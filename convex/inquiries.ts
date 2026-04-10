import { v } from "convex/values";
import { type Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { auth } from "./auth";
import { resolveAvatarUrl } from "./lib/avatar";
import { isPropertyPubliclyVisible, normalizeRequiredText } from "./lib/security";

async function findExistingInquiry(
    ctx: QueryCtx | MutationCtx,
    userId: Id<"users">,
    propertyId: Id<"properties">,
    unitId?: Id<"propertyUnits">,
) {
    return await ctx.db
        .query("inquiries")
        .withIndex("by_tenantId", (q) => q.eq("tenantId", userId))
        .filter((q) =>
            q.and(
                q.eq(q.field("propertyId"), propertyId),
                unitId ? q.eq(q.field("unitId"), unitId) : q.eq(q.field("unitId"), undefined),
            ),
        )
        .first();
}

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
        const userId = await auth.getUserId(ctx);
        if (!userId) return null;

        const inquiry = await ctx.db.get(args.inquiryId);
        if (!inquiry) return null;

        const viewer = await ctx.db.get(userId);
        const isParticipant = inquiry.tenantId === userId || inquiry.landlordId === userId;
        const isAdmin = viewer?.role === "admin";
        if (!isParticipant && !isAdmin) {
            return null;
        }

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

        const trimmedMessage = normalizeRequiredText(args.message, { maxLength: 4000, multiline: true }, "Message");
        if (!trimmedMessage) throw new Error("Message cannot be empty");

        const property = await ctx.db.get(args.propertyId);
        if (!property) throw new Error("Property not found");
        if (!isPropertyPubliclyVisible(property)) {
            throw new Error("This listing is not currently accepting inquiries");
        }
        if (property.landlordId === userId) {
            throw new Error("You cannot contact yourself on your own property");
        }
        const unit = args.unitId ? await ctx.db.get(args.unitId) : null;
        if (args.unitId && (!unit || unit.propertyId !== args.propertyId)) {
            throw new Error("Unit not found for this property");
        }
        if (unit && unit.publicationStatus !== "published") {
            throw new Error("This unit is not available for inquiries");
        }

        let inquiryId;

        const existing = await findExistingInquiry(ctx, userId, args.propertyId, args.unitId);

        if (existing) {
            inquiryId = existing._id;
            const patch = {
                ...(args.moveInDate ? { moveInDate: args.moveInDate } : {}),
                ...(!existing.message ? { message: trimmedMessage } : {}),
            };

            if (Object.keys(patch).length > 0) {
                await ctx.db.patch(inquiryId, patch);
            }
        } else {
            inquiryId = await ctx.db.insert("inquiries", {
                propertyId: args.propertyId,
                unitId: args.unitId,
                tenantId: userId,
                landlordId: property.landlordId,
                message: trimmedMessage,
                moveInDate: args.moveInDate,
                status: "pending",
            });
        }

        // Insert message
        await ctx.db.insert("messages", {
            inquiryId,
            senderId: userId,
            content: trimmedMessage,
        });

        await ctx.scheduler.runAfter(0, internal.pushNotifications.sendToUsers, {
            userIds: [property.landlordId],
            kind: "inquiries",
            title: `New inquiry for ${property.title}`,
            body: trimmedMessage,
            url: `/chat?kind=inquiry&id=${inquiryId}`,
            tag: `inquiry-${inquiryId}`,
            requireInteraction: true,
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
            const lastMessage = await ctx.db
                .query("messages")
                .withIndex("by_inquiryId", (q) => q.eq("inquiryId", inquiry._id))
                .order("desc")
                .first();

            if (!lastMessage) return null;

            const isLandlord = inquiry.landlordId === userId;
            const otherPartyId = isLandlord ? inquiry.tenantId : inquiry.landlordId;

            const [otherParty, property, unit, unreadMessages] = await Promise.all([
                ctx.db.get(otherPartyId),
                ctx.db.get(inquiry.propertyId),
                inquiry.unitId ? ctx.db.get(inquiry.unitId) : Promise.resolve(null),
                ctx.db
                    .query("messages")
                    .withIndex("by_inquiryId", (q) => q.eq("inquiryId", inquiry._id))
                    .filter((q) =>
                        q.and(
                            q.eq(q.field("readAt"), undefined),
                            q.neq(q.field("senderId"), userId),
                        ),
                    )
                    .collect(),
            ]);

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

        return enriched
            .filter((inquiry): inquiry is NonNullable<typeof inquiry> => inquiry !== null)
            .sort((a, b) => b.updatedAt - a.updatedAt);
    },
});

export const getDraftContext = query({
    args: {
        propertyId: v.id("properties"),
        unitId: v.optional(v.id("propertyUnits")),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return null;

        const property = await ctx.db.get(args.propertyId);
        if (!property) return null;
        if (!isPropertyPubliclyVisible(property)) return null;
        if (property.landlordId === userId) return null;

        const unit = args.unitId ? await ctx.db.get(args.unitId) : null;
        if (args.unitId && (!unit || unit.propertyId !== args.propertyId)) {
            return null;
        }
        if (unit && unit.publicationStatus !== "published") {
            return null;
        }

        const landlord = await ctx.db.get(property.landlordId);

        return {
            property: {
                title: property.title,
            },
            unit: unit ? {
                title: unit.title,
                unitCode: unit.unitCode,
            } : null,
            otherParty: landlord ? {
                _id: landlord._id,
                fullName: landlord.fullName,
                email: landlord.email,
                avatarUrl: await resolveAvatarUrl(ctx, landlord.avatarUrl),
            } : null,
        };
    },
});

// Return an existing inquiry for a property if it already has messages.
export const getExistingForProperty = mutation({
    args: {
        propertyId: v.id("properties"),
        unitId: v.optional(v.id("propertyUnits")),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const property = await ctx.db.get(args.propertyId);
        if (!property) throw new Error("Property not found");
        if (!isPropertyPubliclyVisible(property)) {
            throw new Error("This listing is not currently accepting inquiries");
        }
        const unit = args.unitId ? await ctx.db.get(args.unitId) : null;
        if (args.unitId && (!unit || unit.propertyId !== args.propertyId)) {
            throw new Error("Unit not found for this property");
        }
        if (unit && unit.publicationStatus !== "published") {
            throw new Error("This unit is not available for inquiries");
        }

        // Prevent landlords from creating inquiries with themselves
        if (property.landlordId === userId) {
            throw new Error("You cannot contact yourself on your own property");
        }

        const existing = await findExistingInquiry(ctx, userId, args.propertyId, args.unitId);

        if (!existing) return null;

        const existingMessage = await ctx.db
            .query("messages")
            .withIndex("by_inquiryId", (q) => q.eq("inquiryId", existing._id))
            .first();

        return existingMessage ? existing._id : null;
    },
});

