"use client"

import { useState, useEffect, useRef, use, useCallback, TouchEvent } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { Button } from "@/components/ui/button"
import {
    MapPin,
    BedDouble,
    Bath,
    Maximize,
    Share2,
    ChevronLeft,
    ChevronRight,
    Phone,
    User,
    Shield,
    X,
    Grid3X3,
    Home,
    CheckCircle2,
    ArrowLeft,
    Dot
} from "lucide-react"

import { SavePropertyButton } from "@/components/properties/SavePropertyButton"
import { ContactLandlordButton } from "@/components/properties/ContactLandlordButton"
import { PropertyDetailMap } from "@/components/maps/PropertyDetailMap"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import { cn } from "@/lib/utils"

// --- Types ---

interface PropertyDetails {
    id: string
    landlordId: string
    title: string
    description: string
    price: number
    address: string
    city: string
    bedrooms: number
    bathrooms: number
    size: number
    type: string
    images: string[]
    amenities: string[]
    isFromDatabase: boolean
    coordinates?: { lat: number; lng: number } | null
    landlord?: {
        name: string | null
        email: string
        phone: string | null
        avatarUrl?: string | null
    } | null
}

// --- Main Component ---

function PropertyDetailContent({ id }: { id: string }) {
    const [showAllPhotos, setShowAllPhotos] = useState(false)
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
    const [isScrolled, setIsScrolled] = useState(false)
    const [copied, setCopied] = useState(false)

    // Touch gesture state for mobile carousel
    const touchStartX = useRef<number>(0)
    const touchEndX = useRef<number>(0)
    const minSwipeDistance = 50 // minimum distance in px to trigger swipe

    // Track view mutation
    const trackView = useMutation(api.recentlyViewed.trackView)
    const hasTracked = useRef(false)

    // Sticky Nav Logic
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 200)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const convexProperty = useQuery(api.properties.getById, { propertyId: id as Id<"properties"> })

    // Track property view when page loads (only once)
    useEffect(() => {
        if (convexProperty && !hasTracked.current) {
            hasTracked.current = true
            trackView({ propertyId: id as Id<"properties"> }).catch(() => {
                // Silently fail - user might not be logged in
            })
        }
    }, [convexProperty, id, trackView])

    // Share functionality
    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Fallback
        }
    }

    // Touch handlers for mobile carousel swipe
    const onTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
        touchEndX.current = 0 // Reset end position
        touchStartX.current = e.targetTouches[0].clientX
    }, [])

    const onTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
        touchEndX.current = e.targetTouches[0].clientX
    }, [])

    const onTouchEnd = useCallback((imagesLength: number) => {
        if (!touchStartX.current || !touchEndX.current) return

        const distance = touchStartX.current - touchEndX.current
        const isLeftSwipe = distance > minSwipeDistance
        const isRightSwipe = distance < -minSwipeDistance

        if (isLeftSwipe) {
            // Swipe left -> go to next image
            setCurrentPhotoIndex((prev) => (prev + 1) % imagesLength)
        } else if (isRightSwipe) {
            // Swipe right -> go to previous image
            setCurrentPhotoIndex((prev) => (prev - 1 + imagesLength) % imagesLength)
        }

        // Reset values
        touchStartX.current = 0
        touchEndX.current = 0
    }, [])

    // Loading State
    if (convexProperty === undefined) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-neutral-500">Loading property...</p>
                </div>
            </div>
        )
    }

    if (!convexProperty) return notFound()

    const property: PropertyDetails = {
        id: convexProperty._id,
        landlordId: convexProperty.landlordId,
        title: convexProperty.title,
        description: convexProperty.description || 'No description available',
        price: convexProperty.priceNad,
        address: convexProperty.address,
        city: convexProperty.city,
        bedrooms: convexProperty.bedrooms || 0,
        bathrooms: convexProperty.bathrooms || 0,
        size: convexProperty.sizeSqm || 0,
        type: convexProperty.propertyType,
        images: convexProperty.imageUrls?.length ? convexProperty.imageUrls : ['/window.svg'],
        amenities: convexProperty.amenityNames || [],
        isFromDatabase: true,
        coordinates: convexProperty.coordinates || null,
        landlord: convexProperty.landlordInfo || null,
    }

    // Photo Gallery Modal
    if (showAllPhotos) {
        return (
            <div className="fixed inset-0 z-[100] bg-black animate-in fade-in duration-200">
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 sm:p-6">
                    <button
                        onClick={() => setShowAllPhotos(false)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full text-neutral-900 hover:bg-neutral-100 transition-all text-sm font-medium"
                    >
                        <X className="w-4 h-4" />
                        <span>Close</span>
                    </button>
                    <div className="text-white/70 font-mono text-sm bg-black/50 px-3 py-1.5 rounded-full">
                        {currentPhotoIndex + 1} / {property.images.length}
                    </div>
                </div>

                {/* Main Image */}
                <div className="absolute inset-0 flex items-center justify-center p-4 pt-20 pb-20">
                    <div className="relative w-full max-w-5xl h-full max-h-[80vh]">
                        <OptimizedImage
                            src={property.images[currentPhotoIndex]}
                            alt={`Photo ${currentPhotoIndex + 1}`}
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>

                {/* Navigation Arrows */}
                {property.images.length > 1 && (
                    <>
                        <button
                            onClick={() => setCurrentPhotoIndex((prev) => (prev - 1 + property.images.length) % property.images.length)}
                            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white flex items-center justify-center text-neutral-900 hover:scale-105 transition-transform shadow-lg"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => setCurrentPhotoIndex((prev) => (prev + 1) % property.images.length)}
                            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white flex items-center justify-center text-neutral-900 hover:scale-105 transition-transform shadow-lg"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </>
                )}

                {/* Thumbnail Strip */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex gap-2 justify-center overflow-x-auto pb-2 no-scrollbar">
                        {property.images.map((img, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPhotoIndex(i)}
                                className={cn(
                                    "relative w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden shrink-0 transition-all border-2",
                                    i === currentPhotoIndex
                                        ? "border-white opacity-100 scale-105"
                                        : "border-transparent opacity-50 hover:opacity-75"
                                )}
                            >
                                <OptimizedImage
                                    src={img}
                                    alt={`Thumbnail ${i + 1}`}
                                    fill
                                    className="object-cover"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white font-sans text-neutral-900 overflow-x-hidden">
            {/* Sticky Navigation Header */}
            <header className={cn(
                "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
                isScrolled
                    ? "bg-white border-b border-neutral-200"
                    : "bg-transparent"
            )}>
                <div className="max-w-[1120px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
                    {/* Back Button */}
                    <Link
                        href="/"
                        className={cn(
                            "flex items-center justify-center w-9 h-9 rounded-full transition-all",
                            isScrolled
                                ? "bg-neutral-100 text-neutral-900 hover:bg-neutral-200"
                                : "bg-white text-neutral-900 hover:bg-neutral-100 shadow-md"
                        )}
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleShare}
                            className={cn(
                                "flex items-center gap-2 h-9 px-4 rounded-full transition-all text-sm font-medium",
                                isScrolled
                                    ? "bg-neutral-100 text-neutral-900 hover:bg-neutral-200"
                                    : "bg-white text-neutral-900 hover:bg-neutral-100 shadow-md"
                            )}
                        >
                            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
                        </button>
                        <SavePropertyButton
                            propertyId={property.id}
                            className={cn(
                                "h-9 w-9 rounded-full",
                                isScrolled
                                    ? "bg-neutral-100 hover:bg-neutral-200 border-0"
                                    : "bg-white hover:bg-neutral-100 border-0 shadow-md"
                            )}
                        />
                    </div>
                </div>
            </header>

            {/* Hero Image Section */}
            <section className="relative">
                {/* Mobile: Full-width image carousel */}
                <div
                    className="md:hidden relative aspect-[4/3] touch-pan-y"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={() => onTouchEnd(property.images.length)}
                >
                    <OptimizedImage
                        src={property.images[currentPhotoIndex]}
                        alt={property.title}
                        fill
                        className="object-cover select-none pointer-events-none"
                        priority
                    />

                    {/* Mobile photo navigation */}
                    {property.images.length > 1 && (
                        <>
                            {/* Smart dots indicator with sliding window */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                                {/* Position counter */}
                                <div className="bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                                    <span className="text-white text-xs font-medium">
                                        {currentPhotoIndex + 1} / {property.images.length}
                                    </span>
                                </div>

                                {/* Dots - show sliding window of 5 dots */}
                                <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-2 py-1.5 rounded-full">
                                    {(() => {
                                        const total = property.images.length
                                        const maxDots = 5

                                        // If 5 or fewer images, show all dots
                                        if (total <= maxDots) {
                                            return property.images.map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentPhotoIndex(i)}
                                                    className={cn(
                                                        "rounded-full transition-all duration-200",
                                                        i === currentPhotoIndex
                                                            ? "bg-white w-2 h-2"
                                                            : "bg-white/50 w-1.5 h-1.5 hover:bg-white/70"
                                                    )}
                                                    aria-label={`Go to image ${i + 1}`}
                                                />
                                            ))
                                        }

                                        // Calculate sliding window for more than 5 images
                                        let startIdx = Math.max(0, currentPhotoIndex - 2)
                                        const endIdx = Math.min(total, startIdx + maxDots)

                                        // Adjust start if we're near the end
                                        if (endIdx - startIdx < maxDots) {
                                            startIdx = Math.max(0, endIdx - maxDots)
                                        }

                                        return property.images.slice(startIdx, endIdx).map((_, i) => {
                                            const actualIndex = startIdx + i
                                            const isEdge = i === 0 || i === maxDots - 1
                                            const isAtBoundary = (startIdx > 0 && i === 0) || (endIdx < total && i === maxDots - 1)

                                            return (
                                                <button
                                                    key={actualIndex}
                                                    onClick={() => setCurrentPhotoIndex(actualIndex)}
                                                    className={cn(
                                                        "rounded-full transition-all duration-200",
                                                        actualIndex === currentPhotoIndex
                                                            ? "bg-white w-2 h-2"
                                                            : isAtBoundary
                                                                ? "bg-white/30 w-1 h-1"
                                                                : "bg-white/50 w-1.5 h-1.5 hover:bg-white/70"
                                                    )}
                                                    aria-label={`Go to image ${actualIndex + 1}`}
                                                />
                                            )
                                        })
                                    })()}
                                </div>
                            </div>

                            {/* Navigation arrows (semi-transparent, appear on tap) */}
                            <button
                                onClick={() => setCurrentPhotoIndex((prev) => (prev - 1 + property.images.length) % property.images.length)}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white active:bg-black/50 transition-colors z-10"
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setCurrentPhotoIndex((prev) => (prev + 1) % property.images.length)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white active:bg-black/50 transition-colors z-10"
                                aria-label="Next image"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </>
                    )}

                    {/* View all photos button */}
                    <button
                        onClick={() => setShowAllPhotos(true)}
                        className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-2 bg-white rounded-lg text-sm font-medium text-neutral-900 hover:bg-neutral-50 transition-all z-10 shadow-lg"
                    >
                        <Grid3X3 className="w-4 h-4" />
                        {property.images.length}
                    </button>
                </div>

                {/* Desktop: Grid layout */}
                <div className="hidden md:block pt-16">
                    <div className="max-w-[1120px] mx-auto px-6 pt-4">
                        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[480px] rounded-xl overflow-hidden">
                            {/* Main large image */}
                            <div
                                className="col-span-2 row-span-2 relative cursor-pointer group"
                                onClick={() => { setCurrentPhotoIndex(0); setShowAllPhotos(true); }}
                            >
                                <OptimizedImage
                                    src={property.images[0]}
                                    alt={property.title}
                                    fill
                                    className="object-cover transition-all duration-300 group-hover:brightness-90"
                                    priority
                                />
                            </div>

                            {/* Secondary images */}
                            {property.images.slice(1, 5).map((img, i) => (
                                <div
                                    key={i}
                                    className="relative cursor-pointer group overflow-hidden"
                                    onClick={() => { setCurrentPhotoIndex(i + 1); setShowAllPhotos(true); }}
                                >
                                    <OptimizedImage
                                        src={img}
                                        alt={`Photo ${i + 2}`}
                                        fill
                                        className="object-cover transition-all duration-300 group-hover:brightness-90"
                                    />

                                    {/* Show "View all" overlay on last image if more photos */}
                                    {i === 3 && property.images.length > 5 && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                                            <span className="text-white font-medium">+{property.images.length - 5} more</span>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Fill empty slots if less than 5 images */}
                            {property.images.length < 5 && Array(5 - property.images.length).fill(0).map((_, i) => (
                                <div key={`empty-${i}`} className="bg-neutral-100" />
                            ))}
                        </div>

                        {/* View all photos button */}
                        <div className="flex justify-end mt-3">
                            <button
                                onClick={() => setShowAllPhotos(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-sm font-medium text-neutral-900 hover:bg-neutral-50 transition-all border border-neutral-200"
                            >
                                <Grid3X3 className="w-4 h-4" />
                                View all {property.images.length} photos
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <main className="max-w-[1120px] mx-auto px-4 sm:px-6 pb-32 lg:pb-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-24 pt-8">

                    {/* Left Column - Property Details */}
                    <div className="lg:col-span-2">

                        {/* Title Section */}
                        <section className="pb-8 border-b border-neutral-200">
                            <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 mb-2">
                                {property.title}
                            </h1>

                            {/* Property specs - inline like Airbnb */}
                            <div className="flex items-center flex-wrap gap-1 text-neutral-600 mb-4">
                                <span>{property.bedrooms} bedroom{property.bedrooms !== 1 ? 's' : ''}</span>
                                <Dot className="w-4 h-4 text-neutral-400" />
                                <span>{property.bathrooms} bathroom{property.bathrooms !== 1 ? 's' : ''}</span>
                                <Dot className="w-4 h-4 text-neutral-400" />
                                <span>{property.size} m²</span>
                                <Dot className="w-4 h-4 text-neutral-400" />
                                <span className="capitalize">{property.type}</span>
                            </div>

                            {/* Location */}
                            <div className="flex items-center gap-2 text-neutral-600">
                                <MapPin className="w-4 h-4 shrink-0" />
                                <span>{property.address}, {property.city}</span>
                            </div>
                        </section>

                        {/* Mobile: Price and Contact Section */}
                        <section className="lg:hidden py-8 border-b border-neutral-200">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-neutral-500 mb-1">Monthly Rent</p>
                                    <p className="text-3xl font-semibold text-neutral-900">
                                        N${property.price.toLocaleString()}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <ContactLandlordButton propertyId={property.id} landlordId={property.landlordId} />

                                    {property.landlord?.phone && (
                                        <a
                                            href={`tel:${property.landlord.phone}`}
                                            className="flex items-center justify-center gap-2 w-full h-12 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-medium rounded-lg transition-colors"
                                        >
                                            <Phone className="w-4 h-4" />
                                            {property.landlord.phone}
                                        </a>
                                    )}
                                </div>

                                <div className="space-y-2 pt-4 border-t border-neutral-100">
                                    <div className="flex items-center gap-3 text-sm text-neutral-500">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span>Usually responds within 24 hours</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-neutral-500">
                                        <Shield className="w-4 h-4 text-blue-500 shrink-0" />
                                        <span>Protected by Link guarantee</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Landlord Preview */}
                        <section className="py-8 border-b border-neutral-200">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-neutral-100 overflow-hidden relative shrink-0">
                                    {property.landlord?.avatarUrl ? (
                                        <OptimizedImage
                                            src={property.landlord.avatarUrl}
                                            alt="Landlord"
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full w-full text-neutral-400">
                                            <User className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-neutral-900">
                                        Listed by {property.landlord?.name || 'Property Owner'}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                                        <Shield className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Verified Landlord</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Description */}
                        <section className="py-8 border-b border-neutral-200">
                            <h2 className="text-xl font-semibold text-neutral-900 mb-6">About this property</h2>
                            <p className="text-neutral-600 leading-relaxed whitespace-pre-line">
                                {property.description}
                            </p>
                        </section>

                        {/* Amenities */}
                        {property.amenities.length > 0 && (
                            <section className="py-8 border-b border-neutral-200">
                                <h2 className="text-xl font-semibold text-neutral-900 mb-6">What this place offers</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {property.amenities.map(amenity => (
                                        <div key={amenity} className="flex items-center gap-4">
                                            <CheckCircle2 className="w-5 h-5 text-neutral-600 shrink-0" />
                                            <span className="text-neutral-600">{amenity}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Location Map */}
                        {property.coordinates && (
                            <section className="py-8">
                                <h2 className="text-xl font-semibold text-neutral-900 mb-6">Where you'll be</h2>
                                <div className="h-[320px] sm:h-[400px] rounded-xl overflow-hidden border border-neutral-200 mb-4">
                                    <PropertyDetailMap coordinates={property.coordinates} address={property.address} />
                                </div>
                                <p className="text-neutral-600">
                                    {property.address}, {property.city}
                                </p>
                            </section>
                        )}
                    </div>

                    {/* Right Column - Contact Section (Desktop only) */}
                    <div className="hidden lg:block">
                        <div className="sticky top-24 space-y-6">
                            {/* Price */}
                            <div>
                                <p className="text-sm text-neutral-500 mb-1">Monthly Rent</p>
                                <p className="text-3xl font-semibold text-neutral-900">
                                    N${property.price.toLocaleString()}
                                </p>
                            </div>

                            {/* Contact Button */}
                            <div className="space-y-3">
                                <ContactLandlordButton propertyId={property.id} landlordId={property.landlordId} />

                                {property.landlord?.phone && (
                                    <a
                                        href={`tel:${property.landlord.phone}`}
                                        className="flex items-center justify-center gap-2 w-full h-12 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-medium rounded-lg transition-colors"
                                    >
                                        <Phone className="w-4 h-4" />
                                        {property.landlord.phone}
                                    </a>
                                )}
                            </div>

                            {/* Trust Indicators */}
                            <div className="space-y-3 pt-4 border-t border-neutral-200">
                                <div className="flex items-center gap-3 text-sm text-neutral-500">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Usually responds within 24 hours</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-neutral-500">
                                    <Shield className="w-4 h-4 text-blue-500 shrink-0" />
                                    <span>Protected by Link guarantee</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    return <PropertyDetailContent id={id} />
}
