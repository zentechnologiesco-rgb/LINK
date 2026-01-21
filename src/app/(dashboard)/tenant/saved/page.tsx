'use client'

import { PropertyCard } from '@/components/properties/PropertyCard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Heart, Loader2 } from 'lucide-react'
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"

export default function SavedPropertiesPage() {
    const savedProperties = useQuery(api.savedProperties.list)

    if (savedProperties === undefined) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!savedProperties || savedProperties.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <Heart className="h-8 w-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No saved properties yet</h2>
                <p className="text-muted-foreground mb-6 max-w-sm">
                    Start exploring and save properties you're interested in to easily find them later.
                </p>
                <Button asChild>
                    <Link href="/search">Browse Properties</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Saved Properties</h1>
                <p className="text-muted-foreground">
                    Your collection of favorite homes.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {savedProperties.map((property: any) => (
                    <div key={property._id} className="h-full">
                        <PropertyCard
                            property={{
                                id: property._id,
                                title: property.title,
                                price: property.priceNad,
                                address: property.address,
                                bedrooms: property.bedrooms ?? 0,
                                bathrooms: property.bathrooms ?? 0,
                                size: property.sizeSqm ?? 0,
                                images: property.mainImage ? [property.mainImage] : [],
                                type: property.propertyType,
                                monthly_rent: property.priceNad,
                                isSaved: true
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}
