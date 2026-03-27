import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Get messages for an inquiry (chat thread)
export const getByInquiry = query({
    args: { inquiryId: v.id("inquiries") },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        const inquiry = await ctx.db.get(args.inquiryId);
        if (!inquiry) return [];

        // Verify participation
        if (inquiry.tenantId !== userId && inquiry.landlordId !== userId) {
            return [];
        }

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_inquiryId", (q) => q.eq("inquiryId", args.inquiryId))
            .collect();

        return messages;
    },
});

// Send a message
export const send = mutation({
    args: {
        inquiryId: v.id("inquiries"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const inquiry = await ctx.db.get(args.inquiryId);
        if (!inquiry) throw new Error("Inquiry not found");

        if (inquiry.tenantId !== userId && inquiry.landlordId !== userId) {
            throw new Error("You are not a participant in this chat");
        }

        const trimmedContent = args.content.trim();
        if (!trimmedContent) throw new Error("Message cannot be empty");

        if (!inquiry.message) {
            await ctx.db.patch(args.inquiryId, { message: trimmedContent });
        }

        const messageId = await ctx.db.insert("messages", {
            inquiryId: args.inquiryId,
            senderId: userId,
            content: trimmedContent,
        });

        return messageId;
    },
});

// Mark messages as read
export const markAsRead = mutation({
    args: { inquiryId: v.id("inquiries") },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return;

        const inquiry = await ctx.db.get(args.inquiryId);
        if (!inquiry) return;

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_inquiryId", (q) => q.eq("inquiryId", args.inquiryId))
            .filter((q) => q.eq(q.field("readAt"), undefined))
            .collect();

        for (const message of messages) {
            if (message.senderId !== userId) {
                await ctx.db.patch(message._id, { readAt: Date.now() });
            }
        }
    },
});

// Get total unread message count for current user
export const getUnreadCount = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return 0;

        // Get user to determine role
        const user = await ctx.db.get(userId);
        if (!user) return 0;

        // Get all inquiries where user is a participant
        let inquiries;
        if (user.role === "landlord") {
            inquiries = await ctx.db
                .query("inquiries")
                .withIndex("by_landlordId", (q) => q.eq("landlordId", userId))
                .collect();
        } else {
            inquiries = await ctx.db
                .query("inquiries")
                .withIndex("by_tenantId", (q) => q.eq("tenantId", userId))
                .collect();
        }

        // Count unread messages across all inquiries
        let unreadCount = 0;
        for (const inquiry of inquiries) {
            const unreadMessages = await ctx.db
                .query("messages")
                .withIndex("by_inquiryId", (q) => q.eq("inquiryId", inquiry._id))
                .filter((q) =>
                    q.and(
                        q.eq(q.field("readAt"), undefined),
                        q.neq(q.field("senderId"), userId)
                    )
                )
                .collect();
            unreadCount += unreadMessages.length;
        }

        // Count unread support messages as well.
        const supportThreads = user.role === "admin"
            ? await ctx.db.query("supportThreads").collect()
            : await ctx.db
                .query("supportThreads")
                .withIndex("by_requesterId", (q) => q.eq("requesterId", userId))
                .collect();

        for (const thread of supportThreads) {
            const unreadSupportMessages = await ctx.db
                .query("supportMessages")
                .withIndex("by_threadId", (q) => q.eq("threadId", thread._id))
                .filter((q) =>
                    q.and(
                        q.eq(q.field("readAt"), undefined),
                        q.neq(q.field("senderId"), userId)
                    )
                )
                .collect();

            unreadCount += unreadSupportMessages.length;
        }

        return unreadCount;
    },
});
