import { v } from "convex/values";
import { type QueryCtx, mutation, query } from "./_generated/server";
import { type Doc, type Id } from "./_generated/dataModel";
import { auth } from "./auth";
import { ALLOWED_IMAGE_TYPES, validateOwnedFile } from "./files";
import { resolveAvatarUrl } from "./lib/avatar";
import { normalizeEmail } from "./lib/normalizeEmail";
import { normalizeOptionalText } from "./lib/security";
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

export const linkedAuthMethods = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) {
            return {
                providers: [] as string[],
                hasPassword: false,
                hasGoogle: false,
            };
        }

        const accounts = await ctx.db
            .query("authAccounts")
            .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
            .collect();

        const providers = Array.from(
            new Set(accounts.map((account) => account.provider)),
        ).sort();

        return {
            providers,
            hasPassword: providers.includes("password"),
            hasGoogle: providers.includes("google"),
        };
    },
});

// Get user by ID
export const getById = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const currentUserId = await auth.getUserId(ctx);
        if (!currentUserId) return null;

        const currentUser = await ctx.db.get(currentUserId);
        if (currentUserId !== args.userId && currentUser?.role !== "admin") {
            return null;
        }

        const user = await ctx.db.get(args.userId);
        return await getUserWithAvatarUrl(ctx, user);
    },
});

// Get user by email
export const getByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const currentUserId = await auth.getUserId(ctx);
        if (!currentUserId) return null;

        const currentUser = await ctx.db.get(currentUserId);
        if (currentUser?.role !== "landlord" && currentUser?.role !== "admin") {
            return null;
        }

        const user = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", normalizeEmail(args.email)))
            .first();

        if (!user) return null;

        return {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            avatarUrl: await resolveAvatarUrl(ctx, user.avatarUrl),
        };
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

        const nextAvatarUrl = normalizeOptionalText(args.avatarUrl, {
            maxLength: 2048,
        });
        if (nextAvatarUrl && /^https?:\/\//i.test(nextAvatarUrl)) {
            throw new Error("External avatar URLs are not allowed");
        }
        if (nextAvatarUrl && !nextAvatarUrl.startsWith("/") && !nextAvatarUrl.startsWith("data:") && !nextAvatarUrl.startsWith("blob:")) {
            await validateOwnedFile(
                ctx,
                userId as Id<"users">,
                nextAvatarUrl as Id<"_storage">,
                ALLOWED_IMAGE_TYPES,
            );
        }

        const nextFirstName = args.firstName ?? currentUser.firstName ?? "";
        const nextSurname = args.surname ?? currentUser.surname ?? "";
        const derivedFullName =
            args.fullName !== undefined
                ? normalizeOptionalText(args.fullName, { maxLength: 160 })
                : args.firstName !== undefined || args.surname !== undefined
                    ? normalizeOptionalText(
                        `${normalizeOptionalText(nextFirstName, { maxLength: 80 }) ?? ""} ${normalizeOptionalText(nextSurname, { maxLength: 80 }) ?? ""}`,
                        { maxLength: 160 },
                    )
                    : undefined;

        await ctx.db.patch(userId, {
            ...(derivedFullName !== undefined && { fullName: derivedFullName }),
            ...(args.firstName !== undefined && {
                firstName: normalizeOptionalText(args.firstName, { maxLength: 80 }),
            }),
            ...(args.surname !== undefined && {
                surname: normalizeOptionalText(args.surname, { maxLength: 80 }),
            }),
            ...(args.phone !== undefined && {
                phone: normalizeOptionalText(args.phone, { maxLength: 40 }),
            }),
            ...(args.avatarUrl !== undefined && { avatarUrl: nextAvatarUrl }),
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
