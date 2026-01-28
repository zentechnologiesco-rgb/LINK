import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";
import { api } from "./_generated/api";
import { TEMPLATES } from "./emailTemplates";
import { validateFile, ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES } from "./files";

const BASE_URL = "http://localhost:3000";

// Create a new lease
export const create = mutation({
    args: {
        propertyId: v.id("properties"),
        tenantId: v.id("users"),
        startDate: v.string(),
        endDate: v.string(),
        monthlyRent: v.number(),
        deposit: v.optional(v.number()),
        leaseDocument: v.optional(v.any()),
        terms: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const property = await ctx.db.get(args.propertyId);
        if (!property) throw new Error("Property not found");

        const user = await ctx.db.get(userId);
        if (property.landlordId !== userId && user?.role !== "admin") {
            throw new Error("Only the property owner can create leases");
        }

        const leaseId = await ctx.db.insert("leases", {
            propertyId: args.propertyId,
            tenantId: args.tenantId,
            landlordId: userId,
            startDate: args.startDate,
            endDate: args.endDate,
            monthlyRent: args.monthlyRent,
            deposit: args.deposit,
            leaseDocument: args.leaseDocument,
            terms: args.terms,
            status: "draft",
        });

        return leaseId;
    },
});

// Create a new lease with tenant email
export const createByEmail = mutation({
    args: {
        propertyId: v.id("properties"),
        tenantEmail: v.string(),
        startDate: v.string(),
        endDate: v.string(),
        monthlyRent: v.number(),
        deposit: v.optional(v.number()),
        leaseDocument: v.optional(v.any()),
        terms: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Find tenant by email
        const tenant = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.tenantEmail))
            .first();

        if (!tenant) throw new Error(`No user found with email ${args.tenantEmail}. Please ask them to sign up first.`);

        const property = await ctx.db.get(args.propertyId);
        if (!property) throw new Error("Property not found");

        const user = await ctx.db.get(userId);
        if (property.landlordId !== userId && user?.role !== "admin") {
            throw new Error("Only the property owner can create leases");
        }

        const leaseId = await ctx.db.insert("leases", {
            propertyId: args.propertyId,
            tenantId: tenant._id,
            landlordId: userId,
            startDate: args.startDate,
            endDate: args.endDate,
            monthlyRent: args.monthlyRent,
            deposit: args.deposit,
            leaseDocument: args.leaseDocument,
            terms: args.terms,
            status: "draft",
        });

        // Also generate payments (optional, but legacy probably did it)
        // We handle payment generation separately usually.

        return { leaseId, tenantName: tenant.fullName };
    },
});

// Send lease to tenant
export const sendToTenant = mutation({
    args: { leaseId: v.id("leases") },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const lease = await ctx.db.get(args.leaseId);
        if (!lease) throw new Error("Lease not found");
        if (lease.landlordId !== userId) throw new Error("Only the landlord can send the lease");
        if (lease.status !== "draft") throw new Error("Only draft leases can be sent");

        await ctx.db.patch(args.leaseId, {
            status: "sent_to_tenant",
            sentAt: Date.now(),
        });

        // Notify Tenant
        const tenant = await ctx.db.get(lease.tenantId);
        const property = await ctx.db.get(lease.propertyId);

        if (tenant?.email && property) {
            const emailData = TEMPLATES.LEASE_CREATED(
                `${BASE_URL}/tenant/leases/${args.leaseId}`,
                property.address
            );
            await ctx.scheduler.runAfter(0, api.emails.send, {
                to: tenant.email,
                subject: emailData.subject,
                html: emailData.html
            });
        }

        return { success: true };
    },
});

