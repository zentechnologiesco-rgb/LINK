import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";
import { resolveAvatarUrl } from "./lib/avatar";
import { isPropertyPubliclyVisible, normalizeRequiredText } from "./lib/security";

const COMMENT_MAX_LENGTH = 2000;

type CommentCtx = MutationCtx | QueryCtx;
type CommentDoc = Doc<"propertyComments">;

type ViewerRecord = {
    userId: Id<"users">;
    user: Doc<"users">;
};

function summarizeComments(comments: CommentDoc[]) {
    let commentCount = 0;
    let topLevelCommentCount = 0;

    for (const comment of comments) {
        if (comment.status !== "active") {
            continue;
        }

        commentCount += 1;
        if (!comment.parentCommentId) {
            topLevelCommentCount += 1;
        }
    }

    return {
        commentCount,
        topLevelCommentCount,
    };
}

function getPlaceholderText(status: CommentDoc["status"]) {
    return status === "hidden"
        ? "Comment hidden by admin."
        : "Comment deleted by author.";
}

function sortTopLevelComments(
    comments: CommentDoc[],
    sort: "top" | "newest",
) {
    const rankedComments = [...comments];

    if (sort === "top") {
        rankedComments.sort((a, b) => {
            if (b.likeCount !== a.likeCount) {
                return b.likeCount - a.likeCount;
            }
            if (b.replyCount !== a.replyCount) {
                return b.replyCount - a.replyCount;
            }
            return b._creationTime - a._creationTime;
        });

        return rankedComments;
    }

    rankedComments.sort((a, b) => b._creationTime - a._creationTime);
    return rankedComments;
}

function sortReplies(comments: CommentDoc[]) {
    return [...comments].sort((a, b) => a._creationTime - b._creationTime);
}

async function getCurrentViewer(ctx: CommentCtx): Promise<ViewerRecord | null> {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    return { userId, user };
}

async function requireAuthenticatedViewer(ctx: MutationCtx) {
    const viewer = await getCurrentViewer(ctx);
    if (!viewer) {
        throw new Error("Not authenticated");
    }

    return viewer;
}

async function requireAdmin(ctx: MutationCtx) {
    const viewer = await requireAuthenticatedViewer(ctx);
    if (viewer.user.role !== "admin") {
        throw new Error("Admin access required");
    }

    return viewer;
}

async function requirePublicProperty(ctx: CommentCtx, propertyId: Id<"properties">) {
    const property = await ctx.db.get(propertyId);
    if (!property || !isPropertyPubliclyVisible(property)) {
        throw new Error("This property is not available for comments");
    }

    return property;
}

async function getCommentOrThrow(ctx: MutationCtx, commentId: Id<"propertyComments">) {
    const comment = await ctx.db.get(commentId);
    if (!comment) {
        throw new Error("Comment not found");
    }

    return comment;
}

async function adjustParentReplyCount(
    ctx: MutationCtx,
    parentCommentId: Id<"propertyComments"> | undefined,
    delta: number,
) {
    if (!parentCommentId || delta === 0) {
        return;
    }

    const parentComment = await ctx.db.get(parentCommentId);
    if (!parentComment) {
        return;
    }

    await ctx.db.patch(parentCommentId, {
        replyCount: Math.max(0, parentComment.replyCount + delta),
    });
}

async function buildAuthorMap(
    ctx: QueryCtx,
    comments: CommentDoc[],
    landlordId: Id<"users">,
) {
    const uniqueAuthorIds = Array.from(new Set(comments.map((comment) => comment.authorId)));

    const authorEntries = await Promise.all(
        uniqueAuthorIds.map(async (authorId) => {
            const author = await ctx.db.get(authorId);
            const avatarUrl = await resolveAvatarUrl(ctx, author?.avatarUrl);

            return [
                authorId,
                {
                    _id: author?._id ?? authorId,
                    fullName: author?.fullName ?? null,
                    email: author?.email ?? null,
                    avatarUrl,
                    isPropertyOwner: authorId === landlordId,
                },
            ] as const;
        }),
    );

    return new Map(authorEntries);
}

