"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  Bed,
  Building2,
  Camera,
  Check,
  ChevronRight,
  CopyPlus,
  Home,
  Info,
  Loader2,
  MapPin,
  Minus,
  PawPrint,
  Plus,
  Ruler,
  Sparkles,
  Trash2,
  Users,
  X,
  XCircle,
  Zap,
} from "lucide-react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "./ImageUpload";
import { LocationPicker } from "@/components/maps/LocationPicker";
import {
  AMENITIES,
  PET_POLICIES,
  PET_POLICY_LABELS,
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  UTILITY_LABELS,
  UTILITY_OPTIONS,
  getAmenitiesByCategory,
  type AmenityCategory,
} from "@/constants/property";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type ListingType = "single_home" | "multi_unit_block" | "student_accommodation";
type PublicationStatus = "published" | "unpublished";
type OccupancyStatus = "vacant" | "reserved" | "occupied" | "unavailable";

type PropertyUnitForm = {
  _id?: Id<"propertyUnits">;
  title: string;
  unitCode: string;
  description: string;
  unitType: string;
  occupancyMode: string;
  roomType: string;
  furnishingStatus: string;
  genderPolicy: string;
  availableFrom: string;
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

type PropertyFormInitialData = {
  title?: string;
  description?: string;
  listingType?: ListingType;
  propertyType?: string;
  occupancyMode?: string;
  furnishingStatus?: string;
  genderPolicy?: string;
  availableFrom?: string;
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
    availableFrom?: string;
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

type PropertyUnitInitialData = NonNullable<
  PropertyFormInitialData["units"]
>[number];

interface PropertyFormProps {
  mode?: "create" | "edit";
  propertyId?: Id<"properties">;
  initialData?: PropertyFormInitialData;
  pageBackgroundClassName?: string;
}

type InventoryGenerator = {
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

type SingleHomeUnitSyncOptions = {
  listingTitle: string;
  propertyType: string;
  occupancyMode: string;
  furnishingStatus: string;
  genderPolicy: string;
  availableFrom: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const LISTING_TYPES: {
  id: ListingType;
  title: string;
  description: string;
  icon: typeof Home;
}[] = [
  {
    id: "single_home",
    title: "Single Home",
    description: "One rentable home, apartment, studio, or room.",
    icon: Home,
  },
  {
    id: "multi_unit_block",
    title: "Apartment Block",
    description: "One building with multiple rentable units.",
    icon: Building2,
  },
  {
    id: "student_accommodation",
    title: "Student Accommodation",
    description: "Rooms or bed spaces in a shared residence.",
    icon: Users,
  },
];

const STEPS = [
  {
    id: "type",
    label: "Type",
    title: "What are you listing?",
    subtitle: "Choose the type that best describes your property.",
  },
  {
    id: "photos",
    label: "Photos",
    title: "Show it off",
    subtitle: "Great photos attract the right tenants. Add up to 15.",
  },
  {
    id: "details",
    label: "Details",
    title: "Tell us about it",
    subtitle: "Give tenants everything they need to make a decision.",
  },
  {
    id: "location",
    label: "Location",
    title: "Where is it?",
    subtitle: "Add the address and drop a pin on the map.",
  },
  {
    id: "features",
    label: "Features",
    title: "Amenities & rules",
    subtitle: "Let tenants know what's included and what's allowed.",
  },
  {
    id: "inventory",
    label: "Units",
    title: "Set up your units",
    subtitle: "Add every rentable space and choose which ones should appear when the listing goes live.",
  },
] as const;

const AMENITY_CATEGORIES = [
  { id: "all" as const, label: "All" },
  { id: "security" as const, label: "Security" },
  { id: "utilities" as const, label: "Utilities" },
  { id: "outdoor" as const, label: "Outdoor" },
  { id: "indoor" as const, label: "Indoor" },
  { id: "community" as const, label: "Community" },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function createDefaultUnit(
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
    availableFrom: "",
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

function toUnitForm(
  unit: PropertyUnitInitialData,
  listingType: ListingType,
  propertyType: string,
): PropertyUnitForm {
  return {
    _id: unit?._id ?? undefined,
    title: unit?.title || "Unit",
    unitCode: unit?.unitCode || "",
    description: unit?.description || "",
    unitType:
      unit?.unitType ||
      (listingType === "student_accommodation" ? "room" : propertyType),
    occupancyMode:
      unit?.occupancyMode ||
      (listingType === "student_accommodation" ? "private_room" : "whole_unit"),
    roomType:
      unit?.roomType ||
      (listingType === "student_accommodation" ? "private" : ""),
    furnishingStatus: unit?.furnishingStatus || "unfurnished",
    genderPolicy: unit?.genderPolicy || "mixed",
    availableFrom: unit?.availableFrom || "",
    floorLabel: unit?.floorLabel || "",
    blockLabel: unit?.blockLabel || "",
    priceNad: unit?.priceNad?.toString() || "",
    bedrooms: unit?.bedrooms?.toString() || "",
    bathrooms: unit?.bathrooms?.toString() || "",
    sizeSqm: unit?.sizeSqm?.toString() || "",
    maxOccupants: unit?.maxOccupants?.toString() || "",
    publicationStatus: unit?.publicationStatus || "published",
    occupancyStatus: unit?.occupancyStatus || "vacant",
  };
}

function numberValue(value: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function getPropertyTypeLabel(propertyType: string) {
  return (
    PROPERTY_TYPE_LABELS[propertyType as keyof typeof PROPERTY_TYPE_LABELS] ||
    "Whole Home"
  );
}

function buildSingleHomeUnit(
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
    occupancyMode: options.occupancyMode,
    roomType: "",
    furnishingStatus: options.furnishingStatus,
    genderPolicy: options.genderPolicy,
    availableFrom: options.availableFrom,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MICRO-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function Pill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[14px] font-medium transition-all duration-150 active:scale-95 select-none",
        selected
          ? "bg-neutral-950 text-white shadow-sm"
          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
      )}
    >
      {selected && (
        <Check className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2.5} />
      )}
      {children}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-1.5 select-none">
      {children}
    </span>
  );
}

function CardSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

function CardRow({
  children,
  last = false,
  className,
}: {
  children: React.ReactNode;
  last?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-4 py-3.5",
        !last && "border-b border-neutral-100/80",
        className,
      )}
    >
      {children}
    </div>
  );
}

function InlineSelectRow({
  label,
  value,
  onValueChange,
  options,
  last = false,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string }[];
  last?: boolean;
}) {
  return (
    <CardRow last={last} className="flex items-center justify-between gap-4">
      <span className="text-[15px] text-neutral-950 flex-shrink-0">
        {label}
      </span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-8 w-auto max-w-[180px] min-w-[120px] rounded-lg border-neutral-200 bg-neutral-50/80 px-3 text-[14px] font-medium text-neutral-700 focus:ring-0 focus:border-neutral-300 shadow-none truncate">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </CardRow>
  );
}

