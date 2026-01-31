"use client"

import { useState, useEffect, useRef, use } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
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
    Calendar,
    MessageCircle,
    X,
    Grid3X3,
    Zap,
    Home
} from "lucide-react"

import { SavePropertyButton } from "@/components/properties/SavePropertyButton"
import { ContactLandlordButton } from "@/components/properties/ContactLandlordButton"
import { PropertyDetailMap } from "@/components/maps/PropertyDetailMap"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import { cn } from "@/lib/utils"

// --- Types ---

interface PropertyDetails {
    id: string
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

function Metric({ label, value, highlight = false, large = false }: { label: string, value: string | number, highlight?: boolean, large?: boolean }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[9px] sm:text-[10px] uppercase text-neutral-400 font-semibold tracking-wider font-mono">{label}</span>
            <span className={cn(
                "font-mono font-medium text-neutral-900",
                highlight && "text-blue-600",
                large ? "text-lg sm:text-xl md:text-2xl" : "text-sm sm:text-base"
            )}>
                {value}
            </span>
        </div>
    )
}

function getAmenityIcon(amenity: string) {
    // Return a default icon or map as needed
    // For this design, we might use simple text pills or minimal icons
    return Zap
}

// --- Main Component ---

function PropertyDetailContent({ id }: { id: string }) {
    const [showAllPhotos, setShowAllPhotos] = useState(false)
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
    const [isScrolled, setIsScrolled] = useState(false)

    // Sticky Nav Logic
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 400)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const convexProperty = useQuery(api.properties.getById, { propertyId: id as Id<"properties"> })

    // Loading State
    if (convexProperty === undefined) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!convexProperty) return notFound()

    const property: PropertyDetails = {
        id: convexProperty._id,
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
                <button
                    onClick={() => setShowAllPhotos(false)}
                    className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-all"
                >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4">
                    <div className="relative w-full max-w-7xl aspect-[4/3] sm:aspect-[16/10]">
                        <Image
                            src={property.images[currentPhotoIndex]}
                            alt={`Photo ${currentPhotoIndex + 1}`}
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>

                {/* Navigation Arrows */}
                <button
                    onClick={() => setCurrentPhotoIndex((prev) => (prev - 1 + property.images.length) % property.images.length)}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-4 text-white hover:opacity-70"
                >
                    <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                </button>
                <button
                    onClick={() => setCurrentPhotoIndex((prev) => (prev + 1) % property.images.length)}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-4 text-white hover:opacity-70"
                >
                    <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
                </button>

                <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-white/50 font-mono text-xs sm:text-sm">
                    {currentPhotoIndex + 1} / {property.images.length}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#fafafa] font-sans text-neutral-900 pb-20 overflow-x-hidden">
            {/* Nav / Back Button */}
            <div className={cn(
                "fixed top-0 left-0 right-0 z-40 transition-all duration-300 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between",
                isScrolled ? "bg-white/90 backdrop-blur-md border-b border-neutral-200" : "bg-transparent"
            )}>
                <Link
                    href="/"
                    className={cn(
                        "flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all border",
                        isScrolled
                            ? "bg-white border-neutral-200 text-neutral-900 hover:bg-neutral-50"
                            : "bg-white/90 border-transparent text-neutral-900 hover:bg-white shadow-sm"
                    )}
                >
                    <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="font-mono text-[10px] sm:text-xs uppercase tracking-wider">Back</span>
                </Link>

                {isScrolled && (
                    <div className="hidden sm:flex items-center gap-4 md:gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex flex-col text-right">
                            <span className="text-[10px] sm:text-xs text-neutral-400 font-mono uppercase">Price</span>
                            <span className="font-mono font-medium text-sm sm:text-base">N${(property.price / 1000).toFixed(1)}k/mo</span>
                        </div>
                        <Button className="rounded-full bg-neutral-900 text-white hover:bg-neutral-800 text-xs sm:text-sm px-3 sm:px-4">
                            Contact
                        </Button>
                    </div>
                )}
            </div>

            {/* Hero Image Grid - "TrustMRR style" */}
            <div className="max-w-[1600px] mx-auto pt-16 sm:pt-20 md:pt-24 px-3 sm:px-6 md:px-12 mb-6 sm:mb-8 md:mb-12 animate-in slide-in-from-bottom-8 duration-700 fade-in">
                {/* Mobile: Single Image with View All Button */}
                <div className="md:hidden relative aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden border border-neutral-200 bg-white">
                    <Image
                        src={property.images[0]}
                        alt={property.title}
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 rounded-md bg-white/90 backdrop-blur text-[10px] sm:text-xs font-bold uppercase tracking-wide text-neutral-900 shadow-sm flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live
                        </span>
                    </div>
                    {property.images.length > 1 && (
                        <button
                            onClick={() => setShowAllPhotos(true)}
                            className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm font-semibold text-xs flex items-center gap-1.5"
                        >
                            <Grid3X3 className="w-3 h-3" />
                            {property.images.length} Photos
                        </button>
                    )}
                </div>

                {/* Desktop: Grid Layout */}
                <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2 h-[50vh] md:h-[60vh] rounded-2xl md:rounded-3xl overflow-hidden border border-neutral-200 bg-white p-1">
                    {/* Main Large Image */}
                    <div
                        className="lg:col-span-2 md:col-span-2 h-full relative cursor-pointer group overflow-hidden rounded-xl md:rounded-l-2xl md:rounded-r-none"
                        onClick={() => setShowAllPhotos(true)}
                    >
                        <Image
                            src={property.images[0]}
                            alt={property.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            priority
                        />
                        <div className="absolute top-4 left-4">
                            <span className="px-3 py-1.5 rounded-md bg-white/90 backdrop-blur text-xs font-bold uppercase tracking-wide text-neutral-900 shadow-sm flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Live Listing
                            </span>
                        </div>
                    </div>

                    {/* Secondary Images Column */}
                    <div className="hidden lg:grid grid-rows-2 gap-1.5 sm:gap-2 h-full">
                        {property.images.slice(1, 3).map((img, i) => (
                            <div
                                key={i}
                                className="relative w-full h-full cursor-pointer group overflow-hidden rounded-lg sm:rounded-xl"
                                onClick={() => { setCurrentPhotoIndex(i + 1); setShowAllPhotos(true); }}
                            >
                                <Image
                                    src={img}
                                    alt="Property Detail"
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Final Image / View All */}
                    <div className="hidden md:block relative h-full cursor-pointer group overflow-hidden rounded-r-xl md:rounded-r-2xl bg-neutral-100" onClick={() => setShowAllPhotos(true)}>
                        {property.images[3] ? (
                            <Image
                                src={property.images[3]}
                                alt="Property Detail"
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-60"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-neutral-100" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white/90 backdrop-blur px-4 py-2 sm:px-5 sm:py-3 rounded-full shadow-sm font-semibold text-xs sm:text-sm hover:scale-105 transition-transform">
                                View all photos
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Layout */}
            <div className="max-w-[1400px] mx-auto px-3 sm:px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-20">

                {/* Left Column: Details */}
                <div className="lg:col-span-8 space-y-8 sm:space-y-12 md:space-y-16 animate-in slide-in-from-bottom-8 duration-700 delay-100 fade-in fill-mode-backwards">

                    {/* Title & Key Metrics Header */}
                    <div className="border-b border-neutral-200/60 pb-6 sm:pb-8 md:pb-10">
                        <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
                            <div className="min-w-0 flex-1">
                                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900 mb-1 sm:mb-2 line-clamp-2">
                                    {property.title}
                                </h1>
                                <div className="flex items-center text-neutral-500 gap-1.5 sm:gap-2 text-sm sm:text-base md:text-lg">
                                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                                    <span className="truncate">{property.address}</span>
                                </div>
                            </div>
                            <SavePropertyButton propertyId={property.id} className="bg-white border hover:bg-neutral-50 shrink-0" />
                        </div>

                        {/* Tech-Forward Data Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl bg-white border border-neutral-200">
                            <Metric label="Monthly Rent" value={`N$${property.price.toLocaleString()}`} large highlight />
                            <Metric label="Config" value={`${property.bedrooms}BR / ${property.bathrooms}BA`} />
                            <Metric label="Area" value={`${property.size} m²`} />
                            <Metric label="Type" value={property.type} />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-3 sm:space-y-4 md:space-y-6">
                        <h3 className="text-[10px] sm:text-xs font-bold text-neutral-900 uppercase tracking-widest font-mono">Overview</h3>
                        <p className="text-sm sm:text-base md:text-lg text-neutral-600 leading-relaxed font-light">
                            {property.description}
                        </p>
                    </div>

                    {/* Amenities Grid */}
                    <div className="space-y-3 sm:space-y-4 md:space-y-6 border-t border-neutral-200/60 pt-6 sm:pt-8 md:pt-10">
                        <h3 className="text-[10px] sm:text-xs font-bold text-neutral-900 uppercase tracking-widest font-mono">Features & Amenities</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 sm:gap-y-3 md:gap-y-4 gap-x-4 sm:gap-x-6 md:gap-x-8">
                            {property.amenities.map(amenity => (
                                <div key={amenity} className="flex items-center gap-2 sm:gap-3 text-neutral-700 text-sm sm:text-base">
                                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-500 shrink-0" />
                                    <span className="truncate">{amenity}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Location Map Placeholder */}
                    <div className="space-y-3 sm:space-y-4 md:space-y-6 border-t border-neutral-200/60 pt-6 sm:pt-8 md:pt-10">
                        <h3 className="text-[10px] sm:text-xs font-bold text-neutral-900 uppercase tracking-widest font-mono">Location</h3>
                        {property.coordinates && (
                            <div className="h-[250px] sm:h-[300px] md:h-[400px] rounded-xl sm:rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 relative">
                                <PropertyDetailMap coordinates={property.coordinates} address={property.address} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Sticky Action Card - Hidden on mobile, shown at bottom instead */}
                <div className="hidden lg:block lg:col-span-4 relative">
                    <div className="sticky top-24 md:top-32 space-y-4 sm:space-y-6 animate-in slide-in-from-bottom-8 duration-700 delay-200 fade-in fill-mode-backwards">

                        {/* Request Card */}
                        <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white border border-neutral-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 border-b border-neutral-100 pb-4 sm:pb-6">
                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-neutral-100 overflow-hidden relative border border-neutral-200 shrink-0">
                                    {property.landlord?.avatarUrl ? (
                                        <Image src={property.landlord.avatarUrl} alt="Host" fill className="object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full w-full text-neutral-400">
                                            <User className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-xs text-neutral-500 uppercase font-bold tracking-wide">Listed By</p>
                                    <p className="font-semibold text-neutral-900 text-sm sm:text-base truncate">{property.landlord?.name || 'Verified Landlord'}</p>
                                </div>
                            </div>

                            <ContactLandlordButton propertyId={property.id} />

                            {property.landlord?.phone && (
                                <Button variant="outline" className="w-full h-10 sm:h-12 border-neutral-200 hover:bg-neutral-50 text-neutral-900 font-medium rounded-lg sm:rounded-xl text-sm sm:text-base">
                                    <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                                    {property.landlord.phone}
                                </Button>
                            )}

                            <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 text-[10px] sm:text-xs text-neutral-400">
                                <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span>Identity Verified</span>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Mobile Fixed Bottom CTA */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-neutral-200 p-3 sm:p-4 safe-area-bottom">
                    <div className="flex items-center justify-between gap-3 max-w-[1400px] mx-auto">
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-neutral-400 uppercase font-mono">Monthly Rent</p>
                            <p className="font-bold text-lg sm:text-xl text-neutral-900">N${property.price.toLocaleString()}</p>
                        </div>
                        <ContactLandlordButton propertyId={property.id} variant="mobile" />
                    </div>
                </div>

            </div>
        </div>
    )
}

export default function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    return <PropertyDetailContent id={id} />
}
