"use client"

import { memo } from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { SavePropertyButton } from "@/components/properties/SavePropertyButton"
import {
    MapPin,
    Star,
    Heart,
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
    /** Set to true for above-the-fold cards (first 4-8 visible) for faster initial load */
    priority?: boolean
}

// Immersive full-image property card — inspired by Stuttle.
export const TrustCard = memo(function TrustCard({ property, priority = false }: TrustCardProps) {
    const imageSrc = property.images.length > 0 ? property.images[0] : '/window.svg'

    return (
        <Link
            href={`/properties/${property.id}`}
            className="group block w-full outline-none"
        >
            <div className={cn(
                "relative w-full rounded-[24px] overflow-hidden bg-neutral-100",
                "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
                "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)]",
                "hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:-translate-y-1.5"
            )}>
                {/* Image — Square aspect ratio like Airbnb */}
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
                         <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-black/95 via-black/40 to-transparent md:from-black/70 md:via-black/20 pt-[50%]" />
                    </div>

                    <div className="absolute top-3 right-3 z-20 flex justify-end items-center pointer-events-none">
                        {/* Save Button Circle */}
                        <div className="pointer-events-auto">
                            <SavePropertyButton
                                propertyId={property.id}
                                className="h-8 w-8 sm:h-10 sm:w-10 bg-white hover:bg-neutral-50 border-neutral-100 shadow-sm transition-all text-black p-0"
                            />
                        </div>
                    </div>

                    {/* Bottom Content Area */}
                    <div className="absolute inset-x-0 bottom-0 z-20 p-3 pt-24 pb-4 flex flex-col justify-end">
                        {/* Title — Extrabold, large, tight leading. Hidden on desktop (md+) inside the card. */}
                        <h3 className="md:hidden text-white text-[20px] sm:text-[22px] font-[900] leading-[1.05] tracking-[-0.02em] mb-2 drop-shadow-md line-clamp-2">
                            {property.title}
                        </h3>

                        {/* Middle row: Inline Rating & Location */}
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="flex items-center gap-1.5">
                                <Star className="w-[14px] h-[14px] text-[#FACC15] fill-[#FACC15]" />
                                <span className="text-white/90 text-[13px] font-bold">5.0</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <MapPin className="w-[14px] h-[14px] text-white/70 shadow-black" strokeWidth={2} />
                                <span className="text-white/90 text-[13px] font-semibold truncate max-w-[120px]">
                                    {property.city}
                                </span>
                            </div>
                        </div>

                        {/* Bottom row: Neon Price */}
                        <div className="flex items-center justify-between mt-1">
                            <div className="flex items-baseline">
                                <span className="text-[#C4F135] text-[22px] sm:text-[24px] font-[900] leading-none tracking-[-0.03em] drop-shadow-sm">
                                    N${property.price.toLocaleString()}
                                </span>
                                <span className="text-[#C4F135] text-[12px] font-bold ml-1 drop-shadow-sm">
                                    /month
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
}, (prevProps, nextProps) => {
    return prevProps.property.id === nextProps.property.id &&
        prevProps.property.price === nextProps.property.price &&
        prevProps.property.images[0] === nextProps.property.images[0]
})

TrustCard.displayName = 'TrustCard'