// Tenant signs lease
export const tenantSign = mutation({
    args: {
        leaseId: v.id("leases"),
        signatureData: v.string(),
        tenantDocuments: v.array(v.object({
            type: v.string(),
            storageId: v.id("_storage"),
            uploadedAt: v.string(),
        })),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const lease = await ctx.db.get(args.leaseId);
        if (!lease) throw new Error("Lease not found");
        if (lease.tenantId !== userId) throw new Error("Only the tenant can sign");
        if (lease.status !== "sent_to_tenant" && lease.status !== "revision_requested") throw new Error("Lease not ready for signing");


        // Validate documents
        const ALLOWED_LEASE_DOCS = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];
        for (const doc of args.tenantDocuments) {
            await validateFile(ctx, doc.storageId, ALLOWED_LEASE_DOCS);
        }

        await ctx.db.patch(args.leaseId, {
            status: "tenant_signed",
            tenantSignatureData: args.signatureData,
            tenantDocuments: args.tenantDocuments,
            signedAt: Date.now(),
        });

        // Notify Landlord
        const landlord = await ctx.db.get(lease.landlordId);
        const tenant = await ctx.db.get(lease.tenantId);
        const property = await ctx.db.get(lease.propertyId);

        if (landlord?.email && tenant && property) {
            const emailData = TEMPLATES.TENANT_SIGNED(
                `${BASE_URL}/landlord/leases/${args.leaseId}`,
                tenant.fullName || "Tenant",
                property.address
            );
            await ctx.scheduler.runAfter(0, api.emails.send, {
                to: landlord.email,
                subject: emailData.subject,
                html: emailData.html
            });
        }

        return { success: true };
    },
});

// Landlord approves or rejects signed lease
export const landlordDecision = mutation({
    args: {
        leaseId: v.id("leases"),
        approved: v.boolean(),
        signatureData: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const lease = await ctx.db.get(args.leaseId);
        if (!lease) throw new Error("Lease not found");
        if (lease.landlordId !== userId) throw new Error("Only the landlord can approve");
        if (lease.status !== "tenant_signed") throw new Error("Lease not ready for approval");

        if (args.approved) {
            await ctx.db.patch(args.leaseId, {
                status: "approved",
                landlordSignatureData: args.signatureData,
                landlordNotes: args.notes,
                approvedAt: Date.now(),
            });

            // Mark property as unavailable
            await ctx.db.patch(lease.propertyId, { isAvailable: false });
        } else {
            await ctx.db.patch(args.leaseId, {
                status: "rejected",
                landlordNotes: args.notes,
            });
        }

        // Notify Tenant
        const tenant = await ctx.db.get(lease.tenantId);
        const property = await ctx.db.get(lease.propertyId);

        if (tenant?.email && property) {
            let emailData;
            if (args.approved) {
                emailData = TEMPLATES.LEASE_APPROVED(
                    `${BASE_URL}/tenant/leases/${args.leaseId}`,
                    property.address
                );
            } else {
                emailData = TEMPLATES.LEASE_REJECTED(
                    property.address,
                    args.notes || "No reason provided"
                );
            }

            await ctx.scheduler.runAfter(0, api.emails.send, {
                to: tenant.email,
                subject: emailData.subject,
                html: emailData.html
            });
        }

        return { success: true };
    },
});

// Request revision from tenant
export const requestRevision = mutation({
    args: {
        leaseId: v.id("leases"),
        notes: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const lease = await ctx.db.get(args.leaseId);
        if (!lease) throw new Error("Lease not found");
        if (lease.landlordId !== userId) throw new Error("Only the landlord can request revisions");
        // Status check: usually can request revision if tenant signed but something is wrong
        if (lease.status !== "tenant_signed") throw new Error("Lease not currently in review");

        await ctx.db.patch(args.leaseId, {
            status: "revision_requested",
            landlordNotes: args.notes,
        });

        // Notify Tenant
        const tenant = await ctx.db.get(lease.tenantId);
        const property = await ctx.db.get(lease.propertyId);

        if (tenant?.email && property) {
            const emailData = TEMPLATES.REVISION_REQUESTED(
                `${BASE_URL}/tenant/leases/${args.leaseId}`,
                property.address,
                args.notes
            );
            await ctx.scheduler.runAfter(0, api.emails.send, {
                to: tenant.email,
                subject: emailData.subject,
                html: emailData.html
            });
        }

        return { success: true };
    },
});

