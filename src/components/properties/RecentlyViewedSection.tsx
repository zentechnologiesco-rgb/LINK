"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import Link from "next/link"
import Image from "next/image"
import { Clock, X, ChevronRight, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface RecentProperty {
    _id: string
    title: string
    priceNad: number
    address: string
    city: string
    bedrooms?: number
    bathrooms?: number
    sizeSqm?: number
    propertyType: string
    imageUrls: string[]
    viewedAt: number
}

export function RecentlyViewedSection() {
    const recentlyViewed = useQuery(api.recentlyViewed.list, { limit: 6 })
    const clearAll = useMutation(api.recentlyViewed.clearAll)
    const removeView = useMutation(api.recentlyViewed.removeView)

    // Don't show if not logged in or no items
    if (!recentlyViewed || recentlyViewed.length === 0) {
        return null
    }

    const handleClearAll = async () => {
        await clearAll({})
    }

    const handleRemove = async (propertyId: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        await removeView({ propertyId: propertyId as any })
    }

    return (
        <section className="mb-8 md:mb-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-neutral-100">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-600" />
                    </div>
                    <div>
                        <h2 className="text-sm sm:text-base md:text-lg font-bold text-neutral-900">
                            Recently Viewed
                        </h2>
                        <p className="text-[10px] sm:text-xs text-neutral-400 font-mono">
                            {recentlyViewed.length} {recentlyViewed.length === 1 ? 'property' : 'properties'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleClearAll}
                    className="flex items-center gap-1.5 text-[10px] sm:text-xs text-neutral-400 hover:text-neutral-600 transition-colors font-medium"
                >
                    <Trash2 className="w-3 h-3" />
                    <span className="hidden xs:inline">Clear History</span>
                </button>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="relative -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0">
                <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-2">
                    {recentlyViewed.filter((p): p is NonNullable<typeof p> => p !== null).map((property) => (
                        <RecentPropertyCard
                            key={property._id}
                            property={property as RecentProperty}
                            onRemove={handleRemove}
                        />
                    ))}

                    {/* View All Link Card */}
                    {recentlyViewed.length >= 6 && (
                        <Link
                            href="/recently-viewed"
                            className="flex-shrink-0 w-[140px] sm:w-[180px] rounded-xl border border-neutral-200 bg-neutral-50 flex flex-col items-center justify-center gap-2 hover:bg-neutral-100 transition-colors group"
                        >
                            <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
                            <span className="text-xs sm:text-sm font-medium text-neutral-500 group-hover:text-neutral-700">
                                View All
                            </span>
                        </Link>
                    )}
                </div>
            </div>
        </section>
    )
}

function RecentPropertyCard({
    property,
    onRemove
}: {
    property: RecentProperty
    onRemove: (id: string, e: React.MouseEvent) => void
}) {
    const timeAgo = formatDistanceToNow(new Date(property.viewedAt), { addSuffix: true })

    return (
        <Link
            href={`/properties/${property._id}`}
            className="group flex-shrink-0 w-[160px] sm:w-[200px] md:w-[220px] rounded-xl border border-neutral-200 bg-white overflow-hidden hover:border-neutral-300 transition-all hover:shadow-sm"
        >
            {/* Image */}
            <div className="relative aspect-[4/3] bg-neutral-100">
                <Image
                    src={property.imageUrls[0] || '/window.svg'}
                    alt={property.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Remove Button */}
                <button
                    onClick={(e) => onRemove(property._id, e)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
                    title="Remove from history"
                >
                    <X className="w-3 h-3" />
                </button>

                {/* Time Badge */}
                <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-white/90 backdrop-blur text-[9px] sm:text-[10px] font-medium text-neutral-600 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {timeAgo}
                </div>
            </div>

            {/* Content */}
            <div className="p-2.5 sm:p-3">
                <h3 className="text-xs sm:text-sm font-semibold text-neutral-900 line-clamp-1 mb-0.5">
                    {property.title}
                </h3>
                <p className="text-[10px] sm:text-xs text-neutral-400 line-clamp-1 mb-2">
                    {property.address}
                </p>
                <div className="flex items-center justify-between">
                    <span className="font-mono text-xs sm:text-sm font-semibold text-neutral-900">
                        N${property.priceNad.toLocaleString()}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-neutral-400">
                        /mo
                    </span>
                </div>
            </div>
        </Link>
    )
}
