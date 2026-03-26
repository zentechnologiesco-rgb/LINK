import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";
import { resolveAvatarUrl } from "./lib/avatar";

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
                const unit = inquiry.unitId ? await ctx.db.get(inquiry.unitId) : null;
                return {
                    ...inquiry,
                    property: property ? {
                        title: property.title,
                        address: property.address,
                        images: property.images,
                        priceNad: property.priceNad,
                    } : null,
                    unit: unit ? {
                        title: unit.title,
                        unitCode: unit.unitCode,
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
                const unit = inquiry.unitId ? await ctx.db.get(inquiry.unitId) : null;
                const tenant = await ctx.db.get(inquiry.tenantId);
                return {
                    ...inquiry,
                    property: property ? {
                        title: property.title,
                        address: property.address,
                    } : null,
                    unit: unit ? {
                        title: unit.title,
                        unitCode: unit.unitCode,
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
        const unit = inquiry.unitId ? await ctx.db.get(inquiry.unitId) : null;
        const tenant = await ctx.db.get(inquiry.tenantId);
        const landlord = await ctx.db.get(inquiry.landlordId);

        return {
            ...inquiry,
            property,
            unit,
            tenant: tenant ? { fullName: tenant.fullName, email: tenant.email, phone: tenant.phone } : null,
            landlord: landlord ? { fullName: landlord.fullName, email: landlord.email } : null,
        };
    },
});

// Create or update inquiry
export const create = mutation({
    args: {
        propertyId: v.id("properties"),
        unitId: v.optional(v.id("propertyUnits")),
        message: v.string(),
        phone: v.optional(v.string()), // Used to update profile if needed or just logged
        moveInDate: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const property = await ctx.db.get(args.propertyId);
        if (!property) throw new Error("Property not found");
        const unit = args.unitId ? await ctx.db.get(args.unitId) : null;
        if (args.unitId && (!unit || unit.propertyId !== args.propertyId)) {
            throw new Error("Unit not found for this property");
        }

        let inquiryId;

        // Manual check for existing (without compound index)
        const existing = await ctx.db
            .query("inquiries")
            .withIndex("by_tenantId", (q) => q.eq("tenantId", userId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("propertyId"), args.propertyId),
                    args.unitId ? q.eq(q.field("unitId"), args.unitId) : q.eq(q.field("unitId"), undefined),
                ),
            )
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
                unitId: args.unitId,
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
            const unit = inquiry.unitId ? await ctx.db.get(inquiry.unitId) : null;

            // Get last message? Ideally yes for sorting.
            // For now, let's just return basic info. 
            // Better: use an index on messages to get the last message.

            const lastMessage = await ctx.db
                .query("messages")
                .withIndex("by_inquiryId", (q) => q.eq("inquiryId", inquiry._id))
                .order("desc")
                .first();

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

            return {
                ...inquiry,
                property: property ? { title: property.title } : null,
                unit: unit ? { title: unit.title, unitCode: unit.unitCode } : null,
                otherParty: otherParty ? {
                    _id: otherParty._id,
                    fullName: otherParty.fullName,
                    email: otherParty.email,
                    avatarUrl: await resolveAvatarUrl(ctx, otherParty.avatarUrl),
                } : null,
                lastMessage: lastMessage ? {
                    content: lastMessage.content,
                    createdAt: lastMessage._creationTime,
                    senderId: lastMessage.senderId,
                } : null,
                updatedAt: lastMessage ? lastMessage._creationTime : inquiry._creationTime,
                unreadCount: unreadMessages.length,
            };
        }));

        return enriched.sort((a, b) => b.updatedAt - a.updatedAt);
    },
});

// Get or create an inquiry for a property (for starting a chat)
export const getOrCreateForProperty = mutation({
    args: {
        propertyId: v.id("properties"),
        unitId: v.optional(v.id("propertyUnits")),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const property = await ctx.db.get(args.propertyId);
        if (!property) throw new Error("Property not found");
        const unit = args.unitId ? await ctx.db.get(args.unitId) : null;
        if (args.unitId && (!unit || unit.propertyId !== args.propertyId)) {
            throw new Error("Unit not found for this property");
        }

        // Prevent landlords from creating inquiries with themselves
        if (property.landlordId === userId) {
            throw new Error("You cannot contact yourself on your own property");
        }

        // Check if user already has an inquiry for this property
        const existing = await ctx.db
            .query("inquiries")
            .withIndex("by_tenantId", (q) => q.eq("tenantId", userId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("propertyId"), args.propertyId),
                    args.unitId ? q.eq(q.field("unitId"), args.unitId) : q.eq(q.field("unitId"), undefined),
                ),
            )
            .first();

        if (existing) {
            return existing._id;
        }

        // Create new inquiry
        const inquiryId = await ctx.db.insert("inquiries", {
            propertyId: args.propertyId,
            unitId: args.unitId,
            tenantId: userId,
            landlordId: property.landlordId,
            message: "", // No initial message, chat will be empty
            status: "pending",
        });

        return inquiryId;
    },
});

