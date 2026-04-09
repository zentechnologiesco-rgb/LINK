import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { auth } from "./auth";
import { api, internal } from "./_generated/api";
import { TEMPLATES } from "./emailTemplates";
import { ALLOWED_DOCUMENT_TYPES, ALLOWED_IMAGE_TYPES, validateOwnedFile } from "./files";
import { normalizeEmail } from "./lib/normalizeEmail";
import { getStoredUnitsForProperty, resolveStorageUrls, syncPropertyInventory } from "./lib/propertyInventory";
import { normalizeOptionalText, normalizeRequiredText } from "./lib/security";

const BASE_URL = process.env.SITE_URL || "http://localhost:3000";
const ALLOWED_TENANT_SIGNING_DOCUMENT_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

// ─── Mandatory clauses that cannot be removed (legally defensible) ───
const MANDATORY_CLAUSES = [
    {
        id: "mandatory_rent",
        title: "Rent Payment",
        content: "The Tenant agrees to pay the monthly rent amount specified in this agreement on or before the due date of each month. Late payments will incur fees as specified in the rental rules of this agreement. Rent must be paid in Namibian Dollars (N$) via the agreed payment method.",
        isMandatory: true,
    },
    {
        id: "mandatory_deposit",
        title: "Security Deposit",
        content: "The Tenant shall pay a security deposit as specified in this agreement. The deposit will be held by the Landlord for the duration of the lease and returned within 14 days of lease termination, subject to deductions for damages beyond normal wear and tear, outstanding rent, or other legitimate charges. An itemised list of deductions will be provided.",
        isMandatory: true,
    },
    {
        id: "mandatory_condition",
        title: "Property Condition & Maintenance",
        content: "The Tenant agrees to maintain the property in good, habitable condition and report any damages, defects, or maintenance issues promptly to the Landlord. The Tenant shall not make structural modifications without written consent. Normal wear and tear is the Landlord's responsibility.",
        isMandatory: true,
    },
    {
        id: "mandatory_occupancy",
        title: "Occupancy & Use",
        content: "The property shall be used solely as a residential dwelling. Only the Tenant and approved occupants listed in this agreement may reside in the property. The maximum number of occupants shall not exceed the amount specified in this agreement. Subletting is governed by the terms set out in the rental rules.",
        isMandatory: true,
    },
    {
        id: "mandatory_entry",
        title: "Entry by Landlord",
        content: "The Landlord or their authorised agent may enter the property with reasonable notice (minimum 24 hours) for inspections, repairs, showings, or emergency purposes. In the case of an emergency that threatens life or property, immediate entry is permitted without prior notice.",
        isMandatory: true,
    },
    {
        id: "mandatory_termination",
        title: "Termination & Notice",
        content: "Either party may terminate this lease by providing written notice as specified in the notice period outlined in the rental rules. Early termination by the Tenant may result in forfeiture of the security deposit unless otherwise agreed. Upon termination, the Tenant must vacate and return all keys within the agreed timeframe.",
        isMandatory: true,
    },
    {
        id: "mandatory_dispute",
        title: "Dispute Resolution",
        content: "Any disputes arising from this agreement shall first be resolved through negotiation between the parties. If negotiation fails, the parties agree to seek mediation through the Namibian Rental Tribunal or an agreed mediator before pursuing legal action. This agreement is governed by the laws of the Republic of Namibia.",
        isMandatory: true,
    },
];

const BLOCKING_LEASE_STATUSES = new Set([
    "draft",
    "sent_to_tenant",
    "tenant_signed",
    "revision_requested",
    "approved",
]);

const RESERVED_LEASE_STATUSES = new Set([
    "draft",
    "sent_to_tenant",
    "tenant_signed",
    "revision_requested",
]);

function formatDateOnly(date: Date) {
    return date.toISOString().split("T")[0];
}

async function ensurePropertyHasNoBlockingLease(
    ctx: MutationCtx,
    propertyId: Id<"properties">,
    unitId?: Id<"propertyUnits">,
    currentLeaseId?: Id<"leases">,
) {
    const propertyLeases = unitId
        ? await ctx.db
            .query("leases")
            .withIndex("by_unitId", (q) => q.eq("unitId", unitId))
            .collect()
        : await ctx.db
            .query("leases")
            .withIndex("by_propertyId", (q) => q.eq("propertyId", propertyId))
            .collect();

    const blockingLease = propertyLeases.find((lease) =>
        lease._id !== currentLeaseId &&
        BLOCKING_LEASE_STATUSES.has(lease.status) &&
        (unitId ? lease.unitId === unitId : lease.unitId === undefined),
    );

    if (blockingLease) {
        throw new Error(unitId
            ? "This unit already has a lease in progress or an active tenant."
            : "This property already has a lease in progress or an active tenant.");
    }
}

