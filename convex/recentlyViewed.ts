import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const MAX_RECENT_ITEMS = 20; // Maximum items to keep per user

/**
 * Track a property view for the logged-in user.
 * Updates the timestamp if already viewed, or creates a new record.
 * Also cleans up old entries to maintain the limit.
 */
export const trackView = mutation({
    args: {
        propertyId: v.id("properties"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            // Not logged in, don't track
            return null;
        }

        // Check if property exists
        const property = await ctx.db.get(args.propertyId);
        if (!property || !property.isAvailable) {
            return null;
        }

        const now = Date.now();

        // Check if user already viewed this property
        const existing = await ctx.db
            .query("recentlyViewed")
            .withIndex("by_user_property", (q) =>
                q.eq("userId", userId).eq("propertyId", args.propertyId)
            )
            .first();

        if (existing) {
            // Update the timestamp
            await ctx.db.patch(existing._id, { viewedAt: now });
            return existing._id;
        }

        // Create new view record
        const viewId = await ctx.db.insert("recentlyViewed", {
            userId,
            propertyId: args.propertyId,
            viewedAt: now,
        });

        // Cleanup: Keep only the most recent MAX_RECENT_ITEMS
        const allViews = await ctx.db
            .query("recentlyViewed")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();

        if (allViews.length > MAX_RECENT_ITEMS) {
            // Sort by viewedAt descending
            const sortedViews = allViews.sort((a, b) => b.viewedAt - a.viewedAt);
            // Delete the oldest ones
            const toDelete = sortedViews.slice(MAX_RECENT_ITEMS);
            for (const view of toDelete) {
                await ctx.db.delete(view._id);
            }
        }

        return viewId;
    },
});

/**
 * Get recently viewed properties for the logged-in user.
 * Returns properties with their details, sorted by most recently viewed.
 */
export const list = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return [];
        }

        const limit = args.limit ?? 10;

        // Get user's recently viewed entries
        const recentViews = await ctx.db
            .query("recentlyViewed")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();

        // Sort by viewedAt descending and take the limit
        const sortedViews = recentViews
            .sort((a, b) => b.viewedAt - a.viewedAt)
            .slice(0, limit);

        // Fetch property details for each view
        const propertiesWithViews = await Promise.all(
            sortedViews.map(async (view) => {
                const property = await ctx.db.get(view.propertyId);
                if (!property || !property.isAvailable) {
                    return null;
                }

                // Resolve image URLs
                let imageUrls: string[] = [];
                if (property.images && property.images.length > 0) {
                    const urls = await Promise.all(
                        property.images.map((storageId) => ctx.storage.getUrl(storageId))
                    );
                    imageUrls = urls.filter((url): url is string => url !== null);
                }

                return {
                    _id: property._id,
                    title: property.title,
                    description: property.description,
                    priceNad: property.priceNad,
                    address: property.address,
                    city: property.city,
                    bedrooms: property.bedrooms,
                    bathrooms: property.bathrooms,
                    sizeSqm: property.sizeSqm,
                    propertyType: property.propertyType,
                    imageUrls,
                    amenityNames: property.amenityNames,
                    viewedAt: view.viewedAt,
                };
            })
        );

        // Filter out null entries (unavailable/deleted properties)
        return propertiesWithViews.filter(Boolean);
    },
});

/**
 * Clear all recently viewed properties for the logged-in user.
 */
export const clearAll = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return { success: false };
        }

        const allViews = await ctx.db
            .query("recentlyViewed")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();

        for (const view of allViews) {
            await ctx.db.delete(view._id);
        }

        return { success: true, deleted: allViews.length };
    },
});

/**
 * Remove a specific property from recently viewed.
 */
export const removeView = mutation({
    args: {
        propertyId: v.id("properties"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return { success: false };
        }

        const view = await ctx.db
            .query("recentlyViewed")
            .withIndex("by_user_property", (q) =>
                q.eq("userId", userId).eq("propertyId", args.propertyId)
            )
            .first();

        if (view) {
            await ctx.db.delete(view._id);
            return { success: true };
        }

        return { success: false };
    },
});
