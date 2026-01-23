'use client'

import { PropertyCard } from '@/components/properties/PropertyCard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Heart, Search } from 'lucide-react'
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"

export default function SavedPropertiesPage() {
    const savedProperties = useQuery(api.savedProperties.list)

    if (savedProperties === undefined) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-lime-500/20 border-t-lime-500 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading saved properties...</p>
                </div>
            </div>
        )
    }

    if (!savedProperties || savedProperties.length === 0) {
        return (
            <div className="px-6 py-6">
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-foreground">Saved Properties</h1>
                    <p className="text-muted-foreground mt-1">Your collection of favorite homes</p>
                </div>

                <div className="flex flex-col items-center justify-center py-16 px-8 text-center rounded-xl bg-sidebar-accent/30">
                    <div className="h-16 w-16 rounded-2xl bg-sidebar-accent flex items-center justify-center mb-4">
                        <Heart className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No saved properties yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                        Start exploring and save properties you're interested in to easily find them later.
                    </p>
                    <Link href="/search">
                        <Button className="bg-lime-500 hover:bg-lime-600 text-white rounded-lg h-11 px-5 font-medium shadow-lg shadow-lime-500/20">
                            <Search className="mr-2 h-4 w-4" />
                            Browse Properties
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="px-6 py-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Saved Properties</h1>
                    <p className="text-muted-foreground mt-1">
                        {savedProperties.length} {savedProperties.length === 1 ? 'property' : 'properties'} saved
                    </p>
                </div>
                <Link href="/search">
                    <Button variant="outline" className="rounded-lg h-10">
                        <Search className="mr-2 h-4 w-4" />
                        Find More
                    </Button>
                </Link>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
