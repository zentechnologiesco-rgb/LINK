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

        const messageId = await ctx.db.insert("messages", {
            inquiryId: args.inquiryId,
            senderId: userId,
            content: args.content,
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