async function resolveLeaseTarget(
    ctx: MutationCtx,
    propertyId: Id<"properties">,
    requestedUnitId?: Id<"propertyUnits">,
) {
    const property = await ctx.db.get(propertyId);
    if (!property) throw new Error("Property not found");

    const units = await getStoredUnitsForProperty(ctx, propertyId);

    if (requestedUnitId) {
        const unit = await ctx.db.get(requestedUnitId);
        if (!unit || unit.propertyId !== propertyId) {
            throw new Error("Unit not found for this property.");
        }
        return { property, unit };
    }

    if (units.length === 1) {
        return { property, unit: units[0] };
    }

    if (units.length > 1) {
        throw new Error("Select a specific unit before creating a lease.");
    }

    return { property, unit: null };
}

function deriveLeaseTargetState(statuses: string[]) {
    if (statuses.includes("approved")) {
        return "occupied" as const;
    }

    if (statuses.some((status) => RESERVED_LEASE_STATUSES.has(status))) {
        return "reserved" as const;
    }

    return "vacant" as const;
}

async function syncLeaseTargetState(
    ctx: MutationCtx,
    leaseTarget: { propertyId: Id<"properties">; unitId?: Id<"propertyUnits"> },
) {
    const targetLeases = leaseTarget.unitId
        ? await ctx.db
            .query("leases")
            .withIndex("by_unitId", (q) => q.eq("unitId", leaseTarget.unitId))
            .collect()
        : await ctx.db
            .query("leases")
            .withIndex("by_propertyId", (q) => q.eq("propertyId", leaseTarget.propertyId))
            .collect();

    const relevantStatuses = targetLeases
        .filter((lease) => leaseTarget.unitId ? lease.unitId === leaseTarget.unitId : lease.unitId === undefined)
        .map((lease) => lease.status);
    const nextState = deriveLeaseTargetState(relevantStatuses);

    if (leaseTarget.unitId) {
        const unit = await ctx.db.get(leaseTarget.unitId);
        if (!unit) return;

        await ctx.db.patch(leaseTarget.unitId, {
            occupancyStatus: nextState,
            isAvailable: unit.publicationStatus === "published" && nextState === "vacant",
        });
        await syncPropertyInventory(ctx, leaseTarget.propertyId);
        return;
    }

    const property = await ctx.db.get(leaseTarget.propertyId);
    if (!property) return;

    await ctx.db.patch(leaseTarget.propertyId, {
        isAvailable:
            nextState === "vacant" &&
            property.approvalStatus === "approved" &&
            property.publicationStatus === "published",
    });
    await syncPropertyInventory(ctx, leaseTarget.propertyId);
}

async function ensureTenantHasNoActiveLease(
    ctx: MutationCtx,
    tenantId: Id<"users">,
    currentLeaseId?: Id<"leases">,
) {
    const tenantLeases = await ctx.db
        .query("leases")
        .withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId))
        .collect();

    const activeLease = tenantLeases.find((lease) =>
        lease._id !== currentLeaseId && lease.status === "approved",
    );

    if (activeLease) {
        throw new Error("This tenant already has an active lease linked to another property.");
    }
}

async function clearFuturePendingPayments(ctx: MutationCtx, leaseId: Id<"leases">, fromDate: string) {
    const payments = await ctx.db
        .query("payments")
        .withIndex("by_leaseId", (q) => q.eq("leaseId", leaseId))
        .collect();

    for (const payment of payments) {
        if (payment.status === "pending" && payment.dueDate >= fromDate) {
            await ctx.db.delete(payment._id);
        }
    }
}

