import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";
import { validateFile, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES } from "./files";
import {
    getStoredUnitsForProperty,
    resolveStorageUrls,
    summarizeInventory,
    syncPropertyInventory,
    upsertPropertyUnits,
    type PropertyUnitDraft,
} from "./lib/propertyInventory";

const propertyUnitInputValidator = v.object({
    _id: v.optional(v.id("propertyUnits")),
    title: v.string(),
    description: v.optional(v.string()),
    unitCode: v.optional(v.string()),
    unitType: v.optional(v.string()),
    occupancyMode: v.optional(v.string()),
    roomType: v.optional(v.string()),
    furnishingStatus: v.optional(v.string()),
    genderPolicy: v.optional(v.string()),
    floorLabel: v.optional(v.string()),
    blockLabel: v.optional(v.string()),
    priceNad: v.number(),
    bedrooms: v.optional(v.number()),
    bathrooms: v.optional(v.number()),
    sizeSqm: v.optional(v.number()),
    maxOccupants: v.optional(v.number()),
    amenityNames: v.optional(v.array(v.string())),
    utilitiesIncluded: v.optional(v.array(v.string())),
    petPolicy: v.optional(v.string()),
    images: v.optional(v.array(v.id("_storage"))),
});

async function resolveLandlordInfo(ctx: QueryCtx | MutationCtx, landlordId: Id<"users">) {
    const landlord = await ctx.db.get(landlordId);
    if (!landlord) return null;

    let avatarUrl = null;
    if (landlord.avatarUrl) {
        if (landlord.avatarUrl.startsWith("http")) {
            avatarUrl = landlord.avatarUrl;
        } else {
            try {
                avatarUrl = await ctx.storage.getUrl(landlord.avatarUrl);
            } catch {
                avatarUrl = null;
            }
        }
    }

    return {
        name: landlord.fullName || null,
        fullName: landlord.fullName || null,
        email: landlord.email,
        phone: landlord.phone || null,
        avatarUrl,
    };
}

async function validateImages(ctx: MutationCtx, imageIds?: Id<"_storage">[]) {
    if (!imageIds) return;
    for (const imageId of imageIds) {
        await validateFile(ctx, imageId, ALLOWED_IMAGE_TYPES);
    }
}

async function validateVideos(ctx: MutationCtx, videoIds?: Id<"_storage">[]) {
    if (!videoIds) return;
    for (const videoId of videoIds) {
        await validateFile(ctx, videoId, ALLOWED_VIDEO_TYPES);
    }
}

async function validateUnitImages(
    ctx: MutationCtx,
    units?: PropertyUnitDraft[],
) {
    if (!units) return;
    for (const unit of units) {
        await validateImages(ctx, unit.images);
    }
}

async function enrichProperty(
    ctx: QueryCtx,
    property: Doc<"properties">,
    options?: { includeUnits?: boolean },
) {
    const [imageUrls, landlordInfo, storedUnits] = await Promise.all([
        resolveStorageUrls(ctx, property.images),
        resolveLandlordInfo(ctx, property.landlordId),
        getStoredUnitsForProperty(ctx, property._id),
    ]);

    const inventory = summarizeInventory(property, storedUnits);

    const units = options?.includeUnits
        ? await Promise.all(
            inventory.units.map(async (unit) => ({
                ...unit,
                imageUrls: unit._id
                    ? await resolveStorageUrls(ctx, unit.images)
                    : imageUrls,
            })),
        )
        : undefined;

    return {
        ...property,
        listingType: property.listingType ?? "single_home",
        publicationStatus: property.publicationStatus ?? (property.isAvailable ? "published" : "unpublished"),
        imageUrls,
        landlordInfo,
        amenityNames: property.amenityNames ?? [],
        minPriceNad: inventory.minPriceNad,
        maxPriceNad: inventory.maxPriceNad,
        unitCount: inventory.unitCount,
        availableUnitCount: inventory.availableUnitCount,
        unitTypeLabels: inventory.unitTypeLabels,
        isPublicReady: inventory.isPublicReady,
        units,
    };
}

