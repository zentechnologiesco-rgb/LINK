import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // User profiles (extends auth users)
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.string(),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    fullName: v.optional(v.string()),
    firstName: v.optional(v.string()),
    surname: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("tenant"), v.literal("landlord"), v.literal("admin")),
    isVerified: v.boolean(),
    verificationDocs: v.optional(v.any()),
    preferences: v.optional(v.object({
      notifications: v.object({
        email: v.boolean(),
        push: v.boolean(),
        messages: v.boolean(),
        leases: v.boolean(),
        payments: v.boolean(),
        savedSearch: v.boolean(),
        inquiries: v.boolean(),
        approvals: v.boolean(),
        reviews: v.boolean(),
        security: v.boolean(),
        digest: v.boolean(),
      }),
      experience: v.object({
        compactMode: v.boolean(),
        showQuickStats: v.boolean(),
        startPage: v.string(),
      }),
    })),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  fileUploads: defineTable({
    storageId: v.id("_storage"),
    ownerId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_storageId", ["storageId"])
    .index("by_ownerId", ["ownerId"]),

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
    listingType: v.optional(
      v.union(
        v.literal("single_home"),
        v.literal("multi_unit_block"),
        v.literal("student_accommodation")
      )
    ),
    propertyType: v.string(), // apartment, house, room, studio, townhouse, duplex, penthouse
    address: v.string(),
    city: v.string(),
    coordinates: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
    })),
    occupancyMode: v.optional(v.string()),
    furnishingStatus: v.optional(v.string()),
    genderPolicy: v.optional(v.string()),
    priceNad: v.number(),
    minPriceNad: v.optional(v.number()),
    maxPriceNad: v.optional(v.number()),
    bedrooms: v.optional(v.number()),
    bathrooms: v.optional(v.number()),
    sizeSqm: v.optional(v.number()),
    maxOccupants: v.optional(v.number()),
    unitCount: v.optional(v.number()),
    availableUnitCount: v.optional(v.number()),
    amenityNames: v.optional(v.array(v.string())), // Amenity names as strings
    petPolicy: v.optional(v.string()),
    utilitiesIncluded: v.optional(v.array(v.string())),
    images: v.optional(v.array(v.id("_storage"))),
    videos: v.optional(v.array(v.id("_storage"))),
    isAvailable: v.boolean(),
    featured: v.boolean(),
    publicationStatus: v.optional(v.union(v.literal("unpublished"), v.literal("published"))),
    // Approval Workflow
    approvalStatus: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
    approvalRequestedAt: v.optional(v.number()),
    adminNotes: v.optional(v.string()),
  })
    .index("by_landlordId", ["landlordId"])
    .index("by_city", ["city"])
    .index("by_available", ["isAvailable"])
    .index("by_approvalStatus", ["approvalStatus"])
    .index("by_publicationStatus", ["publicationStatus"]),

  // Property Units / Rooms / Beds
  propertyUnits: defineTable({
    propertyId: v.id("properties"),
    landlordId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    unitCode: v.optional(v.string()),
    unitType: v.optional(v.string()),
    occupancyMode: v.optional(v.string()),
    roomType: v.optional(v.string()),
    furnishingStatus: v.optional(v.string()),
    genderPolicy: v.optional(v.string()),
    floorLabel: v.optional(v.string()),
    blockLabel: v.optional(v.string()),
    priceNad: v.number(),
    bedrooms: v.optional(v.number()),
    bathrooms: v.optional(v.number()),
    sizeSqm: v.optional(v.number()),
    maxOccupants: v.optional(v.number()),
    amenityNames: v.optional(v.array(v.string())),
    utilitiesIncluded: v.optional(v.array(v.string())),
    petPolicy: v.optional(v.string()),
    images: v.optional(v.array(v.id("_storage"))),
    publicationStatus: v.union(v.literal("unpublished"), v.literal("published")),
    occupancyStatus: v.union(
      v.literal("vacant"),
      v.literal("reserved"),
      v.literal("occupied"),
      v.literal("unavailable")
    ),
    isAvailable: v.boolean(),
  })
    .index("by_propertyId", ["propertyId"])
    .index("by_landlordId", ["landlordId"])
    .index("by_available", ["isAvailable"])
    .index("by_publicationStatus", ["publicationStatus"]),


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
    unitId: v.optional(v.id("propertyUnits")),
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
    .index("by_unitId", ["unitId"])
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

  // Support Threads (user to admin conversations)
  supportThreads: defineTable({
    requesterId: v.id("users"),
    assignedAdminId: v.optional(v.id("users")),
    subject: v.string(),
    category: v.optional(v.string()),
    status: v.union(
      v.literal("open"),
      v.literal("pending"),
      v.literal("resolved")
    ),
    priority: v.union(
      v.literal("normal"),
      v.literal("high"),
      v.literal("urgent")
    ),
    lastMessageAt: v.optional(v.number()),
    lastMessagePreview: v.optional(v.string()),
  })
    .index("by_requesterId", ["requesterId"])
    .index("by_assignedAdminId", ["assignedAdminId"])
    .index("by_status", ["status"]),

  // Support Messages (admin help desk)
  supportMessages: defineTable({
    threadId: v.id("supportThreads"),
    senderId: v.id("users"),
    content: v.string(),
    readAt: v.optional(v.number()),
  })
    .index("by_threadId", ["threadId"])
    .index("by_senderId", ["senderId"]),

  // Broadcast announcements
  announcements: defineTable({
    createdBy: v.id("users"),
    title: v.string(),
    body: v.string(),
    audience: v.union(
      v.literal("all"),
      v.literal("tenant"),
      v.literal("landlord"),
      v.literal("admin")
    ),
    priority: v.union(
      v.literal("normal"),
      v.literal("important"),
      v.literal("critical")
    ),
    isPinned: v.boolean(),
    ctaLabel: v.optional(v.string()),
    ctaHref: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  })
    .index("by_audience", ["audience"])
    .index("by_createdBy", ["createdBy"]),

  // Leases
  leases: defineTable({
    propertyId: v.id("properties"),
    unitId: v.optional(v.id("propertyUnits")),
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
        isMandatory: v.optional(v.boolean()),
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
    // Rental Rules (structured, drive system behavior)
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
    // Status & Tracking
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
    activatedAt: v.optional(v.number()),
    terminatedAt: v.optional(v.number()),
    terminationReason: v.optional(v.string()),
  })
    .index("by_propertyId", ["propertyId"])
    .index("by_unitId", ["unitId"])
    .index("by_tenantId", ["tenantId"])
    .index("by_landlordId", ["landlordId"])
    .index("by_status", ["status"]),

  // Lease Templates (reusable configurations for landlords with many properties)
  leaseTemplates: defineTable({
    landlordId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    // Rental Rules
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
    // Custom clauses stored with the template
    customClauses: v.optional(v.array(v.object({
      id: v.string(),
      title: v.string(),
      content: v.string(),
    }))),
    isDefault: v.optional(v.boolean()),
  })
    .index("by_landlordId", ["landlordId"]),

  // Payments
  payments: defineTable({
    leaseId: v.id("leases"),
    amount: v.number(),
    type: v.union(v.literal("rent"), v.literal("deposit"), v.literal("late_fee")),
    status: v.union(v.literal("pending"), v.literal("paid"), v.literal("overdue")),
    dueDate: v.string(),
    paidAt: v.optional(v.number()),
    paymentMethod: v.optional(v.string()),
    paymentReference: v.optional(v.string()),
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

  propertyComments: defineTable({
    propertyId: v.id("properties"),
    authorId: v.id("users"),
    parentCommentId: v.optional(v.id("propertyComments")),
    content: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("deleted"),
      v.literal("hidden")
    ),
    likeCount: v.number(),
    replyCount: v.number(),
    editedAt: v.optional(v.number()),
  })
    .index("by_propertyId", ["propertyId"])
    .index("by_parentCommentId", ["parentCommentId"])
    .index("by_authorId", ["authorId"]),

  propertyCommentLikes: defineTable({
    commentId: v.id("propertyComments"),
    userId: v.id("users"),
  })
    .index("by_commentId", ["commentId"])
    .index("by_userId", ["userId"])
    .index("by_user_comment", ["userId", "commentId"]),
});