function NumberStepperRow({
  label,
  sublabel,
  value,
  onChange,
  min = 0,
  max = 20,
  last = false,
}: {
  label: string;
  sublabel?: string;
  value: string;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  last?: boolean;
}) {
  const num = parseInt(value) || 0;
  return (
    <CardRow last={last} className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[15px] text-neutral-950">{label}</p>
        {sublabel && (
          <p className="text-[12px] text-neutral-400 mt-0.5">{sublabel}</p>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          type="button"
          onClick={() => onChange(String(Math.max(min, num - 1)))}
          disabled={num <= min}
          className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-700 hover:bg-neutral-200 disabled:opacity-30 active:scale-90 transition-all"
        >
          <Minus className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <span className="w-7 text-center text-[16px] font-semibold text-neutral-950 tabular-nums select-none">
          {num || "–"}
        </span>
        <button
          type="button"
          onClick={() => onChange(String(Math.min(max, num + 1)))}
          disabled={num >= max}
          className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-700 hover:bg-neutral-200 disabled:opacity-30 active:scale-90 transition-all"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </CardRow>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UNIT CARD
// ─────────────────────────────────────────────────────────────────────────────

function UnitCard({
  unit,
  index,
  onEdit,
  onDuplicate,
  onRemove,
}: {
  unit: PropertyUnitForm;
  index: number;
  onEdit: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const price = Number(unit.priceNad) || 0;
  const beds = parseInt(unit.bedrooms) || 0;
  const baths = parseInt(unit.bathrooms) || 0;
  const size = parseFloat(unit.sizeSqm) || 0;

  return (
    <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
      <button
        type="button"
        onClick={onEdit}
        className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-neutral-50 active:bg-neutral-100 transition-colors"
      >
        {/* Index badge */}
        <div className="h-11 w-11 rounded-xl bg-neutral-100 flex-shrink-0 flex items-center justify-center">
          <span className="text-[14px] font-bold text-neutral-500 tabular-nums">
            {index + 1}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[15px] font-semibold text-neutral-950 truncate">
              {unit.title || `Unit ${index + 1}`}
            </p>
            <span
              className={cn(
                "text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0",
                unit.publicationStatus === "published"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-neutral-100 text-neutral-500",
              )}
            >
              {unit.publicationStatus === "published" ? "Visible" : "Hidden"}
            </span>
            {unit.occupancyStatus === "occupied" && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 flex-shrink-0">
                Occupied
              </span>
            )}
          </div>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1">
            {price > 0 && (
              <span className="text-[14px] font-semibold text-neutral-950">
                N${price.toLocaleString()}
                <span className="text-neutral-400 font-normal">/mo</span>
              </span>
            )}
            {beds > 0 && (
              <span className="flex items-center gap-1 text-[13px] text-neutral-500">
                <Bed className="h-3.5 w-3.5" strokeWidth={1.8} />
                {beds}
              </span>
            )}
            {baths > 0 && (
              <span className="flex items-center gap-1 text-[13px] text-neutral-500">
                <Bath className="h-3.5 w-3.5" strokeWidth={1.8} />
                {baths}
              </span>
            )}
            {size > 0 && (
              <span className="flex items-center gap-1 text-[13px] text-neutral-500">
                <Ruler className="h-3.5 w-3.5" strokeWidth={1.8} />
                {size}m²
              </span>
            )}
            {!price && !beds && !baths && !size && (
              <span className="text-[13px] text-neutral-400 italic">
                Tap to add details
              </span>
            )}
          </div>
        </div>
        <ChevronRight
          className="h-4 w-4 text-neutral-300 flex-shrink-0"
          strokeWidth={2}
        />
      </button>

      {/* Quick actions */}
      <div className="grid grid-cols-2 border-t border-neutral-100 divide-x divide-neutral-100">
        <button
          type="button"
          onClick={onDuplicate}
          className="flex items-center justify-center gap-2 py-3 text-[13px] font-medium text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 active:bg-neutral-100 transition-all"
        >
          <CopyPlus className="h-3.5 w-3.5" strokeWidth={2} />
          Duplicate
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="flex items-center justify-center gap-2 py-3 text-[13px] font-medium text-red-500 hover:text-red-700 hover:bg-red-50 active:bg-red-100 transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
          Remove
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function PropertyForm({
  mode = "create",
  propertyId,
  initialData,
  pageBackgroundClassName = "bg-white",
}: PropertyFormProps) {
  const router = useRouter();
  const currentUser = useQuery(api.users.currentUser);
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
  const [availableFrom, setAvailableFrom] = useState(
    initialData?.availableFrom || "",
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
  const [units, setUnits] = useState<PropertyUnitForm[]>(() => {
    if (initialData?.units?.length) {
      return initialData.units
        .filter((u) => !u?.isSynthetic)
        .map((u) =>
          toUnitForm(
            u,
            initialData?.listingType || "single_home",
            initialData?.propertyType || "apartment",
          ),
        );
    }
    return [
      createDefaultUnit(
        initialData?.listingType || "single_home",
        initialData?.propertyType || "apartment",
      ),
    ];
  });
  const [generator, setGenerator] = useState<InventoryGenerator>({
    count: "6",
    prefix:
      initialData?.listingType === "student_accommodation" ? "Room" : "Unit",
    unitType:
      initialData?.listingType === "student_accommodation"
        ? "room"
        : initialData?.propertyType || "apartment",
    occupancyMode:
      initialData?.listingType === "student_accommodation"
        ? "private_room"
        : "whole_unit",
    roomType:
      initialData?.listingType === "student_accommodation" ? "private" : "",
    priceNad: "",
    bedrooms: "1",
    bathrooms: "1",
    sizeSqm: "",
    maxOccupants:
      initialData?.listingType === "student_accommodation" ? "1" : "2",
  });

  // ── UI state ─────────────────────────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [editingUnitIndex, setEditingUnitIndex] = useState<number | null>(null);
  const [amenityCategory, setAmenityCategory] = useState<
    "all" | AmenityCategory
  >("all");
  const [showBatchGen, setShowBatchGen] = useState(false);

  // ── Computed ─────────────────────────────────────────────────────────────
  const isSingleHome = listingType === "single_home";
  const normalizedUnits = useMemo(() => {
    if (!isSingleHome) return units;
    return [
      buildSingleHomeUnit(units[0], {
        listingTitle: title,
        propertyType,
        occupancyMode,
        furnishingStatus,
        genderPolicy,
        availableFrom,
      }),
    ];
  }, [
    availableFrom,
    furnishingStatus,
    genderPolicy,
    isSingleHome,
    occupancyMode,
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

  const TOTAL_STEPS = STEPS.length;
  const stepData =
    step === 5 && isSingleHome
      ? {
          ...STEPS[step],
          label: "Pricing",
          title: "Set rent & availability",
          subtitle:
            "Single-home listings use one whole-home price instead of separate unit pricing.",
        }
      : STEPS[step];
  const editingUnit =
    editingUnitIndex !== null ? units[editingUnitIndex] : null;

  // ── Navigation ────────────────────────────────────────────────────────────
  function navigateTo(newStep: number) {
    if (newStep < 0 || newStep >= TOTAL_STEPS) return;
    setDirection(newStep > step ? "forward" : "back");
    setStep(newStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAmenityChange = (name: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name],
    );
  };

  const toggleUtility = (utility: string) => {
    setUtilitiesIncluded((prev) =>
      prev.includes(utility)
        ? prev.filter((u) => u !== utility)
        : [...prev, utility],
    );
  };

  const updateUnit = (index: number, patch: Partial<PropertyUnitForm>) => {
    setUnits((prev) =>
      prev.map((u, i) => (i === index ? { ...u, ...patch } : u)),
    );
  };

  const updateSingleHomeUnit = (
    patch: Partial<PropertyUnitForm> = {},
    overrides: Partial<SingleHomeUnitSyncOptions> = {},
  ) => {
    setUnits((prev) => [
      {
        ...buildSingleHomeUnit(prev[0], {
          listingTitle: overrides.listingTitle ?? title,
          propertyType: overrides.propertyType ?? propertyType,
          occupancyMode: overrides.occupancyMode ?? occupancyMode,
          furnishingStatus: overrides.furnishingStatus ?? furnishingStatus,
          genderPolicy: overrides.genderPolicy ?? genderPolicy,
          availableFrom: overrides.availableFrom ?? availableFrom,
        }),
        ...patch,
      },
    ]);
  };

  const addUnit = () => {
    const label = listingType === "student_accommodation" ? "Room" : "Unit";
    const newUnit = createDefaultUnit(
      listingType,
      propertyType,
      `${label} ${units.length + 1}`,
    );
    setUnits((prev) => [...prev, newUnit]);
    setEditingUnitIndex(units.length);
  };

  const duplicateUnit = (index: number) => {
    const unit = units[index];
    const dup: PropertyUnitForm = {
      ...unit,
      _id: undefined,
      title: `${unit.title} (Copy)`,
      unitCode: "",
      occupancyStatus: "vacant",
    };
    setUnits((prev) => [
      ...prev.slice(0, index + 1),
      dup,
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
    const nextOccupancyMode =
      next === "student_accommodation" ? "private_room" : "whole_unit";
    const nextFurnishingStatus =
      next === "student_accommodation" ? "furnished" : "unfurnished";

    setListingType(next);
    setOccupancyMode(nextOccupancyMode);
    setFurnishingStatus(nextFurnishingStatus);
    setEditingUnitIndex(null);
    setShowBatchGen(false);
    setGenerator((prev) => ({
      ...prev,
      prefix: next === "student_accommodation" ? "Room" : "Unit",
      unitType: next === "student_accommodation" ? "room" : propertyType,
      occupancyMode: nextOccupancyMode,
      roomType: next === "student_accommodation" ? "private" : "",
      maxOccupants: next === "student_accommodation" ? "1" : prev.maxOccupants,
    }));
    setUnits((prev) => {
      const seededPrev =
        listingType === "single_home"
          ? [
              buildSingleHomeUnit(prev[0], {
                listingTitle: title,
                propertyType,
                occupancyMode,
                furnishingStatus,
                genderPolicy,
                availableFrom,
              }),
            ]
          : prev;

      if (next === "single_home") {
        return [
          buildSingleHomeUnit(seededPrev[0], {
            listingTitle: title,
            propertyType,
            occupancyMode: nextOccupancyMode,
            furnishingStatus: nextFurnishingStatus,
            genderPolicy,
            availableFrom,
          }),
        ];
      }
      if (seededPrev.length > 0) {
        return seededPrev.map((u) => ({
          ...u,
          unitType:
            next === "student_accommodation"
              ? "room"
              : u.unitType || propertyType,
          occupancyMode:
            next === "student_accommodation"
              ? "private_room"
              : u.occupancyMode || "whole_unit",
          roomType:
            next === "student_accommodation" ? u.roomType || "private" : "",
        }));
      }
      return [createDefaultUnit(next, propertyType)];
    });
  };

  const handleGenerateBatch = () => {
    const count = Number(generator.count);
    if (!Number.isFinite(count) || count < 1 || count > 100) {
      toast.error("Choose a batch size between 1 and 100.");
      return;
    }
    if (!generator.prefix.trim()) {
      toast.error("Add a name prefix for generated units.");
      return;
    }
    if (!generator.priceNad) {
      toast.error("Set a price for the generated units.");
      return;
    }
    const batch: PropertyUnitForm[] = Array.from({ length: count }, (_, i) => ({
      ...createDefaultUnit(
        listingType,
        propertyType,
        `${generator.prefix.trim()} ${units.length + i + 1}`,
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
    setUnits((prev) => [...prev, ...batch]);
    toast.success(`Added ${count} unit${count === 1 ? "" : "s"} to inventory.`);
    setShowBatchGen(false);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (images.length === 0) {
      toast.error("Upload at least one cover photo.");
      navigateTo(1);
      return;
    }
    if (!title.trim()) {
      toast.error("Give your listing a title.");
      navigateTo(2);
      return;
    }
    if (!city.trim() || !address.trim()) {
      toast.error("Add the city and street address.");
      navigateTo(3);
      return;
    }
    if (!coordinates) {
      toast.error("Pin the exact location on the map.");
      navigateTo(3);
      return;
    }
    if (normalizedUnits.length === 0) {
      toast.error("Add at least one rentable unit.");
      navigateTo(5);
      return;
    }
    const invalidUnit = normalizedUnits.find(
      (u) => !u.title.trim() || Number(u.priceNad || 0) <= 0,
    );
    if (invalidUnit) {
      toast.error("Every unit needs a title and a price.");
      navigateTo(5);
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        listingType,
        propertyType,
        address: address.trim(),
        city: city.trim(),
        coordinates,
        occupancyMode,
        furnishingStatus,
        genderPolicy:
          listingType === "student_accommodation" ? genderPolicy : undefined,
        availableFrom: availableFrom || undefined,
        priceNad:
          summary.minPrice || Number(normalizedUnits[0]?.priceNad || 0),
        bedrooms: summary.bedrooms || undefined,
        bathrooms: summary.bathrooms || undefined,
        sizeSqm: summary.sizeSqm || undefined,
        maxOccupants: summary.maxOccupants || undefined,
        amenityNames: selectedAmenities,
        utilitiesIncluded,
        petPolicy,
        images,
        units: normalizedUnits.map((unit) => ({
          _id: unit._id,
          title: unit.title.trim(),
          unitCode: unit.unitCode.trim() || undefined,
          description: unit.description.trim() || undefined,
          unitType: unit.unitType,
          occupancyMode: unit.occupancyMode,
          roomType: unit.roomType || undefined,
          furnishingStatus: unit.furnishingStatus || undefined,
          genderPolicy:
            listingType === "student_accommodation"
              ? unit.genderPolicy || undefined
              : undefined,
          availableFrom: unit.availableFrom || undefined,
          floorLabel: unit.floorLabel.trim() || undefined,
          blockLabel: unit.blockLabel.trim() || undefined,
          priceNad: Number(unit.priceNad),
          bedrooms: numberValue(unit.bedrooms),
          bathrooms: numberValue(unit.bathrooms),
          sizeSqm: numberValue(unit.sizeSqm),
          maxOccupants: numberValue(unit.maxOccupants),
          publicationStatus: unit.publicationStatus,
          occupancyStatus: unit.occupancyStatus,
        })),
      };

      if (mode === "edit" && propertyId) {
        await updateProperty({ propertyId, ...payload });
        toast.success(
          initialData?.approvalStatus === "rejected"
            ? "Listing updated and resubmitted for review."
            : "Listing updated. The latest changes are now under review.",
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
  if (currentUser === undefined) {
    return (
      <div
        className={cn(
          "flex min-h-screen items-center justify-center",
          pageBackgroundClassName,
        )}
      >
        <Loader2 className="h-7 w-7 animate-spin text-neutral-400" />
      </div>
    );
  }

  const submitButtonLabel =
    mode === "create"
      ? "Submit for Review"
      : initialData?.approvalStatus === "rejected"
        ? "Save & Resubmit"
        : initialData?.approvalStatus === "pending"
          ? "Update for Review"
          : "Save Changes";

  const loadingButtonLabel =
    mode === "create"
      ? "Submitting..."
      : initialData?.approvalStatus === "rejected"
        ? "Resubmitting..."
        : "Saving...";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={cn("min-h-screen font-sans", pageBackgroundClassName)}>
      {/* ══════════════════════════════════════════════════════════════
                FIXED HEADER
            ══════════════════════════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="bg-white/90 backdrop-blur-2xl border-b border-neutral-200/50">
          <div className="w-full px-4 sm:px-5 lg:px-6">
            <div className="flex items-center h-14 gap-3">
              {/* Left: Cancel or Back */}
              {step === 0 ? (
                <Link href="/landlord/properties">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 active:scale-90 transition-all cursor-pointer">
                    <X className="h-4 w-4" strokeWidth={2.5} />
                  </div>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => navigateTo(step - 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 active:scale-90 transition-all"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
                </button>
              )}

              {/* Center: Label + counter */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <p className="text-[15px] font-semibold text-neutral-950 leading-none tracking-[-0.01em]">
                  {mode === "edit" ? "Edit Listing" : stepData.label}
                </p>
                <p className="mt-0.5 text-[12px] text-neutral-400 leading-none tabular-nums">
                  {step + 1} of {TOTAL_STEPS}
                </p>
              </div>

              {/* Right: Step dots */}
              <div className="flex items-center gap-1.5">
                {STEPS.map((s, i) => {
                  const accessible = mode === "edit" || i <= step;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => (accessible ? navigateTo(i) : undefined)}
                      className={cn(
                        "rounded-full transition-all duration-300",
                        i === step
                          ? "w-5 h-2 bg-neutral-950"
                          : i < step
                            ? "w-2 h-2 bg-neutral-400 cursor-pointer"
                            : mode === "edit"
                              ? "w-2 h-2 bg-neutral-300 cursor-pointer"
                              : "w-2 h-2 bg-neutral-200 cursor-default",
                      )}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Thin progress bar */}
        <div className="h-[2px] bg-neutral-100">
          <div
            className="h-full bg-neutral-900 transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════
                SCROLLABLE CONTENT
            ══════════════════════════════════════════════════════════════ */}
      <main className="pt-[60px] pb-28">
        <form onSubmit={handleSubmit} noValidate>
          {/* Animated step wrapper */}
          <div
            key={step}
            className={cn(
              "mx-auto max-w-xl px-4 pt-7 pb-4 space-y-4 animate-in fade-in duration-200",
              direction === "forward"
                ? "slide-in-from-right-4"
                : "slide-in-from-left-4",
            )}
          >
            {/* Rejected banner (edit mode) */}
            {mode === "edit" &&
              initialData?.approvalStatus === "rejected" &&
              step === 2 && (
                <div className="flex items-start gap-3 rounded-2xl bg-red-50 border border-red-100 p-4">
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[14px] font-semibold text-red-900">
                      Listing Rejected
                    </p>
                    <p className="mt-0.5 text-[13px] text-red-700 leading-relaxed">
                      {initialData.adminNotes ||
                        "Review the feedback and resubmit."}
                    </p>
                    <p className="mt-1.5 text-[12px] text-red-500 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Saving will resubmit this listing for review.
                    </p>
                  </div>
                </div>
              )}

            {/* Step hero heading */}
            <div className="pb-1">
              <h1 className="text-[1.9rem] font-bold tracking-[-0.03em] text-neutral-950 leading-[1.15]">
                {stepData.title}
              </h1>
              <p className="mt-1.5 text-[15px] text-neutral-500 leading-relaxed">
                {stepData.subtitle}
              </p>
            </div>

            {/* ─────────────────────────────────────────────────
                            STEP 0 — LISTING TYPE
                        ───────────────────────────────────────────────── */}
            {step === 0 && (
              <div className="space-y-3 pt-1">
                {LISTING_TYPES.map((type) => {
                  const Icon = type.icon;
                  const selected = listingType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setListingTypeAndSeed(type.id)}
                      className={cn(
                        "w-full flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200 active:scale-[0.98] select-none",
                        selected
                          ? "border-neutral-950 bg-neutral-950"
                          : "border-transparent bg-white hover:border-neutral-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl mt-0.5 transition-colors",
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
                      <div className="flex-1 min-w-0">
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
                      {selected && (
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center mt-0.5">
                          <Check
                            className="h-3.5 w-3.5 text-white"
                            strokeWidth={3}
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ─────────────────────────────────────────────────
                            STEP 1 — PHOTOS
                        ───────────────────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-4">
                <CardSection className="p-4">
                  <ImageUpload
                    maxImages={15}
                    onImagesChange={setImages}
                    initialImages={initialData?.images ?? []}
                  />
                </CardSection>

                {images.length === 0 && (
                  <div className="flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-100 p-4">
                    <Camera className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[14px] text-amber-800 leading-relaxed">
                      At least one photo is required before you can publish.
                    </p>
                  </div>
                )}

                {images.length > 0 && (
                  <div className="flex items-center gap-2 px-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <p className="text-[13px] text-neutral-500">
                      {images.length} photo{images.length !== 1 ? "s" : ""}{" "}
                      added
                      {images.length < 5 && " · Add more for a richer listing"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ─────────────────────────────────────────────────
                            STEP 2 — DETAILS
                        ───────────────────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Title + description */}
                <CardSection>
                  <CardRow>
                    <FieldLabel>Listing Title</FieldLabel>
                    <input
                      value={title}
                      onChange={(e) => {
                        const nextTitle = e.target.value;
                        setTitle(nextTitle);
                        if (isSingleHome) {
                          updateSingleHomeUnit({}, { listingTitle: nextTitle });
                        }
                      }}
                      placeholder={
                        listingType === "student_accommodation"
                          ? "e.g. Campus Heights Residence"
                          : "e.g. Modern studio in Klein Windhoek"
                      }
                      className="w-full text-[18px] font-medium text-neutral-950 bg-transparent outline-none placeholder:text-neutral-300 placeholder:font-normal mt-0.5"
                    />
                  </CardRow>
                  <CardRow last>
                    <FieldLabel>Description</FieldLabel>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what makes this listing stand out — the building, surroundings, and tenant experience…"
                      rows={4}
                      className="w-full text-[15px] text-neutral-950 bg-transparent outline-none resize-none placeholder:text-neutral-300 leading-relaxed mt-0.5"
                    />
                  </CardRow>
                </CardSection>

                {/* Property attributes */}
                <CardSection>
                  {listingType === "single_home" && (
                    <InlineSelectRow
                      label="Property Type"
                      value={propertyType}
                      onValueChange={(v) => {
                        setPropertyType(v);
                        setGenerator((prev) => ({ ...prev, unitType: v }));
                        if (isSingleHome) {
                          updateSingleHomeUnit({}, { propertyType: v });
                        }
                      }}
                      options={PROPERTY_TYPES.map((t) => ({
                        value: t,
                        label: PROPERTY_TYPE_LABELS[t],
                      }))}
                    />
                  )}
                  <InlineSelectRow
                    label="Occupancy Mode"
                    value={occupancyMode}
                    onValueChange={(v) => {
                      setOccupancyMode(v);
                      if (isSingleHome) {
                        updateSingleHomeUnit({}, { occupancyMode: v });
                      }
                    }}
                    options={[
                      { value: "whole_unit", label: "Whole Unit" },
                      { value: "private_room", label: "Private Room" },
                      { value: "shared_room", label: "Shared Room" },
                      { value: "bed_space", label: "Bed Space" },
                    ]}
                  />
                  <InlineSelectRow
                    label="Furnishing"
                    value={furnishingStatus}
                    onValueChange={(v) => {
                      setFurnishingStatus(v);
                      if (isSingleHome) {
                        updateSingleHomeUnit({}, { furnishingStatus: v });
                      }
                    }}
                    options={[
                      { value: "unfurnished", label: "Unfurnished" },
                      { value: "semi_furnished", label: "Semi-Furnished" },
                      { value: "furnished", label: "Furnished" },
                    ]}
                  />
                  {listingType === "student_accommodation" && (
                    <InlineSelectRow
                      label="Gender Policy"
                      value={genderPolicy}
                      onValueChange={setGenderPolicy}
                      options={[
                        { value: "mixed", label: "Mixed" },
                        { value: "male_only", label: "Male Only" },
                        { value: "female_only", label: "Female Only" },
                      ]}
                    />
                  )}
                  <CardRow
                    last
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="text-[15px] text-neutral-950">
                      Available From
                    </span>
                    <input
                      type="date"
                      value={availableFrom}
                      onChange={(e) => {
                        const nextAvailableFrom = e.target.value;
                        setAvailableFrom(nextAvailableFrom);
                        if (isSingleHome) {
                          updateSingleHomeUnit({}, {
                            availableFrom: nextAvailableFrom,
                          });
                        }
                      }}
                      className="text-[14px] font-medium text-neutral-600 bg-transparent outline-none text-right cursor-pointer"
                    />
                  </CardRow>
                </CardSection>
              </div>
            )}

            {/* ─────────────────────────────────────────────────
                            STEP 3 — LOCATION
                        ───────────────────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-4">
                {/* Address fields */}
                <CardSection>
                  <CardRow>
                    <FieldLabel>City</FieldLabel>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Windhoek"
                      className="w-full text-[17px] font-medium text-neutral-950 bg-transparent outline-none placeholder:text-neutral-300 placeholder:font-normal mt-0.5"
                    />
                  </CardRow>
                  <CardRow last>
                    <FieldLabel>Street Address</FieldLabel>
                    <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Independence Avenue"
                      className="w-full text-[17px] font-medium text-neutral-950 bg-transparent outline-none placeholder:text-neutral-300 placeholder:font-normal mt-0.5"
                    />
                  </CardRow>
                </CardSection>

                {/* Map */}
                <CardSection>
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100">
                    <MapPin
                      className="h-4 w-4 text-neutral-400 flex-shrink-0"
                      strokeWidth={2}
                    />
                    <p className="text-[15px] font-semibold text-neutral-950">
                      Pin on Map
                    </p>
                    <div className="ml-auto">
                      {coordinates ? (
                        <div className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-600">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Pinned
                        </div>
                      ) : (
                        <p className="text-[13px] text-neutral-400">
                          Drop a pin
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="h-[260px]">
                    <LocationPicker
                      initialCoordinates={coordinates}
                      onLocationChange={setCoordinates}
                      onAddressChange={setAddress}
                    />
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2.5 border-t border-neutral-100 bg-neutral-50/50">
                    <Info className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
                    <p className="text-[12px] text-neutral-400">
                      Pin the building once — all units share this location.
                    </p>
                  </div>
                </CardSection>
              </div>
            )}

            {/* ─────────────────────────────────────────────────
                            STEP 4 — FEATURES
                        ───────────────────────────────────────────────── */}
            {step === 4 && (
              <div className="space-y-4">
                {/* Amenities */}
                <CardSection>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
                    <p className="text-[15px] font-semibold text-neutral-950">
                      Amenities
                    </p>
                    {selectedAmenities.length > 0 && (
                      <span className="text-[13px] font-semibold text-neutral-950 bg-neutral-100 px-2 py-0.5 rounded-full tabular-nums">
                        {selectedAmenities.length}
                      </span>
                    )}
                  </div>

                  {/* Category filter — horizontal scroll */}
                  <div className="flex gap-2 px-4 py-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-neutral-100">
                    {AMENITY_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setAmenityCategory(cat.id)}
                        className={cn(
                          "flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150 active:scale-95 select-none",
                          amenityCategory === cat.id
                            ? "bg-neutral-950 text-white"
                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
                        )}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 flex flex-wrap gap-2">
                    {filteredAmenities.map((amenity) => (
                      <Pill
                        key={amenity.id}
                        selected={selectedAmenities.includes(amenity.name)}
                        onClick={() => handleAmenityChange(amenity.name)}
                      >
                        {amenity.name}
                      </Pill>
                    ))}
                  </div>
                </CardSection>

                {/* Utilities */}
                <CardSection>
                  <div className="px-4 py-3 border-b border-neutral-100">
                    <p className="text-[15px] font-semibold text-neutral-950">
                      Utilities Included
                    </p>
                    <p className="text-[12px] text-neutral-400 mt-0.5">
                      {"What's covered in the rent"}
                    </p>
                  </div>
                  <div className="p-4 flex flex-wrap gap-2">
                    {UTILITY_OPTIONS.map((utility) => (
                      <Pill
                        key={utility}
                        selected={utilitiesIncluded.includes(utility)}
                        onClick={() => toggleUtility(utility)}
                      >
                        {UTILITY_LABELS[utility]}
                      </Pill>
                    ))}
                  </div>
                </CardSection>

                {/* Pet policy */}
                <CardSection>
                  <div className="flex items-center gap-2.5 px-4 py-3 border-b border-neutral-100">
                    <PawPrint
                      className="h-4 w-4 text-neutral-400"
                      strokeWidth={2}
                    />
                    <p className="text-[15px] font-semibold text-neutral-950">
                      Pet Policy
                    </p>
                  </div>
                  <div className="p-4 flex flex-wrap gap-2">
                    {PET_POLICIES.map((policy) => (
                      <Pill
                        key={policy}
                        selected={petPolicy === policy}
                        onClick={() => setPetPolicy(policy)}
                      >
                        {PET_POLICY_LABELS[policy]}
                      </Pill>
                    ))}
                  </div>
                </CardSection>
              </div>
            )}

            {/* ─────────────────────────────────────────────────
                            STEP 5 — INVENTORY
                        ───────────────────────────────────────────────── */}
            {step === 5 && (
              <div className="space-y-4">
                {isSingleHome ? (
                  <>
                    <CardSection>
                      <CardRow>
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-600">
                            <Home className="h-4 w-4" strokeWidth={2} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[15px] font-semibold text-neutral-950">
                              Whole-home setup
                            </p>
                            <p className="mt-1 text-[13px] leading-5 text-neutral-500">
                              Single-home listings are treated as one rentable
                              space. Set one rent and one availability state,
                              and we&apos;ll use that across the listing and
                              lease flow.
                            </p>
                          </div>
                        </div>
                      </CardRow>
                      <CardRow last>
                        <div className="flex items-end justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <FieldLabel>Monthly Rent</FieldLabel>
                            <div className="mt-1 flex items-baseline gap-1.5">
                              <span className="text-[24px] font-bold text-neutral-400 leading-none">
                                N$
                              </span>
                              <input
                                type="number"
                                value={singleHomeUnit?.priceNad ?? ""}
                                onChange={(e) =>
                                  updateSingleHomeUnit({
                                    priceNad: e.target.value,
                                  })
                                }
                                placeholder="0"
                                className="min-w-0 flex-1 bg-transparent text-[38px] font-bold leading-none text-neutral-950 outline-none placeholder:text-neutral-200 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                              />
                              <span className="self-end pb-0.5 text-[18px] font-medium text-neutral-400">
                                /mo
                              </span>
                            </div>
                          </div>
                          <div className="rounded-2xl bg-neutral-100 px-3 py-2 text-right">
                            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400">
                              Listing
                            </p>
                            <p className="mt-1 text-[14px] font-semibold text-neutral-950">
                              {getPropertyTypeLabel(propertyType)}
                            </p>
                          </div>
                        </div>
                      </CardRow>
                    </CardSection>

                    <CardSection>
                      <NumberStepperRow
                        label="Bedrooms"
                        value={singleHomeUnit?.bedrooms ?? ""}
                        onChange={(v) => updateSingleHomeUnit({ bedrooms: v })}
                        max={10}
                      />
                      <NumberStepperRow
                        label="Bathrooms"
                        value={singleHomeUnit?.bathrooms ?? ""}
                        onChange={(v) => updateSingleHomeUnit({ bathrooms: v })}
                        max={10}
                      />
                      <NumberStepperRow
                        label="Max Occupants"
                        sublabel="People allowed to live here"
                        value={singleHomeUnit?.maxOccupants ?? ""}
                        onChange={(v) =>
                          updateSingleHomeUnit({ maxOccupants: v })
                        }
                        min={1}
                        max={20}
                        last
                      />
                    </CardSection>

                    <CardSection>
                      <CardRow className="flex items-center justify-between gap-4">
                        <span className="text-[15px] text-neutral-950">
                          Size (m²)
                        </span>
                        <input
                          type="number"
                          value={singleHomeUnit?.sizeSqm ?? ""}
                          onChange={(e) =>
                            updateSingleHomeUnit({ sizeSqm: e.target.value })
                          }
                          placeholder="—"
                          className="w-24 bg-transparent text-right text-[15px] font-semibold text-neutral-950 outline-none placeholder:text-neutral-300 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                      </CardRow>
                      <CardRow className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[15px] text-neutral-950">
                            Public visibility
                          </p>
                          <p className="mt-0.5 text-[12px] text-neutral-400">
                            Show this home whenever the listing is live
                          </p>
                        </div>
                        <Switch
                          checked={
                            singleHomeUnit?.publicationStatus === "published"
                          }
                          onCheckedChange={(checked) =>
                            updateSingleHomeUnit({
                              publicationStatus: checked
                                ? "published"
                                : "unpublished",
                            })
                          }
                        />
                      </CardRow>
                      <InlineSelectRow
                        label="Occupancy Status"
                        value={singleHomeUnit?.occupancyStatus ?? "vacant"}
                        onValueChange={(v) =>
                          updateSingleHomeUnit({
                            occupancyStatus: v as OccupancyStatus,
                          })
                        }
                        options={[
                          { value: "vacant", label: "Vacant" },
                          { value: "reserved", label: "Reserved" },
                          { value: "occupied", label: "Occupied" },
                          { value: "unavailable", label: "Unavailable" },
                        ]}
                        last
                      />
                    </CardSection>

                    {Number(singleHomeUnit?.priceNad || 0) <= 0 && (
                      <div className="flex items-center gap-2.5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                        <Info className="h-4 w-4 flex-shrink-0 text-amber-600" />
                        <p className="text-[13px] text-amber-800">
                          Add the rent for this home before submitting the
                          listing.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {units.length > 0 && (
                      <div className="grid grid-cols-3 gap-2.5">
                        {[
                          { label: "Units", value: String(units.length) },
                          {
                            label: "From",
                            value:
                              summary.minPrice > 0
                                ? `N$${summary.minPrice.toLocaleString()}`
                                : "—",
                          },
                          {
                            label: "Up to",
                            value:
                              summary.maxPrice > summary.minPrice
                                ? `N$${summary.maxPrice.toLocaleString()}`
                                : summary.minPrice > 0
                                  ? `N$${summary.minPrice.toLocaleString()}`
                                  : "—",
                          },
                        ].map((stat) => (
                          <div
                            key={stat.label}
                            className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-3.5 text-center"
                          >
                            <p className="text-[19px] font-bold text-neutral-950 tracking-[-0.02em] leading-none truncate">
                              {stat.value}
                            </p>
                            <p className="mt-1 text-[12px] text-neutral-400 font-medium">
                              {stat.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    <CardSection>
                      <button
                        type="button"
                        onClick={() => setShowBatchGen(!showBatchGen)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-neutral-50 active:bg-neutral-100 transition-colors"
                      >
                        <div className="h-9 w-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                          <Sparkles
                            className="h-4 w-4 text-violet-600"
                            strokeWidth={2}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-semibold text-neutral-950">
                            Bulk Add Units
                          </p>
                          <p className="text-[12px] text-neutral-400">
                            Generate identical units in one tap
                          </p>
                        </div>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 text-neutral-400 flex-shrink-0 transition-transform duration-200",
                            showBatchGen && "rotate-90",
                          )}
                          strokeWidth={2}
                        />
                      </button>

                      {showBatchGen && (
                        <div className="border-t border-neutral-100 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              {
                                label: "Count",
                                key: "count" as const,
                                type: "number",
                                placeholder: "6",
                              },
                              {
                                label: "Prefix",
                                key: "prefix" as const,
                                type: "text",
                                placeholder: "Unit",
                              },
                              {
                                label: "Price (N$)",
                                key: "priceNad" as const,
                                type: "number",
                                placeholder: "0",
                              },
                              {
                                label: "Bedrooms",
                                key: "bedrooms" as const,
                                type: "number",
                                placeholder: "1",
                              },
                              {
                                label: "Bathrooms",
                                key: "bathrooms" as const,
                                type: "number",
                                placeholder: "1",
                              },
                              {
                                label: "Size (m²)",
                                key: "sizeSqm" as const,
                                type: "number",
                                placeholder: "—",
                              },
                            ].map((field) => (
                              <div key={field.key}>
                                <FieldLabel>{field.label}</FieldLabel>
                                <input
                                  type={field.type}
                                  value={generator[field.key]}
                                  onChange={(e) =>
                                    setGenerator((prev) => ({
                                      ...prev,
                                      [field.key]: e.target.value,
                                    }))
                                  }
                                  placeholder={field.placeholder}
                                  className="w-full h-11 px-3 rounded-xl border border-neutral-200 bg-neutral-50 text-[15px] font-medium text-neutral-950 outline-none focus:border-neutral-400 focus:bg-white transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={handleGenerateBatch}
                            className="w-full h-11 rounded-xl bg-violet-600 text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-violet-700 active:scale-[0.98] transition-all"
                          >
                            <Zap className="h-4 w-4" strokeWidth={2.5} />
                            Generate {generator.count || "0"} Units
                          </button>
                        </div>
                      )}
                    </CardSection>

                    <button
                      type="button"
                      onClick={addUnit}
                      className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl border-2 border-dashed border-neutral-300 bg-white/60 text-neutral-500 font-semibold text-[15px] hover:border-neutral-400 hover:bg-white hover:text-neutral-700 active:scale-[0.98] transition-all"
                    >
                      <Plus className="h-5 w-5" strokeWidth={2.5} />
                      Add Unit
                    </button>

                    {units.length > 0 ? (
                      <div className="space-y-3">
                        {units.map((unit, index) => (
                          <UnitCard
                            key={`${unit._id ?? "new"}-${index}`}
                            unit={unit}
                            index={index}
                            onEdit={() => setEditingUnitIndex(index)}
                            onDuplicate={() => duplicateUnit(index)}
                            onRemove={() => removeUnit(index)}
                          />
                        ))}
                      </div>
                    ) : (
                      <CardSection className="p-8 text-center">
                        <div className="h-14 w-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                          <Home
                            className="h-6 w-6 text-neutral-400"
                            strokeWidth={1.5}
                          />
                        </div>
                        <p className="text-[15px] font-semibold text-neutral-950">
                          No units yet
                        </p>
                        <p className="mt-1 text-[14px] text-neutral-400">
                          Tap &ldquo;Add Unit&rdquo; to create your first
                          rentable space.
                        </p>
                      </CardSection>
                    )}

                    {units.length > 0 &&
                      units.some(
                        (u) => !u.priceNad || Number(u.priceNad) <= 0,
                      ) && (
                        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100">
                          <Info className="h-4 w-4 text-amber-600 flex-shrink-0" />
                          <p className="text-[13px] text-amber-800">
                            Some units are missing a price. Tap to edit.
                          </p>
                        </div>
                      )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════
                        FIXED BOTTOM NAVIGATION
                    ══════════════════════════════════════════════════════ */}
          <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-2xl border-t border-neutral-200/50 px-4 py-3 pointer-events-auto">
              <div className="mx-auto max-w-xl flex gap-3">
                {/* Left: Cancel or Back */}
                {step === 0 ? (
                  <Link href="/landlord/properties" className="flex-1">
                    <div className="w-full h-12 rounded-2xl bg-neutral-100 text-neutral-600 font-semibold text-[15px] flex items-center justify-center hover:bg-neutral-200 active:scale-[0.97] transition-all cursor-pointer select-none">
                      Cancel
                    </div>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigateTo(step - 1)}
                    className="flex-1 h-12 rounded-2xl bg-neutral-100 text-neutral-700 font-semibold text-[15px] flex items-center justify-center gap-2 hover:bg-neutral-200 active:scale-[0.97] transition-all"
                  >
                    <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
                    Back
                  </button>
                )}

                {/* Right: Continue or Publish */}
                {step < TOTAL_STEPS - 1 ? (
                  <button
                    type="button"
                    onClick={() => navigateTo(step + 1)}
                    className="flex-[2] h-12 rounded-2xl bg-neutral-950 text-white font-semibold text-[15px] flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.97] transition-all"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-[2] h-12 rounded-2xl bg-neutral-950 text-white font-semibold text-[15px] flex items-center justify-center gap-2 hover:bg-neutral-800 disabled:opacity-60 active:scale-[0.97] transition-all"
                  >
                    {isLoading && (
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        strokeWidth={3}
                      />
                    )}
                    {isLoading ? loadingButtonLabel : submitButtonLabel}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </main>

      {/* ══════════════════════════════════════════════════════════════
                UNIT EDITOR BOTTOM SHEET
            ══════════════════════════════════════════════════════════════ */}
      <Sheet
        open={editingUnitIndex !== null}
        onOpenChange={(open) => !open && setEditingUnitIndex(null)}
      >
        <SheetContent
          side="bottom"
          className="h-[93vh] rounded-t-[28px] border-0 p-0 flex flex-col bg-white overflow-hidden focus:outline-none"
        >
          {editingUnit !== null && editingUnitIndex !== null && (
            <>
              <SheetTitle className="sr-only">
                {editingUnit.title || `Unit ${editingUnitIndex + 1}`} editor
              </SheetTitle>

              {/* Drag handle */}
              <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
                <div className="w-9 h-1 rounded-full bg-neutral-300" />
              </div>

              {/* Sheet header */}
              <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-white">
                <button
                  type="button"
                  onClick={() => setEditingUnitIndex(null)}
                  className="text-[15px] font-medium text-neutral-500 hover:text-neutral-700 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <div className="text-center">
                  <p className="text-[16px] font-semibold text-neutral-950 leading-none">
                    {editingUnit.title || `Unit ${editingUnitIndex + 1}`}
                  </p>
                  <p className="mt-0.5 text-[12px] text-neutral-400">
                    Edit unit
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingUnitIndex(null)}
                  className="text-[15px] font-semibold text-neutral-950 hover:text-neutral-700 active:scale-95 transition-all"
                >
                  Done
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-6">
                {/* Identity */}
                <CardSection>
                  <CardRow>
                    <FieldLabel>Unit Name</FieldLabel>
                    <input
                      value={editingUnit.title}
                      onChange={(e) =>
                        updateUnit(editingUnitIndex, { title: e.target.value })
                      }
                      placeholder="e.g. Studio A or Room 12"
                      className="w-full text-[17px] font-medium text-neutral-950 bg-transparent outline-none placeholder:text-neutral-300 placeholder:font-normal mt-0.5"
                    />
                  </CardRow>
                  <CardRow last>
                    <FieldLabel>Unit Code</FieldLabel>
                    <input
                      value={editingUnit.unitCode}
                      onChange={(e) =>
                        updateUnit(editingUnitIndex, {
                          unitCode: e.target.value,
                        })
                      }
                      placeholder="A-101"
                      className="w-full text-[16px] font-mono font-medium text-neutral-950 bg-transparent outline-none placeholder:text-neutral-300 mt-0.5"
                    />
                  </CardRow>
                </CardSection>

                {/* Price — hero input */}
                <CardSection>
                  <CardRow last>
                    <FieldLabel>Monthly Rent</FieldLabel>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-[24px] font-bold text-neutral-400 leading-none">
                        N$
                      </span>
                      <input
                        type="number"
                        value={editingUnit.priceNad}
                        onChange={(e) =>
                          updateUnit(editingUnitIndex, {
                            priceNad: e.target.value,
                          })
                        }
                        placeholder="0"
                        className="flex-1 text-[38px] font-bold text-neutral-950 bg-transparent outline-none placeholder:text-neutral-200 min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none leading-none"
                      />
                      <span className="text-[18px] text-neutral-400 font-medium self-end pb-0.5">
                        /mo
                      </span>
                    </div>
                  </CardRow>
                </CardSection>

                {/* Room specs — steppers */}
                <CardSection>
                  <NumberStepperRow
                    label="Bedrooms"
                    value={editingUnit.bedrooms}
                    onChange={(v) =>
                      updateUnit(editingUnitIndex, { bedrooms: v })
                    }
                    max={10}
                  />
                  <NumberStepperRow
                    label="Bathrooms"
                    value={editingUnit.bathrooms}
                    onChange={(v) =>
                      updateUnit(editingUnitIndex, { bathrooms: v })
                    }
                    max={10}
                  />
                  <NumberStepperRow
                    label="Max Occupants"
                    sublabel="People allowed to live here"
                    value={editingUnit.maxOccupants}
                    onChange={(v) =>
                      updateUnit(editingUnitIndex, { maxOccupants: v })
                    }
                    min={1}
                    max={20}
                    last
                  />
                </CardSection>

                {/* Size + availability */}
                <CardSection>
                  <CardRow className="flex items-center justify-between gap-4">
                    <span className="text-[15px] text-neutral-950">
                      Size (m²)
                    </span>
                    <input
                      type="number"
                      value={editingUnit.sizeSqm}
                      onChange={(e) =>
                        updateUnit(editingUnitIndex, {
                          sizeSqm: e.target.value,
                        })
                      }
                      placeholder="—"
                      className="w-24 text-right text-[15px] font-semibold text-neutral-950 bg-transparent outline-none placeholder:text-neutral-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </CardRow>
                  <CardRow
                    last
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="text-[15px] text-neutral-950">
                      Available From
                    </span>
                    <input
                      type="date"
                      value={editingUnit.availableFrom}
                      onChange={(e) =>
                        updateUnit(editingUnitIndex, {
                          availableFrom: e.target.value,
                        })
                      }
                      className="text-[14px] font-medium text-neutral-600 bg-transparent outline-none text-right cursor-pointer"
                    />
                  </CardRow>
                </CardSection>

                {/* Location labels */}
                <CardSection>
                  <CardRow className="flex items-center justify-between gap-4">
                    <span className="text-[15px] text-neutral-950">
                      Block / Wing
                    </span>
                    <input
                      value={editingUnit.blockLabel}
                      onChange={(e) =>
                        updateUnit(editingUnitIndex, {
                          blockLabel: e.target.value,
                        })
                      }
                      placeholder="North Wing"
                      className="w-36 text-right text-[14px] font-medium text-neutral-600 bg-transparent outline-none placeholder:text-neutral-300"
                    />
                  </CardRow>
                  <CardRow
                    last
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="text-[15px] text-neutral-950">Floor</span>
                    <input
                      value={editingUnit.floorLabel}
                      onChange={(e) =>
                        updateUnit(editingUnitIndex, {
                          floorLabel: e.target.value,
                        })
                      }
                      placeholder="Floor 2"
                      className="w-36 text-right text-[14px] font-medium text-neutral-600 bg-transparent outline-none placeholder:text-neutral-300"
                    />
                  </CardRow>
                </CardSection>

                {/* Status controls */}
                <CardSection>
                  <CardRow className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[15px] text-neutral-950">Public visibility</p>
                      <p className="text-[12px] text-neutral-400 mt-0.5">
                        Include this unit whenever the property listing is live
                      </p>
                    </div>
                    <Switch
                      checked={editingUnit.publicationStatus === "published"}
                      onCheckedChange={(checked) =>
                        updateUnit(editingUnitIndex, {
                          publicationStatus: checked
                            ? "published"
                            : "unpublished",
                        })
                      }
                    />
                  </CardRow>
                  <InlineSelectRow
                    label="Occupancy Status"
                    value={editingUnit.occupancyStatus}
                    onValueChange={(v) =>
                      updateUnit(editingUnitIndex, {
                        occupancyStatus: v as OccupancyStatus,
                      })
                    }
                    options={[
                      { value: "vacant", label: "Vacant" },
                      { value: "reserved", label: "Reserved" },
                      { value: "occupied", label: "Occupied" },
                      { value: "unavailable", label: "Unavailable" },
                    ]}
                    last
                  />
                </CardSection>

                {/* Student accommodation extras */}
                {listingType === "student_accommodation" && (
                  <CardSection>
                    <InlineSelectRow
                      label="Room Type"
                      value={editingUnit.roomType || "private"}
                      onValueChange={(v) =>
                        updateUnit(editingUnitIndex, { roomType: v })
                      }
                      options={[
                        { value: "private", label: "Private" },
                        { value: "shared", label: "Shared" },
                        { value: "bed_space", label: "Bed Space" },
                      ]}
                    />
                    <InlineSelectRow
                      label="Gender Policy"
                      value={editingUnit.genderPolicy || "mixed"}
                      onValueChange={(v) =>
                        updateUnit(editingUnitIndex, { genderPolicy: v })
                      }
                      options={[
                        { value: "mixed", label: "Mixed" },
                        { value: "male_only", label: "Male Only" },
                        { value: "female_only", label: "Female Only" },
                      ]}
                      last
                    />
                  </CardSection>
                )}

                {/* Description */}
                <CardSection>
                  <CardRow last>
                    <FieldLabel>Notes / Description</FieldLabel>
                    <textarea
                      value={editingUnit.description}
                      onChange={(e) =>
                        updateUnit(editingUnitIndex, {
                          description: e.target.value,
                        })
                      }
                      placeholder="Anything unique about this unit — view, special features, recent renovation…"
                      rows={3}
                      className="w-full text-[15px] text-neutral-950 bg-transparent outline-none resize-none placeholder:text-neutral-300 leading-relaxed mt-0.5"
                    />
                  </CardRow>
                </CardSection>
              </div>

              {/* Done button */}
              <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-neutral-200/50">
                <button
                  type="button"
                  onClick={() => setEditingUnitIndex(null)}
                  className="w-full h-12 rounded-2xl bg-neutral-950 text-white font-semibold text-[15px] hover:bg-neutral-800 active:scale-[0.97] transition-all"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
