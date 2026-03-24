import { v } from "convex/values";
import { type MutationCtx, mutation, query } from "./_generated/server";

import { auth } from "./auth";
import { logAdminAction } from "./audit";
import { resolveAvatarUrl } from "./lib/avatar";
import {
    getStoredUnitsForProperty,
    resolveStorageUrls,
    summarizeInventory,
    syncPropertyInventory,
} from "./lib/propertyInventory";

const RESERVED_LEASE_STATUSES = new Set([
    "draft",
    "sent_to_tenant",
    "tenant_signed",
    "revision_requested",
]);

// Helper to check admin role
async function requireAdmin(ctx: MutationCtx) {
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

        const users = await ctx.db.query("users").collect();

        return await Promise.all(
            users.map(async (user) => ({
                ...user,
                avatarUrl: await resolveAvatarUrl(ctx, user.avatarUrl),
            }))
        );
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
                const [landlord, units, leases] = await Promise.all([
                    ctx.db.get(property.landlordId),
                    getStoredUnitsForProperty(ctx, property._id),
                    ctx.db
                        .query("leases")
                        .withIndex("by_propertyId", (q) => q.eq("propertyId", property._id))
                        .collect(),
                ]);
                const inventory = summarizeInventory(property, units);
                return {
                    ...property,
                    listingType: property.listingType ?? "single_home",
                    unitCount: inventory.unitCount,
                    availableUnitCount: inventory.availableUnitCount,
                    minPriceNad: inventory.minPriceNad,
                    maxPriceNad: inventory.maxPriceNad,
                    activeLeaseCount: leases.filter((lease) => lease.status === "approved").length,
                    reservedLeaseCount: leases.filter((lease) => RESERVED_LEASE_STATUSES.has(lease.status)).length,
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
        const property = await ctx.db.get(args.propertyId);
        if (!property) throw new Error("Property not found");
        if (property.approvalStatus !== "approved") {
            throw new Error("Only approved listings can be published or taken off market.");
        }

        await ctx.db.patch(args.propertyId, {
            publicationStatus: args.isAvailable ? "published" : "unpublished",
        });
        await syncPropertyInventory(ctx, args.propertyId);
        return { success: true };
    },
});

// Delete property (admin only)
export const deleteProperty = mutation({
    args: { propertyId: v.id("properties") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const units = await getStoredUnitsForProperty(ctx, args.propertyId);
        for (const unit of units) {
            await ctx.db.delete(unit._id);
        }
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
                const units = await getStoredUnitsForProperty(ctx, property._id);
                const inventory = summarizeInventory(property, units);
                const imageUrls = await resolveStorageUrls(ctx, property.images?.slice(0, 1));

                return {
                    ...property,
                    listingType: property.listingType ?? "single_home",
                    unitCount: inventory.unitCount,
                    availableUnitCount: inventory.availableUnitCount,
                    minPriceNad: inventory.minPriceNad,
                    maxPriceNad: inventory.maxPriceNad,
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
        const landlordAvatarUrl = await resolveAvatarUrl(ctx, landlord?.avatarUrl);
        const units = await getStoredUnitsForProperty(ctx, property._id);
        const inventory = summarizeInventory(property, units);
        const imageUrls = await resolveStorageUrls(ctx, property.images);

        return {
            ...property,
            listingType: property.listingType ?? "single_home",
            unitCount: inventory.unitCount,
            availableUnitCount: inventory.availableUnitCount,
            minPriceNad: inventory.minPriceNad,
            maxPriceNad: inventory.maxPriceNad,
            images: imageUrls,
            units,
            landlord: landlord ? {
                fullName: landlord.fullName,
                email: landlord.email,
                phone: landlord.phone,
                avatarUrl: landlordAvatarUrl
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
            publicationStatus: "unpublished",
            isAvailable: false,
            adminNotes: undefined,
        });
        await syncPropertyInventory(ctx, args.propertyId);

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
            publicationStatus: "unpublished",
            isAvailable: false,
            adminNotes: args.reason
        });
        await syncPropertyInventory(ctx, args.propertyId);

        // Log action
        await logAdminAction(ctx, userId, "reject_property", args.propertyId, "property", { reason: args.reason });

        return { success: true };
    },
});
