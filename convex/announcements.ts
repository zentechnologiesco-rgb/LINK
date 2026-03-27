import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { auth } from "./auth";
import { resolveAvatarUrl } from "./lib/avatar";
import { normalizeRequiredText, normalizeSafeLink } from "./lib/security";

function sanitizeOptionalString(value?: string) {
    const trimmedValue = value?.trim();
    return trimmedValue ? trimmedValue : undefined;
}

async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    return { userId, user };
}

async function requireAdmin(ctx: MutationCtx) {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) throw new Error("Not authenticated");
    if (currentUser.user.role !== "admin") throw new Error("Admin access required");
    return currentUser;
}

function getPriorityRank(priority: "normal" | "important" | "critical") {
    if (priority === "critical") return 3;
    if (priority === "important") return 2;
    return 1;
}

export const getFeed = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUser(ctx);
        if (!currentUser) return [];

        const now = Date.now();
        const announcements = await ctx.db.query("announcements").collect();

        const visibleAnnouncements = announcements.filter((announcement) => {
            const isExpired = announcement.expiresAt !== undefined && announcement.expiresAt < now;
            if (isExpired) return false;

            if (currentUser.user.role === "admin") {
                return true;
            }

            return (
                announcement.audience === "all" ||
                announcement.audience === currentUser.user.role
            );
        });

        const sortedAnnouncements = visibleAnnouncements
            .sort((a, b) => {
                if (a.isPinned !== b.isPinned) {
                    return a.isPinned ? -1 : 1;
                }

                const priorityDifference = getPriorityRank(b.priority) - getPriorityRank(a.priority);
                if (priorityDifference !== 0) return priorityDifference;

                return b._creationTime - a._creationTime;
            })
            .slice(0, args.limit ?? 8);

        return await Promise.all(
            sortedAnnouncements.map(async (announcement) => {
                const author = await ctx.db.get(announcement.createdBy);

                return {
                    ...announcement,
                    author: author ? {
                        _id: author._id,
                        fullName: author.fullName,
                        email: author.email,
                        avatarUrl: await resolveAvatarUrl(ctx, author.avatarUrl),
                    } : null,
                };
            })
        );
    },
});

export const create = mutation({
    args: {
        title: v.string(),
        body: v.string(),
        audience: v.union(
            v.literal("all"),
            v.literal("tenant"),
            v.literal("landlord"),
            v.literal("admin")
        ),
        priority: v.union(
            v.literal("normal"),
            v.literal("important"),
            v.literal("critical")
        ),
        isPinned: v.boolean(),
        ctaLabel: v.optional(v.string()),
        ctaHref: v.optional(v.string()),
        expiresAt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const currentUser = await requireAdmin(ctx);

        const title = normalizeRequiredText(args.title, { maxLength: 160 }, "Announcement title");
        const body = normalizeRequiredText(args.body, { maxLength: 4000, multiline: true }, "Announcement details");
        if (!title) throw new Error("Please add a title");
        if (!body) throw new Error("Please add announcement details");

        return await ctx.db.insert("announcements", {
            createdBy: currentUser.userId,
            title,
            body,
            audience: args.audience,
            priority: args.priority,
            isPinned: args.isPinned,
            ctaLabel: sanitizeOptionalString(args.ctaLabel),
            ctaHref: normalizeSafeLink(args.ctaHref),
            expiresAt: args.expiresAt,
        });
    },
});
