import type { Id } from '@convex/_generated/dataModel'

export type PublicHomePriceRange = {
    min: string
    max: string
}

export interface PublicHomeRawProperty {
    _id: Id<'properties'>
    title: string
    description?: string | null
    minPriceNad?: number | null
    maxPriceNad?: number | null
    priceNad: number
    address: string
    city: string
    bedrooms?: number | null
    bathrooms?: number | null
    sizeSqm?: number | null
    propertyType?: string | null
    imageUrls?: string[] | null
    amenityNames?: string[] | null
    coordinates?: { lat: number; lng: number } | null
    landlordId?: string
    listingType?: 'single_home' | 'multi_unit_block' | 'student_accommodation'
    unitCount?: number | null
    availableUnitCount?: number | null
    unitTypeLabels?: string[] | null
}

export interface PublicHomeProperty {
    id: Id<'properties'>
    title: string
    price: number
    maxPrice?: number
    address: string
    city: string
    bedrooms: number
    bathrooms: number
    size: number
    type: string
    images: string[]
    amenities: string[]
    description: string
    coordinates?: { lat: number; lng: number } | null
    landlordId?: string
    listingType?: 'single_home' | 'multi_unit_block' | 'student_accommodation'
    unitCount?: number
    availableUnitCount?: number
    unitTypeLabels?: string[]
}

export interface PublicHomeMapProperty {
    id: Id<'properties'>
    title: string
    price_nad: number
    address: string
    images: string[]
    coordinates: { lat: number; lng: number }
}
