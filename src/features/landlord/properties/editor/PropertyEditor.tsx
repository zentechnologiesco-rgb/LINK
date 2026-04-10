"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Loader2 } from "@/components/ui/icons";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { STEPS } from "./constants";
import {
  buildSingleHomeUnit,
  normalizeStepIndex,
} from "./utils";
import {
  buildPropertySubmissionPayload,
  buildPropertyUpdatePayload,
  getPropertyUpdateSuccessMessage,
  hasPropertyUpdateChanges,
  validatePropertyFormBeforeSubmit,
} from "./submission";
import type {
  InventoryGenerator,
  ListingType,
  PropertyFormProps,
  PropertyUnitForm,
} from "./types";
import { useUser } from "@/components/providers/UserProvider";
import { getPropertyWorkflow } from "@/lib/property-workflow";
import { PropertyUnitEditorSheet } from "./unit-editor-sheet";
import {
  PropertyFormBottomBar,
  PropertyFormHeader,
  PropertyFormStepViewport,
} from "./chrome";
import {
  buildGeneratedUnits,
  createAdditionalUnit,
  createDuplicateUnit,
  getBatchGenerationError,
  getInitialGenerator,
  getInitialUnits,
  getListingTypeSeed,
  patchUnitAtIndex,
  syncGeneratorForListingTypeChange,
  syncSingleHomeUnit,
  syncUnitsForListingTypeChange,
  toggleStringSelection,
} from "./inventory";
import {
  buildEditStepHref,
  buildEditStepLinks,
  getRenderDirection,
  getStepData,
  getSubmitButtonLabels,
  type PropertyFormDirection,
} from "./navigation";
import { PropertyFormStepContent } from "./step-content";
import {
  AMENITIES,
  getAmenitiesByCategory,
  type AmenityCategory,
} from "@/constants/property";

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function PropertyEditor({
  mode = "create",
  propertyId,
  initialData,
  pageBackgroundClassName = "bg-white",
  initialStep,
  initialFocus = null,
}: PropertyFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamString = searchParams.toString();
  const routedStep = normalizeStepIndex(initialStep, mode);
  const routedStepRef = useRef(routedStep);
  const resolvedPageBackgroundClassName = cn(pageBackgroundClassName, "text-neutral-950");
  const { isLoading: isUserLoading } = useUser();
  const createProperty = useMutation(api.properties.create);
  const updateProperty = useMutation(api.properties.update);

  // ── Form state ──────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [listingType, setListingType] = useState<ListingType>(
    initialData?.listingType || "single_home",
  );
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [propertyType, setPropertyType] = useState(
    initialData?.propertyType || "apartment",
  );
  const [occupancyMode, setOccupancyMode] = useState(
    initialData?.occupancyMode ||
      (initialData?.listingType === "student_accommodation"
        ? "private_room"
        : "whole_unit"),
  );
  const [furnishingStatus, setFurnishingStatus] = useState(
    initialData?.furnishingStatus || "unfurnished",
  );
  const [genderPolicy, setGenderPolicy] = useState(
    initialData?.genderPolicy || "mixed",
  );
  const [city, setCity] = useState(initialData?.city || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(initialData?.coordinates || null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    initialData?.amenityNames || [],
  );
  const [utilitiesIncluded, setUtilitiesIncluded] = useState<string[]>(
    initialData?.utilitiesIncluded || [],
  );
  const [petPolicy, setPetPolicy] = useState(
    initialData?.petPolicy || "negotiable",
  );
  const [images, setImages] = useState<Id<"_storage">[]>(
    initialData?.images || [],
  );
  const [videos, setVideos] = useState<Id<"_storage">[]>(
    initialData?.videos || [],
  );
  const [units, setUnits] = useState<PropertyUnitForm[]>(() =>
    getInitialUnits(initialData),
  );
  const [generator, setGenerator] = useState<InventoryGenerator>(() =>
    getInitialGenerator(initialData),
  );

  // ── UI state ─────────────────────────────────────────────────────────────
  const [stepState, setStepState] = useState(() => routedStep);
  const [direction, setDirection] =
    useState<PropertyFormDirection>("forward");
  const [editingUnitIndex, setEditingUnitIndex] = useState<number | null>(null);
  const [amenityCategory, setAmenityCategory] = useState<
    "all" | AmenityCategory
  >("all");
  const [showBatchGen, setShowBatchGen] = useState(false);
  const [clipSpotlightDismissed, setClipSpotlightDismissed] = useState(false);

  // ── Computed ─────────────────────────────────────────────────────────────
  const isSingleHome = listingType === "single_home";
  const effectiveOccupancyMode = isSingleHome ? "whole_unit" : occupancyMode;
  const normalizedUnits = useMemo(() => {
    if (!isSingleHome) return units;
    return [
      buildSingleHomeUnit(units[0], {
        listingTitle: title,
        propertyType,
        furnishingStatus,
        genderPolicy,
      }),
    ];
  }, [
    furnishingStatus,
    genderPolicy,
    isSingleHome,
    propertyType,
    title,
    units,
  ]);
  const singleHomeUnit = normalizedUnits[0];
  const summary = useMemo(() => {
    const pricedUnits = normalizedUnits
      .map((u) => ({
        price: Number(u.priceNad || 0),
        bedrooms: Number(u.bedrooms || 0),
        bathrooms: Number(u.bathrooms || 0),
        sizeSqm: Number(u.sizeSqm || 0),
        maxOccupants: Number(u.maxOccupants || 0),
      }))
      .filter((u) => u.price > 0);
    const first = pricedUnits[0] || {
      price: 0,
      bedrooms: 0,
      bathrooms: 0,
      sizeSqm: 0,
      maxOccupants: 0,
    };
    return {
      minPrice: pricedUnits.length
        ? Math.min(...pricedUnits.map((u) => u.price))
        : 0,
      maxPrice: pricedUnits.length
        ? Math.max(...pricedUnits.map((u) => u.price))
        : 0,
      bedrooms: first.bedrooms,
      bathrooms: first.bathrooms,
      sizeSqm: first.sizeSqm,
      maxOccupants: first.maxOccupants,
    };
  }, [normalizedUnits]);

  const filteredAmenities =
    amenityCategory === "all"
      ? AMENITIES
      : getAmenitiesByCategory(amenityCategory);

  const step = mode === "edit" ? routedStep : stepState;
  const TOTAL_STEPS = STEPS.length;
  const stepData = getStepData(step, isSingleHome);
  const editingUnit =
    editingUnitIndex !== null ? units[editingUnitIndex] : null;
  const workflow =
    mode === "edit"
      ? getPropertyWorkflow({
          approvalStatus: initialData?.approvalStatus,
          publicationStatus: initialData?.publicationStatus,
          availableUnitCount: normalizedUnits.filter(
            (unit) => Number(unit.priceNad || 0) > 0,
          ).length,
        })
      : null;
  const hasDiscoveryClip = videos.length > 0;
  const shouldHighlightClip =
    mode === "edit" &&
    step === 1 &&
    initialFocus === "clip" &&
    !clipSpotlightDismissed;
  const prefersClipFocus =
    searchParams.get("focus") === "clip" || initialFocus === "clip";
  const stepLinks = buildEditStepLinks(
    pathname,
    searchParamString,
    prefersClipFocus,
  );
  const clipEditHref = buildEditStepHref(1, pathname, searchParamString, {
    focusClip: true,
  });
  const renderDirection = getRenderDirection({
    mode,
    direction,
    routedStep,
    previousRoutedStep: routedStepRef.current,
  });
  const showRejectedBanner =
    mode === "edit" && initialData?.approvalStatus === "rejected" && step === 2;

  // ── Navigation ────────────────────────────────────────────────────────────
  function navigateTo(newStep: number) {
    if (newStep < 0 || newStep >= TOTAL_STEPS) return;
    if (mode === "edit") {
      router.push(
        buildEditStepHref(newStep, pathname, searchParamString, {
          focusClip: newStep === 1 && prefersClipFocus,
        }),
        { scroll: false },
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setDirection(newStep > step ? "forward" : "back");
    setStepState(newStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    if (mode !== "edit") return;
    routedStepRef.current = routedStep;
  }, [mode, routedStep]);

  useEffect(() => {
    if (mode === "edit") return;
    if (initialStep == null) return;
    
    // Only set stepState from initialStep if it explicitly changes
    const nextStep = normalizeStepIndex(initialStep, mode);
    setStepState(nextStep);
  }, [initialStep, mode]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAmenityChange = (name: string) => {
    setSelectedAmenities((prev) => toggleStringSelection(prev, name));
  };

  const toggleUtility = (utility: string) => {
    setUtilitiesIncluded((prev) => toggleStringSelection(prev, utility));
  };

  const updateUnit = (index: number, patch: Partial<PropertyUnitForm>) => {
    setUnits((prev) => patchUnitAtIndex(prev, index, patch));
  };

  const updateSingleHomeUnit = (
    patch: Partial<PropertyUnitForm> = {},
    overrides: Partial<{
      listingTitle: string;
      propertyType: string;
      furnishingStatus: string;
      genderPolicy: string;
    }> = {},
  ) => {
    setUnits((prev) =>
      syncSingleHomeUnit({
        units: prev,
        patch,
        syncOptions: {
          listingTitle: overrides.listingTitle ?? title,
          propertyType: overrides.propertyType ?? propertyType,
          furnishingStatus: overrides.furnishingStatus ?? furnishingStatus,
          genderPolicy: overrides.genderPolicy ?? genderPolicy,
        },
      }),
    );
  };

  const addUnit = () => {
    setUnits((prev) => [
      ...prev,
      createAdditionalUnit(listingType, propertyType, prev.length),
    ]);
    setEditingUnitIndex(units.length);
  };

  const duplicateUnit = (index: number) => {
    const unit = units[index];
    setUnits((prev) => [
      ...prev.slice(0, index + 1),
      createDuplicateUnit(unit),
      ...prev.slice(index + 1),
    ]);
    toast.success("Unit duplicated");
  };

  const removeUnit = (index: number) => {
    if (units.length === 1) {
      toast.error("At least one unit is required.");
      return;
    }
    setUnits((prev) => prev.filter((_, i) => i !== index));
  };

  const setListingTypeAndSeed = (next: ListingType) => {
    const nextSeed = getListingTypeSeed(next, propertyType);

    setListingType(next);
    setOccupancyMode(nextSeed.occupancyMode);
    setFurnishingStatus(nextSeed.furnishingStatus);
    setEditingUnitIndex(null);
    setShowBatchGen(false);
    setGenerator((prev) =>
      syncGeneratorForListingTypeChange(prev, next, propertyType),
    );
    setUnits((prev) =>
      syncUnitsForListingTypeChange({
        currentListingType: listingType,
        nextListingType: next,
        units: prev,
        listingTitle: title,
        propertyType,
        currentFurnishingStatus: furnishingStatus,
        nextFurnishingStatus: nextSeed.furnishingStatus,
        genderPolicy,
      }),
    );
  };

  const handleGenerateBatch = () => {
    const count = Number(generator.count);
    const generationError = getBatchGenerationError(generator);

    if (generationError) {
      toast.error(generationError);
      return;
    }

    setUnits((prev) => [
      ...prev,
      ...buildGeneratedUnits({
        count,
        generator,
        listingType,
        propertyType,
        existingUnitCount: prev.length,
      }),
    ]);
    toast.success(`Added ${count} unit${count === 1 ? "" : "s"} to inventory.`);
    setShowBatchGen(false);
  };

  const handleTitleChange = (nextTitle: string) => {
    setTitle(nextTitle);
    if (isSingleHome) {
      updateSingleHomeUnit({}, { listingTitle: nextTitle });
    }
  };

  const handlePropertyTypeChange = (value: string) => {
    setPropertyType(value);
    setGenerator((prev) => ({ ...prev, unitType: value }));
    if (isSingleHome) {
      updateSingleHomeUnit({}, { propertyType: value });
    }
  };

  const handleFurnishingStatusChange = (value: string) => {
    setFurnishingStatus(value);
    if (isSingleHome) {
      updateSingleHomeUnit({}, { furnishingStatus: value });
    }
  };

  const handleGeneratorChange = (
    key: keyof InventoryGenerator,
    value: string,
  ) => {
    setGenerator((prev) => ({ ...prev, [key]: value }));
  };

  const handleEditingUnitUpdate = (patch: Partial<PropertyUnitForm>) => {
    if (editingUnitIndex === null) return;
    updateUnit(editingUnitIndex, patch);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validation = validatePropertyFormBeforeSubmit({
      images,
      title,
      city,
      address,
      coordinates,
      normalizedUnits,
    });
    if (!validation.ok) {
      toast.error(validation.message);
      navigateTo(validation.step);
      return;
    }

    setIsLoading(true);
    try {
      const payload = buildPropertySubmissionPayload({
        title,
        description,
        listingType,
        propertyType,
        address,
        city,
        coordinates: coordinates!,
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
      });

      if (mode === "edit" && propertyId) {
        const updatePayload = buildPropertyUpdatePayload({
          payload,
          initialData,
        });

        if (!hasPropertyUpdateChanges(updatePayload)) {
          toast("No changes to save.");
          return;
        }

        const result = await updateProperty({ propertyId, ...updatePayload });
        const didUpdateClip = "videos" in updatePayload;

        toast.success(
          getPropertyUpdateSuccessMessage({
            requiresReapproval: result.requiresReapproval,
            didUpdateClip,
            initialApprovalStatus: initialData?.approvalStatus,
            initialPublicationStatus: initialData?.publicationStatus,
          }),
        );
      } else {
        await createProperty(payload);
        toast.success("Listing created and sent for review.");
      }
      router.push("/landlord/properties");
    } catch (err) {
      console.error("Error saving listing:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to save listing.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isUserLoading) {
    return (
      <div
        className={cn(
          "flex min-h-screen items-center justify-center",
          resolvedPageBackgroundClassName,
        )}
      >
        <Loader2 className="h-7 w-7 animate-spin text-neutral-400" />
      </div>
    );
  }

  const { submitButtonLabel, loadingButtonLabel } = getSubmitButtonLabels(
    mode,
    initialData?.approvalStatus,
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className={cn("min-h-screen font-sans", resolvedPageBackgroundClassName)}
    >
      <main className="pt-4 pb-28">
        <form onSubmit={handleSubmit} noValidate>
          <PropertyFormStepViewport
            mode={mode}
            step={step}
            renderDirection={renderDirection}
          >
            <PropertyFormStepContent
              step={step}
              mode={mode}
              stepData={stepData}
              showRejectedBanner={showRejectedBanner}
              adminNotes={initialData?.adminNotes}
              workflow={workflow}
              hasDiscoveryClip={hasDiscoveryClip}
              imagesCount={images.length}
              videosCount={videos.length}
              unitCount={normalizedUnits.length}
              stepLinks={stepLinks}
              clipEditHref={clipEditHref}
              listingType={listingType}
              title={title}
              description={description}
              propertyType={propertyType}
              occupancyMode={occupancyMode}
              furnishingStatus={furnishingStatus}
              genderPolicy={genderPolicy}
              city={city}
              address={address}
              coordinates={coordinates}
              amenityCategory={amenityCategory}
              filteredAmenities={filteredAmenities}
              selectedAmenities={selectedAmenities}
              utilitiesIncluded={utilitiesIncluded}
              petPolicy={petPolicy}
              isSingleHome={isSingleHome}
              singleHomeUnit={singleHomeUnit}
              units={units}
              summary={summary}
              showBatchGen={showBatchGen}
              generator={generator}
              shouldHighlightClip={shouldHighlightClip}
              initialImages={initialData?.images ?? []}
              initialVideos={initialData?.videos ?? []}
              onDismissClipHighlight={() => setClipSpotlightDismissed(true)}
              onImagesChange={setImages}
              onVideosChange={setVideos}
              onSelectListingType={setListingTypeAndSeed}
              onTitleChange={handleTitleChange}
              onDescriptionChange={setDescription}
              onPropertyTypeChange={handlePropertyTypeChange}
              onOccupancyModeChange={setOccupancyMode}
              onFurnishingStatusChange={handleFurnishingStatusChange}
              onGenderPolicyChange={setGenderPolicy}
              onCityChange={setCity}
              onAddressChange={setAddress}
              onCoordinatesChange={setCoordinates}
              onAmenityCategoryChange={setAmenityCategory}
              onAmenityToggle={handleAmenityChange}
              onUtilityToggle={toggleUtility}
              onPetPolicyChange={setPetPolicy}
              onUpdateSingleHomeUnit={updateSingleHomeUnit}
              onToggleBatchGen={() => setShowBatchGen((prev) => !prev)}
              onGeneratorChange={handleGeneratorChange}
              onGenerateBatch={handleGenerateBatch}
              onAddUnit={addUnit}
              onEditUnit={setEditingUnitIndex}
              onDuplicateUnit={duplicateUnit}
              onRemoveUnit={removeUnit}
            />
          </PropertyFormStepViewport>

          <PropertyFormBottomBar
            mode={mode}
            step={step}
            totalSteps={TOTAL_STEPS}
            isLoading={isLoading}
            submitButtonLabel={submitButtonLabel}
            loadingButtonLabel={loadingButtonLabel}
            onNavigate={navigateTo}
          />
        </form>
      </main>

      {/* ══════════════════════════════════════════════════════════════
                UNIT EDITOR BOTTOM SHEET
            ══════════════════════════════════════════════════════════════ */}
      <PropertyUnitEditorSheet
        listingType={listingType}
        unit={editingUnit}
        unitIndex={editingUnitIndex}
        open={editingUnitIndex !== null}
        onOpenChange={(open) => !open && setEditingUnitIndex(null)}
        onUpdateUnit={handleEditingUnitUpdate}
      />
    </div>
  );
}
