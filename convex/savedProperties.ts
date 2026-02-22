import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Toggle saved property
export const toggle = mutation({
    args: { propertyId: v.id("properties") },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Authentication required");

        const existing = await ctx.db
            .query("savedProperties")
            .withIndex("by_user_property", (q) =>
                q.eq("userId", userId).eq("propertyId", args.propertyId)
            )
            .first();

        if (existing) {
            await ctx.db.delete(existing._id);
            return false; // Unsaved
        } else {
            await ctx.db.insert("savedProperties", {
                userId,
                propertyId: args.propertyId,
            });
            return true; // Saved
        }
    },
});

// Check if saved
export const isSaved = query({
    args: { propertyId: v.id("properties") },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return false;

        const existing = await ctx.db
            .query("savedProperties")
            .withIndex("by_user_property", (q) =>
                q.eq("userId", userId).eq("propertyId", args.propertyId)
            )
            .first();

        return !!existing;
    },
});

// List saved properties
export const list = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        const saved = await ctx.db
            .query("savedProperties")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();

        const properties = await Promise.all(
            saved.map(async (s) => {
                const property = await ctx.db.get(s.propertyId);
                if (!property) return null;

                let imageUrl = null;
                if (property.images && property.images.length > 0) {
                    imageUrl = await ctx.storage.getUrl(property.images[0]);
                }

                return {
                    ...property,
                    mainImage: imageUrl,
                };
            })
        );

        return properties.filter((p) => p !== null);
    },
});