async function getFilteredPublicProperties(
    ctx: QueryCtx,
    args: {
        city?: string;
        onlyAvailable?: boolean;
        limit?: number;
        query?: string;
        minPrice?: number;
        maxPrice?: number;
        bedrooms?: number;
        propertyType?: string;
        listingType?: string;
    },
) {
    const allProperties = await ctx.db.query("properties").collect();

    const properties = allProperties.filter((property: Doc<"properties">) => {
        const publicationStatus = property.publicationStatus ?? (property.isAvailable ? "published" : "unpublished");
        return property.approvalStatus === "approved" && publicationStatus === "published";
    });

    const enriched = await Promise.all(properties.map((property: Doc<"properties">) => enrichProperty(ctx, property)));

    let filtered = enriched.filter((property) => !args.onlyAvailable || property.isPublicReady);

    if (args.city) {
        const city = args.city.toLowerCase();
        filtered = filtered.filter((property) => property.city.toLowerCase().includes(city));
    }

    if (args.query) {
        const search = args.query.toLowerCase();
        filtered = filtered.filter((property) =>
            property.title.toLowerCase().includes(search) ||
            property.description?.toLowerCase().includes(search) ||
            property.address.toLowerCase().includes(search) ||
            property.city.toLowerCase().includes(search),
        );
    }

    if (args.listingType) {
        filtered = filtered.filter((property) => property.listingType === args.listingType);
    }

    if (args.propertyType) {
        filtered = filtered.filter((property) => property.propertyType === args.propertyType);
    }

    if (args.minPrice !== undefined) {
        filtered = filtered.filter((property) => property.minPriceNad >= args.minPrice!);
    }

    if (args.maxPrice !== undefined) {
        filtered = filtered.filter((property) => property.minPriceNad <= args.maxPrice!);
    }

    if (args.bedrooms !== undefined) {
        filtered = filtered.filter((property) => (property.bedrooms ?? 0) >= args.bedrooms!);
    }

    filtered.sort((a, b) => {
        if (b.featured !== a.featured) return Number(b.featured) - Number(a.featured);
        if (b.availableUnitCount !== a.availableUnitCount) return b.availableUnitCount - a.availableUnitCount;
        return b._creationTime - a._creationTime;
    });

    if (args.limit) {
        filtered = filtered.slice(0, args.limit);
    }

    return filtered;
}

// Create a new property
export const create = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        listingType: v.optional(
            v.union(
                v.literal("single_home"),
                v.literal("multi_unit_block"),
                v.literal("student_accommodation"),
            ),
        ),
        propertyType: v.string(),
        address: v.string(),
        city: v.string(),
        coordinates: v.object({ lat: v.number(), lng: v.number() }),
        occupancyMode: v.optional(v.string()),
        furnishingStatus: v.optional(v.string()),
        genderPolicy: v.optional(v.string()),
        priceNad: v.number(),
        bedrooms: v.optional(v.number()),
        bathrooms: v.optional(v.number()),
        sizeSqm: v.optional(v.number()),
        maxOccupants: v.optional(v.number()),
        amenityNames: v.optional(v.array(v.string())),
        petPolicy: v.optional(v.string()),
        utilitiesIncluded: v.optional(v.array(v.string())),
        images: v.optional(v.array(v.id("_storage"))),
        videos: v.optional(v.array(v.id("_storage"))),
        units: v.optional(v.array(propertyUnitInputValidator)),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const user = await ctx.db.get(userId);
        if (user?.role !== "landlord" && user?.role !== "admin") {
            throw new Error("Only landlords can create properties");
        }

        await validateImages(ctx, args.images);
        await validateVideos(ctx, args.videos);
        await validateUnitImages(ctx, args.units as PropertyUnitDraft[] | undefined);

        const propertyId = await ctx.db.insert("properties", {
            title: args.title,
            description: args.description,
            listingType: args.listingType ?? "single_home",
            propertyType: args.propertyType,
            address: args.address,
            city: args.city,
            coordinates: args.coordinates,
            occupancyMode: args.occupancyMode,
            furnishingStatus: args.furnishingStatus,
            genderPolicy: args.genderPolicy,
            priceNad: args.priceNad,
            bedrooms: args.bedrooms,
            bathrooms: args.bathrooms,
            sizeSqm: args.sizeSqm,
            maxOccupants: args.maxOccupants,
            amenityNames: args.amenityNames ?? [],
            petPolicy: args.petPolicy,
            utilitiesIncluded: args.utilitiesIncluded ?? [],
            images: args.images ?? [],
            videos: args.videos ?? [],
            landlordId: userId,
            isAvailable: false,
            featured: false,
            publicationStatus: "unpublished",
            approvalStatus: "pending",
            approvalRequestedAt: Date.now(),
        });

        const property = await ctx.db.get(propertyId);
        if (!property) throw new Error("Property could not be created");

        await upsertPropertyUnits(ctx, property, (args.units as PropertyUnitDraft[] | undefined) ?? []);

        return propertyId;
    },
});

