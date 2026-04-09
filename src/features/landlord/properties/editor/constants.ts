import {
  Building2,
  Camera,
  Home,
  Info,
  MapPin,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { InventoryGenerator, ListingType } from "./types";

export const LISTING_TYPES: {
  id: ListingType;
  title: string;
  description: string;
  icon: LucideIcon;
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

export const STEPS = [
  {
    id: "type",
    label: "Type",
    title: "What are you listing?",
    subtitle: "Choose the type that best describes your property.",
  },
  {
    id: "photos",
    label: "Media",
    title: "Show it off",
    subtitle: "Photos are required. Add clear images that help renters understand the space.",
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
    subtitle:
      "Add every rentable space and choose which ones should appear when the listing goes live.",
  },
] as const;

export const EDIT_STEP_LINKS = [
  { id: "type", label: "Type", icon: Building2 },
  { id: "photos", label: "Media", icon: Camera },
  { id: "details", label: "Details", icon: Info },
  { id: "location", label: "Location", icon: MapPin },
  { id: "features", label: "Features", icon: Sparkles },
  { id: "inventory", label: "Pricing & Units", icon: Home },
] as const;

export const AMENITY_CATEGORIES = [
  { id: "all" as const, label: "All" },
  { id: "security" as const, label: "Security" },
  { id: "utilities" as const, label: "Utilities" },
  { id: "outdoor" as const, label: "Outdoor" },
  { id: "indoor" as const, label: "Indoor" },
  { id: "community" as const, label: "Community" },
];

export const OCCUPANCY_MODE_OPTIONS = [
  { value: "whole_unit", label: "Whole Unit" },
  { value: "private_room", label: "Private Room" },
  { value: "shared_room", label: "Shared Room" },
  { value: "bed_space", label: "Bed Space" },
];

export const FURNISHING_OPTIONS = [
  { value: "unfurnished", label: "Unfurnished" },
  { value: "semi_furnished", label: "Semi-Furnished" },
  { value: "furnished", label: "Furnished" },
];

export const GENDER_POLICY_OPTIONS = [
  { value: "mixed", label: "Mixed" },
  { value: "male_only", label: "Male Only" },
  { value: "female_only", label: "Female Only" },
];

export const ROOM_TYPE_OPTIONS = [
  { value: "private", label: "Private" },
  { value: "shared", label: "Shared" },
  { value: "bed_space", label: "Bed Space" },
];

export const BATCH_GENERATOR_FIELDS: Array<{
  label: string;
  key: keyof Pick<
    InventoryGenerator,
    "count" | "prefix" | "priceNad" | "bedrooms" | "bathrooms" | "sizeSqm"
  >;
  type: "number" | "text";
  placeholder: string;
}> = [
  {
    label: "Count",
    key: "count",
    type: "number",
    placeholder: "6",
  },
  {
    label: "Prefix",
    key: "prefix",
    type: "text",
    placeholder: "Unit",
  },
  {
    label: "Price (N$)",
    key: "priceNad",
    type: "number",
    placeholder: "0",
  },
  {
    label: "Bedrooms",
    key: "bedrooms",
    type: "number",
    placeholder: "1",
  },
  {
    label: "Bathrooms",
    key: "bathrooms",
    type: "number",
    placeholder: "1",
  },
  {
    label: "Size (m²)",
    key: "sizeSqm",
    type: "number",
    placeholder: "—",
  },
];
