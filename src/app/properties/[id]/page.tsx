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
import { InquiryDialog } from "@/components/properties/InquiryDialog"
import { SavePropertyButton } from "@/components/properties/SavePropertyButton"
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
            <span className="text-[10px] uppercase text-neutral-400 font-semibold tracking-wider font-mono">{label}</span>
            <span className={cn(
                "font-mono font-medium text-neutral-900",
                highlight && "text-blue-600",
                large ? "text-2xl" : "text-base"
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
                    className="absolute top-6 right-6 z-50 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-all"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="relative w-full max-w-7xl aspect-[16/10]">
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-4 text-white hover:opacity-70"
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                    onClick={() => setCurrentPhotoIndex((prev) => (prev + 1) % property.images.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-4 text-white hover:opacity-70"
                >
                    <ChevronRight className="w-8 h-8" />
                </button>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 font-mono text-sm">
                    {currentPhotoIndex + 1} / {property.images.length}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#fafafa] font-sans text-neutral-900 pb-20">
            {/* Nav / Back Button */}
            <div className={cn(
                "fixed top-0 left-0 right-0 z-40 transition-all duration-300 px-6 py-4 flex items-center justify-between",
                isScrolled ? "bg-white/90 backdrop-blur-md border-b border-neutral-200" : "bg-transparent"
            )}>
                <Link
                    href="/"
                    className={cn(
                        "flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full transition-all border",
                        isScrolled
                            ? "bg-white border-neutral-200 text-neutral-900 hover:bg-neutral-50"
                            : "bg-white/90 border-transparent text-neutral-900 hover:bg-white shadow-sm"
                    )}
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="font-mono text-xs uppercase tracking-wider">Back to Feed</span>
                </Link>

                {isScrolled && (
                    <div className="hidden md:flex items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex flex-col text-right">
                            <span className="text-xs text-neutral-400 font-mono uppercase">Price</span>
                            <span className="font-mono font-medium">N${(property.price / 1000).toFixed(1)}k/mo</span>
                        </div>
                        <Button className="rounded-full bg-neutral-900 text-white hover:bg-neutral-800">
                            Contact Landlord
                        </Button>
                    </div>
                )}
            </div>

            {/* Hero Image Grid - "TrustMRR style" */}
            <div className="max-w-[1600px] mx-auto pt-24 px-6 md:px-12 mb-12 animate-in slide-in-from-bottom-8 duration-700 fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 h-[50vh] md:h-[60vh] rounded-3xl overflow-hidden border border-neutral-200 bg-white p-1">
                    {/* Main Large Image */}
                    <div
                        className="lg:col-span-2 md:col-span-2 h-full relative cursor-pointer group overflow-hidden rounded-2xl md:rounded-l-2xl md:rounded-r-none"
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
                    <div className="hidden lg:grid grid-rows-2 gap-2 h-full">
                        {property.images.slice(1, 3).map((img, i) => (
                            <div
                                key={i}
                                className="relative w-full h-full cursor-pointer group overflow-hidden rounded-xl"
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
                    <div className="hidden md:block relative h-full cursor-pointer group overflow-hidden rounded-r-2xl bg-neutral-100" onClick={() => setShowAllPhotos(true)}>
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
                            <div className="bg-white/90 backdrop-blur px-5 py-3 rounded-full shadow-sm font-semibold text-sm hover:scale-105 transition-transform">
                                View all photos
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Layout */}
            <div className="max-w-[1400px] mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">

                {/* Left Column: Details */}
                <div className="lg:col-span-8 space-y-16 animate-in slide-in-from-bottom-8 duration-700 delay-100 fade-in fill-mode-backwards">

                    {/* Title & Key Metrics Header */}
                    <div className="border-b border-neutral-200/60 pb-10">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 mb-2">
                                    {property.title}
                                </h1>
                                <div className="flex items-center text-neutral-500 gap-2 text-lg">
                                    <MapPin className="w-4 h-4" />
                                    <span>{property.address}</span>
                                </div>
                            </div>
                            <SavePropertyButton propertyId={property.id} className="bg-white border hover:bg-neutral-50" />
                        </div>

                        {/* Tech-Forward Data Grid */}
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-6 p-6 rounded-2xl bg-white border border-neutral-200">
                            <Metric label="Monthly Rent" value={`N$${property.price.toLocaleString()}`} large highlight />
                            <Metric label="Configuration" value={`${property.bedrooms} Bed / ${property.bathrooms} Bath`} />
                            <Metric label="Total Area" value={`${property.size} m²`} />
                            <Metric label="Asset Type" value={property.type} />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-widest font-mono">Overview</h3>
                        <p className="text-lg text-neutral-600 leading-relaxed font-light">
                            {property.description}
                        </p>
                    </div>

                    {/* Amenities Grid */}
                    <div className="space-y-6 border-t border-neutral-200/60 pt-10">
                        <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-widest font-mono">Features & Amenities</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                            {property.amenities.map(amenity => (
                                <div key={amenity} className="flex items-center gap-3 text-neutral-700">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    <span>{amenity}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Location Map Placeholder */}
                    <div className="space-y-6 border-t border-neutral-200/60 pt-10">
                        <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-widest font-mono">Location Data</h3>
                        {property.coordinates && (
                            <div className="h-[400px] rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 relative">
                                <PropertyDetailMap coordinates={property.coordinates} address={property.address} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Sticky Action Card */}
                <div className="lg:col-span-4 relative">
                    <div className="sticky top-32 space-y-6 animate-in slide-in-from-bottom-8 duration-700 delay-200 fade-in fill-mode-backwards">

                        {/* Request Card */}
                        <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            <div className="flex items-center gap-4 mb-6 border-b border-neutral-100 pb-6">
                                <div className="h-12 w-12 rounded-full bg-neutral-100 overflow-hidden relative border border-neutral-200">
                                    {property.landlord?.avatarUrl ? (
                                        <Image src={property.landlord.avatarUrl} alt="Host" fill className="object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full w-full text-neutral-400">
                                            <User className="w-5 h-5" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500 uppercase font-bold tracking-wide">Listed By</p>
                                    <p className="font-semibold text-neutral-900">{property.landlord?.name || 'Verified Landlord'}</p>
                                </div>
                            </div>

                            <InquiryDialog
                                propertyId={property.id}
                                propertyTitle={property.title}
                                trigger={
                                    <Button className="w-full h-12 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-xl mb-3 shadow-lg shadow-neutral-900/10">
                                        Send Message
                                    </Button>
                                }
                            />

                            {property.landlord?.phone && (
                                <Button variant="outline" className="w-full h-12 border-neutral-200 hover:bg-neutral-50 text-neutral-900 font-medium rounded-xl">
                                    <Phone className="w-4 h-4 mr-2" />
                                    {property.landlord.phone}
                                </Button>
                            )}

                            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-400">
                                <Shield className="w-3 h-3" />
                                <span>Identity Verified</span>
                            </div>
                        </div>

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
