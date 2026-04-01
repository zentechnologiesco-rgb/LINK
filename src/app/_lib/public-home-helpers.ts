import {
    BedDouble,
    Building,
    Building2,
    Home,
    Map as MapIcon,
    Tent,
    type LucideIcon,
} from 'lucide-react'

import type {
    PublicHomeMapProperty,
    PublicHomePriceRange,
    PublicHomeProperty,
    PublicHomeRawProperty,
} from './public-home-types'

const PROPERTY_ICON_MAP: Record<string, LucideIcon> = {
    Apartment: Building2,
    House: Home,
    Townhouse: Building,
    Room: BedDouble,
    Land: Tent,
    Other: MapIcon,
}

export function getIconForType(type: string) {
    const normalizedType = type.toLowerCase()

    if (normalizedType.includes('apartment')) return PROPERTY_ICON_MAP.Apartment
    if (normalizedType.includes('townhouse')) return PROPERTY_ICON_MAP.Townhouse
    if (normalizedType.includes('house')) return PROPERTY_ICON_MAP.House
    if (normalizedType.includes('room')) return PROPERTY_ICON_MAP.Room
    if (normalizedType.includes('land')) return PROPERTY_ICON_MAP.Land

    return PROPERTY_ICON_MAP.Other
}

export function normalizePublicHomeProperties(
    properties: PublicHomeRawProperty[] | undefined
) {
    if (!properties) return [] as PublicHomeProperty[]

    return properties.map((property) => ({
        id: property._id,
        title: property.title,
        description: property.description || '',
        price: property.minPriceNad ?? property.priceNad,
        maxPrice: property.maxPriceNad ?? property.priceNad,
        address: property.address,
        city: property.city,
        bedrooms: property.bedrooms ?? 0,
        bathrooms: property.bathrooms ?? 0,
        size: property.sizeSqm ?? 0,
        type: property.propertyType || 'House',
        images: property.imageUrls ?? [],
        amenities: property.amenityNames ?? [],
        coordinates: property.coordinates ?? null,
        landlordId: property.landlordId,
        listingType: property.listingType,
        unitCount: property.unitCount ?? undefined,
        availableUnitCount: property.availableUnitCount ?? undefined,
        unitTypeLabels: property.unitTypeLabels ?? [],
    }))
}

export function getAvailablePropertyTypes(properties: PublicHomeProperty[]) {
    const types = new Set<string>()

    properties.forEach((property) => types.add(property.type))

    return Array.from(types).sort()
}

export function filterPropertiesByType(
    properties: PublicHomeProperty[],
    selectedPropertyType: string | null
) {
    if (!selectedPropertyType) return properties

    return properties.filter((property) => property.type === selectedPropertyType)
}

export function toPublicHomeMapProperties(properties: PublicHomeProperty[]) {
    return properties
        .filter((property) => property.coordinates?.lat != null && property.coordinates?.lng != null)
        .map((property) => ({
            id: property.id,
            title: property.title,
            price_nad: property.price,
            address: property.address,
            images: property.images,
            coordinates: property.coordinates!,
        })) satisfies PublicHomeMapProperty[]
}

export function getActivePublicHomeFilterCount({
    minBedrooms,
    priceRange,
    selectedAmenities,
    selectedPropertyType,
}: {
    minBedrooms: number | null
    priceRange: PublicHomePriceRange
    selectedAmenities: string[]
    selectedPropertyType: string | null
}) {
    return (minBedrooms !== null ? 1 : 0)
        + (priceRange.min ? 1 : 0)
        + (priceRange.max ? 1 : 0)
        + selectedAmenities.length
        + (selectedPropertyType ? 1 : 0)
}