// Get lease by ID
export const getById = query({
    args: { leaseId: v.id("leases") },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return null;

        const lease = await ctx.db.get(args.leaseId);
        if (!lease) return null;

        // Only landlord, tenant, or admin can view lease details
        const user = await ctx.db.get(userId);
        const isLandlord = lease.landlordId === userId;
        const isTenant = lease.tenantId === userId;
        const isAdmin = user?.role === "admin";

        if (!isLandlord && !isTenant && !isAdmin) {
            return null;
        }

        const property = await ctx.db.get(lease.propertyId);
        const tenant = await ctx.db.get(lease.tenantId);
        const landlord = await ctx.db.get(lease.landlordId);

        let propertyWithImage = null;
        if (property) {
            let imageUrl = null;
            if (property.images && property.images.length > 0) {
                imageUrl = await ctx.storage.getUrl(property.images[0]);
            }
            propertyWithImage = {
                ...property,
                imageUrl, // Add explicit imageUrl field
                images: property.images, // Keep original IDs just in case
            };
        }

        return {
            ...lease,
            property: propertyWithImage,
            tenant: tenant ? { fullName: tenant.fullName, email: tenant.email } : null,
            landlord: landlord ? { fullName: landlord.fullName, email: landlord.email } : null,
        };
    },
});

// Get leases for landlord
export const getForLandlord = query({
    args: { status: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        let leases = await ctx.db
            .query("leases")
            .withIndex("by_landlordId", (q) => q.eq("landlordId", userId))
            .collect();

        if (args.status) {
            leases = leases.filter((l) => l.status === args.status);
        }

        const enrichedLeases = await Promise.all(
            leases.map(async (lease) => {
                const property = await ctx.db.get(lease.propertyId);
                const tenant = await ctx.db.get(lease.tenantId);
                return {
                    ...lease,
                    property: property ? { title: property.title, address: property.address } : null,
                    tenant: tenant ? { fullName: tenant.fullName, email: tenant.email } : null,
                };
            })
        );

        return enrichedLeases;
    },
});

// Get leases for tenant
export const getForTenant = query({
    args: { status: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        let leases = await ctx.db
            .query("leases")
            .withIndex("by_tenantId", (q) => q.eq("tenantId", userId))
            .collect();

        if (args.status) {
            leases = leases.filter((l) => l.status === args.status);
        }

        const enrichedLeases = await Promise.all(
            leases.map(async (lease) => {
                const property = await ctx.db.get(lease.propertyId);
                const landlord = await ctx.db.get(lease.landlordId);
                return {
                    ...lease,
                    property: property ? { title: property.title, address: property.address } : null,
                    landlord: landlord ? { fullName: landlord.fullName, email: landlord.email } : null,
                };
            })
        );

        return enrichedLeases;
    },
});

// Terminate lease
export const terminate = mutation({
    args: {
        leaseId: v.id("leases"),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const lease = await ctx.db.get(args.leaseId);
        if (!lease) throw new Error("Lease not found");

        const user = await ctx.db.get(userId);
        if (lease.landlordId !== userId && user?.role !== "admin") {
            throw new Error("Only the landlord can terminate leases");
        }

        await ctx.db.patch(args.leaseId, {
            status: "terminated",
            landlordNotes: args.reason,
        });

        // Mark property as available again
        await ctx.db.patch(lease.propertyId, { isAvailable: true });

        return { success: true };
    },
});

// Check for expired leases (cron job)
export const checkExpired = mutation({
    args: {},
    handler: async (ctx) => {
        const today = new Date().toISOString().split("T")[0];

        // Get all active leases
        const approvedLeases = await ctx.db
            .query("leases")
            .withIndex("by_status", (q) => q.eq("status", "approved"))
            .collect();

        let count = 0;
        for (const lease of approvedLeases) {
            if (lease.endDate < today) {
                await ctx.db.patch(lease._id, { status: "expired" });

                // Mark property available again
                await ctx.db.patch(lease.propertyId, { isAvailable: true });

                count++;
            }
        }

        return { success: true, expiredCount: count };
    },
});