// ─── Create a new lease ───
export const create = mutation({
    args: {
        propertyId: v.id("properties"),
        unitId: v.optional(v.id("propertyUnits")),
        tenantEmail: v.string(),
        startDate: v.string(),
        endDate: v.string(),
        monthlyRent: v.number(),
        deposit: v.optional(v.number()),
        // Rental Rules
        templateId: v.optional(v.id("leaseTemplates")),
        rentDueDay: v.optional(v.number()),
        gracePeriodDays: v.optional(v.number()),
        lateFeeType: v.optional(v.union(v.literal("percentage"), v.literal("fixed"))),
        lateFeeAmount: v.optional(v.number()),
        paymentFrequency: v.optional(v.union(v.literal("monthly"), v.literal("weekly"), v.literal("biweekly"))),
        // Property Rules
        petPolicy: v.optional(v.string()),
        utilitiesIncluded: v.optional(v.array(v.string())),
        parkingIncluded: v.optional(v.boolean()),
        maintenanceResponsibility: v.optional(v.string()),
        noticePeriodDays: v.optional(v.number()),
        maxOccupants: v.optional(v.number()),
        smokingAllowed: v.optional(v.boolean()),
        sublettingAllowed: v.optional(v.boolean()),
        // Custom clauses (on top of mandatory)
        customClauses: v.optional(v.array(v.object({
            id: v.string(),
            title: v.string(),
            content: v.string(),
        }))),
        // Whether to send immediately or save as draft
        sendImmediately: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const { property, unit } = await resolveLeaseTarget(ctx, args.propertyId, args.unitId);

        const user = await ctx.db.get(userId);
        if (property.landlordId !== userId && user?.role !== "admin") {
            throw new Error("Only the property owner can create leases");
        }

        if (property.approvalStatus !== "approved") {
            throw new Error("The property must be approved before you can create a lease.");
        }

        if (unit) {
            if (unit.publicationStatus !== "published") {
                throw new Error("The selected unit is not published.");
            }
            if (unit.occupancyStatus !== "vacant") {
                throw new Error("The selected unit is not currently available.");
            }
        }

        await ensurePropertyHasNoBlockingLease(ctx, args.propertyId, unit?._id, undefined);

        // Find tenant by email
        const normalizedTenantEmail = normalizeEmail(args.tenantEmail);
        const tenant = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", normalizedTenantEmail))
            .first();

        if (!tenant) {
            throw new Error(`No user found with email ${normalizedTenantEmail}. Please ask them to sign up first.`);
        }

        if (tenant._id === property.landlordId) {
            throw new Error("You cannot assign yourself as the tenant on your own property.");
        }

        // Build clauses: mandatory + auto-generated from rules + custom
        const allClauses = [...MANDATORY_CLAUSES];

        // Auto-generate clauses from rules
        if (args.petPolicy && args.petPolicy !== "no_pets") {
            allClauses.push({
                id: "auto_pets",
                title: "Pet Policy",
                content: `Pets are permitted under the following policy: ${args.petPolicy.replace(/_/g, " ")}. The Tenant is responsible for any damage caused by pets and must ensure pets do not disturb other residents.`,
                isMandatory: false,
            });
        } else if (args.petPolicy === "no_pets") {
            allClauses.push({
                id: "auto_pets",
                title: "Pet Policy",
                content: "No pets of any kind are permitted on the property without prior written consent from the Landlord.",
                isMandatory: false,
            });
        }

        if (args.utilitiesIncluded && args.utilitiesIncluded.length > 0) {
            allClauses.push({
                id: "auto_utilities",
                title: "Utilities",
                content: `The following utilities are included in the monthly rent: ${args.utilitiesIncluded.join(", ")}. All other utilities are the Tenant's responsibility and must be paid directly to the service provider.`,
                isMandatory: false,
            });
        }

        if (args.smokingAllowed === false) {
            allClauses.push({
                id: "auto_smoking",
                title: "Smoking Policy",
                content: "Smoking is strictly prohibited inside the property and in all enclosed common areas. Violation of this policy may result in lease termination.",
                isMandatory: false,
            });
        }

        // Add custom clauses. If an auto-generated clause was edited in the UI,
        // replace the generated version instead of appending a duplicate id.
        if (args.customClauses) {
            for (const clause of args.customClauses) {
                const existingClauseIndex = allClauses.findIndex((existingClause) => existingClause.id === clause.id);

                if (existingClauseIndex >= 0) {
                    allClauses[existingClauseIndex] = {
                        ...allClauses[existingClauseIndex],
                        ...clause,
                        isMandatory: false,
                    };
                    continue;
                }

                allClauses.push({
                    ...clause,
                    isMandatory: false,
                });
            }
        }

        const leaseDocument = {
            title: "Residential Lease Agreement",
            clauses: allClauses,
        };

        const status = args.sendImmediately ? "sent_to_tenant" : "draft";

        const leaseId = await ctx.db.insert("leases", {
            propertyId: args.propertyId,
            unitId: unit?._id,
            tenantId: tenant._id,
            landlordId: userId,
            startDate: args.startDate,
            endDate: args.endDate,
            monthlyRent: args.monthlyRent,
            deposit: args.deposit,
            leaseDocument,
            templateId: args.templateId,
            rentDueDay: args.rentDueDay ?? 1,
            gracePeriodDays: args.gracePeriodDays ?? 5,
            lateFeeType: args.lateFeeType ?? "percentage",
            lateFeeAmount: args.lateFeeAmount ?? 5,
            paymentFrequency: args.paymentFrequency ?? "monthly",
            petPolicy: args.petPolicy ?? "no_pets",
            utilitiesIncluded: args.utilitiesIncluded ?? [],
            parkingIncluded: args.parkingIncluded ?? false,
            maintenanceResponsibility: args.maintenanceResponsibility ?? "shared",
            noticePeriodDays: args.noticePeriodDays ?? 30,
            maxOccupants: args.maxOccupants ?? 2,
            smokingAllowed: args.smokingAllowed ?? false,
            sublettingAllowed: args.sublettingAllowed ?? false,
            status,
            ...(args.sendImmediately ? { sentAt: Date.now() } : {}),
        });

        await syncLeaseTargetState(ctx, {
            propertyId: args.propertyId,
            unitId: unit?._id,
        });

        // If sending immediately, notify tenant
        if (args.sendImmediately && tenant.email) {
            const emailData = TEMPLATES.LEASE_CREATED(
                `${BASE_URL}/tenant/leases/${leaseId}`,
                property.address
            );
            await ctx.scheduler.runAfter(0, api.emails.send, {
                to: tenant.email,
                subject: emailData.subject,
                html: emailData.html,
            });
        }

        return { leaseId, tenantName: tenant.fullName || "Tenant" };
    },
});

