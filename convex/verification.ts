import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

import { auth } from "./auth";
import { logAdminAction } from "./audit";
import { validateFile, ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES } from "./files";

const ALLOWED_ID_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

// Submit verification request
export const submit = mutation({
    args: {
        idType: v.union(v.literal("national_id"), v.literal("passport"), v.literal("drivers_license")),
        idNumber: v.string(),
        businessName: v.optional(v.string()),
        businessRegistration: v.optional(v.string()),
        idFrontStorageId: v.id("_storage"),
        idBackStorageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Check for existing pending request
        const existingPending = await ctx.db
            .query("landlordRequests")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .first();

        if (existingPending) {
            throw new Error("You already have a pending verification request");
        }

        // Validate documents
        await validateFile(ctx, args.idFrontStorageId, ALLOWED_ID_TYPES);
        await validateFile(ctx, args.idBackStorageId, ALLOWED_ID_TYPES);

        const requestId = await ctx.db.insert("landlordRequests", {
            userId,
            status: "pending",
            documents: {
                idType: args.idType,
                idNumber: args.idNumber,
                businessName: args.businessName,
                businessRegistration: args.businessRegistration,
                idFrontStorageId: args.idFrontStorageId,
                idBackStorageId: args.idBackStorageId,
                submittedAt: new Date().toISOString(),
            },
        });

        return requestId;
    },
});

// Resubmit after rejection
export const resubmit = mutation({
    args: {
        previousRequestId: v.id("landlordRequests"),
        idType: v.union(v.literal("national_id"), v.literal("passport"), v.literal("drivers_license")),
        idNumber: v.string(),
        businessName: v.optional(v.string()),
        businessRegistration: v.optional(v.string()),
        idFrontStorageId: v.id("_storage"),
        idBackStorageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const previousRequest = await ctx.db.get(args.previousRequestId);
        if (!previousRequest) throw new Error("Previous request not found");
        if (previousRequest.userId !== userId) throw new Error("Not your request");
        if (previousRequest.status !== "rejected") {
            throw new Error("Can only resubmit rejected requests");
        }

        // Check for existing pending
        const existingPending = await ctx.db
            .query("landlordRequests")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .first();

        if (existingPending) {
            throw new Error("You already have a pending verification request");
        }

        // Validate documents
        await validateFile(ctx, args.idFrontStorageId, ALLOWED_ID_TYPES);
        await validateFile(ctx, args.idBackStorageId, ALLOWED_ID_TYPES);

        const requestId = await ctx.db.insert("landlordRequests", {
            userId,
            status: "pending",
            documents: {
                idType: args.idType,
                idNumber: args.idNumber,
                businessName: args.businessName,
                businessRegistration: args.businessRegistration,
                idFrontStorageId: args.idFrontStorageId,
                idBackStorageId: args.idBackStorageId,
                submittedAt: new Date().toISOString(),
                previousRequestId: args.previousRequestId,
                isResubmission: true,
            },
        });

        return requestId;
    },
});

// Get user's verification status
export const getStatus = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return null;

        const requests = await ctx.db
            .query("landlordRequests")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();

        // Return most recent
        return requests.sort((a, b) => (b._creationTime > a._creationTime ? 1 : -1))[0] || null;
    },
});

// Admin: Approve verification
export const approve = mutation({
    args: { requestId: v.id("landlordRequests") },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const user = await ctx.db.get(userId);
        if (user?.role !== "admin") throw new Error("Only admins can approve");

        const request = await ctx.db.get(args.requestId);
        if (!request) throw new Error("Request not found");

        await ctx.db.patch(args.requestId, {
            status: "approved",
            reviewedAt: Date.now(),
            reviewedBy: userId,
        });

        // Upgrade user to landlord
        await ctx.db.patch(request.userId, {
            role: "landlord",
            isVerified: true,
        });

        // Log action
        await logAdminAction(ctx, userId, "approve_landlord", args.requestId, "landlord_request");

        return { success: true };
    },
});

// Admin: Reject verification
export const reject = mutation({
    args: {
        requestId: v.id("landlordRequests"),
        reason: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const user = await ctx.db.get(userId);
        if (user?.role !== "admin") throw new Error("Only admins can reject");

        await ctx.db.patch(args.requestId, {
            status: "rejected",
            adminNotes: args.reason,
            reviewedAt: Date.now(),
            reviewedBy: userId,
        });

        // Log action
        await logAdminAction(ctx, userId, "reject_landlord", args.requestId, "landlord_request", { reason: args.reason });

        return { success: true };
    },
});

