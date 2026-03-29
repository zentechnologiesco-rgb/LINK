import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";
import { validateOwnedFile, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES } from "./files";
import {
    getStoredUnitsForProperty,
    resolveStorageUrls,
    summarizeInventory,
    syncPropertyInventory,
    upsertPropertyUnits,
    type PropertyUnitDraft,
} from "./lib/propertyInventory";
import { getPropertyCommentSummary } from "./lib/propertyComments";
import {
    isPropertyPubliclyVisible,
    normalizeOptionalText,
    normalizeRequiredText,
    normalizeStringList,
} from "./lib/security";

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

type ViewerPermissions = {
    publicOnly?: boolean;
    includePrivateLandlordContact?: boolean;
};

async function resolveLandlordInfo(
    ctx: QueryCtx | MutationCtx,
    landlordId: Id<"users">,
    options?: { includeEmail?: boolean },
) {
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
        ...(options?.includeEmail ? { email: landlord.email } : {}),
        phone: landlord.phone || null,
        avatarUrl,
    };
}

function sanitizeUnitDraft(unit: PropertyUnitDraft): PropertyUnitDraft {
    return {
        ...unit,
        title: normalizeRequiredText(unit.title, { maxLength: 120 }, "Unit title"),
        description: normalizeOptionalText(unit.description, { maxLength: 4000, multiline: true }),
        unitCode: normalizeOptionalText(unit.unitCode, { maxLength: 40 }),
        unitType: normalizeOptionalText(unit.unitType, { maxLength: 60 }),
        occupancyMode: normalizeOptionalText(unit.occupancyMode, { maxLength: 60 }),
        roomType: normalizeOptionalText(unit.roomType, { maxLength: 60 }),
        furnishingStatus: normalizeOptionalText(unit.furnishingStatus, { maxLength: 60 }),
        genderPolicy: normalizeOptionalText(unit.genderPolicy, { maxLength: 60 }),
        floorLabel: normalizeOptionalText(unit.floorLabel, { maxLength: 40 }),
        blockLabel: normalizeOptionalText(unit.blockLabel, { maxLength: 40 }),
        amenityNames: normalizeStringList(unit.amenityNames, { maxLength: 80 }),
        utilitiesIncluded: normalizeStringList(unit.utilitiesIncluded, { maxLength: 80 }),
        petPolicy: normalizeOptionalText(unit.petPolicy, { maxLength: 60 }),
    };
}

async function validateImages(ctx: MutationCtx, userId: Id<"users">, imageIds?: Id<"_storage">[]) {
    if (!imageIds) return;
    for (const imageId of imageIds) {
        await validateOwnedFile(ctx, userId, imageId, ALLOWED_IMAGE_TYPES);
    }
}

async function validateVideos(ctx: MutationCtx, userId: Id<"users">, videoIds?: Id<"_storage">[]) {
    if (!videoIds) return;
    for (const videoId of videoIds) {
        await validateOwnedFile(ctx, userId, videoId, ALLOWED_VIDEO_TYPES);
    }
}

async function validateUnitImages(
    ctx: MutationCtx,
    userId: Id<"users">,
    units?: PropertyUnitDraft[],
) {
    if (!units) return;
    for (const unit of units) {
        await validateImages(ctx, userId, unit.images);
    }
}

