import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";
import { isPropertyPubliclyVisible } from "./lib/security";

// Allowed MIME types for uploads
export const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/heic",
    "image/heif",
];

export const ALLOWED_DOCUMENT_TYPES = [
    "application/pdf",
];

export const ALLOWED_VIDEO_TYPES = [
    "video/mp4",
    "video/webm",
];

// All allowed types combined
export const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES, ...ALLOWED_VIDEO_TYPES];

// Maximum file size: 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

type DbCtx = QueryCtx | MutationCtx;

type CtxWithStorage = {
    storage: {
        getMetadata: (storageId: string) => Promise<{
            size: number;
            contentType?: string | null;
        } | null>;
    };
};

async function getViewer(ctx: DbCtx) {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    return { userId, user };
}

async function getTrackedUpload(ctx: DbCtx, storageId: Id<"_storage">) {
    return await ctx.db
        .query("fileUploads")
        .withIndex("by_storageId", (q) => q.eq("storageId", storageId))
        .first();
}

// Helper for server-side validation
export const validateFile = async (
    ctx: CtxWithStorage,
    storageId: string,
    allowedTypes: string[] = ALLOWED_TYPES,
) => {
    const metadata = await ctx.storage.getMetadata(storageId);
    if (!metadata) {
        throw new Error(`File not found in storage: ${storageId}`);
    }

    if (metadata.size > MAX_FILE_SIZE) {
        throw new Error(`File size ${(metadata.size / 1024 / 1024).toFixed(2)}MB exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    if (!metadata.contentType || !allowedTypes.includes(metadata.contentType)) {
        throw new Error(`File type ${metadata.contentType} is not allowed. Allowed: ${allowedTypes.join(", ")}`);
    }

    return metadata;
};

export const validateOwnedFile = async (
    ctx: DbCtx & CtxWithStorage,
    userId: Id<"users">,
    storageId: Id<"_storage">,
    allowedTypes: string[] = ALLOWED_TYPES,
) => {
    const metadata = await validateFile(ctx, storageId, allowedTypes);
    const trackedUpload = await getTrackedUpload(ctx, storageId);

    if (trackedUpload && trackedUpload.ownerId !== userId) {
        const user = await ctx.db.get(userId);
        if (user?.role !== "admin") {
            throw new Error("You can only use files uploaded by your account");
        }
    }

    if (!trackedUpload) {
        const user = await ctx.db.get(userId);
        if (!user) {
            throw new Error("User not found");
        }

        const access = await resolveStorageAccess(ctx, storageId);
        if (access.kind !== "unknown" && !canDeleteStorage({ userId, user }, access)) {
            throw new Error("You can only use files that belong to your account");
        }
    }

    return metadata;
};

async function resolveStorageAccess(
    ctx: DbCtx,
    storageId: Id<"_storage">,
) {
    const landlordRequests = await ctx.db.query("landlordRequests").collect();
    const landlordRequest = landlordRequests.find((request) =>
        request.documents.idFrontStorageId === storageId ||
        request.documents.idBackStorageId === storageId,
    );
    if (landlordRequest) {
        return {
            kind: "landlord_request" as const,
            landlordRequest,
        };
    }

    const leases = await ctx.db.query("leases").collect();
    const lease = leases.find((currentLease) =>
        currentLease.tenantDocuments?.some((document) => document.storageId === storageId),
    );
    if (lease) {
        return {
            kind: "lease_document" as const,
            lease,
        };
    }

    const properties = await ctx.db.query("properties").collect();
    const property = properties.find((currentProperty) =>
        currentProperty.images?.includes(storageId) ||
        currentProperty.videos?.includes(storageId),
    );
    if (property) {
        return {
            kind: "property_media" as const,
            property,
        };
    }

    const units = await ctx.db.query("propertyUnits").collect();
    const unit = units.find((currentUnit) => currentUnit.images?.includes(storageId));
    if (unit) {
        return {
            kind: "property_unit_media" as const,
            unit,
            property: await ctx.db.get(unit.propertyId),
        };
    }

    const trackedUpload = await getTrackedUpload(ctx, storageId);
    if (trackedUpload) {
        return {
            kind: "tracked_upload" as const,
            trackedUpload,
        };
    }

    return {
        kind: "unknown" as const,
    };
}

function canReadStorage(
    viewer: { userId: Id<"users">; user: Doc<"users"> },
    access: Awaited<ReturnType<typeof resolveStorageAccess>>,
) {
    switch (access.kind) {
        case "landlord_request":
            return access.landlordRequest.userId === viewer.userId || viewer.user.role === "admin";
        case "lease_document":
            return (
                viewer.user.role === "admin" ||
                access.lease.tenantId === viewer.userId ||
                access.lease.landlordId === viewer.userId
            );
        case "property_media":
            return (
                viewer.user.role === "admin" ||
                access.property.landlordId === viewer.userId ||
                isPropertyPubliclyVisible(access.property)
            );
        case "property_unit_media":
            return (
                viewer.user.role === "admin" ||
                access.unit.landlordId === viewer.userId ||
                (
                    access.property !== null &&
                    isPropertyPubliclyVisible(access.property) &&
                    access.unit.publicationStatus === "published"
                )
            );
        case "tracked_upload":
            return access.trackedUpload.ownerId === viewer.userId || viewer.user.role === "admin";
        case "unknown":
            return false;
    }
}

function canDeleteStorage(
    viewer: { userId: Id<"users">; user: Doc<"users"> },
    access: Awaited<ReturnType<typeof resolveStorageAccess>>,
) {
    switch (access.kind) {
        case "landlord_request":
        case "lease_document":
            return false;
        case "property_media":
            return access.property.landlordId === viewer.userId || viewer.user.role === "admin";
        case "property_unit_media":
            return access.unit.landlordId === viewer.userId || viewer.user.role === "admin";
        case "tracked_upload":
            return access.trackedUpload.ownerId === viewer.userId || viewer.user.role === "admin";
        case "unknown":
            return false;
    }
}

// Generate upload URL with file type validation
export const generateUploadUrl = mutation({
    args: {
        contentType: v.optional(v.string()),
        fileSize: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Validate file type if provided
        if (args.contentType && !ALLOWED_TYPES.includes(args.contentType)) {
            throw new Error(`File type '${args.contentType}' is not allowed. Allowed types: images (JPEG, PNG, GIF, WebP, HEIC), PDF documents, and videos (MP4, WebM).`);
        }

        // Validate file size if provided
        if (args.fileSize && args.fileSize > MAX_FILE_SIZE) {
            throw new Error(`File size exceeds the maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
        }

        return await ctx.storage.generateUploadUrl();
    },
});

