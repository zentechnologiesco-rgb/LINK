import { v } from "convex/values";
import { type MutationCtx, type QueryCtx, mutation, query } from "./_generated/server";

import { auth } from "./auth";
import { logAdminAction } from "./audit";
import { resolveAvatarUrl } from "./lib/avatar";
import {
    getStoredUnitsForProperty,
    resolveStorageUrls,
    summarizeInventory,
    syncPropertyInventory,
} from "./lib/propertyInventory";
import { normalizeRequiredText } from "./lib/security";

const RESERVED_LEASE_STATUSES = new Set([
    "draft",
    "sent_to_tenant",
    "tenant_signed",
    "revision_requested",
]);

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const ACTIVITY_LABELS: Record<string, string> = {
    approve_landlord: "Approved landlord",
    approve_property: "Approved property",
    delete_property: "Deleted property",
    publish_property: "Published listing",
    reject_landlord: "Rejected landlord",
    reject_property: "Requested property changes",
    unpublish_property: "Unpublished listing",
    update_user_role: "Changed user role",
};

type AdminCtx = MutationCtx | QueryCtx;

async function getAdminViewer(ctx: AdminCtx) {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") return null;

    return { userId, user };
}

// Helper to check admin role
async function requireAdmin(ctx: MutationCtx) {
    const viewer = await getAdminViewer(ctx);
    if (!viewer) throw new Error("Admin access required");

    return viewer.userId;
}

function calculateRate(value: number, total: number) {
    if (total <= 0) return 0;
    return Math.round((value / total) * 100);
}

function buildTrend(current: number, previous: number) {
    const delta = current - previous;
    const direction = delta === 0 ? "flat" : delta > 0 ? "up" : "down";
    const changePercent =
        previous === 0
            ? current === 0
                ? 0
                : 100
            : Math.round((delta / previous) * 100);

    return {
        current,
        previous,
        delta,
        direction,
        changePercent,
    };
}

function countWithinWindow<T>(
    items: T[],
    getTimestamp: (item: T) => number | undefined,
    from: number,
    to = Number.POSITIVE_INFINITY,
) {
    return items.reduce((count, item) => {
        const timestamp = getTimestamp(item);
        if (timestamp === undefined) return count;
        return timestamp >= from && timestamp < to ? count + 1 : count;
    }, 0);
}

