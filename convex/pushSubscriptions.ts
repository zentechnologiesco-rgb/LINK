import { v } from "convex/values";

import { auth } from "./auth";
import { internal } from "./_generated/api";
import { type Doc, type Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

const pushNotificationKind = v.union(
    v.literal("messages"),
    v.literal("leases"),
    v.literal("payments"),
);

function canReceivePushNotification(
    user: Doc<"users"> | null,
    kind: "messages" | "leases" | "payments",
) {
    return user?.preferences?.notifications?.push === true
        && user.preferences.notifications[kind] !== false;
}

function getPushPublicKey() {
    return process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
}

export const upsert = mutation({
    args: {
        endpoint: v.string(),
        expirationTime: v.optional(v.number()),
        keys: v.object({
            p256dh: v.string(),
            auth: v.string(),
        }),
        userAgent: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const now = Date.now();
        const existingSubscription = await ctx.db
            .query("pushSubscriptions")
            .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
            .first();

        if (existingSubscription) {
            await ctx.db.patch(existingSubscription._id, {
                userId,
                expirationTime: args.expirationTime,
                keys: args.keys,
                userAgent: args.userAgent,
                updatedAt: now,
                failureReason: undefined,
                lastFailureAt: undefined,
            });

            return { success: true, subscriptionId: existingSubscription._id };
        }

        const subscriptionId = await ctx.db.insert("pushSubscriptions", {
            userId,
            endpoint: args.endpoint,
            expirationTime: args.expirationTime,
            keys: args.keys,
            userAgent: args.userAgent,
            createdAt: now,
            updatedAt: now,
        });

        return { success: true, subscriptionId };
    },
});

export const remove = mutation({
    args: {
        endpoint: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const subscriptions = await ctx.db
            .query("pushSubscriptions")
            .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
            .collect();

        for (const subscription of subscriptions) {
            if (subscription.userId === userId) {
                await ctx.db.delete(subscription._id);
            }
        }

        return { success: true };
    },
});

export const getCurrentUserStatus = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) {
            return null;
        }

        const user = await ctx.db.get(userId);
        const subscriptions = await ctx.db
            .query("pushSubscriptions")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();

        const latestSubscription = [...subscriptions]
            .sort((left, right) => right.updatedAt - left.updatedAt)[0];

        return {
            pushEnabled: user?.preferences?.notifications?.push === true,
            subscriptionCount: subscriptions.length,
            lastSuccessAt: latestSubscription?.lastSuccessAt,
            lastFailureAt: latestSubscription?.lastFailureAt,
            failureReason: latestSubscription?.failureReason,
            lastUpdatedAt: latestSubscription?.updatedAt,
        };
    },
});

export const getClientConfiguration = query({
    args: {},
    handler: async () => {
        const publicKey = getPushPublicKey();

        return {
            configured: Boolean(publicKey),
            publicKey,
        };
    },
});

export const sendTestNotification = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const user = await ctx.db.get(userId);
        if (!user?.preferences?.notifications?.push) {
            throw new Error("Turn on Push notifications in Settings before sending a test.");
        }

        const subscriptions = await ctx.db
            .query("pushSubscriptions")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();

        if (subscriptions.length === 0) {
            throw new Error("This account has no registered mobile device yet. Open LINK on the phone and enable Push notifications there first.");
        }

        const kind =
            user.preferences.notifications.messages !== false
                ? "messages"
                : user.preferences.notifications.leases !== false
                    ? "leases"
                    : user.preferences.notifications.payments !== false
                        ? "payments"
                        : null;

        if (!kind) {
            throw new Error("Enable message, lease, or payment notifications before sending a test push.");
        }

        await ctx.scheduler.runAfter(0, internal.pushNotifications.sendToUsers, {
            userIds: [userId],
            kind,
            title: "Test notification",
            body: "LINK push is connected on this device.",
            url: "/settings",
            tag: `push-test-${Date.now()}`,
        });

        return {
            success: true,
            kind,
            subscriptionCount: subscriptions.length,
        };
    },
});

export const getTargetsForUsers = internalQuery({
    args: {
        userIds: v.array(v.id("users")),
        kind: pushNotificationKind,
    },
    handler: async (ctx, args) => {
        const uniqueUserIds = Array.from(new Set(args.userIds)) as Id<"users">[];
        const targets: Array<{
            userId: Id<"users">;
            endpoint: string;
            expirationTime?: number;
            keys: {
                p256dh: string;
                auth: string;
            };
            userAgent?: string;
        }> = [];

        for (const userId of uniqueUserIds) {
            const user = await ctx.db.get(userId);
            if (!canReceivePushNotification(user, args.kind)) {
                continue;
            }

            const subscriptions = await ctx.db
                .query("pushSubscriptions")
                .withIndex("by_userId", (q) => q.eq("userId", userId))
                .collect();

            for (const subscription of subscriptions) {
                targets.push({
                    userId,
                    endpoint: subscription.endpoint,
                    expirationTime: subscription.expirationTime,
                    keys: subscription.keys,
                    userAgent: subscription.userAgent,
                });
            }
        }

        return targets;
    },
});

export const removeByEndpointInternal = internalMutation({
    args: {
        endpoint: v.string(),
    },
    handler: async (ctx, args) => {
        const subscriptions = await ctx.db
            .query("pushSubscriptions")
            .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
            .collect();

        for (const subscription of subscriptions) {
            await ctx.db.delete(subscription._id);
        }

        return { success: true };
    },
});

export const markDeliverySuccess = internalMutation({
    args: {
        endpoint: v.string(),
    },
    handler: async (ctx, args) => {
        const subscription = await ctx.db
            .query("pushSubscriptions")
            .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
            .first();

        if (!subscription) {
            return { success: false };
        }

        await ctx.db.patch(subscription._id, {
            updatedAt: Date.now(),
            lastSuccessAt: Date.now(),
            failureReason: undefined,
        });

        return { success: true };
    },
});

export const markDeliveryFailure = internalMutation({
    args: {
        endpoint: v.string(),
        failureReason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const subscription = await ctx.db
            .query("pushSubscriptions")
            .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
            .first();

        if (!subscription) {
            return { success: false };
        }

        await ctx.db.patch(subscription._id, {
            updatedAt: Date.now(),
            lastFailureAt: Date.now(),
            failureReason: args.failureReason,
        });

        return { success: true };
    },
});
