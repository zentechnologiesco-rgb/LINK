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
                    <div className="h-10 w-10 rounded-full border-2 border-black/10 border-t-black animate-spin" />
                    <p className="text-sm text-black/60 font-medium">Loading saved properties...</p>
                </div>
            </div>
        )
    }

    if (!savedProperties || savedProperties.length === 0) {
        return (
            <div className="px-8 py-8 md:px-12 md:py-12 max-w-7xl mx-auto">


                <div className="flex flex-col items-center justify-center py-24 px-8 text-center rounded-3xl border border-dashed border-black/10 bg-gray-50/50">
                    <div className="h-20 w-20 rounded-2xl bg-white border border-black/5 flex items-center justify-center mb-6 shadow-xl shadow-black/5">
                        <Heart className="h-8 w-8 text-black/20" fill="currentColor" />
                    </div>
                    <h3 className="font-[family-name:var(--font-anton)] text-2xl text-black mb-3 tracking-wide">
                        No saved properties yet
                    </h3>
                    <p className="text-black/60 mb-8 max-w-md text-lg leading-relaxed">
                        Start exploring and save properties you're interested in to easily find them later.
                    </p>
                    <Link href="/search">
                        <Button className="bg-black hover:bg-black/80 text-white rounded-full h-14 px-8 text-lg font-medium shadow-xl shadow-black/10 transition-all hover:scale-105 active:scale-95">
                            <Search className="mr-3 h-5 w-5" />
                            Browse Properties
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="px-8 py-8 md:px-12 md:py-12 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-end mb-12">
                <Link href="/search">
                    <Button variant="outline" className="rounded-full h-12 px-6 border-black/10 hover:bg-black/5 text-black font-medium text-base transition-all hover:border-black/20">
                        <Search className="mr-2 h-4 w-4" />
                        Find More
                    </Button>
                </Link>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
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
