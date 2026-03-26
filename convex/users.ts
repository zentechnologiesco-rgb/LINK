import { v } from "convex/values";
import { type QueryCtx, mutation, query } from "./_generated/server";
import { type Doc } from "./_generated/dataModel";
import { auth } from "./auth";
import { resolveAvatarUrl } from "./lib/avatar";
import { normalizeUserPreferences } from "./lib/userPreferences";

// Helper to resolve avatar URL
async function getUserWithAvatarUrl(ctx: QueryCtx, user: Doc<"users"> | null) {
    if (!user) return null;

    return {
        ...user,
        avatarUrl: await resolveAvatarUrl(ctx, user.avatarUrl),
        preferences: normalizeUserPreferences(user.role, user.preferences),
    };
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
        firstName: v.optional(v.string()),
        surname: v.optional(v.string()),
        phone: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
        preferences: v.optional(v.object({
            notifications: v.object({
                email: v.boolean(),
                push: v.boolean(),
                messages: v.boolean(),
                leases: v.boolean(),
                payments: v.boolean(),
                savedSearch: v.boolean(),
                inquiries: v.boolean(),
                approvals: v.boolean(),
                reviews: v.boolean(),
                security: v.boolean(),
                digest: v.boolean(),
            }),
            experience: v.object({
                compactMode: v.boolean(),
                showQuickStats: v.boolean(),
                startPage: v.string(),
            }),
        })),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const currentUser = await ctx.db.get(userId);
        if (!currentUser) throw new Error("User not found");

        const nextFirstName = args.firstName ?? currentUser.firstName ?? "";
        const nextSurname = args.surname ?? currentUser.surname ?? "";
        const derivedFullName =
            args.fullName !== undefined
                ? args.fullName
                : args.firstName !== undefined || args.surname !== undefined
                    ? `${nextFirstName} ${nextSurname}`.trim()
                    : undefined;

        await ctx.db.patch(userId, {
            ...(derivedFullName !== undefined && { fullName: derivedFullName }),
            ...(args.firstName !== undefined && { firstName: args.firstName }),
            ...(args.surname !== undefined && { surname: args.surname }),
            ...(args.phone !== undefined && { phone: args.phone }),
            ...(args.avatarUrl !== undefined && { avatarUrl: args.avatarUrl }),
            ...(args.preferences !== undefined && {
                preferences: normalizeUserPreferences(currentUser.role, args.preferences),
            }),
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
