import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Generate upload URL
export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");
        return await ctx.storage.generateUploadUrl();
    },
});

// Get file URL by storage ID
export const getUrl = query({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId);
    },
});

// Delete a file
export const remove = mutation({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        await ctx.storage.delete(args.storageId);
        return { success: true };
    },
});

// Get multiple file URLs
export const getUrls = query({
    args: { storageIds: v.array(v.id("_storage")) },
    handler: async (ctx, args) => {
        const urls = await Promise.all(
            args.storageIds.map(async (id) => {
                const url = await ctx.storage.getUrl(id);
                return { id, url };
            })
        );
        return urls;
    },
});
