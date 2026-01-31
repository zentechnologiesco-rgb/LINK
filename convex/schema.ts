import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // User profiles (extends auth users)
  users: defineTable({
    email: v.string(),
    fullName: v.optional(v.string()),
    firstName: v.optional(v.string()),
    surname: v.optional(v.string()),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("tenant"), v.literal("landlord"), v.literal("admin")),
    isVerified: v.boolean(),
    verificationDocs: v.optional(v.any()),
  }).index("by_email", ["email"]),

  // Landlord Verification Requests
  landlordRequests: defineTable({
    userId: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    documents: v.object({
      idType: v.union(v.literal("national_id"), v.literal("passport"), v.literal("drivers_license")),
      idNumber: v.string(),
      businessName: v.optional(v.string()),
      businessRegistration: v.optional(v.string()),
      idFrontStorageId: v.optional(v.id("_storage")),
      idBackStorageId: v.optional(v.id("_storage")),
      submittedAt: v.string(),
      previousRequestId: v.optional(v.id("landlordRequests")),
      isResubmission: v.optional(v.boolean()),
    }),
    adminNotes: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),

  // Properties
  properties: defineTable({
    landlordId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    propertyType: v.string(), // apartment, house, room, commercial
    address: v.string(),
    city: v.string(),
    coordinates: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
    })),
    priceNad: v.number(),
    bedrooms: v.optional(v.number()),
    bathrooms: v.optional(v.number()),
    sizeSqm: v.optional(v.number()),
    amenityNames: v.optional(v.array(v.string())), // Amenity names as strings
    petPolicy: v.optional(v.string()),
    utilitiesIncluded: v.optional(v.array(v.string())),
    images: v.optional(v.array(v.id("_storage"))),
    videos: v.optional(v.array(v.id("_storage"))),
    isAvailable: v.boolean(),
    featured: v.boolean(),
    // Approval Workflow
    approvalStatus: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
    approvalRequestedAt: v.optional(v.number()),
    adminNotes: v.optional(v.string()),
  })
    .index("by_landlordId", ["landlordId"])
    .index("by_city", ["city"])
    .index("by_available", ["isAvailable"])
    .index("by_approvalStatus", ["approvalStatus"]),


  // Saved Properties (Favorites)
  savedProperties: defineTable({
    userId: v.id("users"),
    propertyId: v.id("properties"),
  })
    .index("by_userId", ["userId"])
    .index("by_propertyId", ["propertyId"])
    .index("by_user_property", ["userId", "propertyId"]),

  // Inquiries/Booking Requests
  inquiries: defineTable({
    propertyId: v.id("properties"),
    tenantId: v.id("users"),
    landlordId: v.id("users"),
    message: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("completed")
    ),
    moveInDate: v.optional(v.string()),
  })
    .index("by_propertyId", ["propertyId"])
    .index("by_tenantId", ["tenantId"])
    .index("by_landlordId", ["landlordId"])
    .index("by_status", ["status"]),

  // Messages (In-app chat)
  messages: defineTable({
    inquiryId: v.id("inquiries"),
    senderId: v.id("users"),
    content: v.string(),
    readAt: v.optional(v.number()),
  })
    .index("by_inquiryId", ["inquiryId"])
    .index("by_senderId", ["senderId"]),

  // Leases
  leases: defineTable({
    propertyId: v.id("properties"),
    tenantId: v.id("users"),
    landlordId: v.id("users"),
    startDate: v.string(),
    endDate: v.string(),
    monthlyRent: v.number(),
    deposit: v.optional(v.number()),
    leaseDocument: v.optional(v.object({
      title: v.optional(v.string()),
      clauses: v.optional(v.array(v.object({
        id: v.string(),
        title: v.string(),
        content: v.string(),
      }))),
      specialConditions: v.optional(v.string()),
    })),
    tenantDocuments: v.optional(v.array(v.object({
      type: v.string(),
      storageId: v.id("_storage"),
      uploadedAt: v.string(),
    }))),
    tenantSignatureData: v.optional(v.string()),
    landlordSignatureData: v.optional(v.string()),
    landlordNotes: v.optional(v.string()),
    terms: v.optional(v.any()),
    tenantSignature: v.optional(v.any()),
    landlordSignature: v.optional(v.any()),
    status: v.union(
      v.literal("draft"),
      v.literal("sent_to_tenant"),
      v.literal("tenant_signed"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("revision_requested"),
      v.literal("expired"),
      v.literal("terminated")
    ),
    sentAt: v.optional(v.number()),
    signedAt: v.optional(v.number()),
    approvedAt: v.optional(v.number()),
  })
    .index("by_propertyId", ["propertyId"])
    .index("by_tenantId", ["tenantId"])
    .index("by_landlordId", ["landlordId"])
    .index("by_status", ["status"]),

  // Payments
  payments: defineTable({
    leaseId: v.id("leases"),
    amount: v.number(),
    type: v.union(v.literal("rent"), v.literal("deposit"), v.literal("late_fee")),
    status: v.union(v.literal("pending"), v.literal("paid"), v.literal("overdue")),
    dueDate: v.string(),
    paidAt: v.optional(v.number()),
    paymentMethod: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index("by_leaseId", ["leaseId"])
    .index("by_status", ["status"])
    .index("by_dueDate", ["dueDate"]),

  // Security Deposits (Escrow Service)
  deposits: defineTable({
    leaseId: v.id("leases"),
    tenantId: v.id("users"),
    landlordId: v.id("users"),
    amount: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("held"),
      v.literal("released"),
      v.literal("forfeited"),
      v.literal("partial_release")
    ),
    paidAt: v.optional(v.number()),
    paymentMethod: v.optional(v.union(
      v.literal("cash"),
      v.literal("bank_transfer"),
      v.literal("eft")
    )),
    paymentReference: v.optional(v.string()),
    releaseRequestedAt: v.optional(v.number()),
    releaseRequestedBy: v.optional(v.id("users")),
    releaseReason: v.optional(v.string()),
    deductionAmount: v.number(),
    deductionReason: v.optional(v.string()),
    releasedAt: v.optional(v.number()),
  })
    .index("by_leaseId", ["leaseId"])
    .index("by_tenantId", ["tenantId"])
    .index("by_landlordId", ["landlordId"])
    .index("by_status", ["status"]),

  // Audit Logs
  auditLogs: defineTable({
    adminId: v.id("users"),
    action: v.string(), // "approve_landlord", "reject_property", etc.
    targetId: v.string(), // ID of the object being acted upon
    targetType: v.string(), // "landlord_request", "property", etc.
    details: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_adminId", ["adminId"])
    .index("by_targetId", ["targetId"])
    .index("by_action", ["action"]),

  // Recently Viewed Properties
  recentlyViewed: defineTable({
    userId: v.id("users"),
    propertyId: v.id("properties"),
    viewedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_user_property", ["userId", "propertyId"])
    .index("by_viewedAt", ["viewedAt"]),
});
