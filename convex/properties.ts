import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Create a new property
export const create = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        propertyType: v.string(),
        address: v.string(),
        city: v.string(),
        coordinates: v.optional(v.object({ lat: v.number(), lng: v.number() })),
        priceNad: v.number(),
        bedrooms: v.optional(v.number()),
        bathrooms: v.optional(v.number()),
        sizeSqm: v.optional(v.number()),
        amenities: v.optional(v.array(v.id("amenities"))),
        amenityNames: v.optional(v.array(v.string())),
        petPolicy: v.optional(v.string()),
        utilitiesIncluded: v.optional(v.array(v.string())),
        images: v.optional(v.array(v.id("_storage"))),
        videos: v.optional(v.array(v.id("_storage"))),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const user = await ctx.db.get(userId);
        if (user?.role !== "landlord" && user?.role !== "admin") {
            throw new Error("Only landlords can create properties");
        }

        const propertyId = await ctx.db.insert("properties", {
            ...args,
            landlordId: userId,
            isAvailable: false, // Not available until approved
            featured: false,
            approvalStatus: "pending",
            approvalRequestedAt: Date.now(),
        });

        return propertyId;
    },
});

// Get all properties (with filters)
export const list = query({
    args: {
        city: v.optional(v.string()),
        onlyAvailable: v.optional(v.boolean()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let properties;

        if (args.city) {
            properties = await ctx.db
                .query("properties")
                .withIndex("by_city", (q) => q.eq("city", args.city!))
                .collect();
        } else {
            properties = await ctx.db.query("properties").collect();
        }

        let filtered = properties;
        if (args.onlyAvailable) {
            filtered = properties.filter((p) => p.isAvailable);
        }

        if (args.limit) {
            filtered = filtered.slice(0, args.limit);
        }

        const propertiesWithImages = await Promise.all(
            filtered.map(async (property) => {
                let imageUrls: string[] = [];
                if (property.images && property.images.length > 0) {
                    for (const imageId of property.images) {
                        try {
                            const url = await ctx.storage.getUrl(imageId);
                            if (url) imageUrls.push(url);
                        } catch (error) {
                            // Ignore invalid image IDs
                        }
                    }
                }

                return {
                    ...property,
                    imageUrls,
                };
            })
        );

        return propertiesWithImages;
    },
});

// Get property by ID with resolved images, landlord info, and amenities
export const getById = query({
    args: { propertyId: v.id("properties") },
    handler: async (ctx, args) => {
        const property = await ctx.db.get(args.propertyId);
        if (!property) return null;

        // Resolve image URLs
        let imageUrls: string[] = [];
        if (property.images && property.images.length > 0) {
            const urls = await Promise.all(
                property.images.map(async (storageId) => {
                    const url = await ctx.storage.getUrl(storageId);
                    return url;
                })
            );
            imageUrls = urls.filter((url): url is string => url !== null);
        }

        // Fetch landlord info
        const landlord = await ctx.db.get(property.landlordId);
        const landlordInfo = landlord ? {
            name: landlord.fullName || null,
            email: landlord.email,
            phone: landlord.phone || null,
        } : null;

        // Resolve amenities
        let amenityNames: string[] = [];
        if (property.amenities && property.amenities.length > 0) {
            const amenityDocs = await Promise.all(
                property.amenities.map(async (amenityId) => {
                    return await ctx.db.get(amenityId);
                })
            );
            amenityNames = amenityDocs
                .filter((a): a is NonNullable<typeof a> => a !== null)
                .map((a) => a.name);
        }

        return {
            ...property,
            imageUrls,
            landlordInfo,
            amenityNames,
        };
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

        // Resolve image URLs for each property
        const propertiesWithImages = await Promise.all(
            properties.map(async (property) => {
                let imageUrls: string[] = [];
                if (property.images && property.images.length > 0) {
                    for (const imageId of property.images) {
                        try {
                            const url = await ctx.storage.getUrl(imageId);
                            if (url) imageUrls.push(url);
                        } catch (error) {
                            // Ignore invalid image IDs
                        }
                    }
                }
                return {
                    ...property,
                    imageUrls,
                };
            })
        );

        return propertiesWithImages;
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

        // Only return approved properties
        const approvedProperties = properties.filter(p => p.approvalStatus === "approved");

        const propertiesWithLeases = await Promise.all(
            approvedProperties.map(async (property) => {
                // Get all leases for this property
                const leases = await ctx.db
                    .query("leases")
                    .withIndex("by_propertyId", (q) => q.eq("propertyId", property._id))
                    .collect();

                // Format leases with tenant info
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
                        };
                    })
                );

                return {
                    id: property._id,
                    title: property.title,
                    city: property.city,
                    price_nad: property.priceNad,
                    leases: formattedLeases,
                };
            })
        );

        return propertiesWithLeases;
    },
});

// Update property
export const update = mutation({
    args: {
        propertyId: v.id("properties"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        propertyType: v.optional(v.string()),
        address: v.optional(v.string()),
        city: v.optional(v.string()),
        coordinates: v.optional(v.object({ lat: v.number(), lng: v.number() })),
        priceNad: v.optional(v.number()),
        bedrooms: v.optional(v.number()),
        bathrooms: v.optional(v.number()),
        sizeSqm: v.optional(v.number()),
        amenities: v.optional(v.array(v.id("amenities"))),
        amenityNames: v.optional(v.array(v.string())),
        petPolicy: v.optional(v.string()),
        utilitiesIncluded: v.optional(v.array(v.string())),
        images: v.optional(v.array(v.id("_storage"))),
        videos: v.optional(v.array(v.id("_storage"))),
        isAvailable: v.optional(v.boolean()),
        featured: v.optional(v.boolean()),
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

        const { propertyId, ...updateData } = args;
        const cleanedData = Object.fromEntries(
            Object.entries(updateData).filter(([_, v]) => v !== undefined)
        );

        await ctx.db.patch(propertyId, cleanedData);
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

        await ctx.db.patch(args.propertyId, {
            approvalStatus: "pending",
            approvalRequestedAt: Date.now(),
        });

        // Create a landlord request for admin to see (optional, if we track requests separately)
        // But approvalStatus on property might be enough.
        // Let's also create a verifiable request if that system is used.
        // For now, updating the status on property is the primary mechanism.

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
    },
    handler: async (ctx, args) => {
        let properties = await ctx.db
            .query("properties")
            .withIndex("by_available", (q) => q.eq("isAvailable", true))
            .collect();

        if (args.city) {
            properties = properties.filter((p) =>
                p.city.toLowerCase().includes(args.city!.toLowerCase())
            );
        }

        if (args.minPrice !== undefined) {
            properties = properties.filter((p) => p.priceNad >= args.minPrice!);
        }

        if (args.maxPrice !== undefined) {
            properties = properties.filter((p) => p.priceNad <= args.maxPrice!);
        }

        if (args.bedrooms !== undefined) {
            properties = properties.filter((p) => p.bedrooms === args.bedrooms);
        }

        if (args.propertyType) {
            properties = properties.filter((p) => p.propertyType === args.propertyType);
        }

        if (args.query) {
            const q = args.query.toLowerCase();
            properties = properties.filter(
                (p) =>
                    p.title.toLowerCase().includes(q) ||
                    p.description?.toLowerCase().includes(q) ||
                    p.address.toLowerCase().includes(q)
            );
        }

        return properties;
    },
});
