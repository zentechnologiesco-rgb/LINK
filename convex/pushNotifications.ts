"use node";

import { v } from "convex/values";
import webpush from "web-push";

import { internal } from "./_generated/api";
import { type Id } from "./_generated/dataModel";
import { type ActionCtx, internalAction } from "./_generated/server";

const pushNotificationKind = v.union(
    v.literal("messages"),
    v.literal("inquiries"),
    v.literal("leases"),
    v.literal("payments"),
);

function normalizePushText(value: string, maxLength: number) {
    const collapsed = value.replace(/\s+/g, " ").trim();
    if (collapsed.length <= maxLength) {
        return collapsed;
    }

    return `${collapsed.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-NA", {
        style: "currency",
        currency: "NAD",
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatDateLabel(dateOnly: string) {
    return new Intl.DateTimeFormat("en-NA", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(`${dateOnly}T00:00:00.000Z`));
}

function getPushConfiguration() {
    const publicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || process.env.NEXT_PUBLIC_APP_URL || "mailto:noreply@link-property.com";

    if (!publicKey || !privateKey || !subject) {
        return null;
    }

    return {
        publicKey,
        privateKey,
        subject,
    };
}

type PushDeliveryResult = {
    success: boolean;
    attempted: number;
    delivered: number;
    skipped?: "missing_configuration";
};

type DueSoonReminderCandidate = {
    paymentId: Id<"payments">;
    tenantId: Id<"users">;
    dueDate: string;
    amount: number;
    label: string;
    propertyTitle: string;
    url: string;
};

async function sendPushNotificationBatch(
    ctx: ActionCtx,
    args: {
        userIds: Id<"users">[];
        kind: "messages" | "inquiries" | "leases" | "payments";
        title: string;
        body: string;
        url: string;
        tag?: string;
        requireInteraction?: boolean;
    },
): Promise<PushDeliveryResult> {
    const configuration = getPushConfiguration();
    if (!configuration) {
        return { success: false, attempted: 0, delivered: 0, skipped: "missing_configuration" as const };
    }

    webpush.setVapidDetails(
        configuration.subject,
        configuration.publicKey,
        configuration.privateKey,
    );

    const targets = await ctx.runQuery(internal.pushSubscriptions.getTargetsForUsers, {
        userIds: args.userIds,
        kind: args.kind,
    });

    if (targets.length === 0) {
        return { success: true, attempted: 0, delivered: 0 };
    }

    const payload = JSON.stringify({
        title: normalizePushText(args.title, 80),
        body: normalizePushText(args.body, 160),
        icon: "/pwa-icon-192",
        badge: "/pwa-icon-192",
        tag: args.tag || `link-${args.kind}-${Date.now()}`,
        requireInteraction: args.requireInteraction ?? false,
        data: {
            url: args.url,
            kind: args.kind,
        },
    });

    let delivered = 0;

    for (const target of targets) {
        try {
            await webpush.sendNotification(
                {
                    endpoint: target.endpoint,
                    expirationTime: target.expirationTime,
                    keys: target.keys,
                },
                payload,
            );

            delivered += 1;
            await ctx.runMutation(internal.pushSubscriptions.markDeliverySuccess, {
                endpoint: target.endpoint,
            });
        } catch (error) {
            const failureReason = error instanceof Error
                ? error.message
                : "Push delivery failed";
            const statusCode = typeof error === "object" && error !== null && "statusCode" in error
                ? Number((error as { statusCode?: number }).statusCode)
                : undefined;

            await ctx.runMutation(internal.pushSubscriptions.markDeliveryFailure, {
                endpoint: target.endpoint,
                failureReason,
            });

            if (statusCode === 404 || statusCode === 410) {
                await ctx.runMutation(internal.pushSubscriptions.removeByEndpointInternal, {
                    endpoint: target.endpoint,
                });
            }
        }
    }

    return {
        success: true,
        attempted: targets.length,
        delivered,
    };
}

export const sendToUsers = internalAction({
    args: {
        userIds: v.array(v.id("users")),
        kind: pushNotificationKind,
        title: v.string(),
        body: v.string(),
        url: v.string(),
        tag: v.optional(v.string()),
        requireInteraction: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        return sendPushNotificationBatch(ctx, {
            userIds: args.userIds,
            kind: args.kind,
            title: args.title,
            body: args.body,
            url: args.url,
            tag: args.tag,
            requireInteraction: args.requireInteraction,
        });
    },
});

export const sendDueSoonPaymentReminders = internalAction({
    args: {},
    handler: async (ctx): Promise<{
        success: true;
        remindersProcessed: number;
        remindersSent: number;
    }> => {
        const candidates = await ctx.runQuery(internal.payments.getDueSoonReminderCandidates, {
            daysAhead: 3,
        }) as DueSoonReminderCandidate[];

        let remindersSent = 0;

        for (const candidate of candidates) {
            const result = await sendPushNotificationBatch(ctx, {
                userIds: [candidate.tenantId],
                kind: "payments",
                title: "Payment due soon",
                body: `${candidate.label} of ${formatCurrency(candidate.amount)} is due ${formatDateLabel(candidate.dueDate)} for ${candidate.propertyTitle}.`,
                url: candidate.url,
                tag: `payment-due-${candidate.paymentId}`,
            });

            if (result.delivered > 0) {
                remindersSent += result.delivered;
                await ctx.runMutation(internal.payments.markDueSoonReminderSent, {
                    paymentId: candidate.paymentId,
                });
            }
        }

        return {
            success: true,
            remindersProcessed: candidates.length,
            remindersSent,
        };
    },
});