// ─── Send lease to tenant (from draft) ───
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

        await syncLeaseTargetState(ctx, {
            propertyId: lease.propertyId,
            unitId: lease.unitId,
        });

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
                html: emailData.html,
            });
        }

        return { success: true };
    },
});

// ─── Tenant signs lease ───
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
        if (lease.status !== "sent_to_tenant" && lease.status !== "revision_requested") {
            throw new Error("Lease not ready for signing");
        }

        for (const document of args.tenantDocuments) {
            await validateOwnedFile(ctx, userId, document.storageId, ALLOWED_TENANT_SIGNING_DOCUMENT_TYPES);
        }

        await ctx.db.patch(args.leaseId, {
            status: "tenant_signed",
            tenantSignatureData: args.signatureData,
            tenantDocuments: args.tenantDocuments,
            signedAt: Date.now(),
        });

        await syncLeaseTargetState(ctx, {
            propertyId: lease.propertyId,
            unitId: lease.unitId,
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
                html: emailData.html,
            });
        }

        return { success: true };
    },
});

// ─── Landlord approves or rejects (with full system activation on approval) ───
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
            const now = Date.now();

            const property = await ctx.db.get(lease.propertyId);
            if (!property) {
                throw new Error("Property not found");
            }
            if (property.approvalStatus !== "approved") {
                throw new Error("The property is no longer approved for leasing.");
            }

            await ensurePropertyHasNoBlockingLease(ctx, lease.propertyId, lease.unitId, lease._id);
            await ensureTenantHasNoActiveLease(ctx, lease.tenantId, lease._id);

            // 1. Activate the lease
            await ctx.db.patch(args.leaseId, {
                status: "approved",
                landlordSignatureData: args.signatureData,
                landlordNotes: args.notes,
                approvedAt: now,
                activatedAt: now,
            });

            // 3. Auto-generate payment schedule
            await ctx.scheduler.runAfter(0, internal.payments.generateScheduleForLease, {
                leaseId: args.leaseId,
            });

            // 4. Auto-create deposit record if deposit specified
            if (lease.deposit && lease.deposit > 0) {
                await ctx.db.insert("deposits", {
                    leaseId: args.leaseId,
                    tenantId: lease.tenantId,
                    landlordId: lease.landlordId,
                    amount: lease.deposit,
                    status: "pending",
                    deductionAmount: 0,
                });
            }
        } else {
            await ctx.db.patch(args.leaseId, {
                status: "rejected",
                landlordNotes: args.notes,
            });
        }

        await syncLeaseTargetState(ctx, {
            propertyId: lease.propertyId,
            unitId: lease.unitId,
        });

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
                html: emailData.html,
            });
        }

        return { success: true };
    },
});

