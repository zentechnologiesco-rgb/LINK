import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

type AuditDetails = Record<string, unknown> | undefined

export async function logAdminAction(
    ctx: MutationCtx,
    adminId: Id<"users">,
    action: string,
    targetId: string,
    targetType: string,
    details?: AuditDetails
) {
    await ctx.db.insert("auditLogs", {
        adminId,
        action,
        targetId,
        targetType,
        details,
        timestamp: Date.now(),
    });
}
