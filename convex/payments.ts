import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Record a payment as paid
export const record = mutation({
    args: {
        paymentId: v.id("payments"),
        paymentMethod: v.string(),
        paymentDate: v.optional(v.number()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const payment = await ctx.db.get(args.paymentId);
        if (!payment) throw new Error("Payment not found");

        const lease = await ctx.db.get(payment.leaseId);
        if (!lease) throw new Error("Lease not found");

        const user = await ctx.db.get(userId);
        if (lease.landlordId !== userId && user?.role !== "admin") {
            throw new Error("Only the landlord can record payments");
        }

        await ctx.db.patch(args.paymentId, {
            status: "paid",
            paidAt: args.paymentDate || Date.now(),
            paymentMethod: args.paymentMethod,
            notes: args.notes,
        });

        return { success: true };
    },
});

// Generate recurring payments for a lease
export const generateRecurring = mutation({
    args: {
        leaseId: v.id("leases"),
        monthsAhead: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const lease = await ctx.db.get(args.leaseId);
        if (!lease) throw new Error("Lease not found");

        const months = args.monthsAhead || 12;
        const startDate = new Date(lease.startDate);
        const endDate = new Date(lease.endDate);

        // Get existing payments
        const existingPayments = await ctx.db
            .query("payments")
            .withIndex("by_leaseId", (q) => q.eq("leaseId", args.leaseId))
            .collect();

        const existingDates = new Set(existingPayments.map((p) => p.dueDate));

        const newPayments: Array<{
            leaseId: typeof args.leaseId;
            amount: number;
            type: "rent";
            status: "pending";
            dueDate: string;
        }> = [];

        let currentDate = new Date(startDate);
        currentDate.setMonth(currentDate.getMonth() + 1);
        currentDate.setDate(1);

        for (let i = 0; i < months; i++) {
            if (currentDate > endDate) break;

            const dueDate = currentDate.toISOString().split("T")[0];

            if (!existingDates.has(dueDate)) {
                newPayments.push({
                    leaseId: args.leaseId,
                    amount: lease.monthlyRent,
                    type: "rent",
                    status: "pending",
                    dueDate,
                });
            }

            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        for (const payment of newPayments) {
            await ctx.db.insert("payments", payment);
        }

        return { success: true, paymentsGenerated: newPayments.length };
    },
});

// Mark overdue payments
export const markOverdue = mutation({
    args: {},
    handler: async (ctx) => {
        const today = new Date().toISOString().split("T")[0];

        const pendingPayments = await ctx.db
            .query("payments")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();

        let updated = 0;
        for (const payment of pendingPayments) {
            if (payment.dueDate < today) {
                await ctx.db.patch(payment._id, { status: "overdue" });
                updated++;
            }
        }

        return { success: true, updated };
    },
});

// Get payment summary for a lease
export const getSummary = query({
    args: { leaseId: v.id("leases") },
    handler: async (ctx, args) => {
        const payments = await ctx.db
            .query("payments")
            .withIndex("by_leaseId", (q) => q.eq("leaseId", args.leaseId))
            .collect();

        const summary = { paid: 0, pending: 0, overdue: 0 };
        for (const p of payments) {
            summary[p.status] += p.amount;
        }

        return summary;
    },
});

// Get payments for a specific lease
export const getByLease = query({
    args: { leaseId: v.id("leases") },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        const lease = await ctx.db.get(args.leaseId);
        if (!lease) return [];

        // Only landlord or tenant of this lease can view payments
        if (lease.landlordId !== userId && lease.tenantId !== userId) {
            return [];
        }

        const payments = await ctx.db
            .query("payments")
            .withIndex("by_leaseId", (q) => q.eq("leaseId", args.leaseId))
            .collect();

        return payments.sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1));
    },
});

