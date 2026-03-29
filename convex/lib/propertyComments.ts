import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type CommentCtx = MutationCtx | QueryCtx;

export async function getPropertyCommentSummary(
    ctx: CommentCtx,
    propertyId: Id<"properties">,
) {
    const comments = await ctx.db
        .query("propertyComments")
        .withIndex("by_propertyId", (q) => q.eq("propertyId", propertyId))
        .collect();

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
