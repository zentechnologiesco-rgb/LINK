import {
    AirVent,
    Car,
    CheckCircle2,
    Dog,
    Droplets,
    Dumbbell,
    Eye,
    Fence,
    Flame,
    Lock,
    ParkingCircle,
    Refrigerator,
    Sun,
    Trees,
    Tv,
    Waves,
    Wifi,
    Wind,
    type LucideIcon,
} from "@/components/ui/icons"

import type { PropertyDetailData } from "./types"

const AMENITY_ICONS: Record<string, LucideIcon> = {
    wifi: Wifi,
    "wi-fi": Wifi,
    internet: Wifi,
    parking: ParkingCircle,
    "covered parking": ParkingCircle,
    "garage parking": Car,
    pool: Waves,
    "swimming pool": Waves,
    gym: Dumbbell,
    "fitness center": Dumbbell,
    security: Lock,
    "24/7 security": Lock,
    "air conditioning": AirVent,
    "air-conditioning": AirVent,
    ac: AirVent,
    tv: Tv,
    television: Tv,
    fridge: Refrigerator,
    refrigerator: Refrigerator,
    stove: Flame,
    oven: Flame,
    garden: Trees,
    backyard: Trees,
    "pet friendly": Dog,
    "pets allowed": Dog,
    laundry: Wind,
    "washing machine": Wind,
    "hot water": Droplets,
    geyser: Droplets,
    balcony: Sun,
    patio: Sun,
    view: Eye,
    "ocean view": Eye,
    fence: Fence,
    "boundary wall": Fence,
    "ceiling fan": Wind,
    fan: Wind,
}

export function getAmenityIcon(amenity: string): LucideIcon {
    const lowerAmenity = amenity.toLowerCase().trim()

    for (const [key, icon] of Object.entries(AMENITY_ICONS)) {
        if (lowerAmenity.includes(key)) {
            return icon
        }
    }

    return CheckCircle2
}

export function formatCurrency(value: number) {
    return `N$${value.toLocaleString()}`
}

export function isMultiUnitListing(property: Pick<PropertyDetailData, "listingType" | "unitCount">) {
    return (
        property.unitCount > 1 ||
        property.listingType === "multi_unit_block" ||
        property.listingType === "student_accommodation"
    )
}

export function getAvailableInventoryCount(property: Pick<PropertyDetailData, "availableUnitCount" | "units">) {
    return property.availableUnitCount ?? property.units.filter((unit) => unit.occupancyStatus === "vacant" || unit.isAvailable).length
}

export function getPriceHeading(property: Pick<PropertyDetailData, "price" | "listingType" | "unitCount">) {
    return isMultiUnitListing(property) ? `From ${formatCurrency(property.price)}` : formatCurrency(property.price)
}

export function getPropertyEditHref(propertyId: string) {
    return `/landlord/properties/${propertyId}/edit`
}

export function getLandlordDisplayName(property: Pick<PropertyDetailData, "landlord">) {
    return property.landlord?.name || property.landlord?.email || "Property Owner"
}

export function getPropertyTypeLabel(propertyType: string) {
    return propertyType
        .split(/[_-]/)
        .filter(Boolean)
        .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
        .join(" ")
}

export function getAvailabilityMeta(occupancyStatus?: string) {
    switch (occupancyStatus) {
        case "vacant":
            return {
                isAvailable: true,
                label: "Available",
                className: "bg-emerald-50 text-emerald-700",
            }
        case "reserved":
            return {
                isAvailable: false,
                label: "Reserved",
                className: "bg-amber-50 text-amber-700",
            }
        case "occupied":
            return {
                isAvailable: false,
                label: "Occupied",
                className: "bg-neutral-900 text-white",
            }
        default:
            return {
                isAvailable: false,
                label: "Unavailable",
                className: "bg-neutral-100 text-neutral-500",
            }
    }
}
