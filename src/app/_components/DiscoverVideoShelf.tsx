'use client'

import { useRef, useCallback } from 'react'
import Link from 'next/link'
import { useQuery } from 'convex/react'
import {
    Clapperboard,
    ChevronRight,
    MapPin,
    Play,
    ChevronLeft,
} from 'lucide-react'

import { api } from '@convex/_generated/api'
import { UserAvatar } from '@/components/ui/user-avatar'
import { BrowserSafeVideo } from '@/components/ui/BrowserSafeVideo'

type DiscoverShelfProperty = {
    _id: string
    landlordId: string
    title: string
    description?: string
    city: string
    address: string
    propertyType: string
    listingType?: 'single_home' | 'multi_unit_block' | 'student_accommodation'
    minPriceNad: number
    maxPriceNad?: number
    bedrooms?: number
    bathrooms?: number
    sizeSqm?: number
    imageUrls?: string[]
    videoUrl: string | null
    unitCount?: number
    availableUnitCount?: number
    unitTypeLabels?: string[]
    landlordInfo?: {
        name?: string | null
        phone?: string | null
        avatarUrl?: string | null
    } | null
}

function formatPrice(value: number) {
    return `N$${value.toLocaleString()}`
}

/* ─── Skeleton card ─── */
function ShelfCardSkeleton() {
    return (
        <div className="relative flex-shrink-0 w-[152px] sm:w-[172px] lg:w-[196px] aspect-[9/16] rounded-2xl overflow-hidden bg-neutral-100 animate-pulse">
            <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-neutral-200/80 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-1.5">
                <div className="h-4 w-16 rounded bg-neutral-200" />
                <div className="h-3 w-24 rounded bg-neutral-200" />
            </div>
        </div>
    )
}

/* ─── Individual video card ─── */
function ShelfVideoCard({
    property,
    index,
}: {
    property: DiscoverShelfProperty
    index: number
}) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const posterUrl = property.imageUrls?.[0] ?? '/window.svg'
    const priceLabel = formatPrice(property.minPriceNad)

    const handleMouseEnter = useCallback(() => {
        const video = videoRef.current
        if (!video) return
        void video.play().catch(() => {})
    }, [])

    const handleMouseLeave = useCallback(() => {
        const video = videoRef.current
        if (!video) return
        video.pause()
        video.currentTime = 0
    }, [])

    return (
        <Link
            href={`/discover?index=${index}`}
            className="group relative flex-shrink-0 w-[152px] sm:w-[172px] lg:w-[196px] aspect-[9/16] rounded-2xl overflow-hidden bg-black snap-start outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Video / Poster */}
            {property.videoUrl ? (
                <BrowserSafeVideo
                    ref={videoRef}
                    src={`${property.videoUrl}#t=0.1`}
                    posterSrc={posterUrl}
                    posterAlt={property.title}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                    containerClassName="absolute inset-0 h-full w-full"
                />
            ) : (
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                    style={{ backgroundImage: `url(${posterUrl})` }}
                />
            )}

            {/* Play indicator — top-left */}
            <div className="absolute top-2.5 left-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Play className="h-3.5 w-3.5 fill-white" />
            </div>

            {/* Landlord avatar — top-right */}
            {property.landlordInfo?.avatarUrl && (
                <div className="absolute top-2.5 right-2.5 z-10">
                    <UserAvatar
                        src={property.landlordInfo.avatarUrl}
                        name={property.landlordInfo.name ?? 'Host'}
                        className="h-7 w-7 border-[1.5px] border-white/80 shadow-sm"
                    />
                </div>
            )}

            {/* Bottom gradient + info */}
            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

            <div className="absolute bottom-0 inset-x-0 z-10 flex flex-col gap-0.5 p-3">
                {/* Price */}
                <span className="text-[15px] font-bold text-white leading-tight tracking-tight">
                    {priceLabel}
                    <span className="text-[11px] font-semibold text-white/80 ml-0.5">/mo</span>
                </span>

                {/* Location */}
                <span className="flex items-center gap-1 text-[11px] font-medium text-white/85 leading-tight line-clamp-1">
                    <MapPin className="h-3 w-3 flex-shrink-0 text-white/70" strokeWidth={2.5} />
                    {property.city}
                </span>

                {/* Property type pill */}
                <span className="mt-1 inline-flex self-start items-center rounded-md bg-white/15 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-semibold text-white/90 border border-white/10">
                    {property.propertyType || 'Home'}
                </span>
            </div>
        </Link>
    )
}

/* ─── Main Shelf ─── */
export function DiscoverVideoShelf() {
    const scrollRef = useRef<HTMLDivElement>(null)
    const properties = useQuery(api.properties.listDiscover, { limit: 12 })

    const scroll = useCallback((direction: 'left' | 'right') => {
        const container = scrollRef.current
        if (!container) return
        const scrollAmount = container.clientWidth * 0.75
        container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        })
    }, [])

    // Loading state
    if (properties === undefined) {
        return (
            <section className="w-full py-2">
                <div className="flex items-center gap-2.5 mb-4 px-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 animate-pulse" />
                    <div className="h-5 w-24 rounded bg-neutral-100 animate-pulse" />
                </div>
                <div className="flex gap-3 overflow-hidden">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <ShelfCardSkeleton key={i} />
                    ))}
                </div>
            </section>
        )
    }

    // Don't render if no discover videos
    if (!properties || properties.length === 0) {
        return null
    }

    return (
        <section id="discover-video-shelf" className="w-full py-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 shadow-sm">
                        <Clapperboard className="h-[18px] w-[18px] text-white" strokeWidth={2.2} />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-[18px] font-extrabold tracking-tight text-neutral-900 leading-tight">
                            Discover
                        </h2>
                        <p className="text-[12px] font-medium text-neutral-400 leading-tight -mt-0.5">
                            Property video tours
                        </p>
                    </div>
                </div>
                <Link
                    href="/discover"
                    className="flex items-center gap-1 text-[13px] font-semibold text-neutral-900 hover:text-neutral-600 transition-colors active:scale-[0.97] group"
                >
                    See all
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
            </div>

            {/* Scroll container with arrow buttons */}
            <div className="relative group/shelf">
                {/* Left arrow */}
                <button
                    type="button"
                    onClick={() => scroll('left')}
                    className="hidden md:flex absolute left-[-12px] top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-white border border-neutral-200 shadow-lg text-neutral-700 hover:bg-neutral-50 hover:shadow-xl transition-all opacity-0 group-hover/shelf:opacity-100 active:scale-95"
                    aria-label="Scroll left"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>

                {/* Right arrow */}
                <button
                    type="button"
                    onClick={() => scroll('right')}
                    className="hidden md:flex absolute right-[-12px] top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-white border border-neutral-200 shadow-lg text-neutral-700 hover:bg-neutral-50 hover:shadow-xl transition-all opacity-0 group-hover/shelf:opacity-100 active:scale-95"
                    aria-label="Scroll right"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>

                {/* Scrollable rail */}
                <div
                    ref={scrollRef}
                    className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-1"
                >
                    {properties.map((property, index) => (
                        <ShelfVideoCard
                            key={property._id}
                            property={property}
                            index={index}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}
