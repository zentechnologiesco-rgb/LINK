"use client"

import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Building2 } from "lucide-react"
import { PropertyCard } from "@/components/properties/PropertyCard"

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

    if (normalizedProperties.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center bg-white">
                <div className="bg-gray-50 p-6 rounded-full mb-6 relative">
                    <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-xl" />
                    <Building2 className="h-10 w-10 text-gray-900 relative z-10" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-3">
                    No properties available yet
                </h1>
                <p className="text-gray-500 max-w-md text-lg mb-8 leading-relaxed">
                    We're currently expanding our exclusive listings. check back soon for updates.
                </p>
                <div className="flex gap-4">
                    <Link href="/become-landlord">
                        <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white h-12 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                            List Your Property
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Featured Properties</h1>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {normalizedProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                ))}
            </div>
        </div>
    )
}