async function getViewerLikeSet(
    ctx: QueryCtx,
    viewerId: Id<"users"> | null,
    comments: CommentDoc[],
) {
    if (!viewerId || comments.length === 0) {
        return new Set<string>();
    }

    const commentIds = new Set(comments.map((comment) => comment._id));
    const likes = await ctx.db
        .query("propertyCommentLikes")
        .withIndex("by_userId", (q) => q.eq("userId", viewerId))
        .collect();

    return new Set(
        likes
            .filter((like) => commentIds.has(like.commentId))
            .map((like) => like.commentId),
    );
}

export const listForProperty = query({
    args: {
        propertyId: v.id("properties"),
        sort: v.optional(v.union(v.literal("top"), v.literal("newest"))),
    },
    handler: async (ctx, args) => {
        const property = await ctx.db.get(args.propertyId);
        if (!property || !isPropertyPubliclyVisible(property)) {
            return {
                summary: {
                    commentCount: 0,
                    topLevelCommentCount: 0,
                },
                comments: [],
            };
        }

        const viewer = await getCurrentViewer(ctx);
        const comments = await ctx.db
            .query("propertyComments")
            .withIndex("by_propertyId", (q) => q.eq("propertyId", args.propertyId))
            .collect();

        const summary = summarizeComments(comments);
        const visibleTopLevelComments = sortTopLevelComments(
            comments.filter((comment) => !comment.parentCommentId && (comment.status === "active" || comment.replyCount > 0)),
            args.sort ?? "top",
        );
        const activeReplies = comments.filter(
            (comment) => comment.parentCommentId && comment.status === "active",
        );
        const repliesByParentId = new Map<string, CommentDoc[]>();

        for (const reply of activeReplies) {
            const replies = repliesByParentId.get(reply.parentCommentId!) ?? [];
            replies.push(reply);
            repliesByParentId.set(reply.parentCommentId!, replies);
        }

        const authors = await buildAuthorMap(
            ctx,
            [...visibleTopLevelComments, ...activeReplies],
            property.landlordId,
        );
        const viewerLikeSet = await getViewerLikeSet(
            ctx,
            viewer?.userId ?? null,
            [...visibleTopLevelComments, ...activeReplies],
        );

        return {
            summary,
            comments: visibleTopLevelComments.map((comment) => {
                const replies = sortReplies(repliesByParentId.get(comment._id) ?? []);

                return {
                    _id: comment._id,
                    content: comment.status === "active" ? comment.content : null,
                    status: comment.status,
                    placeholderText: comment.status === "active" ? null : getPlaceholderText(comment.status),
                    likeCount: comment.likeCount,
                    replyCount: replies.length,
                    createdAt: comment._creationTime,
                    editedAt: comment.editedAt ?? null,
                    isLikedByViewer: viewerLikeSet.has(comment._id),
                    canEdit: viewer?.userId === comment.authorId && comment.status === "active",
                    canDelete: viewer?.userId === comment.authorId && comment.status === "active",
                    canLike: Boolean(viewer) && comment.status === "active",
                    canReply: Boolean(viewer) && comment.status === "active",
                    author: authors.get(comment.authorId) ?? null,
                    replies: replies.map((reply) => ({
                        _id: reply._id,
                        content: reply.content,
                        status: reply.status,
                        placeholderText: null,
                        likeCount: reply.likeCount,
                        createdAt: reply._creationTime,
                        editedAt: reply.editedAt ?? null,
                        isLikedByViewer: viewerLikeSet.has(reply._id),
                        canEdit: viewer?.userId === reply.authorId,
                        canDelete: viewer?.userId === reply.authorId,
                        canLike: Boolean(viewer),
                        author: authors.get(reply.authorId) ?? null,
                    })),
                };
            }),
        };
    },
});

