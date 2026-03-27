export interface PropertyDetailUnit {
    _id: string | null
    title: string
    unitCode?: string
    unitType?: string
    occupancyMode?: string
    roomType?: string
    priceNad: number
    bedrooms?: number
    bathrooms?: number
    sizeSqm?: number
    maxOccupants?: number
    imageUrls?: string[]
    publicationStatus?: string
    occupancyStatus?: string
    isAvailable?: boolean
}

export interface PropertyDetailData {
    id: string
    landlordId: string
    title: string
    description: string
    price: number
    maxPrice?: number
    address: string
    city: string
    bedrooms: number
    bathrooms: number
    size: number
    type: string
    listingType?: "single_home" | "multi_unit_block" | "student_accommodation"
    unitCount: number
    availableUnitCount: number
    unitTypeLabels: string[]
    images: string[]
    amenities: string[]
    coordinates?: { lat: number; lng: number } | null
    units: PropertyDetailUnit[]
    landlord?: {
        name: string | null
        email?: string | null
        phone: string | null
        avatarUrl?: string | null
    } | null
}
