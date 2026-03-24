"use client"

import { memo, type MouseEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import type { Id } from "../../../convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { SavePropertyButton } from "@/components/properties/SavePropertyButton"
import { X, MapPin, Bed, Bath, Square, Home } from "lucide-react"


export interface TrustCardProps {
    property: {
        id: Id<"properties">
        title: string
        price: number
        maxPrice?: number
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
        listingType?: 'single_home' | 'multi_unit_block' | 'student_accommodation'
        unitCount?: number
        availableUnitCount?: number
        unitTypeLabels?: string[]
    }
    priority?: boolean
    actionType?: 'save' | 'remove' | 'none'
    onRemove?: (propertyId: Id<"properties">, event: MouseEvent<HTMLButtonElement>) => void
}

export const TrustCard = memo(function TrustCard({
    property,
    priority = false,
    actionType = 'save',
    onRemove,
}: TrustCardProps) {
    const imageSrc = property.images?.length > 0 ? property.images[0] : '/window.svg'
    const isMultiUnit = (property.unitCount ?? 1) > 1 || property.listingType === 'multi_unit_block' || property.listingType === 'student_accommodation'
    const availableCount = property.availableUnitCount ?? 0
    const priceLabel = isMultiUnit ? `From N$${property.price.toLocaleString()}` : `N$${property.price.toLocaleString()}`
    const subtitle = isMultiUnit
        ? `${property.unitCount ?? 1} units • ${availableCount} available`
        : `${property.bedrooms || 0} bed • ${property.bathrooms || 0} bath`

    return (
        <Link
            href={`/properties/${property.id}`}
            className="group block w-full outline-none flex flex-col gap-3.5"
        >
            <div className={cn(
                "relative w-full aspect-[4/3] rounded-[24px] overflow-hidden bg-neutral-100",
                "shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] isolate",
                "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
            )}>
                {/* Image */}
                <Image
                    src={imageSrc}
                    alt={property.title}
                    fill
                    priority={priority}
                    quality={85}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1400px) 33vw, 25vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />

                {/* Top Overlay Gradient for icons readability */}
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />

                {/* Top Controls */}
                {actionType !== 'none' && (
                    <div className="absolute top-3 right-3 z-20 pointer-events-none">
                        <div className="pointer-events-auto">
                            {actionType === 'save' ? (
                                <SavePropertyButton
                                    propertyId={property.id}
                                    landlordId={property.landlordId}
                                    className="h-9 w-9 sm:h-10 sm:w-10 bg-white/90 backdrop-blur-md hover:bg-white border-0 shadow-sm transition-all text-neutral-900 p-0 rounded-full"
                                />
                            ) : (
                                <button
                                    onClick={(event) => {
                                        event.preventDefault()
                                        onRemove?.(property.id, event)
                                    }}
                                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white/90 backdrop-blur-md hover:bg-white border-0 shadow-sm transition-all flex items-center justify-center text-neutral-900"
                                    title="Remove"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Price Badge - Apple Native Style */}
                <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
                    <div className="bg-white/95 backdrop-blur-xl px-3.5 py-1.5 rounded-full shadow-sm border border-neutral-200/50 flex items-baseline select-none">
                        <span className="text-[15px] font-bold text-neutral-900 tracking-tight">
                            {priceLabel}
                        </span>
                        <span className="text-[13px] font-semibold text-neutral-500 ml-1">/mo</span>
                    </div>
                </div>
            </div>

            {/* Content Area - Clean, high contrast typography */}
            <div className="px-1 flex flex-col gap-1.5">
                <div className="flex justify-between items-start gap-4">
                    <h3 className="text-[17px] sm:text-[18px] font-semibold text-neutral-900 leading-snug tracking-[-0.015em] line-clamp-1 group-hover:text-black transition-colors">
                        {property.title}
                    </h3>
                </div>

                <div className="flex items-center gap-1.5 text-[14px] text-neutral-500 font-medium tracking-tight">
                    <MapPin className="w-3.5 h-3.5 opacity-70" />
                    <span className="truncate">{property.city} • {property.address}</span>
                </div>

                <div className="flex items-center gap-3.5 text-[13.5px] text-neutral-600 font-medium mt-0.5 flex-wrap">
                    {!isMultiUnit && (
                        <>
                            <div className="flex items-center gap-1.5">
                                <Bed className="w-4 h-4 text-neutral-400" />
                                <span>{property.bedrooms || 0}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Bath className="w-4 h-4 text-neutral-400" />
                                <span>{property.bathrooms || 0}</span>
                            </div>
                            {property.size > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <Square className="w-4 h-4 text-neutral-400" />
                                    <span>{property.size} m²</span>
                                </div>
                            )}
                        </>
                    )}
                    {isMultiUnit && (
                        <>
                            <div className="flex items-center gap-1.5">
                                <Home className="w-4 h-4 text-neutral-400" />
                                <span>{subtitle}</span>
                            </div>
                            {property.unitTypeLabels?.slice(0, 2).map((label) => (
                                <span key={label} className="rounded-full border border-neutral-200 px-2 py-0.5 text-[11px] text-neutral-500">
                                    {label}
                                </span>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </Link>
    )
}, (prevProps, nextProps) => {
    return prevProps.property.id === nextProps.property.id &&
        prevProps.property.price === nextProps.property.price &&
        prevProps.property.maxPrice === nextProps.property.maxPrice &&
        prevProps.property.images[0] === nextProps.property.images[0] &&
        prevProps.property.availableUnitCount === nextProps.property.availableUnitCount &&
        prevProps.property.unitCount === nextProps.property.unitCount &&
        prevProps.actionType === nextProps.actionType &&
        prevProps.onRemove === nextProps.onRemove
})

TrustCard.displayName = 'TrustCard'
