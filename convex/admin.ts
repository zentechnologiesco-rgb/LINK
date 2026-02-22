import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

import { auth } from "./auth";
import { logAdminAction } from "./audit";

// Helper to check admin role
async function requireAdmin(ctx: any) {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (user?.role !== "admin") throw new Error("Admin access required");

    return userId;
}

// Get admin statistics
export const getStats = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return { users: 0, properties: 0, leases: 0, inquiries: 0 };

        const user = await ctx.db.get(userId);
        if (user?.role !== "admin") return { users: 0, properties: 0, leases: 0, inquiries: 0 };

        const users = await ctx.db.query("users").collect();
        const properties = await ctx.db.query("properties").collect();
        const leases = await ctx.db.query("leases").collect();
        const inquiries = await ctx.db.query("inquiries").collect();

        return {
            users: users.length,
            properties: properties.length,
            leases: leases.filter(l => l.status === "approved").length,
            inquiries: inquiries.length,
        };
    },
});

// Get all users (admin only)
export const getAllUsers = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        const user = await ctx.db.get(userId);
        if (user?.role !== "admin") return [];

        return await ctx.db.query("users").collect();
    },
});

// Get all properties with landlord info (admin only)
export const getAllProperties = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        const user = await ctx.db.get(userId);
        if (user?.role !== "admin") return [];

        const properties = await ctx.db.query("properties").collect();

        const enrichedProperties = await Promise.all(
            properties.map(async (property) => {
                const landlord = await ctx.db.get(property.landlordId);
                return {
                    ...property,
                    landlord: landlord ? { fullName: landlord.fullName, email: landlord.email } : null,
                };
            })
        );

        return enrichedProperties;
    },
});

// Update user role (admin only)
export const updateUserRole = mutation({
    args: {
        userId: v.id("users"),
        role: v.union(v.literal("tenant"), v.literal("landlord"), v.literal("admin")),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        await ctx.db.patch(args.userId, { role: args.role });
        return { success: true };
    },
});

// Toggle property availability (admin only)
export const togglePropertyAvailability = mutation({
    args: {
        propertyId: v.id("properties"),
        isAvailable: v.boolean(),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        await ctx.db.patch(args.propertyId, { isAvailable: args.isAvailable });
        return { success: true };
    },
});

// Delete property (admin only)
export const deleteProperty = mutation({
    args: { propertyId: v.id("properties") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        await ctx.db.delete(args.propertyId);
        return { success: true };
    },
});

// Check if current user is admin
export const isAdmin = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return false;

        const user = await ctx.db.get(userId);
        return user?.role === "admin";
    },
});

// Get property approval notification stats
export const getPropertyStats = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return { total: 0, pending: 0, approved: 0, rejected: 0 };

        const user = await ctx.db.get(userId);
        if (user?.role !== "admin") return { total: 0, pending: 0, approved: 0, rejected: 0 };

        const properties = await ctx.db.query("properties").collect();
        const validProperties = properties.filter(p => p.approvalStatus !== undefined);

        return {
            total: validProperties.length,
            pending: validProperties.filter(p => p.approvalStatus === "pending").length,
            approved: validProperties.filter(p => p.approvalStatus === "approved").length,
            rejected: validProperties.filter(p => p.approvalStatus === "rejected").length,
        };
    },
});

// Get property requests
export const getPropertyRequests = query({
    args: {
        status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        const user = await ctx.db.get(userId);
        if (user?.role !== "admin") return [];

        let properties;
        if (args.status) {
            properties = await ctx.db
                .query("properties")
                .withIndex("by_approvalStatus", (q) => q.eq("approvalStatus", args.status!))
                .collect();
        } else {
            properties = await ctx.db.query("properties").collect();
            properties = properties.filter(p => p.approvalStatus !== undefined);
        }

        const enrichedProperties = await Promise.all(
            properties.map(async (property) => {
                const landlord = await ctx.db.get(property.landlordId);

                let imageUrls: string[] = [];
                if (property.images && property.images.length > 0) {
                    // Just get the first one for list view
                    try {
                        const url = await ctx.storage.getUrl(property.images[0]);
                        if (url) imageUrls.push(url);
                    } catch (e) {
                        // Ignore invalid image IDs
                    }
                }

                return {
                    ...property,
                    images: imageUrls,
                    landlord: landlord ? { fullName: landlord.fullName, email: landlord.email } : null,
                };
            })
        );

        return enrichedProperties.sort((a, b) =>
            ((b.approvalRequestedAt || b._creationTime) - (a.approvalRequestedAt || a._creationTime))
        );
    },
});

// Get property request details by ID
export const getPropertyRequestById = query({
    args: { propertyId: v.id("properties") },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return null;

        const user = await ctx.db.get(userId);
        if (user?.role !== "admin") return null;

        const property = await ctx.db.get(args.propertyId);
        if (!property) return null;

        const landlord = await ctx.db.get(property.landlordId);

        let imageUrls: string[] = [];
        if (property.images) {
            for (const imageId of property.images) {
                try {
                    const url = await ctx.storage.getUrl(imageId);
                    if (url) imageUrls.push(url);
                } catch (e) {
                    // Ignore
                }
            }
        }

        return {
            ...property,
            images: imageUrls,
            landlord: landlord ? {
                fullName: landlord.fullName,
                email: landlord.email,
                phone: landlord.phone,
                avatarUrl: landlord.avatarUrl
            } : null,
        };
    },
});

// Approve property
export const approveProperty = mutation({
    args: { propertyId: v.id("properties") },
    handler: async (ctx, args) => {
        const userId = await requireAdmin(ctx);
        await ctx.db.patch(args.propertyId, {
            approvalStatus: "approved",
            isAvailable: true
        });

        // Log action
        await logAdminAction(ctx, userId, "approve_property", args.propertyId, "property");

        return { success: true };
    },
});

// Reject property
export const rejectProperty = mutation({
    args: {
        propertyId: v.id("properties"),
        reason: v.string()
    },
    handler: async (ctx, args) => {
        const userId = await requireAdmin(ctx);
        await ctx.db.patch(args.propertyId, {
            approvalStatus: "rejected",
            isAvailable: false,
            adminNotes: args.reason
        });

        // Log action
        await logAdminAction(ctx, userId, "reject_property", args.propertyId, "property", { reason: args.reason });

        return { success: true };
    },
});
