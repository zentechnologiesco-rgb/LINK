import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { auth } from "./auth";
import type { Doc, Id } from "./_generated/dataModel";

const DEFAULT_MONTHS_AHEAD = 12;
const RENT_SCHEDULE_STATUSES = new Set(["approved"]);

function parseDateOnly(value: string) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
}

function formatDateOnly(date: Date) {
    return date.toISOString().split("T")[0];
}

function addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
}

function addMonthsWithDueDay(date: Date, monthsToAdd: number, dueDay: number) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + monthsToAdd;
    const safeDay = Math.min(Math.max(dueDay, 1), 28);
    return new Date(Date.UTC(year, month, safeDay));
}

function paymentKey(payment: Pick<Doc<"payments">, "type" | "dueDate" | "notes">) {
    return `${payment.type}:${payment.dueDate}:${payment.notes ?? ""}`;
}

function buildScheduledPayments(
    lease: Doc<"leases">,
    monthsAhead = DEFAULT_MONTHS_AHEAD,
) {
    const schedule: Array<{
        leaseId: Id<"leases">;
        amount: number;
        type: "rent" | "deposit";
        status: "pending";
        dueDate: string;
        notes?: string;
    }> = [];

    if (!RENT_SCHEDULE_STATUSES.has(lease.status)) {
        return schedule;
    }

    const startDate = parseDateOnly(lease.startDate);
    const endDate = parseDateOnly(lease.endDate);

    if (lease.deposit && lease.deposit > 0) {
        schedule.push({
            leaseId: lease._id,
            amount: lease.deposit,
            type: "deposit",
            status: "pending",
            dueDate: lease.startDate,
            notes: "Security deposit",
        });
    }

    schedule.push({
        leaseId: lease._id,
        amount: lease.monthlyRent,
        type: "rent",
        status: "pending",
        dueDate: lease.startDate,
        notes: "Initial rent payment",
    });

    const frequency = lease.paymentFrequency ?? "monthly";

    if (frequency === "weekly" || frequency === "biweekly") {
        const intervalDays = frequency === "weekly" ? 7 : 14;
        let cursor = addDays(startDate, intervalDays);
        let cycles = 0;

        while (cursor <= endDate && cycles < monthsAhead * 5) {
            schedule.push({
                leaseId: lease._id,
                amount: lease.monthlyRent,
                type: "rent",
                status: "pending",
                dueDate: formatDateOnly(cursor),
                notes: `${frequency === "weekly" ? "Weekly" : "Biweekly"} rent payment`,
            });
            cursor = addDays(cursor, intervalDays);
            cycles += 1;
        }

        return schedule;
    }

    const dueDay = lease.rentDueDay ?? startDate.getUTCDate();

    for (let monthOffset = 1; monthOffset <= monthsAhead; monthOffset += 1) {
        const dueDate = addMonthsWithDueDay(startDate, monthOffset, dueDay);
        if (dueDate > endDate) {
            break;
        }

        schedule.push({
            leaseId: lease._id,
            amount: lease.monthlyRent,
            type: "rent",
            status: "pending",
            dueDate: formatDateOnly(dueDate),
            notes: "Recurring rent payment",
        });
    }

    return schedule;
}

async function upsertLeaseSchedule(
    ctx: MutationCtx,
    leaseId: Id<"leases">,
    monthsAhead = DEFAULT_MONTHS_AHEAD,
) {
    const lease = await ctx.db.get(leaseId);
    if (!lease) {
        throw new Error("Lease not found");
    }

    const scheduledPayments = buildScheduledPayments(lease, monthsAhead);
        const existingPayments = await ctx.db
        .query("payments")
        .withIndex("by_leaseId", (q) => q.eq("leaseId", leaseId))
        .collect();

    const existingKeys = new Set(existingPayments.map((payment: Doc<"payments">) => paymentKey(payment)));

    let inserted = 0;
    for (const payment of scheduledPayments) {
        if (existingKeys.has(paymentKey(payment))) {
            continue;
        }

        await ctx.db.insert("payments", payment);
        inserted += 1;
    }

    return { success: true, paymentsGenerated: inserted };
}

function sortPaymentsAscending(payments: Doc<"payments">[]) {
    return [...payments].sort((a, b) => {
        if (a.dueDate === b.dueDate) {
            if (a.type === b.type) {
                return a._creationTime - b._creationTime;
            }
            if (a.type === "deposit") return -1;
            if (b.type === "deposit") return 1;
            return a.type.localeCompare(b.type);
        }
        return a.dueDate.localeCompare(b.dueDate);
    });
}

