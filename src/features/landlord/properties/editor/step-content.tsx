"use client";

import type { ComponentProps } from "react";

import type { Id } from "@convex/_generated/dataModel";
import type { Amenity, AmenityCategory } from "@/constants/property";
import type { PropertyWorkflow } from "@/lib/property-workflow";

import {
  DetailsStepSection,
  FeaturesStepSection,
  ListingTypeStepSection,
  LocationStepSection,
} from "./basic-steps";
import { PropertyFormStepHero } from "./chrome";
import {
  PropertyFormEditOverview,
  PropertyFormRejectedBanner,
} from "./edit-overview";
import {
  MultiUnitInventorySection,
  SingleHomeInventorySection,
} from "./inventory-sections";
import { MediaStepSection } from "./media-step";
import type {
  InventoryGenerator,
  ListingType,
  PropertyUnitForm,
} from "./types";

type StepData = ComponentProps<typeof PropertyFormStepHero>["stepData"];
type EditStepLink =
  ComponentProps<typeof PropertyFormEditOverview>["stepLinks"][number];

export function PropertyFormStepContent({
  step,
  mode,
  stepData,
  showRejectedBanner,
  adminNotes,
  workflow,
  hasDiscoveryClip,
  imagesCount,
  videosCount,
  unitCount,
  stepLinks,
  clipEditHref,
  listingType,
  title,
  description,
  propertyType,
  occupancyMode,
  furnishingStatus,
  genderPolicy,
  city,
  address,
  coordinates,
  amenityCategory,
  filteredAmenities,
  selectedAmenities,
  utilitiesIncluded,
  petPolicy,
  isSingleHome,
  singleHomeUnit,
  units,
  summary,
  showBatchGen,
  generator,
  shouldHighlightClip,
  initialImages,
  initialVideos,
  onDismissClipHighlight,
  onImagesChange,
  onVideosChange,
  onSelectListingType,
  onTitleChange,
  onDescriptionChange,
  onPropertyTypeChange,
  onOccupancyModeChange,
  onFurnishingStatusChange,
  onGenderPolicyChange,
  onCityChange,
  onAddressChange,
  onCoordinatesChange,
  onAmenityCategoryChange,
  onAmenityToggle,
  onUtilityToggle,
  onPetPolicyChange,
  onUpdateSingleHomeUnit,
  onToggleBatchGen,
  onGeneratorChange,
  onGenerateBatch,
  onAddUnit,
  onEditUnit,
  onDuplicateUnit,
  onRemoveUnit,
}: {
  step: number;
  mode: "create" | "edit";
  stepData: StepData;
  showRejectedBanner: boolean;
  adminNotes?: string;
  workflow: PropertyWorkflow | null;
  hasDiscoveryClip: boolean;
  imagesCount: number;
  videosCount: number;
  unitCount: number;
  stepLinks: EditStepLink[];
  clipEditHref: string;
  listingType: ListingType;
  title: string;
  description: string;
  propertyType: string;
  occupancyMode: string;
  furnishingStatus: string;
  genderPolicy: string;
  city: string;
  address: string;
  coordinates: { lat: number; lng: number } | null;
  amenityCategory: "all" | AmenityCategory;
  filteredAmenities: Amenity[];
  selectedAmenities: string[];
  utilitiesIncluded: string[];
  petPolicy: string;
  isSingleHome: boolean;
  singleHomeUnit: PropertyUnitForm | undefined;
  units: PropertyUnitForm[];
  summary: {
    minPrice: number;
    maxPrice: number;
  };
  showBatchGen: boolean;
  generator: InventoryGenerator;
  shouldHighlightClip: boolean;
  initialImages: Id<"_storage">[];
  initialVideos: Id<"_storage">[];
  onDismissClipHighlight: () => void;
  onImagesChange: (images: Id<"_storage">[]) => void;
  onVideosChange: (videos: Id<"_storage">[]) => void;
  onSelectListingType: (listingType: ListingType) => void;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onPropertyTypeChange: (propertyType: string) => void;
  onOccupancyModeChange: (occupancyMode: string) => void;
  onFurnishingStatusChange: (furnishingStatus: string) => void;
  onGenderPolicyChange: (genderPolicy: string) => void;
  onCityChange: (city: string) => void;
  onAddressChange: (address: string) => void;
  onCoordinatesChange: (
    coordinates: { lat: number; lng: number } | null,
  ) => void;
  onAmenityCategoryChange: (category: "all" | AmenityCategory) => void;
  onAmenityToggle: (amenityName: string) => void;
  onUtilityToggle: (utilityName: string) => void;
  onPetPolicyChange: (petPolicy: string) => void;
  onUpdateSingleHomeUnit: (patch: Partial<PropertyUnitForm>) => void;
  onToggleBatchGen: () => void;
  onGeneratorChange: (key: keyof InventoryGenerator, value: string) => void;
  onGenerateBatch: () => void;
  onAddUnit: () => void;
  onEditUnit: (index: number) => void;
  onDuplicateUnit: (index: number) => void;
  onRemoveUnit: (index: number) => void;
}) {
  return (
    <>
      {showRejectedBanner ? (
        <PropertyFormRejectedBanner adminNotes={adminNotes} />
      ) : null}

      {mode === "edit" && workflow ? (
        <PropertyFormEditOverview
          workflow={workflow}
          hasDiscoveryClip={hasDiscoveryClip}
          imagesCount={imagesCount}
          unitCount={unitCount}
          stepLinks={stepLinks}
          activeStep={step}
          clipHref={clipEditHref}
        />
      ) : null}

      <PropertyFormStepHero stepData={stepData} />

      {step === 0 ? (
        <ListingTypeStepSection
          listingType={listingType}
          onSelectListingType={onSelectListingType}
        />
      ) : null}

      {step === 1 ? (
        <MediaStepSection
          mode={mode}
          initialImages={initialImages}
          initialVideos={initialVideos}
          hasDiscoveryClip={hasDiscoveryClip}
          highlighted={shouldHighlightClip}
          imagesCount={imagesCount}
          videosCount={videosCount}
          workflow={workflow}
          onDismissHighlight={onDismissClipHighlight}
          onImagesChange={onImagesChange}
          onVideosChange={onVideosChange}
        />
      ) : null}

      {step === 2 ? (
        <DetailsStepSection
          listingType={listingType}
          title={title}
          description={description}
          propertyType={propertyType}
          occupancyMode={occupancyMode}
          furnishingStatus={furnishingStatus}
          genderPolicy={genderPolicy}
          onTitleChange={onTitleChange}
          onDescriptionChange={onDescriptionChange}
          onPropertyTypeChange={onPropertyTypeChange}
          onOccupancyModeChange={onOccupancyModeChange}
          onFurnishingStatusChange={onFurnishingStatusChange}
          onGenderPolicyChange={onGenderPolicyChange}
        />
      ) : null}

      {step === 3 ? (
        <LocationStepSection
          city={city}
          address={address}
          coordinates={coordinates}
          onCityChange={onCityChange}
          onAddressChange={onAddressChange}
          onCoordinatesChange={onCoordinatesChange}
        />
      ) : null}

      {step === 4 ? (
        <FeaturesStepSection
          amenityCategory={amenityCategory}
          filteredAmenities={filteredAmenities}
          selectedAmenities={selectedAmenities}
          utilitiesIncluded={utilitiesIncluded}
          petPolicy={petPolicy}
          onAmenityCategoryChange={onAmenityCategoryChange}
          onAmenityToggle={onAmenityToggle}
          onUtilityToggle={onUtilityToggle}
          onPetPolicyChange={onPetPolicyChange}
        />
      ) : null}

      {step === 5 ? (
        <div className="space-y-4">
          {isSingleHome ? (
            <SingleHomeInventorySection
              singleHomeUnit={singleHomeUnit}
              propertyType={propertyType}
              onUpdateUnit={onUpdateSingleHomeUnit}
            />
          ) : (
            <MultiUnitInventorySection
              units={units}
              summary={summary}
              showBatchGen={showBatchGen}
              generator={generator}
              onToggleBatchGen={onToggleBatchGen}
              onGeneratorChange={onGeneratorChange}
              onGenerateBatch={onGenerateBatch}
              onAddUnit={onAddUnit}
              onEditUnit={onEditUnit}
              onDuplicateUnit={onDuplicateUnit}
              onRemoveUnit={onRemoveUnit}
            />
          )}
        </div>
      ) : null}
    </>
  );
}
