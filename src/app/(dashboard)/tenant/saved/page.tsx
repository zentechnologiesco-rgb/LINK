"use client"

import { useState, useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { TrustCard } from "@/components/properties/TrustCard"
import { cn } from "@/lib/utils"
import {
    Search,
    Heart,
    ArrowUpDown,
} from "lucide-react"
import Link from "next/link"

const SORT_OPTIONS = [
    { id: 'newest', label: 'Recently Saved' },
    { id: 'price-low', label: 'Price: Low to High' },
    { id: 'price-high', label: 'Price: High to Low' },
]

export default function SavedPropertiesPage() {
    const savedProperties = useQuery(api.savedProperties.list)
    const [sortBy, setSortBy] = useState("newest")
    const [showSortMenu, setShowSortMenu] = useState(false)

    // Normalize Data
    const normalizedProperties = useMemo(() => {
        if (!savedProperties) return []
        return savedProperties.map((p) => ({
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
    }, [savedProperties])

    // Sort logic
    const sortedProperties = useMemo(() => {
        let result = [...normalizedProperties]

        switch (sortBy) {
            case 'price-low':
                result.sort((a, b) => a.price - b.price)
                break
            case 'price-high':
                result.sort((a, b) => b.price - a.price)
                break
            default:
                break
        }

        return result
    }, [normalizedProperties, sortBy])

    if (savedProperties === undefined) {
        return (
            <div className="font-sans text-neutral-900">
                {/* Controls Skeleton */}
                <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-100">
                    <div className="h-4 w-20 bg-neutral-100 rounded animate-pulse" />
                    <div className="h-9 w-24 bg-neutral-100 rounded-lg animate-pulse" />
                </div>

                {/* Grid Skeleton */}
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-neutral-200/80 overflow-hidden">
                            <div className="aspect-[4/3] bg-neutral-100 animate-pulse" />
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-neutral-100 rounded animate-pulse w-3/4" />
                                <div className="h-3 bg-neutral-100 rounded animate-pulse w-1/2" />
                                <div className="h-5 bg-neutral-100 rounded animate-pulse w-1/3 mt-4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="font-sans text-neutral-900">
            {/* Controls Bar */}
            {normalizedProperties.length > 0 && (
                <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-100">
                    {/* Results Count */}
                    <p className="text-xs text-neutral-500">
                        {sortedProperties.length} {sortedProperties.length === 1 ? 'saved' : 'saved'}
                    </p>

                    {/* Sort Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSortMenu(!showSortMenu)}
                            className={cn(
                                "flex items-center gap-2 h-9 px-3 rounded-lg text-xs font-medium border transition-all",
                                showSortMenu
                                    ? "bg-neutral-900 text-white border-neutral-900"
                                    : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300"
                            )}
                        >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                                {SORT_OPTIONS.find(o => o.id === sortBy)?.label}
                            </span>
                            <span className="sm:hidden">Sort</span>
                        </button>

                        {showSortMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowSortMenu(false)}
                                />
                                <div className="absolute right-0 top-full mt-1.5 py-1 w-44 bg-white rounded-lg border border-neutral-200 shadow-lg z-50">
                                    {SORT_OPTIONS.map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => {
                                                setSortBy(option.id)
                                                setShowSortMenu(false)
                                            }}
                                            className={cn(
                                                "w-full text-left px-3 py-2 text-sm transition-colors",
                                                sortBy === option.id
                                                    ? "bg-neutral-100 text-neutral-900 font-medium"
                                                    : "text-neutral-600 hover:bg-neutral-50"
                                            )}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className="min-h-[300px]">
                {sortedProperties.length > 0 ? (
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                        {sortedProperties.map((property) => (
                            <TrustCard key={property.id} property={property} />
                        ))}
                    </div>
                ) : (
                    // Empty state
                    <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                        <div className="h-14 w-14 rounded-xl bg-neutral-100 flex items-center justify-center mb-5">
                            <Heart className="h-6 w-6 text-neutral-400" />
                        </div>

                        <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                            No saved properties yet
                        </h3>
                        <p className="text-sm text-neutral-500 max-w-xs mb-6">
                            Save properties you like by tapping the heart icon. They will appear here.
                        </p>

                        <Link href="/">
                            <button className="h-10 px-5 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium rounded-lg transition-colors">
                                Browse Properties
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
