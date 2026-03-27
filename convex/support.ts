import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { type Doc, type Id } from "./_generated/dataModel";
import { auth } from "./auth";
import { resolveAvatarUrl } from "./lib/avatar";
import { normalizeOptionalText, normalizeRequiredText } from "./lib/security";

type Viewer = {
    userId: Id<"users">;
    user: Doc<"users">;
};

function sanitizeOptionalString(value?: string) {
    return normalizeOptionalText(value, { maxLength: 80 });
}

function createPreview(content: string) {
    return normalizeRequiredText(content, { maxLength: 160, multiline: true }, "Message preview");
}

async function getViewer(ctx: QueryCtx | MutationCtx): Promise<Viewer | null> {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    return { userId, user };
}

async function getAccessibleThread(
    ctx: QueryCtx | MutationCtx,
    threadId: Id<"supportThreads">,
    viewer: Viewer
) {
    const thread = await ctx.db.get(threadId);
    if (!thread) return null;

    if (
        viewer.user.role !== "admin" &&
        thread.requesterId !== viewer.userId &&
        thread.assignedAdminId !== viewer.userId
    ) {
        return null;
    }

    return thread;
}

async function getUserSummary(ctx: QueryCtx | MutationCtx, userId?: Id<"users">) {
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    return {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatarUrl: await resolveAvatarUrl(ctx, user.avatarUrl),
    };
}

export const getThreads = query({
    args: {},
    handler: async (ctx) => {
        const viewer = await getViewer(ctx);
        if (!viewer) return [];

        const threads = viewer.user.role === "admin"
            ? await ctx.db.query("supportThreads").collect()
            : await ctx.db
                .query("supportThreads")
                .withIndex("by_requesterId", (q) => q.eq("requesterId", viewer.userId))
                .collect();

        const enrichedThreads = await Promise.all(
            threads.map(async (thread) => {
                const unreadMessages = await ctx.db
                    .query("supportMessages")
                    .withIndex("by_threadId", (q) => q.eq("threadId", thread._id))
                    .filter((q) =>
                        q.and(
                            q.eq(q.field("readAt"), undefined),
                            q.neq(q.field("senderId"), viewer.userId)
                        )
                    )
                    .collect();

                return {
                    ...thread,
                    requester: await getUserSummary(ctx, thread.requesterId),
                    assignedAdmin: await getUserSummary(ctx, thread.assignedAdminId),
                    unreadCount: unreadMessages.length,
                    updatedAt: thread.lastMessageAt ?? thread._creationTime,
                };
            })
        );

        return enrichedThreads.sort((a, b) => b.updatedAt - a.updatedAt);
    },
});

export const getMessages = query({
    args: { threadId: v.id("supportThreads") },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) return [];

        const thread = await getAccessibleThread(ctx, args.threadId, viewer);
        if (!thread) return [];

        return await ctx.db
            .query("supportMessages")
            .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
            .collect();
    },
});

export const createThread = mutation({
    args: {
        subject: v.string(),
        content: v.string(),
        category: v.optional(v.string()),
        priority: v.optional(
            v.union(v.literal("normal"), v.literal("high"), v.literal("urgent"))
        ),
    },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Not authenticated");

        const subject = normalizeRequiredText(args.subject, { maxLength: 160 }, "Subject");
        const content = normalizeRequiredText(args.content, { maxLength: 4000, multiline: true }, "Message");
        if (!subject) throw new Error("Please add a subject");
        if (!content) throw new Error("Please add a message");

        const now = Date.now();
        const threadId = await ctx.db.insert("supportThreads", {
            requesterId: viewer.userId,
            subject,
            category: sanitizeOptionalString(args.category),
            status: "open",
            priority: args.priority ?? "normal",
            lastMessageAt: now,
            lastMessagePreview: createPreview(content),
        });

        await ctx.db.insert("supportMessages", {
            threadId,
            senderId: viewer.userId,
            content,
        });

        return threadId;
    },
});

export const sendMessage = mutation({
    args: {
        threadId: v.id("supportThreads"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Not authenticated");

        const thread = await getAccessibleThread(ctx, args.threadId, viewer);
        if (!thread) throw new Error("Support thread not found");

        const content = normalizeRequiredText(args.content, { maxLength: 4000, multiline: true }, "Message");
        if (!content) throw new Error("Message cannot be empty");

        const now = Date.now();
        await ctx.db.insert("supportMessages", {
            threadId: args.threadId,
            senderId: viewer.userId,
            content,
        });

        const patch: Partial<Doc<"supportThreads">> = {
            lastMessageAt: now,
            lastMessagePreview: createPreview(content),
            status: viewer.user.role === "admin" ? "pending" : "open",
        };

        if (viewer.user.role === "admin" && !thread.assignedAdminId) {
            patch.assignedAdminId = viewer.userId;
        }

        await ctx.db.patch(args.threadId, patch);
        return { success: true };
    },
});

export const markMessagesAsRead = mutation({
    args: { threadId: v.id("supportThreads") },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) return;

        const thread = await getAccessibleThread(ctx, args.threadId, viewer);
        if (!thread) return;

        const unreadMessages = await ctx.db
            .query("supportMessages")
            .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("readAt"), undefined),
                    q.neq(q.field("senderId"), viewer.userId)
                )
            )
            .collect();

        await Promise.all(
            unreadMessages.map((message) =>
                ctx.db.patch(message._id, { readAt: Date.now() })
            )
        );
    },
});

export const updateThreadStatus = mutation({
    args: {
        threadId: v.id("supportThreads"),
        status: v.union(v.literal("open"), v.literal("pending"), v.literal("resolved")),
    },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        if (!viewer) throw new Error("Not authenticated");
        if (viewer.user.role !== "admin") throw new Error("Admin access required");

        const thread = await ctx.db.get(args.threadId);
        if (!thread) throw new Error("Support thread not found");

        const patch: Partial<Doc<"supportThreads">> = { status: args.status };
        if (!thread.assignedAdminId) {
            patch.assignedAdminId = viewer.userId;
        }

        await ctx.db.patch(args.threadId, patch);
        return { success: true };
    },
});
