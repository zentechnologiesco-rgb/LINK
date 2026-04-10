"use client";

import { Check, Info, MapPin, PawPrint } from "@/components/ui/icons";

import { LocationPicker } from "@/components/maps/LocationPicker";
import { cn } from "@/lib/utils";
import {
  PET_POLICIES,
  PET_POLICY_LABELS,
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  UTILITY_LABELS,
  UTILITY_OPTIONS,
  type Amenity,
  type AmenityCategory,
} from "@/constants/property";

import {
  CardRow,
  CardSection,
  FieldLabel,
  InlineSelectRow,
  Pill,
} from "./components";
import {
  AMENITY_CATEGORIES,
  FURNISHING_OPTIONS,
  GENDER_POLICY_OPTIONS,
  LISTING_TYPES,
  OCCUPANCY_MODE_OPTIONS,
} from "./constants";
import type { ListingType } from "./types";

export function ListingTypeStepSection({
  listingType,
  onSelectListingType,
}: {
  listingType: ListingType;
  onSelectListingType: (type: ListingType) => void;
}) {
  return (
    <div className="space-y-3 pt-1">
      {LISTING_TYPES.map((type) => {
        const Icon = type.icon;
        const selected = listingType === type.id;

        return (
          <button
            key={type.id}
            type="button"
            onClick={() => onSelectListingType(type.id)}
            className={cn(
              "flex w-full items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all duration-200 select-none active:scale-[0.98]",
              selected
                ? "border-neutral-950 bg-neutral-950"
                : "border-neutral-200 bg-white hover:border-neutral-300",
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-colors",
                selected ? "bg-white/15" : "bg-neutral-100",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  selected ? "text-white" : "text-neutral-600",
                )}
                strokeWidth={1.8}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-[16px] font-semibold tracking-[-0.01em]",
                  selected ? "text-white" : "text-neutral-950",
                )}
              >
                {type.title}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-[14px] leading-snug",
                  selected ? "text-neutral-300" : "text-neutral-500",
                )}
              >
                {type.description}
              </p>
            </div>
            {selected ? (
              <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function DetailsStepSection({
  listingType,
  title,
  description,
  propertyType,
  occupancyMode,
  furnishingStatus,
  genderPolicy,
  onTitleChange,
  onDescriptionChange,
  onPropertyTypeChange,
  onOccupancyModeChange,
  onFurnishingStatusChange,
  onGenderPolicyChange,
}: {
  listingType: ListingType;
  title: string;
  description: string;
  propertyType: string;
  occupancyMode: string;
  furnishingStatus: string;
  genderPolicy: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPropertyTypeChange: (value: string) => void;
  onOccupancyModeChange: (value: string) => void;
  onFurnishingStatusChange: (value: string) => void;
  onGenderPolicyChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <CardSection>
        <CardRow>
          <FieldLabel>Listing Title</FieldLabel>
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={
              listingType === "student_accommodation"
                ? "e.g. Campus Heights Residence"
                : "e.g. Modern studio in Klein Windhoek"
            }
            className="mt-0.5 w-full bg-transparent text-[18px] font-medium text-neutral-950 outline-none placeholder:font-normal placeholder:text-neutral-300"
          />
        </CardRow>
        <CardRow last>
          <FieldLabel>Description</FieldLabel>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Describe what makes this listing stand out — the building, surroundings, and tenant experience…"
            rows={4}
            className="mt-0.5 w-full resize-none bg-transparent text-[15px] leading-relaxed text-neutral-950 outline-none placeholder:text-neutral-300"
          />
        </CardRow>
      </CardSection>

      <CardSection>
        {listingType === "single_home" ? (
          <InlineSelectRow
            label="Property Type"
            value={propertyType}
            onValueChange={onPropertyTypeChange}
            options={PROPERTY_TYPES.map((type) => ({
              value: type,
              label: PROPERTY_TYPE_LABELS[type],
            }))}
          />
        ) : (
          <InlineSelectRow
            label="Occupancy Mode"
            value={occupancyMode}
            onValueChange={onOccupancyModeChange}
            options={OCCUPANCY_MODE_OPTIONS}
          />
        )}
        <InlineSelectRow
          label="Furnishing"
          value={furnishingStatus}
          onValueChange={onFurnishingStatusChange}
          options={FURNISHING_OPTIONS}
        />
        {listingType === "student_accommodation" ? (
          <InlineSelectRow
            label="Gender Policy"
            value={genderPolicy}
            onValueChange={onGenderPolicyChange}
            options={GENDER_POLICY_OPTIONS}
          />
        ) : null}
      </CardSection>
    </div>
  );
}

export function LocationStepSection({
  city,
  address,
  coordinates,
  onCityChange,
  onAddressChange,
  onCoordinatesChange,
}: {
  city: string;
  address: string;
  coordinates: { lat: number; lng: number } | null;
  onCityChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onCoordinatesChange: (value: { lat: number; lng: number } | null) => void;
}) {
  return (
    <div className="space-y-4">
      <CardSection>
        <CardRow>
          <FieldLabel>City</FieldLabel>
          <input
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="Windhoek"
            className="mt-0.5 w-full bg-transparent text-[17px] font-medium text-neutral-950 outline-none placeholder:font-normal placeholder:text-neutral-300"
          />
        </CardRow>
        <CardRow last>
          <FieldLabel>Street Address</FieldLabel>
          <input
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="123 Independence Avenue"
            className="mt-0.5 w-full bg-transparent text-[17px] font-medium text-neutral-950 outline-none placeholder:font-normal placeholder:text-neutral-300"
          />
        </CardRow>
      </CardSection>

      <CardSection>
        <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3">
          <MapPin className="h-4 w-4 flex-shrink-0 text-neutral-400" strokeWidth={2} />
          <p className="text-[15px] font-semibold text-neutral-950">Pin on Map</p>
          <div className="ml-auto">
            {coordinates ? (
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-600">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Pinned
              </div>
            ) : (
              <p className="text-[13px] text-neutral-400">Drop a pin</p>
            )}
          </div>
        </div>
        <div className="h-[260px]">
          <LocationPicker
            initialCoordinates={coordinates}
            onLocationChange={onCoordinatesChange}
            onAddressChange={onAddressChange}
          />
        </div>
        <div className="flex items-center gap-2 border-t border-neutral-100 bg-neutral-50/50 px-4 py-2.5">
          <Info className="h-3.5 w-3.5 flex-shrink-0 text-neutral-400" />
          <p className="text-[12px] text-neutral-400">
            Pin the building once — all units share this location.
          </p>
        </div>
      </CardSection>
    </div>
  );
}

export function FeaturesStepSection({
  amenityCategory,
  filteredAmenities,
  selectedAmenities,
  utilitiesIncluded,
  petPolicy,
  onAmenityCategoryChange,
  onAmenityToggle,
  onUtilityToggle,
  onPetPolicyChange,
}: {
  amenityCategory: "all" | AmenityCategory;
  filteredAmenities: Amenity[];
  selectedAmenities: string[];
  utilitiesIncluded: string[];
  petPolicy: string;
  onAmenityCategoryChange: (value: "all" | AmenityCategory) => void;
  onAmenityToggle: (name: string) => void;
  onUtilityToggle: (utility: string) => void;
  onPetPolicyChange: (policy: string) => void;
}) {
  return (
    <div className="space-y-4">
      <CardSection>
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
          <p className="text-[15px] font-semibold text-neutral-950">
            Amenities
          </p>
          {selectedAmenities.length > 0 ? (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[13px] font-semibold tabular-nums text-neutral-950">
              {selectedAmenities.length}
            </span>
          ) : null}
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-neutral-100 px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {AMENITY_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onAmenityCategoryChange(category.id)}
              className={cn(
                "flex-shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all duration-150 select-none active:scale-95",
                amenityCategory === category.id
                  ? "bg-neutral-950 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
              )}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 p-4">
          {filteredAmenities.map((amenity) => (
            <Pill
              key={amenity.id}
              selected={selectedAmenities.includes(amenity.name)}
              onClick={() => onAmenityToggle(amenity.name)}
            >
              {amenity.name}
            </Pill>
          ))}
        </div>
      </CardSection>

      <CardSection>
        <div className="border-b border-neutral-100 px-4 py-3">
          <p className="text-[15px] font-semibold text-neutral-950">
            Utilities Included
          </p>
          <p className="mt-0.5 text-[12px] text-neutral-400">
            {"What's covered in the rent"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 p-4">
          {UTILITY_OPTIONS.map((utility) => (
            <Pill
              key={utility}
              selected={utilitiesIncluded.includes(utility)}
              onClick={() => onUtilityToggle(utility)}
            >
              {UTILITY_LABELS[utility]}
            </Pill>
          ))}
        </div>
      </CardSection>

      <CardSection>
        <div className="flex items-center gap-2.5 border-b border-neutral-100 px-4 py-3">
          <PawPrint className="h-4 w-4 text-neutral-400" strokeWidth={2} />
          <p className="text-[15px] font-semibold text-neutral-950">
            Pet Policy
          </p>
        </div>
        <div className="flex flex-wrap gap-2 p-4">
          {PET_POLICIES.map((policy) => (
            <Pill
              key={policy}
              selected={petPolicy === policy}
              onClick={() => onPetPolicyChange(policy)}
            >
              {PET_POLICY_LABELS[policy]}
            </Pill>
          ))}
        </div>
      </CardSection>
    </div>
  );
}
