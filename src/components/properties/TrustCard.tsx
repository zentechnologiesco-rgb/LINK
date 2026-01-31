"use client"

import { memo } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { SavePropertyButton } from "@/components/properties/SavePropertyButton"
import { OptimizedImage } from "@/components/ui/optimized-image"
import {
    MapPin,
    BedDouble,
    Bath,
    Maximize,
    Zap,
} from "lucide-react"

export interface TrustCardProps {
    property: {
        id: string
        title: string
        price: number
        address: string
        city: string
        bedrooms: number
        bathrooms: number
        size: number
        type: string
        images: string[]
        amenities: string[]
        description?: string
        coordinates?: { lat: number; lng: number } | null
    }
}

// Memoized TrustCard component to prevent unnecessary re-renders
// Re-renders only when property.id changes
export const TrustCard = memo(function TrustCard({ property }: TrustCardProps) {
    const images = property.images.length > 0 ? property.images : ['/window.svg']

    return (
        <Link
            href={`/properties/${property.id}`}
            className="group block"
        >
            <div className={cn(
                "h-full bg-white rounded-xl sm:rounded-2xl border border-neutral-200/80 overflow-hidden flex flex-col",
                "transition-all duration-300 ease-out",
                "hover:-translate-y-1.5 hover:shadow-xl hover:shadow-neutral-900/[0.08] hover:border-neutral-300"
            )}>
                {/* Image Section - now with optimized lazy loading */}
                <div className="relative bg-neutral-100 overflow-hidden">
                    <OptimizedImage
                        src={images[0]}
                        alt={property.title}
                        fill
                        aspectRatio="4/3"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                        fallbackSrc="/window.svg"
                    />

                    {/* Top Row: Type Badge & Save */}
                    <div className="absolute top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 flex justify-between items-start">
                        <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-black/70 backdrop-blur-sm text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white">
                            {property.type}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 transform translate-y-1 group-hover:translate-y-0 text-neutral-900">
                            <div
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                            >
                                <SavePropertyButton
                                    propertyId={property.id}
                                    className="h-7 w-7 sm:h-8 sm:w-8 bg-white/90 hover:bg-white text-neutral-700 rounded-full shadow-lg border-0"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 flex-1">
                    {/* Title */}
                    <h3 className="font-semibold text-neutral-900 text-[13px] sm:text-[15px] leading-snug group-hover:text-neutral-700 transition-colors line-clamp-1">
                        {property.title}
                    </h3>

                    {/* Location & Stats Row */}
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-neutral-500 flex-wrap">
                        <span className="flex items-center gap-0.5 sm:gap-1 text-neutral-400">
                            <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                            <span className="truncate max-w-[60px] sm:max-w-[80px]">{property.city}</span>
                        </span>
                        <span className="text-neutral-300">·</span>
                        <span className="flex items-center gap-0.5 sm:gap-1">
                            <BedDouble className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {property.bedrooms}
                        </span>
                        <span className="flex items-center gap-0.5 sm:gap-1">
                            <Bath className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {property.bathrooms}
                        </span>
                        <span className="flex items-center gap-0.5 sm:gap-1">
                            <Maximize className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {property.size}m²
                        </span>
                    </div>

                    {/* Price & Footer */}
                    <div className="mt-auto pt-2 sm:pt-3 border-t border-neutral-100 flex items-center justify-between">
                        <div>
                            <span className="text-base sm:text-xl font-bold text-neutral-900 tracking-tight">
                                N${property.price.toLocaleString()}
                            </span>
                            <span className="text-neutral-400 text-[10px] sm:text-xs ml-0.5 sm:ml-1">/mo</span>
                        </div>
                        <div className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-full">
                            <Zap className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                            Verified
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}, (prevProps, nextProps) => {
    // Custom comparison - only re-render if the property ID changes
    // This is safe because property data from Convex is immutable
    return prevProps.property.id === nextProps.property.id &&
        prevProps.property.price === nextProps.property.price &&
        prevProps.property.images[0] === nextProps.property.images[0]
})

TrustCard.displayName = 'TrustCard'
