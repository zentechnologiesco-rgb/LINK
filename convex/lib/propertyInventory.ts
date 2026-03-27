import type { Id, Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export const PROPERTY_PUBLICATION_STATUSES = ["unpublished", "published"] as const;
export const UNIT_PUBLICATION_STATUSES = ["unpublished", "published"] as const;
export const UNIT_OCCUPANCY_STATUSES = ["vacant", "reserved", "occupied", "unavailable"] as const;

export type PropertyPublicationStatus = (typeof PROPERTY_PUBLICATION_STATUSES)[number];
export type UnitPublicationStatus = (typeof UNIT_PUBLICATION_STATUSES)[number];
export type UnitOccupancyStatus = (typeof UNIT_OCCUPANCY_STATUSES)[number];

export type PropertyUnitDraft = {
    _id?: Id<"propertyUnits">;
    title: string;
    description?: string;
    unitCode?: string;
    unitType?: string;
    occupancyMode?: string;
    roomType?: string;
    furnishingStatus?: string;
    genderPolicy?: string;
    floorLabel?: string;
    blockLabel?: string;
    priceNad: number;
    bedrooms?: number;
    bathrooms?: number;
    sizeSqm?: number;
    maxOccupants?: number;
    amenityNames?: string[];
    utilitiesIncluded?: string[];
    petPolicy?: string;
    images?: Id<"_storage">[];
};

type Ctx = QueryCtx | MutationCtx;

type InventoryUnitLike = {
    _id: Id<"propertyUnits"> | null;
    title: string;
    description?: string;
    unitCode?: string;
    unitType?: string;
    occupancyMode?: string;
    roomType?: string;
    furnishingStatus?: string;
    genderPolicy?: string;
    floorLabel?: string;
    blockLabel?: string;
    priceNad: number;
    bedrooms?: number;
    bathrooms?: number;
    sizeSqm?: number;
    maxOccupants?: number;
    amenityNames?: string[];
    utilitiesIncluded?: string[];
    petPolicy?: string;
    images?: Id<"_storage">[];
    publicationStatus: UnitPublicationStatus;
    occupancyStatus: UnitOccupancyStatus;
    isAvailable: boolean;
    isSynthetic?: boolean;
};

export async function resolveStorageUrls(ctx: Ctx, fileIds?: Id<"_storage">[] | null) {
    if (!fileIds || fileIds.length === 0) return [] as string[];

    const urls = await Promise.all(
        fileIds.map(async (storageId) => {
            try {
                return await ctx.storage.getUrl(storageId);
            } catch {
                return null;
            }
        }),
    );

    return urls.filter((url): url is string => url !== null);
}

export async function getStoredUnitsForProperty(ctx: Ctx, propertyId: Id<"properties">) {
    return await ctx.db
        .query("propertyUnits")
        .withIndex("by_propertyId", (q) => q.eq("propertyId", propertyId))
        .collect();
}

export function buildSyntheticUnitFromProperty(property: Doc<"properties">): InventoryUnitLike {
    const publicationStatus =
        (property.publicationStatus as PropertyPublicationStatus | undefined) === "published"
            || (property.publicationStatus === undefined && property.approvalStatus === "approved" && property.isAvailable)
            ? "published"
            : "unpublished";

    return {
        _id: null,
        title: property.title,
        description: property.description,
        unitType: property.propertyType,
        occupancyMode:
            property.occupancyMode ??
            (property.listingType === "student_accommodation" ? "private_room" : "whole_unit"),
        roomType: property.listingType === "student_accommodation" ? "private" : undefined,
        furnishingStatus: property.furnishingStatus,
        genderPolicy: property.genderPolicy,
        priceNad: property.priceNad,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        sizeSqm: property.sizeSqm,
        maxOccupants: property.maxOccupants,
        amenityNames: property.amenityNames ?? [],
        utilitiesIncluded: property.utilitiesIncluded ?? [],
        petPolicy: property.petPolicy,
        images: property.images ?? [],
        publicationStatus,
        occupancyStatus: property.isAvailable ? "vacant" : "unavailable",
        isAvailable: Boolean(property.isAvailable),
        isSynthetic: true,
    };
}

export function normalizeUnit(property: Doc<"properties">, unit: Doc<"propertyUnits">): InventoryUnitLike {
    const occupancyStatus = (unit.occupancyStatus as UnitOccupancyStatus | undefined) ?? "vacant";
    const publicationStatus = (unit.publicationStatus as UnitPublicationStatus | undefined) ?? "published";
    return {
        _id: unit._id,
        title: unit.title,
        description: unit.description,
        unitCode: unit.unitCode,
        unitType: unit.unitType || property.propertyType,
        occupancyMode:
            unit.occupancyMode ??
            property.occupancyMode ??
            (property.listingType === "student_accommodation" ? "private_room" : "whole_unit"),
        roomType: unit.roomType,
        furnishingStatus: unit.furnishingStatus,
        genderPolicy: unit.genderPolicy,
        floorLabel: unit.floorLabel,
        blockLabel: unit.blockLabel,
        priceNad: unit.priceNad,
        bedrooms: unit.bedrooms,
        bathrooms: unit.bathrooms,
        sizeSqm: unit.sizeSqm,
        maxOccupants: unit.maxOccupants,
        amenityNames: unit.amenityNames ?? [],
        utilitiesIncluded: unit.utilitiesIncluded ?? [],
        petPolicy: unit.petPolicy,
        images: unit.images ?? [],
        publicationStatus,
        occupancyStatus,
        isAvailable: publicationStatus === "published" && occupancyStatus === "vacant",
    };
}

export function summarizeInventory(
    property: Doc<"properties">,
    rawUnits: Doc<"propertyUnits">[],
) {
    const propertyPublicationStatus =
        (property.publicationStatus as PropertyPublicationStatus | undefined) ??
        (property.isAvailable ? "published" : "unpublished");
    const normalizedUnits =
        rawUnits.length > 0
            ? rawUnits.map((unit) => normalizeUnit(property, unit))
            : [buildSyntheticUnitFromProperty(property)];

    const liveUnits = normalizedUnits.filter(
        (unit) => unit.publicationStatus === "published" && unit.occupancyStatus === "vacant",
    );
    const pricedUnits = liveUnits.length > 0 ? liveUnits : normalizedUnits;
    const pricedValues = pricedUnits.map((unit) => unit.priceNad).filter((value) => value > 0);
    const minPriceNad = pricedValues.length > 0 ? Math.min(...pricedValues) : property.priceNad;
    const maxPriceNad = pricedValues.length > 0 ? Math.max(...pricedValues) : property.priceNad;
    const summaryUnit = pricedUnits[0] ?? normalizedUnits[0];
    const unitTypeLabels = Array.from(
        new Set(
            normalizedUnits
                .map((unit) => unit.unitType)
                .filter((unitType): unitType is string => Boolean(unitType)),
        ),
    );

    const isPublicReady =
        property.approvalStatus === "approved" &&
        propertyPublicationStatus === "published" &&
        liveUnits.length > 0;

    return {
        units: normalizedUnits,
        liveUnits,
        unitCount: normalizedUnits.length,
        availableUnitCount: liveUnits.length,
        minPriceNad,
        maxPriceNad,
        summaryBedrooms: summaryUnit?.bedrooms ?? property.bedrooms,
        summaryBathrooms: summaryUnit?.bathrooms ?? property.bathrooms,
        summarySizeSqm: summaryUnit?.sizeSqm ?? property.sizeSqm,
        unitTypeLabels,
        isPublicReady,
    };
}

export async function syncPropertyInventory(ctx: MutationCtx, propertyId: Id<"properties">) {
    const property = await ctx.db.get(propertyId);
    if (!property) return null;

    const units = await getStoredUnitsForProperty(ctx, propertyId);
    const summary = summarizeInventory(property, units);

    await ctx.db.patch(propertyId, {
        isAvailable: summary.isPublicReady,
        bedrooms: summary.summaryBedrooms,
        bathrooms: summary.summaryBathrooms,
        sizeSqm: summary.summarySizeSqm,
        priceNad: summary.minPriceNad,
        minPriceNad: summary.minPriceNad,
        maxPriceNad: summary.maxPriceNad,
        unitCount: summary.unitCount,
        availableUnitCount: summary.availableUnitCount,
    });

    return summary;
}

export async function upsertPropertyUnits(
    ctx: MutationCtx,
    property: Doc<"properties">,
    units: PropertyUnitDraft[],
) {
    const incomingUnits = units.length > 0 ? units : [{
        title: property.title,
        description: property.description,
        unitType: property.propertyType,
        occupancyMode:
            property.occupancyMode ??
            (property.listingType === "student_accommodation" ? "private_room" : "whole_unit"),
        roomType: property.listingType === "student_accommodation" ? "private" : undefined,
        priceNad: property.priceNad,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        sizeSqm: property.sizeSqm,
        amenityNames: property.amenityNames ?? [],
        utilitiesIncluded: property.utilitiesIncluded ?? [],
        petPolicy: property.petPolicy,
        images: property.images ?? [],
        furnishingStatus: property.furnishingStatus,
        genderPolicy: property.genderPolicy,
        maxOccupants: property.maxOccupants,
    }];

    const existingUnits = await getStoredUnitsForProperty(ctx, property._id);
    const existingById = new Map(existingUnits.map((unit) => [unit._id, unit]));
    const seenIds = new Set<Id<"propertyUnits">>();

    for (const unit of incomingUnits) {
        const existingUnit = unit._id ? existingById.get(unit._id) : undefined;
        const publicationStatus: UnitPublicationStatus =
            existingUnit?.publicationStatus === "unpublished"
                && (existingUnit.occupancyStatus === "reserved" || existingUnit.occupancyStatus === "occupied")
                ? "unpublished"
                : "published";
        const occupancyStatus: UnitOccupancyStatus =
            existingUnit?.occupancyStatus === "reserved" || existingUnit?.occupancyStatus === "occupied"
                ? existingUnit.occupancyStatus
                : "vacant";
        const patch = {
            propertyId: property._id,
            landlordId: property.landlordId,
            title: unit.title.trim(),
            description: unit.description,
            unitCode: unit.unitCode,
            unitType: unit.unitType || property.propertyType,
            occupancyMode:
                unit.occupancyMode ??
                property.occupancyMode ??
                (property.listingType === "student_accommodation" ? "private_room" : "whole_unit"),
            roomType: unit.roomType,
            furnishingStatus: unit.furnishingStatus,
            genderPolicy: unit.genderPolicy,
            floorLabel: unit.floorLabel,
            blockLabel: unit.blockLabel,
            priceNad: unit.priceNad,
            bedrooms: unit.bedrooms,
            bathrooms: unit.bathrooms,
            sizeSqm: unit.sizeSqm,
            maxOccupants: unit.maxOccupants,
            amenityNames: unit.amenityNames ?? [],
            utilitiesIncluded: unit.utilitiesIncluded ?? [],
            petPolicy: unit.petPolicy,
            images: unit.images ?? [],
            publicationStatus,
            occupancyStatus,
            isAvailable: publicationStatus === "published" && occupancyStatus === "vacant",
        };

        if (unit._id && existingById.has(unit._id)) {
            await ctx.db.patch(unit._id, patch);
            seenIds.add(unit._id);
            continue;
        }

        const insertedId = await ctx.db.insert("propertyUnits", patch);
        seenIds.add(insertedId);
    }

    for (const existingUnit of existingUnits) {
        if (seenIds.has(existingUnit._id)) continue;

        const linkedLease = await ctx.db
            .query("leases")
            .withIndex("by_unitId", (q) => q.eq("unitId", existingUnit._id))
            .first();
        const linkedInquiry = await ctx.db
            .query("inquiries")
            .withIndex("by_unitId", (q) => q.eq("unitId", existingUnit._id))
            .first();

        if (linkedLease || linkedInquiry) {
            await ctx.db.patch(existingUnit._id, {
                publicationStatus: "unpublished",
                occupancyStatus: linkedLease
                    ? linkedLease.status === "approved"
                        ? "occupied"
                        : "reserved"
                    : "unavailable",
                isAvailable: false,
            });
            continue;
        }

        await ctx.db.delete(existingUnit._id);
    }

    return await syncPropertyInventory(ctx, property._id);
}
