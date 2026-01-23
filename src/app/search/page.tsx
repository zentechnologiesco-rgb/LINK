"use client"

import { SearchPageClient } from './SearchPageClient'
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"

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

export default function SearchPage() {
    const properties = useQuery(api.properties.list, { onlyAvailable: true })

    if (properties === undefined) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-lime-500/20 border-t-lime-500 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading properties...</p>
                </div>
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