async function getLeaseForAuthorizedUser(ctx: QueryCtx, leaseId: Id<"leases">, userId: Id<"users">) {
    const lease = await ctx.db.get(leaseId);
    if (!lease) {
        throw new Error("Lease not found");
    }

    const viewer = await ctx.db.get(userId);
    if (lease.landlordId !== userId && lease.tenantId !== userId && viewer?.role !== "admin") {
        throw new Error("Not authorized to view these payments");
    }

    return lease;
}

// Record a payment as paid
export const record = mutation({
    args: {
        paymentId: v.id("payments"),
        paymentMethod: v.union(v.literal("cash"), v.literal("bank_transfer"), v.literal("eft")),
        paymentDate: v.optional(v.number()),
        paymentReference: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const payment = await ctx.db.get(args.paymentId);
        if (!payment) throw new Error("Payment not found");
        if (payment.type === "deposit") {
            throw new Error("Use the deposit collection flow for security deposits");
        }
        if (payment.status === "paid") {
            throw new Error("This payment has already been recorded");
        }

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
            paymentReference: args.paymentReference,
        });

        return { success: true };
    },
});

// Allow a landlord/admin to regenerate a lease schedule manually
export const regenerateForLease = mutation({
    args: {
        leaseId: v.id("leases"),
        monthsAhead: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const lease = await ctx.db.get(args.leaseId);
        if (!lease) throw new Error("Lease not found");

        const user = await ctx.db.get(userId);
        if (lease.landlordId !== userId && user?.role !== "admin") {
            throw new Error("Only the landlord can regenerate this payment schedule");
        }

        return upsertLeaseSchedule(ctx, args.leaseId, args.monthsAhead ?? DEFAULT_MONTHS_AHEAD);
    },
});

// Internal version used by lease activation and cron-driven repair flows
export const generateScheduleForLease = internalMutation({
    args: {
        leaseId: v.id("leases"),
        monthsAhead: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        return upsertLeaseSchedule(ctx, args.leaseId, args.monthsAhead ?? DEFAULT_MONTHS_AHEAD);
    },
});

// Mark overdue payments & auto-create late fees (cron-only internal job)
export const markOverdue = internalMutation({
    args: {},
    handler: async (ctx) => {
        const today = formatDateOnly(new Date());

        const pendingPayments = await ctx.db
            .query("payments")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();

        const leaseCache = new Map<string, Doc<"leases"> | null>();
        const leasePaymentsCache = new Map<string, Doc<"payments">[]>();

        let updated = 0;
        let lateFeesCreated = 0;

        for (const payment of pendingPayments) {
            let lease = leaseCache.get(payment.leaseId);
            if (lease === undefined) {
                lease = await ctx.db.get(payment.leaseId);
                leaseCache.set(payment.leaseId, lease);
            }

            if (!lease) {
                continue;
            }

            const graceDays = payment.type === "rent" ? lease.gracePeriodDays ?? 0 : 0;
            const overdueDate = addDays(parseDateOnly(payment.dueDate), graceDays);

            if (today <= formatDateOnly(overdueDate)) {
                continue;
            }

            await ctx.db.patch(payment._id, { status: "overdue" });
            updated += 1;

            if (payment.type !== "rent" || !lease.lateFeeAmount) {
                continue;
            }

            let leasePayments = leasePaymentsCache.get(payment.leaseId);
            if (!leasePayments) {
                leasePayments = await ctx.db
                    .query("payments")
                    .withIndex("by_leaseId", (q) => q.eq("leaseId", payment.leaseId))
                    .collect();
                leasePaymentsCache.set(payment.leaseId, leasePayments);
            }

            const lateFeeAmount = lease.lateFeeType === "percentage"
                ? Math.round((lease.monthlyRent * lease.lateFeeAmount) / 100)
                : lease.lateFeeAmount;
            const lateFeeNotes = `Auto-generated late fee for rent due ${payment.dueDate}`;

            const hasExistingLateFee = leasePayments.some((leasePayment) =>
                leasePayment.type === "late_fee" && leasePayment.notes === lateFeeNotes,
            );

            if (lateFeeAmount > 0 && !hasExistingLateFee) {
                const lateFeePayment = {
                    leaseId: payment.leaseId,
                    amount: lateFeeAmount,
                    type: "late_fee" as const,
                    status: "pending" as const,
                    dueDate: today,
                    notes: lateFeeNotes,
                };

                const lateFeeId = await ctx.db.insert("payments", lateFeePayment);
                leasePayments.push({
                    ...lateFeePayment,
                    _id: lateFeeId,
                    _creationTime: Date.now(),
                });
                lateFeesCreated += 1;
            }
        }

        return { success: true, updated, lateFeesCreated };
    },
});

