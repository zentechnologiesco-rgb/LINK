import type {
  InventoryGenerator,
  ListingType,
  PropertyFormInitialData,
  PropertyUnitForm,
  SingleHomeUnitSyncOptions,
} from "./types";
import { buildSingleHomeUnit, createDefaultUnit, toUnitForm } from "./utils";

export function getListingTypeSeed(
  listingType: ListingType,
  propertyType: string,
) {
  if (listingType === "student_accommodation") {
    return {
      prefix: "Room",
      unitType: "room",
      occupancyMode: "private_room",
      roomType: "private",
      furnishingStatus: "furnished",
      maxOccupants: "1",
    };
  }

  return {
    prefix: "Unit",
    unitType: propertyType,
    occupancyMode: "whole_unit",
    roomType: "",
    furnishingStatus: "unfurnished",
    maxOccupants: "2",
  };
}

export function getInitialUnits(
  initialData?: PropertyFormInitialData,
): PropertyUnitForm[] {
  const listingType = initialData?.listingType || "single_home";
  const propertyType = initialData?.propertyType || "apartment";

  if (initialData?.units?.length) {
    return initialData.units
      .filter((unit) => !unit?.isSynthetic)
      .map((unit) => toUnitForm(unit, listingType, propertyType));
  }

  return [createDefaultUnit(listingType, propertyType)];
}

export function getInitialGenerator(
  initialData?: PropertyFormInitialData,
): InventoryGenerator {
  const listingType = initialData?.listingType || "single_home";
  const propertyType = initialData?.propertyType || "apartment";
  const seed = getListingTypeSeed(listingType, propertyType);

  return {
    count: "6",
    prefix: seed.prefix,
    unitType: seed.unitType,
    occupancyMode: seed.occupancyMode,
    roomType: seed.roomType,
    priceNad: "",
    bedrooms: "1",
    bathrooms: "1",
    sizeSqm: "",
    maxOccupants: seed.maxOccupants,
  };
}

export function toggleStringSelection(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export function patchUnitAtIndex(
  units: PropertyUnitForm[],
  index: number,
  patch: Partial<PropertyUnitForm>,
) {
  return units.map((unit, unitIndex) =>
    unitIndex === index ? { ...unit, ...patch } : unit,
  );
}

export function syncSingleHomeUnit(options: {
  units: PropertyUnitForm[];
  patch?: Partial<PropertyUnitForm>;
  syncOptions: SingleHomeUnitSyncOptions;
}) {
  const { units, patch = {}, syncOptions } = options;

  return [
    {
      ...buildSingleHomeUnit(units[0], syncOptions),
      ...patch,
    },
  ];
}

export function createAdditionalUnit(
  listingType: ListingType,
  propertyType: string,
  unitCount: number,
) {
  const label = listingType === "student_accommodation" ? "Room" : "Unit";
  return createDefaultUnit(
    listingType,
    propertyType,
    `${label} ${unitCount + 1}`,
  );
}

export function createDuplicateUnit(unit: PropertyUnitForm): PropertyUnitForm {
  return {
    ...unit,
    _id: undefined,
    title: `${unit.title} (Copy)`,
    unitCode: "",
    occupancyStatus: "vacant",
  };
}

export function syncGeneratorForListingTypeChange(
  generator: InventoryGenerator,
  nextListingType: ListingType,
  propertyType: string,
) {
  const seed = getListingTypeSeed(nextListingType, propertyType);

  return {
    ...generator,
    prefix: seed.prefix,
    unitType: seed.unitType,
    occupancyMode: seed.occupancyMode,
    roomType: seed.roomType,
    maxOccupants:
      nextListingType === "student_accommodation"
        ? seed.maxOccupants
        : generator.maxOccupants,
  };
}

export function syncUnitsForListingTypeChange(options: {
  currentListingType: ListingType;
  nextListingType: ListingType;
  units: PropertyUnitForm[];
  listingTitle: string;
  propertyType: string;
  currentFurnishingStatus: string;
  nextFurnishingStatus: string;
  genderPolicy: string;
}) {
  const {
    currentListingType,
    nextListingType,
    units,
    listingTitle,
    propertyType,
    currentFurnishingStatus,
    nextFurnishingStatus,
    genderPolicy,
  } = options;

  const seededUnits =
    currentListingType === "single_home"
      ? [
          buildSingleHomeUnit(units[0], {
            listingTitle,
            propertyType,
            furnishingStatus: currentFurnishingStatus,
            genderPolicy,
          }),
        ]
      : units;

  if (nextListingType === "single_home") {
    return [
      buildSingleHomeUnit(seededUnits[0], {
        listingTitle,
        propertyType,
        furnishingStatus: nextFurnishingStatus,
        genderPolicy,
      }),
    ];
  }

  if (seededUnits.length > 0) {
    return seededUnits.map((unit) => ({
      ...unit,
      unitType:
        nextListingType === "student_accommodation"
          ? "room"
          : unit.unitType || propertyType,
      occupancyMode:
        nextListingType === "student_accommodation"
          ? "private_room"
          : unit.occupancyMode || "whole_unit",
      roomType:
        nextListingType === "student_accommodation"
          ? unit.roomType || "private"
          : "",
    }));
  }

  return [createDefaultUnit(nextListingType, propertyType)];
}

export function getBatchGenerationError(generator: InventoryGenerator) {
  const count = Number(generator.count);

  if (!Number.isFinite(count) || count < 1 || count > 100) {
    return "Choose a batch size between 1 and 100.";
  }

  if (!generator.prefix.trim()) {
    return "Add a name prefix for generated units.";
  }

  if (!generator.priceNad) {
    return "Set a price for the generated units.";
  }

  return null;
}

export function buildGeneratedUnits(options: {
  count: number;
  generator: InventoryGenerator;
  listingType: ListingType;
  propertyType: string;
  existingUnitCount: number;
}) {
  const { count, generator, listingType, propertyType, existingUnitCount } =
    options;

  return Array.from({ length: count }, (_, index) => ({
    ...createDefaultUnit(
      listingType,
      propertyType,
      `${generator.prefix.trim()} ${existingUnitCount + index + 1}`,
    ),
    unitType: generator.unitType,
    occupancyMode: generator.occupancyMode,
    roomType: generator.roomType,
    priceNad: generator.priceNad,
    bedrooms: generator.bedrooms,
    bathrooms: generator.bathrooms,
    sizeSqm: generator.sizeSqm,
    maxOccupants: generator.maxOccupants,
  }));
}
