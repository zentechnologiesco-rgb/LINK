'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Bed, Bath, Maximize, MapPin, Sparkles } from 'lucide-react'
import { SavePropertyButton } from '@/components/properties/SavePropertyButton'
import { cn } from '@/lib/utils'

interface Property {
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
}

interface PropertyCardFlatProps {
    property: Property
    className?: string
    featured?: boolean
}

export function PropertyCardFlat({ property, className, featured = false }: PropertyCardFlatProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [isHovered, setIsHovered] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)
    const images = property.images.length > 0 ? property.images : ['/window.svg']
    const cardRef = useRef<HTMLAnchorElement>(null)

    const nextImage = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }

    const prevImage = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
    }

    // Get property type color
    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            apartment: 'from-blue-500/90 to-indigo-600/90',
            house: 'from-emerald-500/90 to-green-600/90',
            room: 'from-amber-500/90 to-orange-600/90',
            studio: 'from-purple-500/90 to-violet-600/90',
            penthouse: 'from-rose-500/90 to-pink-600/90',
            townhouse: 'from-cyan-500/90 to-teal-600/90',
            commercial: 'from-slate-600/90 to-gray-700/90',
        }
        return colors[type.toLowerCase()] || 'from-black/80 to-black/90'
    }

    return (
        <Link
            ref={cardRef}
            href={`/properties/${property.id}`}
            className={cn(
                'group block relative',
                featured && 'md:col-span-2 md:row-span-2',
                className
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Card Container with subtle border */}
            <div className="relative rounded-3xl overflow-hidden bg-stone-100 transition-all duration-500 group-hover:-translate-y-1">
                {/* Image Container */}
                <div className={cn(
                    "relative overflow-hidden",
                    featured ? "aspect-[4/3]" : "aspect-[4/5]"
                )}>
                    {/* Shimmer loading effect */}
                    {!imageLoaded && (
                        <div className="absolute inset-0 bg-gradient-to-r from-stone-100 via-stone-50 to-stone-100 animate-shimmer" />
                    )}

                    <Image
                        src={images[currentImageIndex]}
                        alt={property.title}
                        fill
                        className={cn(
                            "object-cover transition-all duration-700",
                            isHovered ? "scale-110" : "scale-100",
                            imageLoaded ? "opacity-100" : "opacity-0"
                        )}
                        sizes={featured
                            ? "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 40vw"
                            : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        }
                        onLoad={() => setImageLoaded(true)}
                    />

                    {/* Gradient Overlay - Bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Premium Top Gradient */}
                    <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent" />

                    {/* Save Button */}
                    <div className="absolute right-4 top-4 z-10">
                        <SavePropertyButton
                            propertyId={property.id}
                            className={cn(
                                "h-10 w-10 rounded-full backdrop-blur-md transition-all duration-300",
                                isHovered
                                    ? "bg-white text-black shadow-lg scale-110"
                                    : "bg-white/80 text-black/80"
                            )}
                        />
                    </div>

                    {/* Type Badge - Premium gradient */}
                    <div className="absolute left-4 top-4 z-10">
                        <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-md bg-gradient-to-r shadow-lg",
                            getTypeColor(property.type)
                        )}>
                            <Sparkles className="h-3 w-3" />
                            {property.type}
                        </span>
                    </div>

                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                        <div className={cn(
                            "transition-all duration-300",
                            isHovered ? "opacity-100" : "opacity-0"
                        )}>
                            <button
                                onClick={prevImage}
                                className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/95 backdrop-blur-sm text-black flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                                onClick={nextImage}
                                className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/95 backdrop-blur-sm text-black flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    )}

                    {/* Carousel Indicator - Minimal dots */}
                    {images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-md">
                            {images.slice(0, 5).map((_, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setCurrentImageIndex(index)
                                    }}
                                    className={cn(
                                        "rounded-full transition-all duration-300",
                                        currentImageIndex === index
                                            ? "w-5 h-1.5 bg-white"
                                            : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                                    )}
                                />
                            ))}
                            {images.length > 5 && (
                                <span className="text-white/60 text-[10px] ml-1">+{images.length - 5}</span>
                            )}
                        </div>
                    )}

                    {/* Quick Info on Hover - Premium floating card */}
                    <div className={cn(
                        "absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-white/95 backdrop-blur-md transition-all duration-500 shadow-2xl",
                        isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                    )}>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1.5 text-black">
                                    <Bed className="h-4 w-4 text-black/60" />
                                    <span className="font-semibold">{property.bedrooms}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-black">
                                    <Bath className="h-4 w-4 text-black/60" />
                                    <span className="font-semibold">{property.bathrooms}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-black">
                                    <Maximize className="h-4 w-4 text-black/60" />
                                    <span className="font-semibold">{property.size}m²</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-4 space-y-2 bg-white">
                    {/* Location with icon */}
                    <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-black/40 shrink-0" />
                        <h3 className="font-bold text-black text-[15px] leading-tight truncate">
                            {property.city}, Namibia
                        </h3>
                    </div>

                    {/* Title */}
                    <p className="text-black/60 text-sm font-medium truncate">
                        {property.title}
                    </p>

                    {/* Specs - Minimal on default view */}
                    <div className="flex items-center gap-3 text-xs text-black/50 font-medium">
                        <span>{property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}</span>
                        <span className="w-1 h-1 rounded-full bg-black/20" />
                        <span>{property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}</span>
                        <span className="w-1 h-1 rounded-full bg-black/20" />
                        <span>{property.size}m²</span>
                    </div>

                    {/* Price - Premium styling */}
                    <div className="pt-2 flex items-baseline gap-1">
                        <span className="font-[family-name:var(--font-anton)] text-2xl text-black tracking-tight">
                            N${property.price.toLocaleString()}
                        </span>
                        <span className="text-black/40 text-sm font-medium">/month</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}