// Get all public properties
export const list = query({
    args: {
        city: v.optional(v.string()),
        onlyAvailable: v.optional(v.boolean()),
        limit: v.optional(v.number()),
        query: v.optional(v.string()),
        minPrice: v.optional(v.number()),
        maxPrice: v.optional(v.number()),
        bedrooms: v.optional(v.number()),
        propertyType: v.optional(v.string()),
        listingType: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await getFilteredPublicProperties(ctx, args);
    },
});

// Get property by ID with resolved media, landlord info, and units
export const getById = query({
    args: { propertyId: v.id("properties") },
    handler: async (ctx, args) => {
        const property = await ctx.db.get(args.propertyId);
        if (!property) return null;

        return await enrichProperty(ctx, property, { includeUnits: true });
    },
});

// Get properties by landlord
export const getByLandlord = query({
    args: { landlordId: v.optional(v.id("users")) },
    handler: async (ctx, args) => {
        const userId = args.landlordId || (await auth.getUserId(ctx));
        if (!userId) return [];

        const properties = await ctx.db
            .query("properties")
            .withIndex("by_landlordId", (q) => q.eq("landlordId", userId))
            .collect();

        const enriched = await Promise.all(
            properties.map((property: Doc<"properties">) => enrichProperty(ctx, property, { includeUnits: true })),
        );

        return enriched.sort((a, b) => b._creationTime - a._creationTime);
    },
});

// Get properties with lease info for landlord (for payment wizard)
export const getByLandlordWithLeases = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        const properties = await ctx.db
            .query("properties")
            .withIndex("by_landlordId", (q) => q.eq("landlordId", userId))
            .collect();

        const approvedProperties = properties.filter((property) => property.approvalStatus === "approved");

        return await Promise.all(
            approvedProperties.map(async (property) => {
                const leases = await ctx.db
                    .query("leases")
                    .withIndex("by_propertyId", (q) => q.eq("propertyId", property._id))
                    .collect();

                const formattedLeases = await Promise.all(
                    leases.map(async (lease) => {
                        const tenant = await ctx.db.get(lease.tenantId);
                        return {
                            status: lease.status,
                            start_date: lease.startDate,
                            end_date: lease.endDate,
                            monthly_rent: lease.monthlyRent,
                            deposit: lease.deposit || 0,
                            tenant: tenant ? { email: tenant.email } : undefined,
                            unitId: lease.unitId,
                        };
                    }),
                );

                return {
                    id: property._id,
                    title: property.title,
                    city: property.city,
                    price_nad: property.minPriceNad ?? property.priceNad,
                    leases: formattedLeases,
                };
            }),
        );
    },
});