// Admin: Get pending verifications
export const getPending = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        const user = await ctx.db.get(userId);
        if (user?.role !== "admin") return [];

        const requests = await ctx.db
            .query("landlordRequests")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();

        const enrichedRequests = await Promise.all(
            requests.map(async (request) => {
                const requestUser = await ctx.db.get(request.userId);
                return {
                    ...request,
                    user: requestUser
                        ? { fullName: requestUser.fullName, email: requestUser.email, phone: requestUser.phone }
                        : null,
                };
            })
        );

        return enrichedRequests;
    },
});

// Admin: Get all verifications with filtering
export const getAll = query({
    args: {
        status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        const user = await ctx.db.get(userId);
        if (user?.role !== "admin") return [];

        let requests;
        if (args.status) {
            requests = await ctx.db
                .query("landlordRequests")
                .withIndex("by_status", (q) => q.eq("status", args.status!))
                .collect();
        } else {
            requests = await ctx.db.query("landlordRequests").collect();
        }

        const enrichedRequests = await Promise.all(
            requests.map(async (request) => {
                const requestUser = await ctx.db.get(request.userId);
                return {
                    ...request,
                    user: requestUser
                        ? { fullName: requestUser.fullName, email: requestUser.email, phone: requestUser.phone }
                        : null,
                };
            })
        );

        return enrichedRequests.sort((a, b) => (b._creationTime > a._creationTime ? 1 : -1));
    },
});

// Admin: Get verification stats
export const getStats = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return { total: 0, pending: 0, approved: 0, rejected: 0 };

        const user = await ctx.db.get(userId);
        if (user?.role !== "admin") return { total: 0, pending: 0, approved: 0, rejected: 0 };

        const all = await ctx.db.query("landlordRequests").collect();

        return {
            total: all.length,
            pending: all.filter((r) => r.status === "pending").length,
            approved: all.filter((r) => r.status === "approved").length,
            rejected: all.filter((r) => r.status === "rejected").length,
        };
    },
});

// Admin: Get request by ID with storage URLs, reviewer info, and history
export const getByIdAdmin = query({
    args: { requestId: v.id("landlordRequests") },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return null;

        const user = await ctx.db.get(userId);
        if (user?.role !== "admin") return null;

        const request = await ctx.db.get(args.requestId);
        if (!request) return null;

        const requestUser = await ctx.db.get(request.userId);

        // Get storage URLs
        let idFrontUrl = null;
        let idBackUrl = null;

        if (request.documents.idFrontStorageId) {
            idFrontUrl = await ctx.storage.getUrl(request.documents.idFrontStorageId);
        }
        if (request.documents.idBackStorageId) {
            idBackUrl = await ctx.storage.getUrl(request.documents.idBackStorageId);
        }

        // Get reviewer info if reviewed
        let reviewer = null;
        if (request.reviewedBy) {
            const reviewerUser = await ctx.db.get(request.reviewedBy);
            if (reviewerUser) {
                reviewer = {
                    fullName: reviewerUser.fullName,
                    email: reviewerUser.email,
                };
            }
        }

        // Build history of previous requests (for resubmissions)
        const previousRequests: Array<{
            _id: string;
            status: string;
            adminNotes: string | null;
            reviewedAt: number | null;
            submittedAt: string;
            reviewerName: string | null;
        }> = [];

        // Walk back through the chain of previous requests
        let currentPreviousId = request.documents.previousRequestId;
        while (currentPreviousId) {
            const previousRequest = await ctx.db.get(currentPreviousId);
            if (!previousRequest) break;

            // Get reviewer name for this previous request
            let prevReviewerName = null;
            if (previousRequest.reviewedBy) {
                const prevReviewer = await ctx.db.get(previousRequest.reviewedBy);
                prevReviewerName = prevReviewer?.fullName || prevReviewer?.email || null;
            }

            previousRequests.push({
                _id: previousRequest._id,
                status: previousRequest.status,
                adminNotes: previousRequest.adminNotes || null,
                reviewedAt: previousRequest.reviewedAt || null,
                submittedAt: previousRequest.documents.submittedAt,
                reviewerName: prevReviewerName,
            });

            currentPreviousId = previousRequest.documents.previousRequestId;
        }

        return {
            ...request,
            user: requestUser
                ? {
                    fullName: requestUser.fullName,
                    email: requestUser.email,
                    phone: requestUser.phone,
                    avatarUrl: requestUser.avatarUrl,
                }
                : null,
            documents: {
                ...request.documents,
                idFrontUrl,
                idBackUrl,
            },
            reviewer,
            previousRequests,
        };
    },
});
