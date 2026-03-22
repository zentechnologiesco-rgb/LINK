import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Create a lease template
export const create = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        rentDueDay: v.optional(v.number()),
        gracePeriodDays: v.optional(v.number()),
        lateFeeType: v.optional(v.union(v.literal("percentage"), v.literal("fixed"))),
        lateFeeAmount: v.optional(v.number()),
        paymentFrequency: v.optional(v.union(v.literal("monthly"), v.literal("weekly"), v.literal("biweekly"))),
        petPolicy: v.optional(v.string()),
        utilitiesIncluded: v.optional(v.array(v.string())),
        parkingIncluded: v.optional(v.boolean()),
        maintenanceResponsibility: v.optional(v.string()),
        noticePeriodDays: v.optional(v.number()),
        maxOccupants: v.optional(v.number()),
        smokingAllowed: v.optional(v.boolean()),
        sublettingAllowed: v.optional(v.boolean()),
        customClauses: v.optional(v.array(v.object({
            id: v.string(),
            title: v.string(),
            content: v.string(),
        }))),
        isDefault: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // If setting as default, unset other defaults
        if (args.isDefault) {
            const existing = await ctx.db
                .query("leaseTemplates")
                .withIndex("by_landlordId", (q) => q.eq("landlordId", userId))
                .collect();
            for (const t of existing) {
                if (t.isDefault) {
                    await ctx.db.patch(t._id, { isDefault: false });
                }
            }
        }

        const templateId = await ctx.db.insert("leaseTemplates", {
            landlordId: userId,
            ...args,
        });

        return templateId;
    },
});

// Get all templates for the current landlord
export const getForLandlord = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        return await ctx.db
            .query("leaseTemplates")
            .withIndex("by_landlordId", (q) => q.eq("landlordId", userId))
            .collect();
    },
});

// Get a specific template
export const getById = query({
    args: { templateId: v.id("leaseTemplates") },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return null;

        const template = await ctx.db.get(args.templateId);
        if (!template || template.landlordId !== userId) return null;

        return template;
    },
});

// Update a template
export const update = mutation({
    args: {
        templateId: v.id("leaseTemplates"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        rentDueDay: v.optional(v.number()),
        gracePeriodDays: v.optional(v.number()),
        lateFeeType: v.optional(v.union(v.literal("percentage"), v.literal("fixed"))),
        lateFeeAmount: v.optional(v.number()),
        paymentFrequency: v.optional(v.union(v.literal("monthly"), v.literal("weekly"), v.literal("biweekly"))),
        petPolicy: v.optional(v.string()),
        utilitiesIncluded: v.optional(v.array(v.string())),
        parkingIncluded: v.optional(v.boolean()),
        maintenanceResponsibility: v.optional(v.string()),
        noticePeriodDays: v.optional(v.number()),
        maxOccupants: v.optional(v.number()),
        smokingAllowed: v.optional(v.boolean()),
        sublettingAllowed: v.optional(v.boolean()),
        customClauses: v.optional(v.array(v.object({
            id: v.string(),
            title: v.string(),
            content: v.string(),
        }))),
        isDefault: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const template = await ctx.db.get(args.templateId);
        if (!template) throw new Error("Template not found");
        if (template.landlordId !== userId) throw new Error("Not authorized");

        const { templateId, ...updates } = args;

        // If setting as default, unset other defaults
        if (updates.isDefault) {
            const existing = await ctx.db
                .query("leaseTemplates")
                .withIndex("by_landlordId", (q) => q.eq("landlordId", userId))
                .collect();
            for (const t of existing) {
                if (t.isDefault && t._id !== templateId) {
                    await ctx.db.patch(t._id, { isDefault: false });
                }
            }
        }

        await ctx.db.patch(templateId, updates);
        return { success: true };
    },
});

// Delete a template
export const remove = mutation({
    args: { templateId: v.id("leaseTemplates") },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const template = await ctx.db.get(args.templateId);
        if (!template) throw new Error("Template not found");
        if (template.landlordId !== userId) throw new Error("Not authorized");

        await ctx.db.delete(args.templateId);
        return { success: true };
    },
});

// Set a template as default
export const setDefault = mutation({
    args: { templateId: v.id("leaseTemplates") },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const template = await ctx.db.get(args.templateId);
        if (!template) throw new Error("Template not found");
        if (template.landlordId !== userId) throw new Error("Not authorized");

        // Unset all other defaults
        const existing = await ctx.db
            .query("leaseTemplates")
            .withIndex("by_landlordId", (q) => q.eq("landlordId", userId))
            .collect();
        for (const t of existing) {
            if (t.isDefault) {
                await ctx.db.patch(t._id, { isDefault: false });
            }
        }

        await ctx.db.patch(args.templateId, { isDefault: true });
        return { success: true };
    },
});
