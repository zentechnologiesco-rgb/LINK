import { v } from "convex/values";

import { auth } from "./auth";
import { type Doc, type Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, mutation } from "./_generated/server";

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