// ─── Request revision from tenant ───
export const requestRevision = mutation({
    args: {
        leaseId: v.id("leases"),
        notes: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");
        const trimmedNotes = normalizeRequiredText(args.notes, { maxLength: 1000, multiline: true }, "Revision notes");
        if (!trimmedNotes) throw new Error("Please provide revision notes");

        const lease = await ctx.db.get(args.leaseId);
        if (!lease) throw new Error("Lease not found");
        if (lease.landlordId !== userId) throw new Error("Only the landlord can request revisions");
        if (lease.status !== "tenant_signed") throw new Error("Lease not currently in review");

        await ctx.db.patch(args.leaseId, {
            status: "revision_requested",
            landlordNotes: trimmedNotes,
            tenantSignatureData: undefined,
            signedAt: undefined,
        });

        await syncLeaseTargetState(ctx, {
            propertyId: lease.propertyId,
            unitId: lease.unitId,
        });

        const tenant = await ctx.db.get(lease.tenantId);
        const property = await ctx.db.get(lease.propertyId);

        if (tenant?.email && property) {
            const emailData = TEMPLATES.REVISION_REQUESTED(
                `${BASE_URL}/tenant/leases/${args.leaseId}`,
                property.address,
                trimmedNotes
            );
            await ctx.scheduler.runAfter(0, api.emails.send, {
                to: tenant.email,
                subject: emailData.subject,
                html: emailData.html,
            });
        }

        return { success: true };
    },
});

// ─── Terminate lease ───
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
            terminatedAt: Date.now(),
            terminationReason: normalizeOptionalText(args.reason, { maxLength: 1000, multiline: true }),
            landlordNotes: normalizeOptionalText(args.reason, { maxLength: 1000, multiline: true }),
        });

        await clearFuturePendingPayments(ctx, args.leaseId, formatDateOnly(new Date()));
        await syncLeaseTargetState(ctx, {
            propertyId: lease.propertyId,
            unitId: lease.unitId,
        });

        return { success: true };
    },
});

// ─── Check for expired leases (cron-only internal job) ───
export const checkExpired = internalMutation({
    args: {},
    handler: async (ctx) => {
        const today = new Date().toISOString().split("T")[0];

        const approvedLeases = await ctx.db
            .query("leases")
            .withIndex("by_status", (q) => q.eq("status", "approved"))
            .collect();

        let count = 0;
        for (const lease of approvedLeases) {
            if (lease.endDate < today) {
                await ctx.db.patch(lease._id, { status: "expired" });
                await clearFuturePendingPayments(ctx, lease._id, today);
                await syncLeaseTargetState(ctx, {
                    propertyId: lease.propertyId,
                    unitId: lease.unitId,
                });
                count++;
            }
        }

        return { success: true, expiredCount: count };
    },
});

// ─── Get lease by ID ───
export const getById = query({
    args: { leaseId: v.id("leases") },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return null;

        const lease = await ctx.db.get(args.leaseId);
        if (!lease) return null;

        const user = await ctx.db.get(userId);
        const isLandlord = lease.landlordId === userId;
        const isTenant = lease.tenantId === userId;
        const isAdmin = user?.role === "admin";

        if (!isLandlord && !isTenant && !isAdmin) {
            return null;
        }

        const property = await ctx.db.get(lease.propertyId);
        const unit = lease.unitId ? await ctx.db.get(lease.unitId) : null;
        const tenant = await ctx.db.get(lease.tenantId);
        const landlord = await ctx.db.get(lease.landlordId);

        let propertyWithImage = null;
        if (property) {
            const propertyImageUrls = await resolveStorageUrls(ctx, property.images);
            const unitImageUrls = unit ? await resolveStorageUrls(ctx, unit.images) : [];
            const imageUrl = unitImageUrls[0] ?? propertyImageUrls[0] ?? null;
            propertyWithImage = {
                ...property,
                imageUrl,
                images: property.images,
            };
        }

        return {
            ...lease,
            property: propertyWithImage,
            unit: unit ? {
                ...unit,
                imageUrls: await resolveStorageUrls(ctx, unit.images),
            } : null,
            tenant: tenant ? { fullName: tenant.fullName, email: tenant.email } : null,
            landlord: landlord ? { fullName: landlord.fullName, email: landlord.email } : null,
        };
    },
});

