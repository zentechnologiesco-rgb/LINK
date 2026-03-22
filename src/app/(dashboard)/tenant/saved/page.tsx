"use client"

import { useState, useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { TrustCard } from "@/components/properties/TrustCard"
import { PropertyCardSkeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
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
            coordinates: null,
            landlordId: p.landlordId,
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
            <div className="font-sans text-neutral-900 w-full animate-in fade-in duration-500">
                {/* Header Skeleton */}
                <div className="flex items-end justify-between mb-8 sm:mb-10 px-2 mt-4 sm:mt-6">
                    <div className="space-y-3">
                        <div className="h-10 w-[200px] sm:w-[280px] bg-neutral-100 rounded-xl animate-pulse" />
                        <div className="h-5 w-[140px] bg-neutral-100 rounded-md animate-pulse" />
                    </div>
                    <div className="h-[42px] sm:h-[52px] w-[100px] sm:w-[160px] bg-neutral-100 rounded-full animate-pulse" />
                </div>

                {/* Grid Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 mt-6">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="w-full">
                            <PropertyCardSkeleton />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="font-sans text-neutral-900 w-full animate-in fade-in duration-500">
            {/* Controls Bar */}
            <div className="flex items-end justify-between mb-8 sm:mb-10 px-2 mt-4 sm:mt-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 mb-1.5 sm:mb-2">
                        My Favorites
                    </h1>
                    <p className="text-neutral-500 font-semibold text-[14px] sm:text-[15px]">
                        {sortedProperties.length} {sortedProperties.length === 1 ? 'saved property' : 'saved properties'}
                    </p>
                </div>

                {/* Sort Dropdown */}
                {normalizedProperties.length > 0 && (
                    <div className="relative">
                        <button
                            onClick={() => setShowSortMenu(!showSortMenu)}
                            className={cn(
                                "h-[42px] sm:h-[52px] px-4 sm:px-6 rounded-full flex items-center justify-center gap-2.5 transition-all font-bold text-[14px] sm:text-[15px] border group outline-none",
                                showSortMenu
                                    ? "bg-black text-white border-black"
                                    : "bg-white text-black border-neutral-200/80 hover:border-black/20 hover:bg-neutral-50"
                            )}
                        >
                            <ArrowUpDown className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
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
                                <div className="absolute right-0 top-full mt-2 py-2 w-[220px] bg-white rounded-2xl border border-neutral-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] z-50 overflow-hidden text-[15px] font-semibold">
                                    {SORT_OPTIONS.map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => {
                                                setSortBy(option.id)
                                                setShowSortMenu(false)
                                            }}
                                            className={cn(
                                                "w-full text-left px-5 py-3 transition-colors",
                                                sortBy === option.id
                                                    ? "bg-neutral-50 text-black font-bold"
                                                    : "text-neutral-500 hover:text-black hover:bg-neutral-50"
                                            )}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {sortedProperties.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 mt-6 pb-20">
                        {sortedProperties.map((property, idx) => (
                            <TrustCard key={property.id} property={property} priority={idx < 4} />
                        ))}
                    </div>
                ) : (
                    // Empty state (Premium design matching the feed)
                    <div className="py-24 sm:py-32 flex flex-col items-center justify-center text-center px-4 mt-6">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-50/80 flex items-center justify-center mb-6 sm:mb-8 border border-red-100 shadow-sm">
                            <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-[#FF385C]" strokeWidth={2.5} />
                        </div>

                        <h3 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-3 tracking-tight">
                            No saved properties yet
                        </h3>
                        <p className="text-neutral-500 font-medium text-[15px] sm:text-[16px] max-w-[380px] mb-8 sm:mb-10 leading-relaxed">
                            Save properties you love by tapping the heart icon. They will appear right here for easy access.
                        </p>

                        <Link href="/">
                            <button className="h-14 sm:h-[60px] px-8 sm:px-10 bg-black text-white rounded-full font-bold text-[15px] sm:text-[16px] hover:bg-neutral-800 transition-all active:scale-[0.98]">
                                Browse Properties
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
