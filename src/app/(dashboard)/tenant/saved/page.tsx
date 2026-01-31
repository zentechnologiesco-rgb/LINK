"use client"

import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { TrustCard } from "@/components/properties/TrustCard"
import { Button } from "@/components/ui/button"
import { Search, Heart } from "lucide-react"
import Link from "next/link"

export default function SavedPropertiesPage() {
    const savedProperties = useQuery(api.savedProperties.list)

    if (savedProperties === undefined) {
        return (
            <div className="h-[50vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        )
    }

    // Normalize Data
    const normalizedProperties = savedProperties.map((p) => ({
        id: p._id,
        title: p.title,
        price: p.priceNad,
        address: p.address,
        city: p.city || "",
        bedrooms: p.bedrooms ?? 0,
        bathrooms: p.bathrooms ?? 0,
        size: p.sizeSqm ?? 0,
        type: p.propertyType,
        images: p.mainImage ? [p.mainImage] : [],
        amenities: p.amenityNames || [],
        description: p.description,
        coordinates: null
    }))

    return (
        <div className="font-sans text-neutral-900">
            {/* Minimal Hero Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10 mb-6 md:mb-12 border-b border-neutral-100 pb-6 md:pb-12">
                <div className="max-w-2xl w-full">
                    <div className="inline-flex items-center gap-2 mb-3 sm:mb-6 px-2.5 sm:px-3 py-1 rounded-full bg-neutral-100/80 border border-neutral-200/60">
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-mono text-neutral-600 uppercase tracking-widest font-medium">Personal Collection</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold tracking-tight text-neutral-900 mb-3 sm:mb-6 leading-[1.1]">
                        Saved Properties.
                    </h1>
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-neutral-500 leading-relaxed font-light max-w-lg">
                        Your curated list of potential homes. Track, compare, and apply when you're ready.
                    </p>
                </div>

                {/* Action Button */}
                <div className="w-full md:w-auto shrink-0">
                    <Link href="/">
                        <Button className="w-full md:w-auto h-12 sm:h-14 px-6 sm:px-8 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold text-sm sm:text-base tracking-wide shadow-lg shadow-neutral-900/10 transition-all hover:scale-[1.01]">
                            <Search className="w-4 h-4 mr-2" />
                            Browse More
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[300px] sm:min-h-[500px]">
                {normalizedProperties.length > 0 ? (
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                        {normalizedProperties.map((property) => (
                            <TrustCard key={property.id} property={property} />
                        ))}
                    </div>
                ) : (
                    <div className="py-16 sm:py-24 md:py-32 flex flex-col items-center justify-center text-center opacity-60 px-4">
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4 sm:mb-6">
                            <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-neutral-400" />
                        </div>
                        <h3 className="text-base sm:text-lg font-medium text-neutral-900">No saved properties</h3>
                        <p className="text-xs sm:text-sm text-neutral-500 max-w-xs mx-auto mb-6">
                            Start exploring and save properties you're interested in to simplify your search.
                        </p>
                        <Link href="/">
                            <Button variant="outline" className="border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-900">
                                Discover Properties
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
