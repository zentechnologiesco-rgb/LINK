import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Helper to resolve avatar URL
async function getUserWithAvatarUrl(ctx: any, user: any) {
    if (!user) return null;

    if (user.avatarUrl && !user.avatarUrl.startsWith("http")) {
        try {
            const url = await ctx.storage.getUrl(user.avatarUrl);
            // If URL is valid, use it. If null (file not found), set avatarUrl to null to trigger fallback
            return { ...user, avatarUrl: url || null };
        } catch (error) {
            console.error("Failed to generate storage URL for avatar:", error);
            // On error, also clear the invalid ID to trigger fallback
            return { ...user, avatarUrl: null };
        }
    }
    return user;
}

// Get current authenticated user
export const currentUser = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return null;
        const user = await ctx.db.get(userId);
        return await getUserWithAvatarUrl(ctx, user);
    },
});

// Get user by ID
export const getById = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        return await getUserWithAvatarUrl(ctx, user);
    },
});

// Get user by email
export const getByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();
        return await getUserWithAvatarUrl(ctx, user);
    },
});

// Update user profile
export const updateProfile = mutation({
    args: {
        fullName: v.optional(v.string()),
        phone: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        await ctx.db.patch(userId, {
            ...(args.fullName !== undefined && { fullName: args.fullName }),
            ...(args.phone !== undefined && { phone: args.phone }),
            ...(args.avatarUrl !== undefined && { avatarUrl: args.avatarUrl }),
        });

        return { success: true };
    },
});

// Update user role (admin only)
export const updateRole = mutation({
    args: {
        userId: v.id("users"),
        role: v.union(v.literal("tenant"), v.literal("landlord"), v.literal("admin")),
    },
    handler: async (ctx, args) => {
        const currentUserId = await auth.getUserId(ctx);
        if (!currentUserId) throw new Error("Not authenticated");

        const currentUser = await ctx.db.get(currentUserId);
        if (currentUser?.role !== "admin") {
            throw new Error("Only admins can update user roles");
        }

        await ctx.db.patch(args.userId, { role: args.role });
        return { success: true };
    },
});
