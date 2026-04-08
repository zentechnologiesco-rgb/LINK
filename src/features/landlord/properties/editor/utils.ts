import { PROPERTY_TYPE_LABELS } from "@/constants/property";

import { STEPS } from "./constants";
import type {
  ListingType,
  PropertyUnitForm,
  PropertyUnitInitialData,
  SingleHomeUnitSyncOptions,
} from "./types";

export function createDefaultUnit(
  listingType: ListingType,
  propertyType: string,
  title = "Unit 1",
): PropertyUnitForm {
  return {
    title,
    unitCode: "",
    description: "",
    unitType: listingType === "student_accommodation" ? "room" : propertyType,
    occupancyMode:
      listingType === "student_accommodation" ? "private_room" : "whole_unit",
    roomType: listingType === "student_accommodation" ? "private" : "",
    furnishingStatus:
      listingType === "student_accommodation" ? "furnished" : "unfurnished",
    genderPolicy: "mixed",
    floorLabel: "",
    blockLabel: "",
    priceNad: "",
    bedrooms: "1",
    bathrooms: "1",
    sizeSqm: "",
    maxOccupants: listingType === "student_accommodation" ? "1" : "2",
    publicationStatus: "published",
    occupancyStatus: "vacant",
  };
}

export function toUnitForm(
  unit: PropertyUnitInitialData,
  listingType: ListingType,
  propertyType: string,
): PropertyUnitForm {
  return {
    _id: unit._id ?? undefined,
    title: unit.title || "Unit",
    unitCode: unit.unitCode || "",
    description: unit.description || "",
    unitType:
      unit.unitType ||
      (listingType === "student_accommodation" ? "room" : propertyType),
    occupancyMode:
      unit.occupancyMode ||
      (listingType === "student_accommodation" ? "private_room" : "whole_unit"),
    roomType:
      unit.roomType ||
      (listingType === "student_accommodation" ? "private" : ""),
    furnishingStatus: unit.furnishingStatus || "unfurnished",
    genderPolicy: unit.genderPolicy || "mixed",
    floorLabel: unit.floorLabel || "",
    blockLabel: unit.blockLabel || "",
    priceNad: unit.priceNad ? String(unit.priceNad) : "",
    bedrooms: unit.bedrooms ? String(unit.bedrooms) : "",
    bathrooms: unit.bathrooms ? String(unit.bathrooms) : "",
    sizeSqm: unit.sizeSqm ? String(unit.sizeSqm) : "",
    maxOccupants: unit.maxOccupants ? String(unit.maxOccupants) : "",
    publicationStatus: unit.publicationStatus || "published",
    occupancyStatus: unit.occupancyStatus || "vacant",
  };
}

export function numberValue(value: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function trimmedOrUndefined(value?: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed || undefined;
}

export function normalizeStringArray(
  values: string[] | undefined,
  options?: { sort?: boolean },
) {
  const next = values ? [...values] : [];
  if (options?.sort) next.sort();
  return next;
}

export function arraysEqual<T>(left: T[] | undefined, right: T[] | undefined) {
  const normalizedLeft = left ?? [];
  const normalizedRight = right ?? [];

  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((value, index) => value === normalizedRight[index])
  );
}

export function coordinatesEqual(
  left: { lat: number; lng: number } | null | undefined,
  right: { lat: number; lng: number } | null | undefined,
) {
  if (!left && !right) return true;
  if (!left || !right) return false;
  return left.lat === right.lat && left.lng === right.lng;
}

export function normalizeStepIndex(
  step: number | undefined,
  mode: "create" | "edit",
) {
  if (typeof step !== "number" || Number.isNaN(step)) {
    return mode === "edit" ? 2 : 0;
  }

  return Math.max(0, Math.min(STEPS.length - 1, step));
}

export function getPropertyTypeLabel(propertyType: string) {
  return (
    PROPERTY_TYPE_LABELS[propertyType as keyof typeof PROPERTY_TYPE_LABELS] ||
    "Whole Home"
  );
}

export function buildSingleHomeUnit(
  existingUnit: PropertyUnitForm | undefined,
  options: SingleHomeUnitSyncOptions,
): PropertyUnitForm {
  const nextTitle =
    options.listingTitle.trim() || getPropertyTypeLabel(options.propertyType);

  return {
    ...(existingUnit ??
      createDefaultUnit("single_home", options.propertyType, nextTitle)),
    title: nextTitle,
    unitType: options.propertyType,
    occupancyMode: "whole_unit",
    roomType: "",
    furnishingStatus: options.furnishingStatus,
    genderPolicy: options.genderPolicy,
  };
}

export function comparableUnit(
  unit:
    | PropertyUnitForm
    | (PropertyUnitInitialData & { _id?: PropertyUnitForm["_id"] | null }),
  listingType: ListingType,
) {
  return {
    _id: unit._id ?? undefined,
    title: unit.title?.trim() || "",
    unitCode: trimmedOrUndefined(unit.unitCode),
    description: trimmedOrUndefined(unit.description),
    unitType: unit.unitType || undefined,
    occupancyMode: unit.occupancyMode || undefined,
    roomType: unit.roomType || undefined,
    furnishingStatus: unit.furnishingStatus || undefined,
    genderPolicy:
      listingType === "student_accommodation"
        ? unit.genderPolicy || undefined
        : undefined,
    floorLabel: trimmedOrUndefined(unit.floorLabel),
    blockLabel: trimmedOrUndefined(unit.blockLabel),
    priceNad: Number(unit.priceNad),
    bedrooms: numberValue(String(unit.bedrooms ?? "")),
    bathrooms: numberValue(String(unit.bathrooms ?? "")),
    sizeSqm: numberValue(String(unit.sizeSqm ?? "")),
    maxOccupants: numberValue(String(unit.maxOccupants ?? "")),
  };
}