// ─── Get leases for landlord ───
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
                const unit = lease.unitId ? await ctx.db.get(lease.unitId) : null;
                const tenant = await ctx.db.get(lease.tenantId);

                let imageUrl = null;
                const unitImageUrls = unit ? await resolveStorageUrls(ctx, unit.images) : [];
                const propertyImageUrls = property ? await resolveStorageUrls(ctx, property.images?.slice(0, 1)) : [];
                imageUrl = unitImageUrls[0] ?? propertyImageUrls[0] ?? null;

                return {
                    ...lease,
                    property: property ? { title: property.title, address: property.address, imageUrl } : null,
                    unit: unit ? { title: unit.title, unitCode: unit.unitCode, occupancyMode: unit.occupancyMode } : null,
                    tenant: tenant ? { fullName: tenant.fullName, email: tenant.email } : null,
                };
            })
        );

        return enrichedLeases;
    },
});

// ─── Get leases for tenant ───
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
                const unit = lease.unitId ? await ctx.db.get(lease.unitId) : null;
                const landlord = await ctx.db.get(lease.landlordId);

                let imageUrl = null;
                const unitImageUrls = unit ? await resolveStorageUrls(ctx, unit.images) : [];
                const propertyImageUrls = property ? await resolveStorageUrls(ctx, property.images?.slice(0, 1)) : [];
                imageUrl = unitImageUrls[0] ?? propertyImageUrls[0] ?? null;

                return {
                    ...lease,
                    property: property ? { title: property.title, address: property.address, imageUrl } : null,
                    unit: unit ? { title: unit.title, unitCode: unit.unitCode, occupancyMode: unit.occupancyMode } : null,
                    landlord: landlord ? { fullName: landlord.fullName, email: landlord.email } : null,
                };
            })
        );

        return enrichedLeases;
    },
});

// ─── Get tenant's currently active lease ───
export const getActiveLease = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return null;

        const activeLeases = await ctx.db
            .query("leases")
            .withIndex("by_tenantId", (q) => q.eq("tenantId", userId))
            .collect();

        const activeLease = activeLeases.find((l) => l.status === "approved");
        if (!activeLease) return null;

        const property = await ctx.db.get(activeLease.propertyId);
        const unit = activeLease.unitId ? await ctx.db.get(activeLease.unitId) : null;
        const landlord = await ctx.db.get(activeLease.landlordId);

        const unitImageUrls = unit ? await resolveStorageUrls(ctx, unit.images) : [];
        const propertyImageUrls = property ? await resolveStorageUrls(ctx, property.images?.slice(0, 1)) : [];
        const imageUrl = unitImageUrls[0] ?? propertyImageUrls[0] ?? null;

        // Get next payment due
        const payments = await ctx.db
            .query("payments")
            .withIndex("by_leaseId", (q) => q.eq("leaseId", activeLease._id))
            .collect();

        const pendingPayments = payments
            .filter((p) => p.status === "pending" || p.status === "overdue")
            .sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1));

        const nextPayment = pendingPayments[0] || null;

        return {
            ...activeLease,
            property: property ? { ...property, imageUrl } : null,
            unit: unit ? { title: unit.title, unitCode: unit.unitCode, occupancyMode: unit.occupancyMode } : null,
            landlord: landlord ? { fullName: landlord.fullName, email: landlord.email } : null,
            nextPayment,
        };
    },
});

// ─── Count leases requiring action ───
export const getActionRequiredCount = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return 0;

        const user = await ctx.db.get(userId);
        if (!user) return 0;

        if (user.role === "landlord") {
            const pendingLeases = await ctx.db
                .query("leases")
                .withIndex("by_landlordId", (q) => q.eq("landlordId", userId))
                .filter((q) => q.eq(q.field("status"), "tenant_signed"))
                .collect();
            return pendingLeases.length;
        } else {
            const pendingLeases = await ctx.db
                .query("leases")
                .withIndex("by_tenantId", (q) => q.eq("tenantId", userId))
                .filter((q) =>
                    q.or(
                        q.eq(q.field("status"), "sent_to_tenant"),
                        q.eq(q.field("status"), "revision_requested")
                    )
                )
                .collect();
            return pendingLeases.length;
        }
    },
});