// Update property
export const update = mutation({
    args: {
        propertyId: v.id("properties"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        listingType: v.optional(
            v.union(
                v.literal("single_home"),
                v.literal("multi_unit_block"),
                v.literal("student_accommodation"),
            ),
        ),
        propertyType: v.optional(v.string()),
        address: v.optional(v.string()),
        city: v.optional(v.string()),
        coordinates: v.optional(v.object({ lat: v.number(), lng: v.number() })),
        occupancyMode: v.optional(v.string()),
        furnishingStatus: v.optional(v.string()),
        genderPolicy: v.optional(v.string()),
        priceNad: v.optional(v.number()),
        bedrooms: v.optional(v.number()),
        bathrooms: v.optional(v.number()),
        sizeSqm: v.optional(v.number()),
        maxOccupants: v.optional(v.number()),
        amenityNames: v.optional(v.array(v.string())),
        petPolicy: v.optional(v.string()),
        utilitiesIncluded: v.optional(v.array(v.string())),
        images: v.optional(v.array(v.id("_storage"))),
        videos: v.optional(v.array(v.id("_storage"))),
        units: v.optional(v.array(propertyUnitInputValidator)),
        isAvailable: v.optional(v.boolean()),
        featured: v.optional(v.boolean()),
        publicationStatus: v.optional(v.union(v.literal("unpublished"), v.literal("published"))),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const property = await ctx.db.get(args.propertyId);
        if (!property) throw new Error("Property not found");

        const user = await ctx.db.get(userId);
        if (property.landlordId !== userId && user?.role !== "admin") {
            throw new Error("You can only update your own properties");
        }

        await validateImages(ctx, args.images);
        await validateVideos(ctx, args.videos);
        await validateUnitImages(ctx, args.units as PropertyUnitDraft[] | undefined);

        const {
            propertyId,
            units,
            isAvailable,
            publicationStatus,
            ...updateData
        } = args;

        const cleanedData = Object.fromEntries(
            Object.entries(updateData).filter(([, value]) => value !== undefined),
        );

        const approvalSensitiveFields = [
            "title",
            "description",
            "listingType",
            "propertyType",
            "address",
            "city",
            "coordinates",
            "occupancyMode",
            "furnishingStatus",
            "genderPolicy",
            "priceNad",
            "bedrooms",
            "bathrooms",
            "sizeSqm",
            "maxOccupants",
            "amenityNames",
            "petPolicy",
            "utilitiesIncluded",
            "images",
            "videos",
        ];

        const requiresReapproval =
            approvalSensitiveFields.some((field) => field in cleanedData) ||
            units !== undefined;

        const nextPublicationStatus =
            publicationStatus ??
            (isAvailable === undefined ? undefined : isAvailable ? "published" : "unpublished");

        if (nextPublicationStatus === "published" && property.approvalStatus !== "approved" && !requiresReapproval) {
            throw new Error("The listing must be approved before it can go live.");
        }

        const patch: Partial<Doc<"properties">> & { approvalRequestedAt?: number } = {
            ...(cleanedData as Partial<Doc<"properties">>),
        };

        if (typeof nextPublicationStatus !== "undefined") {
            patch.publicationStatus = nextPublicationStatus;
        }

        if (requiresReapproval) {
            patch.approvalStatus = "pending";
            patch.approvalRequestedAt = Date.now();
            patch.adminNotes = undefined;
            patch.publicationStatus = "unpublished";
            patch.isAvailable = false;
        }

        await ctx.db.patch(propertyId, patch);

        const updatedProperty = await ctx.db.get(propertyId);
        if (!updatedProperty) throw new Error("Property not found after update");

        if (units !== undefined) {
            await upsertPropertyUnits(ctx, updatedProperty, units as PropertyUnitDraft[]);
        } else {
            await syncPropertyInventory(ctx, propertyId);
        }

        return { success: true };
    },
});

// Delete property
export const remove = mutation({
    args: { propertyId: v.id("properties") },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const property = await ctx.db.get(args.propertyId);
        if (!property) throw new Error("Property not found");

        const user = await ctx.db.get(userId);
        if (property.landlordId !== userId && user?.role !== "admin") {
            throw new Error("You can only delete your own properties");
        }

        const units = await getStoredUnitsForProperty(ctx, args.propertyId);
        for (const unit of units) {
            await ctx.db.delete(unit._id);
        }

        await ctx.db.delete(args.propertyId);
        return { success: true };
    },
});

// Request property approval
export const requestApproval = mutation({
    args: { propertyId: v.id("properties") },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const property = await ctx.db.get(args.propertyId);
        if (!property) throw new Error("Property not found");
        if (property.landlordId !== userId) throw new Error("Only the owner can request approval");
        if (property.approvalStatus === "pending") {
            throw new Error("This listing is already in review.");
        }
        if (property.approvalStatus === "approved") {
            throw new Error("Approved listings do not need to be resubmitted.");
        }
        if (property.approvalStatus !== "rejected") {
            throw new Error("Only rejected listings can be resubmitted from here.");
        }

        await ctx.db.patch(args.propertyId, {
            approvalStatus: "pending",
            approvalRequestedAt: Date.now(),
            publicationStatus: "unpublished",
            isAvailable: false,
            adminNotes: undefined,
        });

        return { success: true };
    },
});

// Search properties
export const search = query({
    args: {
        query: v.optional(v.string()),
        city: v.optional(v.string()),
        minPrice: v.optional(v.number()),
        maxPrice: v.optional(v.number()),
        bedrooms: v.optional(v.number()),
        propertyType: v.optional(v.string()),
        listingType: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await getFilteredPublicProperties(ctx, {
            onlyAvailable: true,
            ...args,
        });
    },
});
