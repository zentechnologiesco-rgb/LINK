import { MutationCtx } from "./_generated/server";
import { v } from "convex/values";

export async function logAdminAction(
    ctx: MutationCtx,
    adminId: string,
    action: string,
    targetId: string,
    targetType: string,
    details?: any
) {
    await ctx.db.insert("auditLogs", {
        adminId: adminId as any,
        action,
        targetId,
        targetType,
        details,
        timestamp: Date.now(),
    });
}
