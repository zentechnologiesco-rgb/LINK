
"use client"

import { SearchPageClient } from './search/SearchPageClient'
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"

// Define the Property type needed for the feed
interface Property {
    id: string
    title: string
    price: number
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
}

export default function HomePage() {
    const properties = useQuery(api.properties.list, { onlyAvailable: true })

    if (properties === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-sm text-muted-foreground">Loading properties...</div>
            </div>
        )
    }

    const normalizedProperties: Property[] = (properties ?? []).map((property) => ({
        id: property._id,
        title: property.title,
        description: property.description || '',
        price: property.priceNad,
        address: property.address,
        city: property.city,
        bedrooms: property.bedrooms ?? 0,
        bathrooms: property.bathrooms ?? 0,
        size: property.sizeSqm ?? 0,
        type: property.propertyType,
        images: property.imageUrls ?? [],
        amenities: [],
        coordinates: property.coordinates ?? null,
    }))

    return <SearchPageClient initialProperties={normalizedProperties} />
}
