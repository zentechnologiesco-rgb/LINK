import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Get current authenticated user
export const currentUser = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return null;
        return await ctx.db.get(userId);
    },
});

// Get user by ID
export const getById = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.userId);
    },
});

// Get user by email
export const getByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();
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

// Verify user (admin only)
export const verifyUser = mutation({
    args: {
        userId: v.id("users"),
        isVerified: v.boolean(),
    },
    handler: async (ctx, args) => {
        const currentUserId = await auth.getUserId(ctx);
        if (!currentUserId) throw new Error("Not authenticated");

        const currentUser = await ctx.db.get(currentUserId);
        if (currentUser?.role !== "admin") {
            throw new Error("Only admins can verify users");
        }

        await ctx.db.patch(args.userId, { isVerified: args.isVerified });
        return { success: true };
    },
});