async function enrichProperty(
    ctx: QueryCtx,
    property: Doc<"properties">,
    options?: { includeUnits?: boolean } & ViewerPermissions,
) {
    const [imageUrls, landlordInfo, storedUnits] = await Promise.all([
        resolveStorageUrls(ctx, property.images),
        resolveLandlordInfo(ctx, property.landlordId, {
            includeEmail: options?.includePrivateLandlordContact,
        }),
        getStoredUnitsForProperty(ctx, property._id),
    ]);

    const inventory = summarizeInventory(property, storedUnits);
    const visibleUnits = options?.publicOnly
        ? inventory.units.filter((unit) => unit.publicationStatus === "published")
        : inventory.units;

    const units = options?.includeUnits
        ? await Promise.all(
            visibleUnits.map(async (unit) => ({
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
        ...(options?.publicOnly ? { adminNotes: undefined } : {}),
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
        amenityNames?: string[];
    },
) {
    const allProperties = await ctx.db.query("properties").collect();

    const properties = allProperties.filter((property: Doc<"properties">) => {
        const publicationStatus = property.publicationStatus ?? (property.isAvailable ? "published" : "unpublished");
        if (property.approvalStatus !== "approved" || publicationStatus !== "published") {
            return false;
        }

        if (args.city) {
            const city = args.city.toLowerCase();
            if (!property.city.toLowerCase().includes(city)) {
                return false;
            }
        }

        if (args.query) {
            const search = args.query.toLowerCase();
            const matchesSearch =
                property.title.toLowerCase().includes(search) ||
                property.description?.toLowerCase().includes(search) ||
                property.address.toLowerCase().includes(search) ||
                property.city.toLowerCase().includes(search);

            if (!matchesSearch) {
                return false;
            }
        }

        if (args.listingType && property.listingType !== args.listingType) {
            return false;
        }

        if (args.propertyType && property.propertyType !== args.propertyType) {
            return false;
        }

        const price = property.minPriceNad ?? property.priceNad;
        if (args.minPrice !== undefined && price < args.minPrice) {
            return false;
        }

        if (args.maxPrice !== undefined && price > args.maxPrice) {
            return false;
        }

        if (args.bedrooms !== undefined && (property.bedrooms ?? 0) < args.bedrooms) {
            return false;
        }

        if (args.amenityNames?.length) {
            const propertyAmenities = property.amenityNames ?? [];
            const matchesAmenities = args.amenityNames.every((amenity) => propertyAmenities.includes(amenity));

            if (!matchesAmenities) {
                return false;
            }
        }

        return true;
    });

    const enriched = await Promise.all(
        properties.map((property: Doc<"properties">) => enrichProperty(ctx, property, {
            publicOnly: true,
        })),
    );

    let filtered = enriched.filter((property) => !args.onlyAvailable || property.isPublicReady);

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

        await validateImages(ctx, userId, args.images);
        await validateVideos(ctx, userId, args.videos);
        await validateUnitImages(ctx, userId, args.units as PropertyUnitDraft[] | undefined);

        const sanitizedUnits = ((args.units as PropertyUnitDraft[] | undefined) ?? []).map(sanitizeUnitDraft);

        const propertyId = await ctx.db.insert("properties", {
            title: normalizeRequiredText(args.title, { maxLength: 120 }, "Property title"),
            description: normalizeOptionalText(args.description, { maxLength: 4000, multiline: true }),
            listingType: args.listingType ?? "single_home",
            propertyType: normalizeRequiredText(args.propertyType, { maxLength: 60 }, "Property type"),
            address: normalizeRequiredText(args.address, { maxLength: 200 }, "Property address"),
            city: normalizeRequiredText(args.city, { maxLength: 80 }, "City"),
            coordinates: args.coordinates,
            occupancyMode: normalizeOptionalText(args.occupancyMode, { maxLength: 60 }),
            furnishingStatus: normalizeOptionalText(args.furnishingStatus, { maxLength: 60 }),
            genderPolicy: normalizeOptionalText(args.genderPolicy, { maxLength: 60 }),
            priceNad: args.priceNad,
            bedrooms: args.bedrooms,
            bathrooms: args.bathrooms,
            sizeSqm: args.sizeSqm,
            maxOccupants: args.maxOccupants,
            amenityNames: normalizeStringList(args.amenityNames, { maxLength: 80 }),
            petPolicy: normalizeOptionalText(args.petPolicy, { maxLength: 60 }),
            utilitiesIncluded: normalizeStringList(args.utilitiesIncluded, { maxLength: 80 }),
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

        await upsertPropertyUnits(ctx, property, sanitizedUnits);

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
        amenityNames: v.optional(v.array(v.string())),
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

        const viewerId = await auth.getUserId(ctx);
        const viewer = viewerId ? await ctx.db.get(viewerId) : null;
        const canViewPrivate = viewer?.role === "admin" || viewerId === property.landlordId;

        if (!canViewPrivate && !isPropertyPubliclyVisible(property)) {
            return null;
        }

        const enrichedProperty = await enrichProperty(ctx, property, {
            includeUnits: true,
            publicOnly: !canViewPrivate,
            includePrivateLandlordContact: canViewPrivate,
        });
        const commentSummary = await getPropertyCommentSummary(ctx, args.propertyId);

        return {
            ...enrichedProperty,
            ...commentSummary,
        };
    },
});

// Get properties by landlord
export const getByLandlord = query({
    args: { landlordId: v.optional(v.id("users")) },
    handler: async (ctx, args) => {
        const viewerId = await auth.getUserId(ctx);
        if (!viewerId) return [];

        const viewer = await ctx.db.get(viewerId);
        const requestedLandlordId = args.landlordId ?? viewerId;
        const canViewRequestedLandlord =
            requestedLandlordId === viewerId || viewer?.role === "admin";

        if (!canViewRequestedLandlord) {
            return [];
        }

        const properties = await ctx.db
            .query("properties")
            .withIndex("by_landlordId", (q) => q.eq("landlordId", requestedLandlordId))
            .collect();

        const enriched = await Promise.all(
            properties.map((property: Doc<"properties">) => enrichProperty(ctx, property, {
                includeUnits: true,
                includePrivateLandlordContact: true,
            })),
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

        await validateImages(ctx, userId, args.images);
        await validateVideos(ctx, userId, args.videos);
        await validateUnitImages(ctx, userId, args.units as PropertyUnitDraft[] | undefined);

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

        if ("title" in cleanedData) {
            cleanedData.title = normalizeRequiredText(cleanedData.title as string, { maxLength: 120 }, "Property title");
        }
        if ("description" in cleanedData) {
            const normalizedDescription = normalizeOptionalText(cleanedData.description as string | undefined, { maxLength: 4000, multiline: true });
            if (normalizedDescription) cleanedData.description = normalizedDescription;
            else delete cleanedData.description;
        }
        if ("propertyType" in cleanedData) {
            cleanedData.propertyType = normalizeRequiredText(cleanedData.propertyType as string, { maxLength: 60 }, "Property type");
        }
        if ("address" in cleanedData) {
            cleanedData.address = normalizeRequiredText(cleanedData.address as string, { maxLength: 200 }, "Property address");
        }
        if ("city" in cleanedData) {
            cleanedData.city = normalizeRequiredText(cleanedData.city as string, { maxLength: 80 }, "City");
        }
        if ("occupancyMode" in cleanedData) {
            const normalizedOccupancyMode = normalizeOptionalText(cleanedData.occupancyMode as string | undefined, { maxLength: 60 });
            if (normalizedOccupancyMode) cleanedData.occupancyMode = normalizedOccupancyMode;
            else delete cleanedData.occupancyMode;
        }
        if ("furnishingStatus" in cleanedData) {
            const normalizedFurnishingStatus = normalizeOptionalText(cleanedData.furnishingStatus as string | undefined, { maxLength: 60 });
            if (normalizedFurnishingStatus) cleanedData.furnishingStatus = normalizedFurnishingStatus;
            else delete cleanedData.furnishingStatus;
        }
        if ("genderPolicy" in cleanedData) {
            const normalizedGenderPolicy = normalizeOptionalText(cleanedData.genderPolicy as string | undefined, { maxLength: 60 });
            if (normalizedGenderPolicy) cleanedData.genderPolicy = normalizedGenderPolicy;
            else delete cleanedData.genderPolicy;
        }
        if ("amenityNames" in cleanedData) {
            cleanedData.amenityNames = normalizeStringList(cleanedData.amenityNames as string[] | undefined, { maxLength: 80 });
        }
        if ("petPolicy" in cleanedData) {
            const normalizedPetPolicy = normalizeOptionalText(cleanedData.petPolicy as string | undefined, { maxLength: 60 });
            if (normalizedPetPolicy) cleanedData.petPolicy = normalizedPetPolicy;
            else delete cleanedData.petPolicy;
        }
        if ("utilitiesIncluded" in cleanedData) {
            cleanedData.utilitiesIncluded = normalizeStringList(cleanedData.utilitiesIncluded as string[] | undefined, { maxLength: 80 });
        }

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
            await upsertPropertyUnits(ctx, updatedProperty, (units as PropertyUnitDraft[]).map(sanitizeUnitDraft));
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
        amenityNames: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        return await getFilteredPublicProperties(ctx, {
            onlyAvailable: true,
            ...args,
        });
    },
});
