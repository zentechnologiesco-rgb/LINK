import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Get inquiries for tenant
export const getForTenant = query({
    args: { status: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        let inquiries = await ctx.db
            .query("inquiries")
            .withIndex("by_tenantId", (q) => q.eq("tenantId", userId))
            .collect();

        if (args.status) {
            inquiries = inquiries.filter((i) => i.status === args.status);
        }

        const enrichedInquiries = await Promise.all(
            inquiries.map(async (inquiry) => {
                const property = await ctx.db.get(inquiry.propertyId);
                return {
                    ...inquiry,
                    property: property ? {
                        title: property.title,
                        address: property.address,
                        images: property.images,
                        priceNad: property.priceNad,
                    } : null,
                };
            })
        );

        return enrichedInquiries;
    },
});

// Get inquiries for landlord
export const getForLandlord = query({
    args: { status: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        let inquiries = await ctx.db
            .query("inquiries")
            .withIndex("by_landlordId", (q) => q.eq("landlordId", userId))
            .collect();

        if (args.status) {
            inquiries = inquiries.filter((i) => i.status === args.status);
        }

        const enrichedInquiries = await Promise.all(
            inquiries.map(async (inquiry) => {
                const property = await ctx.db.get(inquiry.propertyId);
                const tenant = await ctx.db.get(inquiry.tenantId);
                return {
                    ...inquiry,
                    property: property ? {
                        title: property.title,
                        address: property.address,
                    } : null,
                    tenant: tenant ? {
                        fullName: tenant.fullName,
                        email: tenant.email,
                    } : null,
                };
            })
        );

        return enrichedInquiries;
    },
});

// Get inquiry by ID
export const getById = query({
    args: { inquiryId: v.id("inquiries") },
    handler: async (ctx, args) => {
        const inquiry = await ctx.db.get(args.inquiryId);
        if (!inquiry) return null;

        const property = await ctx.db.get(inquiry.propertyId);
        const tenant = await ctx.db.get(inquiry.tenantId);
        const landlord = await ctx.db.get(inquiry.landlordId);

        return {
            ...inquiry,
            property,
            tenant: tenant ? { fullName: tenant.fullName, email: tenant.email, phone: tenant.phone } : null,
            landlord: landlord ? { fullName: landlord.fullName, email: landlord.email } : null,
        };
    },
});

// Create or update inquiry
export const create = mutation({
    args: {
        propertyId: v.id("properties"),
        message: v.string(),
        phone: v.optional(v.string()), // Used to update profile if needed or just logged
        moveInDate: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const property = await ctx.db.get(args.propertyId);
        if (!property) throw new Error("Property not found");

        let inquiryId;

        // Manual check for existing (without compound index)
        const existing = await ctx.db
            .query("inquiries")
            .withIndex("by_tenantId", (q) => q.eq("tenantId", userId))
            .filter((q) => q.eq(q.field("propertyId"), args.propertyId))
            .first();

        if (existing) {
            inquiryId = existing._id;
            // Update move in date if provided?
            if (args.moveInDate) {
                await ctx.db.patch(inquiryId, { moveInDate: args.moveInDate });
            }
        } else {
            inquiryId = await ctx.db.insert("inquiries", {
                propertyId: args.propertyId,
                tenantId: userId,
                landlordId: property.landlordId,
                message: args.message, // Initial message context
                moveInDate: args.moveInDate,
                status: "pending",
            });
        }

        // Insert message
        await ctx.db.insert("messages", {
            inquiryId,
            senderId: userId,
            content: args.message,
        });

        return inquiryId;
    },
});

// Update inquiry status (landlord only)
export const updateStatus = mutation({
    args: {
        inquiryId: v.id("inquiries"),
        status: v.union(
            v.literal("pending"),
            v.literal("approved"),
            v.literal("rejected"),
            v.literal("completed")
        ),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const inquiry = await ctx.db.get(args.inquiryId);
        if (!inquiry) throw new Error("Inquiry not found");
        if (inquiry.landlordId !== userId) throw new Error("Only the landlord can update inquiry status");

        await ctx.db.patch(args.inquiryId, { status: args.status });
        return { success: true };
    },
});

// Get all inquiries for current user (either tenant or landlord)
export const getUserInquiries = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        // Fetch both as tenant and as landlord
        const asTenant = await ctx.db
            .query("inquiries")
            .withIndex("by_tenantId", (q) => q.eq("tenantId", userId))
            .collect();

        const asLandlord = await ctx.db
            .query("inquiries")
            .withIndex("by_landlordId", (q) => q.eq("landlordId", userId))
            .collect();

        const allInquiries = [...asTenant, ...asLandlord];

        // Enrich with other party details and property
        const enriched = await Promise.all(allInquiries.map(async (inquiry) => {
            const isLandlord = inquiry.landlordId === userId;
            const otherPartyId = isLandlord ? inquiry.tenantId : inquiry.landlordId;
            const otherParty = await ctx.db.get(otherPartyId);
            const property = await ctx.db.get(inquiry.propertyId);

            // Get last message? Ideally yes for sorting.
            // For now, let's just return basic info. 
            // Better: use an index on messages to get the last message.

            const lastMessage = await ctx.db
                .query("messages")
                .withIndex("by_inquiryId", (q) => q.eq("inquiryId", inquiry._id))
                .order("desc")
                .first();

            return {
                ...inquiry,
                property: property ? { title: property.title } : null,
                otherParty: otherParty ? {
                    fullName: otherParty.fullName,
                    avatarUrl: otherParty.avatarUrl,
                } : null,
                lastMessage: lastMessage ? {
                    content: lastMessage.content,
                    createdAt: lastMessage._creationTime,
                } : null,
                updatedAt: lastMessage ? lastMessage._creationTime : inquiry._creationTime,
            };
        }));

        return enriched.sort((a, b) => b.updatedAt - a.updatedAt);
    },
});

// Get or create an inquiry for a property (for starting a chat)
export const getOrCreateForProperty = mutation({
    args: {
        propertyId: v.id("properties"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const property = await ctx.db.get(args.propertyId);
        if (!property) throw new Error("Property not found");

        // Check if user already has an inquiry for this property
        const existing = await ctx.db
            .query("inquiries")
            .withIndex("by_tenantId", (q) => q.eq("tenantId", userId))
            .filter((q) => q.eq(q.field("propertyId"), args.propertyId))
            .first();

        if (existing) {
            return existing._id;
        }

        // Create new inquiry
        const inquiryId = await ctx.db.insert("inquiries", {
            propertyId: args.propertyId,
            tenantId: userId,
            landlordId: property.landlordId,
            message: "", // No initial message, chat will be empty
            status: "pending",
        });

        return inquiryId;
    },
});