// Get all payments for landlord
export const getForLandlord = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        // Get all leases for this landlord
        const leases = await ctx.db
            .query("leases")
            .withIndex("by_landlordId", (q) => q.eq("landlordId", userId))
            .collect();

        const leaseIds = leases.map((l) => l._id);

        // Get all payments for these leases
        const allPayments = await ctx.db.query("payments").collect();
        const payments = allPayments.filter((p) => leaseIds.includes(p.leaseId));

        const enrichedPayments = await Promise.all(
            payments.map(async (payment) => {
                const lease = leases.find((l) => l._id === payment.leaseId);
                const tenant = lease ? await ctx.db.get(lease.tenantId) : null;
                const property = lease ? await ctx.db.get(lease.propertyId) : null;

                return {
                    ...payment,
                    lease: lease
                        ? {
                            id: lease._id,
                            tenantId: lease.tenantId,
                            landlordId: lease.landlordId,
                            tenant: tenant ? { fullName: tenant.fullName, email: tenant.email } : null,
                            property: property ? { title: property.title, address: property.address } : null,
                        }
                        : null,
                };
            })
        );

        return enrichedPayments.sort((a, b) => (b.dueDate > a.dueDate ? 1 : -1));
    },
});

// Get all payments for tenant
export const getForTenant = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        // Get all leases for this tenant
        const leases = await ctx.db
            .query("leases")
            .withIndex("by_tenantId", (q) => q.eq("tenantId", userId))
            .collect();

        const leaseIds = leases.map((l) => l._id);

        // Get all payments for these leases
        const allPayments = await ctx.db.query("payments").collect();
        const payments = allPayments.filter((p) => leaseIds.includes(p.leaseId));

        const enrichedPayments = await Promise.all(
            payments.map(async (payment) => {
                const lease = leases.find((l) => l._id === payment.leaseId);
                const landlord = lease ? await ctx.db.get(lease.landlordId) : null;
                const property = lease ? await ctx.db.get(lease.propertyId) : null;

                return {
                    ...payment,
                    lease: lease
                        ? {
                            id: lease._id,
                            landlordId: lease.landlordId,
                            landlord: landlord ? { fullName: landlord.fullName, email: landlord.email } : null,
                            property: property ? { title: property.title, address: property.address } : null,
                        }
                        : null,
                };
            })
        );

        return enrichedPayments.sort((a, b) => (b.dueDate > a.dueDate ? 1 : -1));
    },
});

// Get payment statistics for landlord
export const getLandlordStats = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return { totalCollected: 0, pending: 0, overdue: 0 };

        const leases = await ctx.db
            .query("leases")
            .withIndex("by_landlordId", (q) => q.eq("landlordId", userId))
            .collect();

        const leaseIds = leases.map((l) => l._id);
        const allPayments = await ctx.db.query("payments").collect();
        const payments = allPayments.filter((p) => leaseIds.includes(p.leaseId));

        const stats = { totalCollected: 0, pending: 0, overdue: 0 };
        for (const p of payments) {
            if (p.status === "paid") stats.totalCollected += p.amount;
            else if (p.status === "pending") stats.pending += p.amount;
            else if (p.status === "overdue") stats.overdue += p.amount;
        }

        return stats;
    },
});

// Get payment statistics for tenant
export const getTenantStats = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return { totalPaid: 0, pending: 0, overdue: 0 };

        const leases = await ctx.db
            .query("leases")
            .withIndex("by_tenantId", (q) => q.eq("tenantId", userId))
            .collect();

        const leaseIds = leases.map((l) => l._id);
        const allPayments = await ctx.db.query("payments").collect();
        const payments = allPayments.filter((p) => leaseIds.includes(p.leaseId));

        const stats = { totalPaid: 0, pending: 0, overdue: 0 };
        for (const p of payments) {
            if (p.status === "paid") stats.totalPaid += p.amount;
            else if (p.status === "pending") stats.pending += p.amount;
            else if (p.status === "overdue") stats.overdue += p.amount;
        }

        return stats;
    },
});