export const createComment = mutation({
    args: {
        propertyId: v.id("properties"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const viewer = await requireAuthenticatedViewer(ctx);
        await requirePublicProperty(ctx, args.propertyId);

        const content = normalizeRequiredText(
            args.content,
            { maxLength: COMMENT_MAX_LENGTH, multiline: true },
            "Comment",
        );

        return await ctx.db.insert("propertyComments", {
            propertyId: args.propertyId,
            authorId: viewer.userId,
            content,
            status: "active",
            likeCount: 0,
            replyCount: 0,
        });
    },
});

export const replyToComment = mutation({
    args: {
        propertyId: v.id("properties"),
        parentCommentId: v.id("propertyComments"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const viewer = await requireAuthenticatedViewer(ctx);
        await requirePublicProperty(ctx, args.propertyId);

        const parentComment = await getCommentOrThrow(ctx, args.parentCommentId);
        if (parentComment.propertyId !== args.propertyId) {
            throw new Error("Comment does not belong to this property");
        }
        if (parentComment.parentCommentId) {
            throw new Error("Replies can only be added to top-level comments");
        }
        if (parentComment.status !== "active") {
            throw new Error("This comment is unavailable for replies");
        }

        const content = normalizeRequiredText(
            args.content,
            { maxLength: COMMENT_MAX_LENGTH, multiline: true },
            "Reply",
        );

        const replyId = await ctx.db.insert("propertyComments", {
            propertyId: args.propertyId,
            authorId: viewer.userId,
            parentCommentId: args.parentCommentId,
            content,
            status: "active",
            likeCount: 0,
            replyCount: 0,
        });

        await adjustParentReplyCount(ctx, args.parentCommentId, 1);
        return replyId;
    },
});

export const updateOwnComment = mutation({
    args: {
        commentId: v.id("propertyComments"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const viewer = await requireAuthenticatedViewer(ctx);
        const comment = await getCommentOrThrow(ctx, args.commentId);

        if (comment.authorId !== viewer.userId) {
            throw new Error("You can only edit your own comments");
        }
        if (comment.status !== "active") {
            throw new Error("This comment can no longer be edited");
        }

        const content = normalizeRequiredText(
            args.content,
            { maxLength: COMMENT_MAX_LENGTH, multiline: true },
            "Comment",
        );

        await ctx.db.patch(args.commentId, {
            content,
            editedAt: Date.now(),
        });

        return { success: true };
    },
});

export const deleteOwnComment = mutation({
    args: {
        commentId: v.id("propertyComments"),
    },
    handler: async (ctx, args) => {
        const viewer = await requireAuthenticatedViewer(ctx);
        const comment = await getCommentOrThrow(ctx, args.commentId);

        if (comment.authorId !== viewer.userId) {
            throw new Error("You can only delete your own comments");
        }
        if (comment.status !== "active") {
            throw new Error("This comment has already been removed");
        }

        await ctx.db.patch(args.commentId, {
            status: "deleted",
        });

        await adjustParentReplyCount(ctx, comment.parentCommentId, -1);
        return { success: true };
    },
});

export const toggleLike = mutation({
    args: {
        commentId: v.id("propertyComments"),
    },
    handler: async (ctx, args) => {
        const viewer = await requireAuthenticatedViewer(ctx);
        const comment = await getCommentOrThrow(ctx, args.commentId);

        if (comment.status !== "active") {
            throw new Error("This comment is unavailable");
        }

        await requirePublicProperty(ctx, comment.propertyId);

        const existingLike = await ctx.db
            .query("propertyCommentLikes")
            .withIndex("by_user_comment", (q) =>
                q.eq("userId", viewer.userId).eq("commentId", args.commentId),
            )
            .first();

        if (existingLike) {
            await ctx.db.delete(existingLike._id);
            await ctx.db.patch(args.commentId, {
                likeCount: Math.max(0, comment.likeCount - 1),
            });

            return { liked: false };
        }

        await ctx.db.insert("propertyCommentLikes", {
            commentId: args.commentId,
            userId: viewer.userId,
        });
        await ctx.db.patch(args.commentId, {
            likeCount: comment.likeCount + 1,
        });

        return { liked: true };
    },
});

export const hideComment = mutation({
    args: {
        commentId: v.id("propertyComments"),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const comment = await getCommentOrThrow(ctx, args.commentId);

        if (comment.status !== "active") {
            throw new Error("Only active comments can be hidden");
        }

        await ctx.db.patch(args.commentId, {
            status: "hidden",
        });

        await adjustParentReplyCount(ctx, comment.parentCommentId, -1);
        return { success: true };
    },
});

export const restoreComment = mutation({
    args: {
        commentId: v.id("propertyComments"),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const comment = await getCommentOrThrow(ctx, args.commentId);

        if (comment.status !== "hidden") {
            throw new Error("Only hidden comments can be restored");
        }

        await ctx.db.patch(args.commentId, {
            status: "active",
        });

        await adjustParentReplyCount(ctx, comment.parentCommentId, 1);
        return { success: true };
    },
});
