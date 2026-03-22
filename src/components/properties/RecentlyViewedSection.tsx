"use client"

import { useCallback, type MouseEvent } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import Link from "next/link"
import { ChevronRight, Trash2 } from "lucide-react"
import { TrustCard } from "@/components/properties/TrustCard"
export function RecentlyViewedSection() {
    const recentlyViewed = useQuery(api.recentlyViewed.list, { limit: 6 })
    const clearAll = useMutation(api.recentlyViewed.clearAll)
    const removeView = useMutation(api.recentlyViewed.removeView)

    const handleRemove = useCallback(async (propertyId: Id<"properties">, e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        await removeView({ propertyId })
    }, [removeView])

    // Don't show if not logged in or no items
    if (!recentlyViewed || recentlyViewed.length === 0) {
        return null
    }

    const handleClearAll = async () => {
        await clearAll({})
    }

    return (
        <section className="mb-8 md:mb-12 w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold tracking-tight capitalize">
                        Recently Viewed
                    </h2>
                </div>
                <button
                    onClick={handleClearAll}
                    className="flex items-center gap-1.5 text-[10px] sm:text-xs text-neutral-400 hover:text-neutral-600 transition-colors font-medium"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Clear</span>
                </button>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="relative -mx-4 px-4 sm:-mx-5 sm:px-5 lg:-mx-8 lg:px-8 xl:-mx-12 xl:px-12 md:mx-0 md:px-0">
                <div className="grid grid-flow-col auto-cols-[72vw] sm:auto-cols-[200px] md:auto-cols-[195px] lg:auto-cols-[185px] xl:auto-cols-[200px] gap-3 sm:gap-4 overflow-x-auto pb-2 snap-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {recentlyViewed.filter((p): p is NonNullable<typeof p> => p !== null).map((property) => (
                        <div key={property._id} className="snap-center sm:snap-start">
                            <TrustCard
                                property={{
                                    id: property._id,
                                    title: property.title,
                                    price: property.priceNad,
                                    address: property.address,
                                    city: property.city,
                                    bedrooms: property.bedrooms ?? 0,
                                    bathrooms: property.bathrooms ?? 0,
                                    size: property.sizeSqm ?? 0,
                                    type: property.propertyType,
                                    images: property.imageUrls,
                                    amenities: [],
                                }}
                                actionType="remove"
                                onRemove={handleRemove}
                            />
                        </div>
                    ))}

                    {/* View All Link Card */}
                    {recentlyViewed.length >= 6 && (
                        <div className="snap-center sm:snap-start h-full">
                            <Link
                                href="/recently-viewed"
                                className="w-full h-full rounded-[24px] border border-neutral-200 bg-neutral-50 flex flex-col items-center justify-center gap-2 hover:bg-neutral-100 transition-colors group aspect-square"
                            >
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                    <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-black transition-colors" />
                                </div>
                                <span className="text-sm font-bold text-neutral-500 group-hover:text-black">
                                    View All
                                </span>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