export const registerUpload = mutation({
    args: {
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const { userId } = await getViewer(ctx);

        await validateFile(ctx, args.storageId);

        const existingUpload = await getTrackedUpload(ctx, args.storageId);
        if (existingUpload && existingUpload.ownerId !== userId) {
            throw new Error("This file is already linked to another account");
        }

        if (existingUpload) {
            await ctx.db.patch(existingUpload._id, {
                createdAt: Date.now(),
            });
            return { success: true };
        }

        await ctx.db.insert("fileUploads", {
            storageId: args.storageId,
            ownerId: userId,
            createdAt: Date.now(),
        });

        return { success: true };
    },
});

// Get multiple file URLs with access control
export const getUrls = query({
    args: { storageIds: v.array(v.id("_storage")) },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);

        const urls = await Promise.all(
            args.storageIds.map(async (storageId) => {
                const access = await resolveStorageAccess(ctx, storageId);
                if (!canReadStorage(viewer, access)) {
                    return { id: storageId, url: null };
                }

                return { id: storageId, url: await ctx.storage.getUrl(storageId) };
            }),
        );

        return urls;
    },
});

// Delete a file with ownership verification
export const remove = mutation({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        const access = await resolveStorageAccess(ctx, args.storageId);

        if (!canDeleteStorage(viewer, access)) {
            throw new Error("Not authorized to delete this file");
        }

        await ctx.storage.delete(args.storageId);

        const trackedUpload = await getTrackedUpload(ctx, args.storageId);
        if (trackedUpload) {
            await ctx.db.delete(trackedUpload._id);
        }

        return { success: true };
    },
});

// Validate file type helper (can be used client-side before upload)
export const validateFileType = query({
    args: {
        contentType: v.string(),
        fileSize: v.number(),
    },
    handler: async (_ctx, args) => {
        const isValidType = ALLOWED_TYPES.includes(args.contentType);
        const isValidSize = args.fileSize <= MAX_FILE_SIZE;

        return {
            isValid: isValidType && isValidSize,
            isValidType,
            isValidSize,
            maxFileSize: MAX_FILE_SIZE,
            allowedTypes: ALLOWED_TYPES,
            errors: [
                ...(!isValidType ? [`File type '${args.contentType}' is not allowed`] : []),
                ...(!isValidSize ? [`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`] : []),
            ],
        };
    },
});