// Get payment summary for a lease
export const getSummary = query({
    args: { leaseId: v.id("leases") },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return { paid: 0, pending: 0, overdue: 0 };

        await getLeaseForAuthorizedUser(ctx, args.leaseId, userId);

        const payments = await ctx.db
            .query("payments")
            .withIndex("by_leaseId", (q) => q.eq("leaseId", args.leaseId))
            .collect();

        const summary = { paid: 0, pending: 0, overdue: 0 };
        for (const payment of payments) {
            summary[payment.status] += payment.amount;
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

        await getLeaseForAuthorizedUser(ctx, args.leaseId, userId);

        const payments = await ctx.db
            .query("payments")
            .withIndex("by_leaseId", (q) => q.eq("leaseId", args.leaseId))
            .collect();

        return sortPaymentsAscending(payments);
    },
});

// Get all payments for landlord
export const getForLandlord = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        const leases = await ctx.db
            .query("leases")
            .withIndex("by_landlordId", (q) => q.eq("landlordId", userId))
            .collect();

        const leaseIds = new Set(leases.map((lease) => lease._id));
        const allPayments = await ctx.db.query("payments").collect();
        const payments = allPayments.filter((payment) => leaseIds.has(payment.leaseId));

        const enrichedPayments = await Promise.all(
            payments.map(async (payment) => {
                const lease = leases.find((currentLease) => currentLease._id === payment.leaseId);
                const tenant = lease ? await ctx.db.get(lease.tenantId) : null;
                const property = lease ? await ctx.db.get(lease.propertyId) : null;

                return {
                    ...payment,
                    lease: lease
                        ? {
                            id: lease._id,
                            status: lease.status,
                            tenantId: lease.tenantId,
                            landlordId: lease.landlordId,
                            startDate: lease.startDate,
                            endDate: lease.endDate,
                            tenant: tenant ? { fullName: tenant.fullName, email: tenant.email } : null,
                            property: property ? { title: property.title, address: property.address, city: property.city } : null,
                        }
                        : null,
                };
            }),
        );

        return enrichedPayments.sort((a, b) => b.dueDate.localeCompare(a.dueDate));
    },
});

// Get all payments for tenant
export const getForTenant = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        const leases = await ctx.db
            .query("leases")
            .withIndex("by_tenantId", (q) => q.eq("tenantId", userId))
            .collect();

        const leaseIds = new Set(leases.map((lease) => lease._id));
        const allPayments = await ctx.db.query("payments").collect();
        const payments = allPayments.filter((payment) => leaseIds.has(payment.leaseId));

        const enrichedPayments = await Promise.all(
            payments.map(async (payment) => {
                const lease = leases.find((currentLease) => currentLease._id === payment.leaseId);
                const landlord = lease ? await ctx.db.get(lease.landlordId) : null;
                const property = lease ? await ctx.db.get(lease.propertyId) : null;

                return {
                    ...payment,
                    lease: lease
                        ? {
                            id: lease._id,
                            status: lease.status,
                            startDate: lease.startDate,
                            endDate: lease.endDate,
                            landlordId: lease.landlordId,
                            landlord: landlord ? { fullName: landlord.fullName, email: landlord.email } : null,
                            property: property ? { title: property.title, address: property.address, city: property.city } : null,
                        }
                        : null,
                };
            }),
        );

        return enrichedPayments.sort((a, b) => b.dueDate.localeCompare(a.dueDate));
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

        const leaseIds = new Set(leases.map((lease) => lease._id));
        const allPayments = await ctx.db.query("payments").collect();
        const payments = allPayments.filter((payment) => leaseIds.has(payment.leaseId));

        const stats = { totalCollected: 0, pending: 0, overdue: 0 };
        for (const payment of payments) {
            if (payment.status === "paid") stats.totalCollected += payment.amount;
            if (payment.status === "pending") stats.pending += payment.amount;
            if (payment.status === "overdue") stats.overdue += payment.amount;
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

        const leaseIds = new Set(leases.map((lease) => lease._id));
        const allPayments = await ctx.db.query("payments").collect();
        const payments = allPayments.filter((payment) => leaseIds.has(payment.leaseId));

        const stats = { totalPaid: 0, pending: 0, overdue: 0 };
        for (const payment of payments) {
            if (payment.status === "paid") stats.totalPaid += payment.amount;
            if (payment.status === "pending") stats.pending += payment.amount;
            if (payment.status === "overdue") stats.overdue += payment.amount;
        }

        return stats;
    },
});
