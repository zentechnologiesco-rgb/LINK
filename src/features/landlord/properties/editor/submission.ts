import type { Id } from "@convex/_generated/dataModel";

import {
  arraysEqual,
  comparableUnit,
  coordinatesEqual,
  normalizeStringArray,
  trimmedOrUndefined,
} from "./utils";
import type {
  ListingType,
  PropertyFormInitialData,
  PropertyUnitForm,
} from "./types";

export type PropertyFormSummary = {
  minPrice: number;
  maxPrice: number;
  bedrooms: number;
  bathrooms: number;
  sizeSqm: number;
  maxOccupants: number;
};

export type PropertySubmissionPayload = {
  title: string;
  description?: string;
  listingType: ListingType;
  propertyType: string;
  address: string;
  city: string;
  coordinates: { lat: number; lng: number };
  occupancyMode: string;
  furnishingStatus: string;
  genderPolicy?: string;
  priceNad: number;
  bedrooms?: number;
  bathrooms?: number;
  sizeSqm?: number;
  maxOccupants?: number;
  amenityNames: string[];
  utilitiesIncluded: string[];
  petPolicy: string;
  images: Id<"_storage">[];
  videos: Id<"_storage">[];
  units: ReturnType<typeof comparableUnit>[];
};

export type PropertyUpdatePayload = Partial<PropertySubmissionPayload>;

export type PropertyFormValidationResult =
  | { ok: true }
  | { ok: false; message: string; step: number };

export function validatePropertyFormBeforeSubmit({
  images,
  title,
  city,
  address,
  coordinates,
  normalizedUnits,
}: {
  images: Id<"_storage">[];
  title: string;
  city: string;
  address: string;
  coordinates: { lat: number; lng: number } | null;
  normalizedUnits: PropertyUnitForm[];
}): PropertyFormValidationResult {
  if (images.length === 0) {
    return {
      ok: false,
      message: "Upload at least one cover photo.",
      step: 1,
    };
  }

  if (!title.trim()) {
    return {
      ok: false,
      message: "Give your listing a title.",
      step: 2,
    };
  }

  if (!city.trim() || !address.trim()) {
    return {
      ok: false,
      message: "Add the city and street address.",
      step: 3,
    };
  }

  if (!coordinates) {
    return {
      ok: false,
      message: "Pin the exact location on the map.",
      step: 3,
    };
  }

  if (normalizedUnits.length === 0) {
    return {
      ok: false,
      message: "Add at least one rentable unit.",
      step: 5,
    };
  }

  const invalidUnit = normalizedUnits.find(
    (unit) => !unit.title.trim() || Number(unit.priceNad || 0) <= 0,
  );
  if (invalidUnit) {
    return {
      ok: false,
      message: "Every unit needs a title and a price.",
      step: 5,
    };
  }

  return { ok: true };
}

export function buildPropertySubmissionPayload({
  title,
  description,
  listingType,
  propertyType,
  address,
  city,
  coordinates,
  effectiveOccupancyMode,
  furnishingStatus,
  genderPolicy,
  summary,
  selectedAmenities,
  utilitiesIncluded,
  petPolicy,
  images,
  videos,
  normalizedUnits,
}: {
  title: string;
  description: string;
  listingType: ListingType;
  propertyType: string;
  address: string;
  city: string;
  coordinates: { lat: number; lng: number };
  effectiveOccupancyMode: string;
  furnishingStatus: string;
  genderPolicy: string;
  summary: PropertyFormSummary;
  selectedAmenities: string[];
  utilitiesIncluded: string[];
  petPolicy: string;
  images: Id<"_storage">[];
  videos: Id<"_storage">[];
  normalizedUnits: PropertyUnitForm[];
}): PropertySubmissionPayload {
  return {
    title: title.trim(),
    description: trimmedOrUndefined(description),
    listingType,
    propertyType,
    address: address.trim(),
    city: city.trim(),
    coordinates,
    occupancyMode: effectiveOccupancyMode,
    furnishingStatus,
    genderPolicy:
      listingType === "student_accommodation" ? genderPolicy : undefined,
    priceNad: summary.minPrice || Number(normalizedUnits[0]?.priceNad || 0),
    bedrooms: summary.bedrooms || undefined,
    bathrooms: summary.bathrooms || undefined,
    sizeSqm: summary.sizeSqm || undefined,
    maxOccupants: summary.maxOccupants || undefined,
    amenityNames: normalizeStringArray(selectedAmenities, { sort: true }),
    utilitiesIncluded: normalizeStringArray(utilitiesIncluded, {
      sort: true,
    }),
    petPolicy,
    images,
    videos,
    units: normalizedUnits.map((unit) => comparableUnit(unit, listingType)),
  };
}

