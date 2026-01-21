import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Create deposit for a lease
export const create = mutation({
    args: {
        leaseId: v.id("leases"),
        tenantId: v.id("users"),
        landlordId: v.id("users"),
        amount: v.number(),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Check if deposit already exists
        const existing = await ctx.db
            .query("deposits")
            .withIndex("by_leaseId", (q) => q.eq("leaseId", args.leaseId))
            .first();

        if (existing) {
            throw new Error("Deposit already exists for this lease");
        }

        const depositId = await ctx.db.insert("deposits", {
            leaseId: args.leaseId,
            tenantId: args.tenantId,
            landlordId: args.landlordId,
            amount: args.amount,
            status: "pending",
            deductionAmount: 0,
        });

        return depositId;
    },
});

// Confirm deposit payment (landlord confirms receipt)
export const confirm = mutation({
    args: {
        depositId: v.id("deposits"),
        paymentMethod: v.union(v.literal("cash"), v.literal("bank_transfer"), v.literal("eft")),
        paymentReference: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const deposit = await ctx.db.get(args.depositId);
        if (!deposit) throw new Error("Deposit not found");
        if (deposit.status !== "pending") throw new Error("Deposit is not pending");

        const user = await ctx.db.get(userId);
        if (deposit.landlordId !== userId && user?.role !== "admin") {
            throw new Error("Only the landlord can confirm deposits");
        }

        await ctx.db.patch(args.depositId, {
            status: "held",
            paidAt: Date.now(),
            paymentMethod: args.paymentMethod,
            paymentReference: args.paymentReference,
        });

        return { success: true };
    },
});

// Request deposit release
export const requestRelease = mutation({
    args: {
        depositId: v.id("deposits"),
        reason: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const deposit = await ctx.db.get(args.depositId);
        if (!deposit) throw new Error("Deposit not found");
        if (deposit.status !== "held") throw new Error("Deposit is not currently held");

        await ctx.db.patch(args.depositId, {
            releaseRequestedAt: Date.now(),
            releaseRequestedBy: userId,
            releaseReason: args.reason,
        });

        return { success: true };
    },
});

// Release deposit (full or partial)
export const release = mutation({
    args: {
        depositId: v.id("deposits"),
        deductionAmount: v.optional(v.number()),
        deductionReason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const deposit = await ctx.db.get(args.depositId);
        if (!deposit) throw new Error("Deposit not found");

        const user = await ctx.db.get(userId);
        if (deposit.landlordId !== userId && user?.role !== "admin") {
            throw new Error("Only the landlord can release deposits");
        }

        const deduction = args.deductionAmount || 0;
        const status = deduction > 0 ? "partial_release" : "released";

        await ctx.db.patch(args.depositId, {
            status,
            deductionAmount: deduction,
            deductionReason: args.deductionReason,
            releasedAt: Date.now(),
        });

        return {
            success: true,
            releasedAmount: deposit.amount - deduction,
            deductedAmount: deduction,
        };
    },
});

// Forfeit deposit
export const forfeit = mutation({
    args: {
        depositId: v.id("deposits"),
        reason: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const deposit = await ctx.db.get(args.depositId);
        if (!deposit) throw new Error("Deposit not found");

        const user = await ctx.db.get(userId);
        if (deposit.landlordId !== userId && user?.role !== "admin") {
            throw new Error("Only the landlord can forfeit deposits");
        }

        await ctx.db.patch(args.depositId, {
            status: "forfeited",
            deductionReason: args.reason,
            releasedAt: Date.now(),
        });

        return { success: true };
    },
});

// Get deposit for a lease
export const getForLease = query({
    args: { leaseId: v.id("leases") },
    handler: async (ctx, args) => {
        const deposit = await ctx.db
            .query("deposits")
            .withIndex("by_leaseId", (q) => q.eq("leaseId", args.leaseId))
            .first();

        if (!deposit) return null;

        const tenant = await ctx.db.get(deposit.tenantId);
        const landlord = await ctx.db.get(deposit.landlordId);

        return {
            ...deposit,
            tenant: tenant ? { fullName: tenant.fullName, email: tenant.email } : null,
            landlord: landlord ? { fullName: landlord.fullName, email: landlord.email } : null,
        };
    },
});

// Get all deposits for landlord
export const getForLandlord = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        const deposits = await ctx.db
            .query("deposits")
            .withIndex("by_landlordId", (q) => q.eq("landlordId", userId))
            .collect();

        const enrichedDeposits = await Promise.all(
            deposits.map(async (deposit) => {
                const tenant = await ctx.db.get(deposit.tenantId);
                const lease = await ctx.db.get(deposit.leaseId);
                const property = lease ? await ctx.db.get(lease.propertyId) : null;

                return {
                    ...deposit,
                    tenant: tenant ? { fullName: tenant.fullName, email: tenant.email } : null,
                    lease: lease
                        ? {
                            id: lease._id,
                            property: property ? { title: property.title, address: property.address } : null,
                        }
                        : null,
                };
            })
        );

        return enrichedDeposits;
    },
});

// Get all deposits for tenant
export const getForTenant = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        const deposits = await ctx.db
            .query("deposits")
            .withIndex("by_tenantId", (q) => q.eq("tenantId", userId))
            .collect();

        const enrichedDeposits = await Promise.all(
            deposits.map(async (deposit) => {
                const landlord = await ctx.db.get(deposit.landlordId);
                const lease = await ctx.db.get(deposit.leaseId);
                const property = lease ? await ctx.db.get(lease.propertyId) : null;

                return {
                    ...deposit,
                    landlord: landlord ? { fullName: landlord.fullName, email: landlord.email } : null,
                    lease: lease
                        ? {
                            id: lease._id,
                            property: property ? { title: property.title, address: property.address } : null,
                        }
                        : null,
                };
            })
        );

        return enrichedDeposits;
    },
});
