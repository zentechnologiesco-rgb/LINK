import { DISCOVER_EXPERIENCE_ENABLED } from "@/config/features"
import type { PropertyDetailData } from "./types"

export interface CachedPublicPropertyRecord {
    _id: string
    landlordId: string
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
    propertyType: string
    listingType?: PropertyDetailData["listingType"]
    unitCount?: number | null
    availableUnitCount?: number | null
    unitTypeLabels?: string[] | null
    imageUrls?: string[] | null
    videoUrls?: string[] | null
    amenityNames?: string[] | null
    commentCount?: number | null
    topLevelCommentCount?: number | null
    coordinates?: PropertyDetailData["coordinates"]
    units?: PropertyDetailData["units"] | null
    landlordInfo?: PropertyDetailData["landlord"]
}

export function toPropertyDetailData(convexProperty: CachedPublicPropertyRecord): PropertyDetailData {
    return {
        id: convexProperty._id,
        landlordId: convexProperty.landlordId,
        title: convexProperty.title,
        description: convexProperty.description || "No description available",
        price: convexProperty.minPriceNad ?? convexProperty.priceNad,
        maxPrice: convexProperty.maxPriceNad ?? convexProperty.priceNad,
        address: convexProperty.address,
        city: convexProperty.city,
        bedrooms: convexProperty.bedrooms || 0,
        bathrooms: convexProperty.bathrooms || 0,
        size: convexProperty.sizeSqm || 0,
        type: convexProperty.propertyType,
        listingType: convexProperty.listingType,
        unitCount: convexProperty.unitCount ?? 1,
        availableUnitCount: convexProperty.availableUnitCount ?? 0,
        unitTypeLabels: convexProperty.unitTypeLabels || [],
        images: convexProperty.imageUrls?.length ? convexProperty.imageUrls : ["/window.svg"],
        videoUrls: DISCOVER_EXPERIENCE_ENABLED ? convexProperty.videoUrls || [] : [],
        amenities: convexProperty.amenityNames || [],
        commentCount: convexProperty.commentCount ?? 0,
        topLevelCommentCount: convexProperty.topLevelCommentCount ?? 0,
        coordinates: convexProperty.coordinates || null,
        units: convexProperty.units || [],
        landlord: convexProperty.landlordInfo || null,
    }
}
