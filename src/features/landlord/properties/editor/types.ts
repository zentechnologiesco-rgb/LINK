import type { Id } from "@convex/_generated/dataModel";

export type ListingType =
  | "single_home"
  | "multi_unit_block"
  | "student_accommodation";
export type PublicationStatus = "published" | "unpublished";
export type OccupancyStatus =
  | "vacant"
  | "reserved"
  | "occupied"
  | "unavailable";

export type PropertyUnitForm = {
  _id?: Id<"propertyUnits">;
  title: string;
  unitCode: string;
  description: string;
  unitType: string;
  occupancyMode: string;
  roomType: string;
  furnishingStatus: string;
  genderPolicy: string;
  floorLabel: string;
  blockLabel: string;
  priceNad: string;
  bedrooms: string;
  bathrooms: string;
  sizeSqm: string;
  maxOccupants: string;
  publicationStatus: PublicationStatus;
  occupancyStatus: OccupancyStatus;
};

export type PropertyFormInitialData = {
  title?: string;
  description?: string;
  listingType?: ListingType;
  propertyType?: string;
  occupancyMode?: string;
  furnishingStatus?: string;
  genderPolicy?: string;
  priceNad?: number;
  address?: string;
  city?: string;
  bedrooms?: number;
  bathrooms?: number;
  sizeSqm?: number;
  maxOccupants?: number;
  amenityNames?: string[];
  utilitiesIncluded?: string[];
  petPolicy?: string;
  images?: Id<"_storage">[];
  videos?: Id<"_storage">[];
  coordinates?: { lat: number; lng: number } | null;
  approvalStatus?: string;
  publicationStatus?: PublicationStatus;
  adminNotes?: string;
  units?: Array<{
    _id?: Id<"propertyUnits"> | null;
    title?: string;
    unitCode?: string;
    description?: string;
    unitType?: string;
    occupancyMode?: string;
    roomType?: string;
    furnishingStatus?: string;
    genderPolicy?: string;
    floorLabel?: string;
    blockLabel?: string;
    priceNad?: number;
    bedrooms?: number;
    bathrooms?: number;
    sizeSqm?: number;
    maxOccupants?: number;
    publicationStatus?: PublicationStatus;
    occupancyStatus?: OccupancyStatus;
    isSynthetic?: boolean;
  }>;
};

export type PropertyUnitInitialData = NonNullable<
  PropertyFormInitialData["units"]
>[number];

export interface PropertyFormProps {
  mode?: "create" | "edit";
  propertyId?: Id<"properties">;
  initialData?: PropertyFormInitialData;
  pageBackgroundClassName?: string;
  initialStep?: number;
  initialFocus?: "clip" | null;
}

export type InventoryGenerator = {
  count: string;
  prefix: string;
  unitType: string;
  occupancyMode: string;
  roomType: string;
  priceNad: string;
  bedrooms: string;
  bathrooms: string;
  sizeSqm: string;
  maxOccupants: string;
};

export type SingleHomeUnitSyncOptions = {
  listingTitle: string;
  propertyType: string;
  furnishingStatus: string;
  genderPolicy: string;
};
