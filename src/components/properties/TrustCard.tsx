"use client"

import { memo, type MouseEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import type { Id } from "../../../convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { SavePropertyButton } from "@/components/properties/SavePropertyButton"
import { X } from "lucide-react"


export interface TrustCardProps {
    property: {
        id: Id<"properties">
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
        landlordId?: string
    }
    /** Set to true for above-the-fold cards (first 4-8 visible) for faster initial load */
    priority?: boolean
    actionType?: 'save' | 'remove' | 'none'
    onRemove?: (propertyId: Id<"properties">, event: MouseEvent<HTMLButtonElement>) => void
}

// Immersive full-image property card — inspired by Stuttle.
export const TrustCard = memo(function TrustCard({
    property,
    priority = false,
    actionType = 'save',
    onRemove,
}: TrustCardProps) {
    const imageSrc = property.images.length > 0 ? property.images[0] : '/window.svg'

    return (
        <Link
            href={`/properties/${property.id}`}
            className="group block w-full outline-none"
        >
            <div className={cn(
                "relative w-full rounded-[16px] overflow-hidden bg-neutral-100",
                "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
                "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)]",
                "hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:-translate-y-1.5"
            )}>
                {/* Image — Square ratio for the feed layout */}
                <div className="relative w-full aspect-square">
                    <Image
                        src={imageSrc}
                        alt={property.title}
                        fill
                        priority={priority}
                        quality={80}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1400px) 33vw, 25vw"
                        className="object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.05]"
                    />

                    {/* Gradient Overlay — subtle top for buttons, heavy bottom for text */}
                    <div className="absolute inset-0 z-10 pointer-events-none">
                         {/* Top gradient for readability of white icons */}
                         <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent" />
                         {/* Bottom gradient for text focus */}
                         <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-black/95 via-black/40 to-transparent pt-[50%] md:hidden" />
                    </div>

                    {actionType !== 'none' && (
                        <div className="absolute top-3 right-3 z-20 flex justify-end items-center pointer-events-none">
                            <div className="pointer-events-auto">
                                {actionType === 'save' ? (
                                    <SavePropertyButton
                                        propertyId={property.id}
                                        landlordId={property.landlordId}
                                        className="h-8 w-8 sm:h-10 sm:w-10 bg-white hover:bg-neutral-50 border-neutral-100 shadow-sm transition-all text-black p-0"
                                    />
                                ) : (
                                    <button
                                        onClick={(event) => onRemove?.(property.id, event)}
                                        className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white hover:bg-neutral-50 border border-neutral-100 shadow-sm transition-all flex items-center justify-center text-neutral-900"
                                        title="Remove from history"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Bottom Content Area */}
                    <div className="absolute inset-x-0 bottom-0 z-20 p-3 pt-24 pb-4 flex flex-col justify-end md:hidden">
                        <h3 className="text-white text-[19px] sm:text-[21px] font-semibold leading-tight tracking-[-0.02em] mb-1.5 drop-shadow-md">
                            {property.title}
                        </h3>
                        <div className="flex items-baseline gap-1 drop-shadow-sm">
                            <span className="text-[13px] font-medium truncate text-white">
                                {property.city}
                            </span>
                            <span className="text-[13px] font-medium text-white/60">
                                ·
                            </span>
                            <span className="text-[14px] font-semibold leading-none text-white">
                                N${property.price.toLocaleString()}
                            </span>
                            <span className="text-[11px] font-medium text-white/70">
                                /month
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Desktop content sits below the image for a cleaner card layout. */}
            <div className="hidden md:block mt-2.5 px-0.5 space-y-1">
                <h3 className="text-neutral-900 text-[15px] font-semibold leading-tight tracking-tight hover:text-black transition-colors">
                    {property.title}
                </h3>
                <div className="flex items-baseline gap-1">
                    <span className="text-[13px] font-medium truncate text-neutral-700">
                        {property.city}
                    </span>
                    <span className="text-[13px] font-medium text-neutral-400">
                        ·
                    </span>
                    <span className="text-[14px] font-semibold leading-none text-neutral-900">
                        N${property.price.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-medium text-neutral-500">
                        /month
                    </span>
                </div>
            </div>
        </Link>
    )
}, (prevProps, nextProps) => {
    return prevProps.property.id === nextProps.property.id &&
        prevProps.property.price === nextProps.property.price &&
        prevProps.property.images[0] === nextProps.property.images[0] &&
        prevProps.actionType === nextProps.actionType &&
        prevProps.onRemove === nextProps.onRemove
})

TrustCard.displayName = 'TrustCard'