function sumWithinWindow<T>(
    items: T[],
    getTimestamp: (item: T) => number | undefined,
    getAmount: (item: T) => number,
    from: number,
    to = Number.POSITIVE_INFINITY,
) {
    return items.reduce((sum, item) => {
        const timestamp = getTimestamp(item);
        if (timestamp === undefined || timestamp < from || timestamp >= to) {
            return sum;
        }

        return sum + getAmount(item);
    }, 0);
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

// Rich admin dashboard overview
export const getDashboardOverview = query({
    args: {},
    handler: async (ctx) => {
        const viewer = await getAdminViewer(ctx);
        if (!viewer) return null;

        const now = Date.now();
        const sevenDaysAgo = now - (7 * DAY_IN_MS);
        const fourteenDaysAgo = now - (14 * DAY_IN_MS);
        const thirtyDaysAgo = now - (30 * DAY_IN_MS);
        const sixtyDaysAgo = now - (60 * DAY_IN_MS);

        const [
            users,
            properties,
            propertyUnits,
            leases,
            inquiries,
            messages,
            landlordRequests,
            payments,
            deposits,
            supportThreads,
            supportMessages,
            savedProperties,
            recentlyViewed,
            announcements,
            auditLogs,
        ] = await Promise.all([
            ctx.db.query("users").collect(),
            ctx.db.query("properties").collect(),
            ctx.db.query("propertyUnits").collect(),
            ctx.db.query("leases").collect(),
            ctx.db.query("inquiries").collect(),
            ctx.db.query("messages").collect(),
            ctx.db.query("landlordRequests").collect(),
            ctx.db.query("payments").collect(),
            ctx.db.query("deposits").collect(),
            ctx.db.query("supportThreads").collect(),
            ctx.db.query("supportMessages").collect(),
            ctx.db.query("savedProperties").collect(),
            ctx.db.query("recentlyViewed").collect(),
            ctx.db.query("announcements").collect(),
            ctx.db.query("auditLogs").collect(),
        ]);

        const usersById = new Map(users.map((user) => [user._id, user]));
        const propertiesById = new Map(properties.map((property) => [property._id, property]));
        const landlordRequestsById = new Map(landlordRequests.map((request) => [request._id, request]));

        const unitsByPropertyId = new Map<string, typeof propertyUnits>();
        for (const unit of propertyUnits) {
            const units = unitsByPropertyId.get(unit.propertyId) ?? [];
            units.push(unit);
            unitsByPropertyId.set(unit.propertyId, units);
        }

        const leasesByPropertyId = new Map<string, typeof leases>();
        for (const lease of leases) {
            const propertyLeases = leasesByPropertyId.get(lease.propertyId) ?? [];
            propertyLeases.push(lease);
            leasesByPropertyId.set(lease.propertyId, propertyLeases);
        }

        const savesByPropertyId = new Map();
        for (const save of savedProperties) {
            savesByPropertyId.set(
                save.propertyId,
                (savesByPropertyId.get(save.propertyId) ?? 0) + 1,
            );
        }

        const viewsByPropertyId = new Map();
        for (const view of recentlyViewed) {
            viewsByPropertyId.set(
                view.propertyId,
                (viewsByPropertyId.get(view.propertyId) ?? 0) + 1,
            );
        }

        const roleCounts = {
            tenant: 0,
            landlord: 0,
            admin: 0,
        };
        let verifiedUsers = 0;
        for (const user of users) {
            roleCounts[user.role] += 1;
            if (user.isVerified) {
                verifiedUsers += 1;
            }
        }

        const leaseStatusCounts = {
            draft: 0,
            sent_to_tenant: 0,
            tenant_signed: 0,
            approved: 0,
            rejected: 0,
            revision_requested: 0,
            expired: 0,
            terminated: 0,
        };
        for (const lease of leases) {
            leaseStatusCounts[lease.status] += 1;
        }

        const inquiryStatusCounts = {
            pending: 0,
            approved: 0,
            rejected: 0,
            completed: 0,
        };
        for (const inquiry of inquiries) {
            inquiryStatusCounts[inquiry.status] += 1;
        }

        const propertyCounts = {
            approved: 0,
            pending: 0,
            rejected: 0,
            published: 0,
            live: 0,
            featured: 0,
            offMarket: 0,
            noVacancy: 0,
        };
        const inventoryCounts = {
            totalUnits: 0,
            availableUnits: 0,
            reservedUnits: 0,
            occupiedUnits: 0,
            unavailableUnits: 0,
        };
        const cityStats = new Map<string, { city: string; total: number; live: number; pending: number }>();
        const propertySnapshot = [];

        for (const property of properties) {
            const units = unitsByPropertyId.get(property._id) ?? [];
            const propertyLeases = leasesByPropertyId.get(property._id) ?? [];
            const inventory = summarizeInventory(property, units);
            const activeLeaseCount = propertyLeases.filter((lease) => lease.status === "approved").length;
            const reservedLeaseCount = propertyLeases.filter((lease) => RESERVED_LEASE_STATUSES.has(lease.status)).length;
            const isLive = inventory.isPublicReady;
            const isPending = property.approvalStatus === "pending";
            const isRejected = property.approvalStatus === "rejected";
            const isApproved = property.approvalStatus === "approved";

            if (isApproved) propertyCounts.approved += 1;
            if (isPending) propertyCounts.pending += 1;
            if (isRejected) propertyCounts.rejected += 1;
            if (property.publicationStatus === "published") propertyCounts.published += 1;
            if (property.featured) propertyCounts.featured += 1;
            if (isLive) propertyCounts.live += 1;
            if (isApproved && property.publicationStatus !== "published") propertyCounts.offMarket += 1;
            if (isApproved && property.publicationStatus === "published" && inventory.availableUnitCount === 0) {
                propertyCounts.noVacancy += 1;
            }

            for (const unit of inventory.units) {
                inventoryCounts.totalUnits += 1;
                if (unit.publicationStatus !== "published" || unit.occupancyStatus === "unavailable") {
                    inventoryCounts.unavailableUnits += 1;
                    continue;
                }
                if (unit.occupancyStatus === "occupied") {
                    inventoryCounts.occupiedUnits += 1;
                    continue;
                }
                if (unit.occupancyStatus === "reserved") {
                    inventoryCounts.reservedUnits += 1;
                    continue;
                }
                inventoryCounts.availableUnits += 1;
            }

            const cityKey = property.city?.trim() || "Unassigned";
            const currentCity = cityStats.get(cityKey) ?? { city: cityKey, total: 0, live: 0, pending: 0 };
            currentCity.total += 1;
            if (isLive) currentCity.live += 1;
            if (isPending) currentCity.pending += 1;
            cityStats.set(cityKey, currentCity);

            const landlord = usersById.get(property.landlordId);
            propertySnapshot.push({
                _id: property._id,
                title: property.title,
                city: property.city,
                priceNad: property.priceNad,
                approvalStatus: property.approvalStatus,
                publicationStatus: property.publicationStatus,
                isAvailable: property.isAvailable,
                availableUnitCount: inventory.availableUnitCount,
                activeLeaseCount,
                reservedLeaseCount,
                submittedAt: property.approvalRequestedAt ?? property._creationTime,
                landlord: landlord
                    ? {
                        fullName: landlord.fullName,
                        email: landlord.email,
                    }
                    : null,
                saveCount: savesByPropertyId.get(property._id) ?? 0,
                viewCount: viewsByPropertyId.get(property._id) ?? 0,
            });
        }

        const paymentCounts = {
            paid: 0,
            pending: 0,
            overdue: 0,
        };
        const paymentAmounts = {
            paid: 0,
            pending: 0,
            overdue: 0,
        };
        for (const payment of payments) {
            paymentCounts[payment.status] += 1;
            paymentAmounts[payment.status] += payment.amount;
        }

        const depositCounts = {
            pending: 0,
            held: 0,
            released: 0,
            forfeited: 0,
            partial_release: 0,
        };
        const depositAmounts = {
            pending: 0,
            held: 0,
            released: 0,
            forfeited: 0,
            partial_release: 0,
        };
        for (const deposit of deposits) {
            depositCounts[deposit.status] += 1;
            depositAmounts[deposit.status] += deposit.amount;
        }

        const supportCounts = {
            open: 0,
            pending: 0,
            resolved: 0,
            urgent: 0,
            highPriority: 0,
        };
        for (const thread of supportThreads) {
            supportCounts[thread.status] += 1;
            if (thread.status !== "resolved" && thread.priority === "urgent") {
                supportCounts.urgent += 1;
            }
            if (thread.status !== "resolved" && (thread.priority === "urgent" || thread.priority === "high")) {
                supportCounts.highPriority += 1;
            }
        }

        const unreadSupportMessages = supportMessages.filter((message) => message.readAt === undefined).length;

        const activeAnnouncements = announcements.filter(
            (announcement) => !announcement.expiresAt || announcement.expiresAt > now,
        ).length;

        const usersTrend = buildTrend(
            countWithinWindow(users, (user) => user._creationTime, sevenDaysAgo),
            countWithinWindow(users, (user) => user._creationTime, fourteenDaysAgo, sevenDaysAgo),
        );
        const propertyTrend = buildTrend(
            countWithinWindow(properties, (property) => property.approvalRequestedAt ?? property._creationTime, sevenDaysAgo),
            countWithinWindow(properties, (property) => property.approvalRequestedAt ?? property._creationTime, fourteenDaysAgo, sevenDaysAgo),
        );
        const inquiryTrend = buildTrend(
            countWithinWindow(inquiries, (inquiry) => inquiry._creationTime, sevenDaysAgo),
            countWithinWindow(inquiries, (inquiry) => inquiry._creationTime, fourteenDaysAgo, sevenDaysAgo),
        );
        const collectedTrend = buildTrend(
            sumWithinWindow(payments, (payment) => payment.paidAt, (payment) => payment.amount, thirtyDaysAgo),
            sumWithinWindow(payments, (payment) => payment.paidAt, (payment) => payment.amount, sixtyDaysAgo, thirtyDaysAgo),
        );

        const recentUsers = await Promise.all(
            [...users]
                .sort((a, b) => b._creationTime - a._creationTime)
                .slice(0, 6)
                .map(async (user) => ({
                    _id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                    isVerified: user.isVerified,
                    avatarUrl: await resolveAvatarUrl(ctx, user.avatarUrl),
                    createdAt: user._creationTime,
                })),
        );

        const recentActivity = [...auditLogs]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 8)
            .map((log) => {
                const adminUser = usersById.get(log.adminId);
                const property = propertiesById.get(log.targetId as typeof properties[number]["_id"]);
                const landlordRequest = landlordRequestsById.get(log.targetId as typeof landlordRequests[number]["_id"]);
                const requestUser = landlordRequest ? usersById.get(landlordRequest.userId) : null;
                const targetUser = usersById.get(log.targetId as typeof users[number]["_id"]);

                let targetLabel = "Platform item";
                if (log.targetType === "property" && property) {
                    targetLabel = property.title;
                } else if (log.targetType === "landlord_request" && landlordRequest) {
                    targetLabel =
                        requestUser?.fullName ||
                        requestUser?.email ||
                        landlordRequest.documents.businessName ||
                        "Verification request";
                } else if (log.targetType === "user" && targetUser) {
                    targetLabel = targetUser.fullName || targetUser.email;
                }

                let detail = "";
                if (
                    log.action === "update_user_role" &&
                    log.details &&
                    typeof log.details === "object" &&
                    "fromRole" in log.details &&
                    "toRole" in log.details
                ) {
                    detail = `${String(log.details.fromRole)} -> ${String(log.details.toRole)}`;
                } else if (
                    log.action === "reject_property" &&
                    log.details &&
                    typeof log.details === "object" &&
                    "reason" in log.details
                ) {
                    detail = String(log.details.reason);
                }

                let href: string | undefined;
                if (log.targetType === "landlord_request") {
                    href = `/admin/landlord-requests/${log.targetId}`;
                } else if (
                    log.targetType === "property" &&
                    (log.action === "approve_property" || log.action === "reject_property")
                ) {
                    href = `/admin/property-requests/${log.targetId}`;
                } else if (log.targetType === "user") {
                    href = "/admin/users";
                }

                return {
                    _id: log._id,
                    timestamp: log.timestamp,
                    label: ACTIVITY_LABELS[log.action] ?? log.action.replace(/_/g, " "),
                    targetLabel,
                    adminName: adminUser?.fullName || adminUser?.email || "Admin",
                    detail,
                    href,
                };
            });

        return {
            headline: {
                queuesNeedingAttention:
                    propertyCounts.pending +
                    landlordRequests.filter((request) => request.status === "pending").length +
                    supportCounts.urgent +
                    paymentCounts.overdue,
                liveListings: propertyCounts.live,
                occupancyRate: calculateRate(
                    inventoryCounts.occupiedUnits,
                    inventoryCounts.totalUnits,
                ),
                collectionRate: calculateRate(
                    paymentAmounts.paid,
                    paymentAmounts.paid + paymentAmounts.pending + paymentAmounts.overdue,
                ),
            },
            users: {
                total: users.length,
                verified: verifiedUsers,
                verifiedRate: calculateRate(verifiedUsers, users.length),
                roles: roleCounts,
                trend: usersTrend,
                recent: recentUsers,
            },
            properties: {
                total: properties.length,
                approved: propertyCounts.approved,
                pending: propertyCounts.pending,
                rejected: propertyCounts.rejected,
                published: propertyCounts.published,
                live: propertyCounts.live,
                featured: propertyCounts.featured,
                offMarket: propertyCounts.offMarket,
                noVacancy: propertyCounts.noVacancy,
                trend: propertyTrend,
                recent: propertySnapshot
                    .sort((a, b) => b.submittedAt - a.submittedAt)
                    .slice(0, 6),
                topProperties: propertySnapshot
                    .sort((a, b) => (b.viewCount + b.saveCount) - (a.viewCount + a.saveCount))
                    .slice(0, 5),
            },
            inventory: {
                ...inventoryCounts,
                occupancyRate: calculateRate(
                    inventoryCounts.occupiedUnits,
                    inventoryCounts.totalUnits,
                ),
            },
            leases: leaseStatusCounts,
            moderation: {
                propertyRequestsTotal: propertyCounts.pending + propertyCounts.approved + propertyCounts.rejected,
                propertyApprovalRate: calculateRate(
                    propertyCounts.approved,
                    propertyCounts.pending + propertyCounts.approved + propertyCounts.rejected,
                ),
                landlordRequestsTotal: landlordRequests.length,
                landlordApprovalRate: calculateRate(
                    landlordRequests.filter((request) => request.status === "approved").length,
                    landlordRequests.length,
                ),
                pendingPropertyRequests: propertyCounts.pending,
                pendingLandlordRequests: landlordRequests.filter((request) => request.status === "pending").length,
                rejectedPropertyRequests: propertyCounts.rejected,
                rejectedLandlordRequests: landlordRequests.filter((request) => request.status === "rejected").length,
            },
            finances: {
                amounts: paymentAmounts,
                counts: paymentCounts,
                deposits: {
                    counts: depositCounts,
                    amounts: depositAmounts,
                },
                collectionRate: calculateRate(
                    paymentAmounts.paid,
                    paymentAmounts.paid + paymentAmounts.pending + paymentAmounts.overdue,
                ),
                trend: collectedTrend,
            },
            engagement: {
                inquiries: {
                    total: inquiries.length,
                    ...inquiryStatusCounts,
                },
                messages: {
                    total: messages.length + supportMessages.length,
                    inquiryMessages: messages.length,
                    supportMessages: supportMessages.length,
                    unreadSupportMessages,
                },
                savedProperties: savedProperties.length,
                recentlyViewed: recentlyViewed.length,
                announcements: {
                    total: announcements.length,
                    active: activeAnnouncements,
                },
                support: {
                    total: supportThreads.length,
                    open: supportCounts.open,
                    pending: supportCounts.pending,
                    resolved: supportCounts.resolved,
                    urgent: supportCounts.urgent,
                    highPriority: supportCounts.highPriority,
                },
                trend: inquiryTrend,
            },
            topCities: [...cityStats.values()]
                .sort((a, b) => b.live - a.live || b.total - a.total)
                .slice(0, 5),
            recentActivity,
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
        const adminId = await requireAdmin(ctx);
        const existingUser = await ctx.db.get(args.userId);
        if (!existingUser) throw new Error("User not found");

        await ctx.db.patch(args.userId, { role: args.role });
        await logAdminAction(ctx, adminId, "update_user_role", args.userId, "user", {
            fromRole: existingUser.role,
            toRole: args.role,
        });
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
        const adminId = await requireAdmin(ctx);
        const property = await ctx.db.get(args.propertyId);
        if (!property) throw new Error("Property not found");
        if (property.approvalStatus !== "approved") {
            throw new Error("Only approved listings can be published or taken off market.");
        }

        await ctx.db.patch(args.propertyId, {
            publicationStatus: args.isAvailable ? "published" : "unpublished",
        });
        await syncPropertyInventory(ctx, args.propertyId);
        await logAdminAction(
            ctx,
            adminId,
            args.isAvailable ? "publish_property" : "unpublish_property",
            args.propertyId,
            "property",
            {
                title: property.title,
            },
        );
        return { success: true };
    },
});

// Delete property (admin only)
export const deleteProperty = mutation({
    args: { propertyId: v.id("properties") },
    handler: async (ctx, args) => {
        const adminId = await requireAdmin(ctx);
        const property = await ctx.db.get(args.propertyId);
        if (!property) throw new Error("Property not found");

        const units = await getStoredUnitsForProperty(ctx, args.propertyId);
        for (const unit of units) {
            await ctx.db.delete(unit._id);
        }
        await ctx.db.delete(args.propertyId);
        await logAdminAction(ctx, adminId, "delete_property", args.propertyId, "property", {
            title: property.title,
            deletedUnitCount: units.length,
        });
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
        const rejectionReason = normalizeRequiredText(args.reason, { maxLength: 1000, multiline: true }, "Rejection reason");
        await ctx.db.patch(args.propertyId, {
            approvalStatus: "rejected",
            publicationStatus: "unpublished",
            isAvailable: false,
            adminNotes: rejectionReason
        });
        await syncPropertyInventory(ctx, args.propertyId);

        // Log action
        await logAdminAction(ctx, userId, "reject_property", args.propertyId, "property", { reason: rejectionReason });

        return { success: true };
    },
});
