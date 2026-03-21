"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import Link from "next/link"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { Clock, X, ChevronRight, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { RecentlyViewedSkeleton } from "@/components/ui/skeleton"

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
        <section className="mb-8 md:mb-12 w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight capitalize">
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
                            <RecentPropertyCard
                                property={property as RecentProperty}
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

function RecentPropertyCard({
    property,
    onRemove
}: {
    property: RecentProperty
    onRemove: (id: string, e: React.MouseEvent) => void
}) {
    const timeAgo = formatDistanceToNow(new Date(property.viewedAt), { addSuffix: true })
    const imageSrc = property.imageUrls.length > 0 ? property.imageUrls[0] : '/window.svg'

    return (
        <Link
            href={`/properties/${property._id}`}
            className="group block w-full outline-none"
        >
            <div className={cn(
                "relative w-full rounded-[24px] overflow-hidden bg-neutral-100",
                "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
                "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)]",
                "hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:-translate-y-1.5"
            )}>
                {/* Image */}
                <div className="relative w-full aspect-square">
                    <OptimizedImage
                        src={imageSrc}
                        alt={property.title}
                        fill
                        aspectRatio="square"
                        qualityPreset="thumbnail"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.05]"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 z-10 pointer-events-none">
                         <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent" />
                         <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-black/95 via-black/40 to-transparent md:from-black/70 md:via-black/20 pt-[50%]" />
                    </div>

                    {/* Remove Button */}
                    <div className="absolute top-3 right-3 z-20 flex justify-end items-center pointer-events-none">
                        <button
                            onClick={(e) => onRemove(property._id, e)}
                            className="pointer-events-auto h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/10 hover:bg-white backdrop-blur border border-white/20 shadow-sm transition-all flex items-center justify-center text-white hover:text-black"
                            title="Remove from history"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Bottom Content Area */}
                    <div className="absolute inset-x-0 bottom-0 z-20 p-3 pt-24 pb-4 flex flex-col justify-end">
                        {/* Title — Extrabold, large, tight leading. Hidden on desktop (md+) inside the card. */}
                        <h3 className="md:hidden text-white text-[20px] sm:text-[22px] font-[900] leading-[1.05] tracking-[-0.02em] mb-2 drop-shadow-md line-clamp-2">
                            {property.title}
                        </h3>

                        {/* Middle row: Inline Rating & Time Ago */}
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="flex items-center gap-1.5 opacity-90">
                                <Clock className="w-[14px] h-[14px] text-white/70" />
                                <span className="text-white text-[13px] font-semibold">{timeAgo}</span>
                            </div>
                        </div>

                        {/* Bottom row: Neon Price */}
                        <div className="flex items-center justify-between mt-1">
                            <div className="flex items-baseline">
                                <span className="text-[#C4F135] text-[22px] sm:text-[24px] font-[900] leading-none tracking-[-0.03em] drop-shadow-sm">
                                    N${property.priceNad.toLocaleString()}
                                </span>
                                <span className="text-[#C4F135] text-[12px] font-bold ml-1 drop-shadow-sm">
                                    /mo
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Desktop Title — Shown only on md+ below the card */}
            <div className="hidden md:block mt-2.5 px-0.5">
                <h3 className="text-neutral-900 text-[15px] font-extrabold leading-tight tracking-tight line-clamp-1 hover:text-black transition-colors">
                    {property.title}
                </h3>
            </div>
        </Link>
    )
}