export function buildPropertyUpdatePayload({
  payload,
  initialData,
}: {
  payload: PropertySubmissionPayload;
  initialData?: PropertyFormInitialData;
}): PropertyUpdatePayload {
  const updatePayload: PropertyUpdatePayload = {};
  const comparableInitialUnits =
    initialData?.units
      ?.filter((unit) => !unit?.isSynthetic)
      .map((unit) => comparableUnit(unit, payload.listingType)) ?? [];

  if (payload.title !== (initialData?.title?.trim() ?? "")) {
    updatePayload.title = payload.title;
  }
  if (
    (payload.description ?? "") !==
    (trimmedOrUndefined(initialData?.description) ?? "")
  ) {
    updatePayload.description = payload.description;
  }
  if (payload.listingType !== (initialData?.listingType ?? "single_home")) {
    updatePayload.listingType = payload.listingType;
  }
  if (payload.propertyType !== (initialData?.propertyType ?? "apartment")) {
    updatePayload.propertyType = payload.propertyType;
  }
  if (payload.address !== (initialData?.address?.trim() ?? "")) {
    updatePayload.address = payload.address;
  }
  if (payload.city !== (initialData?.city?.trim() ?? "")) {
    updatePayload.city = payload.city;
  }
  if (!coordinatesEqual(payload.coordinates, initialData?.coordinates)) {
    updatePayload.coordinates = payload.coordinates;
  }
  if (
    payload.occupancyMode !==
    (initialData?.occupancyMode ??
      (initialData?.listingType === "student_accommodation"
        ? "private_room"
        : "whole_unit"))
  ) {
    updatePayload.occupancyMode = payload.occupancyMode;
  }
  if (
    payload.furnishingStatus !==
    (initialData?.furnishingStatus ?? "unfurnished")
  ) {
    updatePayload.furnishingStatus = payload.furnishingStatus;
  }
  if (
    (payload.genderPolicy ?? "") !==
    ((initialData?.listingType ?? payload.listingType) ===
    "student_accommodation"
      ? (initialData?.genderPolicy ?? "mixed")
      : "")
  ) {
    updatePayload.genderPolicy = payload.genderPolicy;
  }
  if (payload.priceNad !== (initialData?.priceNad ?? 0)) {
    updatePayload.priceNad = payload.priceNad;
  }
  if ((payload.bedrooms ?? null) !== ((initialData?.bedrooms ?? undefined) ?? null)) {
    updatePayload.bedrooms = payload.bedrooms;
  }
  if ((payload.bathrooms ?? null) !== ((initialData?.bathrooms ?? undefined) ?? null)) {
    updatePayload.bathrooms = payload.bathrooms;
  }
  if ((payload.sizeSqm ?? null) !== ((initialData?.sizeSqm ?? undefined) ?? null)) {
    updatePayload.sizeSqm = payload.sizeSqm;
  }
  if (
    (payload.maxOccupants ?? null) !==
    ((initialData?.maxOccupants ?? undefined) ?? null)
  ) {
    updatePayload.maxOccupants = payload.maxOccupants;
  }
  if (
    !arraysEqual(
      payload.amenityNames,
      normalizeStringArray(initialData?.amenityNames, { sort: true }),
    )
  ) {
    updatePayload.amenityNames = payload.amenityNames;
  }
  if (
    !arraysEqual(
      payload.utilitiesIncluded,
      normalizeStringArray(initialData?.utilitiesIncluded, {
        sort: true,
      }),
    )
  ) {
    updatePayload.utilitiesIncluded = payload.utilitiesIncluded;
  }
  if (payload.petPolicy !== (initialData?.petPolicy ?? "negotiable")) {
    updatePayload.petPolicy = payload.petPolicy;
  }
  if (!arraysEqual(payload.images, initialData?.images ?? [])) {
    updatePayload.images = payload.images;
  }
  if (!arraysEqual(payload.videos, initialData?.videos ?? [])) {
    updatePayload.videos = payload.videos;
  }
  if (JSON.stringify(payload.units) !== JSON.stringify(comparableInitialUnits)) {
    updatePayload.units = payload.units;
  }

  return updatePayload;
}

export function hasPropertyUpdateChanges(payload: PropertyUpdatePayload) {
  return Object.keys(payload).length > 0;
}

export function getPropertyUpdateSuccessMessage({
  requiresReapproval,
  didUpdateClip,
  initialApprovalStatus,
  initialPublicationStatus,
}: {
  requiresReapproval: boolean;
  didUpdateClip: boolean;
  initialApprovalStatus?: string;
  initialPublicationStatus?: string;
}) {
  if (requiresReapproval) {
    return initialApprovalStatus === "rejected"
      ? "Listing updated and resubmitted for review."
      : "Listing updated. The latest changes are now under review.";
  }

  if (!didUpdateClip) {
    return "Listing updated.";
  }

  if (
    initialApprovalStatus === "approved" &&
    initialPublicationStatus === "published"
  ) {
    return "Discovery clip saved. It is now live in Discover.";
  }

  if (initialApprovalStatus === "rejected") {
    return "Discovery clip saved. Your listing still needs the requested fixes before resubmission.";
  }

  return "Discovery clip saved. It will appear in Discover once the listing is live.";
}
