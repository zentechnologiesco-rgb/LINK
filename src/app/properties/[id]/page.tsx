"use client"

import { useState, useEffect, useRef, use, useCallback, TouchEvent } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { UserAvatar } from "@/components/ui/user-avatar"
import {
    MapPin,
    BedDouble,
    Bath,
    Maximize,
    Shield,
    X,
    Grid3X3,
    Home,
    ChevronDown,
    ArrowLeft,
    Phone,
    Edit,
    Share2,
    Wifi,
    Car,
    Waves,
    Wind,
    Dumbbell,
    Lock,
    Tv,
    Refrigerator,
    Flame,
    ParkingCircle,
    Trees,
    Dog,
    Shirt,
    Droplets,
    Sun,
    Eye,
    Fence,
    AirVent,
    CheckCircle2,
    Camera,
    Sparkles,
} from "lucide-react"

import { SavePropertyButton } from "@/components/properties/SavePropertyButton"
import { ContactLandlordButton } from "@/components/properties/ContactLandlordButton"
import { PropertyDetailMap } from "@/components/maps/PropertyDetailMap"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { useUser } from "@/components/providers/UserProvider"

// --- Amenity Icon Mapping ---
const AMENITY_ICONS: Record<string, React.ElementType> = {
    wifi: Wifi,
    "wi-fi": Wifi,
    internet: Wifi,
    parking: ParkingCircle,
    "covered parking": ParkingCircle,
    "garage parking": Car,
    pool: Waves,
    "swimming pool": Waves,
    gym: Dumbbell,
    "fitness center": Dumbbell,
    security: Lock,
    "24/7 security": Lock,
    "air conditioning": AirVent,
    "air-conditioning": AirVent,
    ac: AirVent,
    tv: Tv,
    television: Tv,
    fridge: Refrigerator,
    refrigerator: Refrigerator,
    stove: Flame,
    oven: Flame,
    garden: Trees,
    backyard: Trees,
    "pet friendly": Dog,
    "pets allowed": Dog,
    laundry: Shirt,
    "washing machine": Shirt,
    "hot water": Droplets,
    geyser: Droplets,
    balcony: Sun,
    patio: Sun,
    view: Eye,
    "ocean view": Eye,
    fence: Fence,
    "boundary wall": Fence,
    "ceiling fan": Wind,
    fan: Wind,
}

function getAmenityIcon(amenity: string): React.ElementType {
    const lower = amenity.toLowerCase().trim()
    for (const [key, icon] of Object.entries(AMENITY_ICONS)) {
        if (lower.includes(key)) return icon
    }
    return CheckCircle2
}

// --- Types ---
interface PropertyDetails {
    id: string
    landlordId: string
    title: string
    description: string
    price: number
    maxPrice?: number
    address: string
    city: string
    bedrooms: number
    bathrooms: number
    size: number
    type: string
    listingType?: 'single_home' | 'multi_unit_block' | 'student_accommodation'
    unitCount?: number
    availableUnitCount?: number
    unitTypeLabels?: string[]
    images: string[]
    amenities: string[]
    coordinates?: { lat: number; lng: number } | null
    units?: Array<{
        _id: string | null
        title: string
        unitCode?: string
        unitType?: string
        occupancyMode?: string
        roomType?: string
        priceNad: number
        bedrooms?: number
        bathrooms?: number
        sizeSqm?: number
        maxOccupants?: number
        imageUrls?: string[]
        publicationStatus?: string
        occupancyStatus?: string
        isAvailable?: boolean
    }>
    landlord?: {
        name: string | null
        email: string
        phone: string | null
        avatarUrl?: string | null
    } | null
}

function getAvailabilityMeta(occupancyStatus?: string) {
    switch (occupancyStatus) {
        case 'vacant':
            return {
                isAvailable: true,
                label: 'Available',
                className: 'bg-emerald-50 text-emerald-700',
            }
        case 'reserved':
            return {
                isAvailable: false,
                label: 'Reserved',
                className: 'bg-amber-50 text-amber-700',
            }
        case 'occupied':
            return {
                isAvailable: false,
                label: 'Occupied',
                className: 'bg-neutral-900 text-white',
            }
        default:
            return {
                isAvailable: false,
                label: 'Unavailable',
                className: 'bg-neutral-100 text-neutral-500',
            }
    }
}

function UnitInventorySection({ property, isOwner }: { property: PropertyDetails; isOwner: boolean }) {
    const visibleUnits = (property.units ?? []).filter((unit) => unit.publicationStatus === 'published' || isOwner)
    if (visibleUnits.length <= 1 && property.listingType === 'single_home') return null

    return (
        <section className="mb-6">
            <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                    <h2 className="text-[18px] font-[800] tracking-[-0.02em] text-neutral-900">Unit Inventory</h2>
                    <p className="text-[14px] text-neutral-500">
                        {property.availableUnitCount ?? visibleUnits.filter((unit) => unit.isAvailable).length} currently open in this listing.
                    </p>
                </div>
            </div>
            <div className="space-y-3">
                {visibleUnits.map((unit, index) => {
                    const unitImage = unit.imageUrls?.[0] || property.images[0] || '/window.svg'
                    const availability = getAvailabilityMeta(unit.occupancyStatus)
                    return (
                        <div key={`${unit._id ?? 'synthetic'}-${index}`} className="rounded-2xl border border-neutral-200 overflow-hidden bg-white">
                            <div className="flex flex-col sm:flex-row">
                                <div className="relative h-40 sm:h-auto sm:w-44 shrink-0 bg-neutral-100">
                                    <OptimizedImage src={unitImage} alt={unit.title} fill className="object-cover" qualityPreset="card" />
                                </div>
                                <div className="flex-1 p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="font-[800] text-[17px] tracking-[-0.02em] text-neutral-900">
                                                {unit.title}
                                            </p>
                                            <p className="text-[13px] text-neutral-500 mt-1">
                                                {[unit.unitCode, unit.unitType, unit.roomType].filter(Boolean).join(' · ')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[18px] font-[900] tracking-[-0.03em] text-neutral-900">
                                                N${unit.priceNad.toLocaleString()}
                                            </p>
                                            <p className="text-[12px] font-semibold text-neutral-400">/month</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-3 text-[13px] text-neutral-600 font-medium mt-4">
                                        {typeof unit.bedrooms === 'number' && <span>{unit.bedrooms} bed</span>}
                                        {typeof unit.bathrooms === 'number' && <span>{unit.bathrooms} bath</span>}
                                        {typeof unit.sizeSqm === 'number' && unit.sizeSqm > 0 && <span>{unit.sizeSqm} m²</span>}
                                        {typeof unit.maxOccupants === 'number' && unit.maxOccupants > 0 && <span>Max {unit.maxOccupants}</span>}
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-3 items-center">
                                        <span className={cn(
                                            'inline-flex rounded-full px-3 py-1 text-[12px] font-bold',
                                            availability.className
                                        )}>
                                            {availability.label}
                                        </span>
                                        {!isOwner && unit._id && availability.isAvailable && (
                                            <ContactLandlordButton
                                                propertyId={property.id}
                                                unitId={unit._id}
                                                className="w-auto px-4 h-10 rounded-full"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}

// --- Skeleton Loader ---
function PropertySkeleton() {
    return (
        <div className="min-h-screen bg-white">
            {/* Image skeleton */}
            <div className="w-full aspect-[4/3] bg-neutral-100 animate-pulse" />

            <div className="px-5 pt-6 space-y-6">
                {/* Title skeleton */}
                <div className="space-y-3">
                    <div className="h-8 bg-neutral-100 rounded-2xl w-3/4 animate-pulse" />
                    <div className="h-5 bg-neutral-100 rounded-xl w-1/2 animate-pulse" />
                </div>

                {/* Stats skeleton */}
                <div className="grid grid-cols-2 gap-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-20 bg-neutral-50 rounded-2xl animate-pulse" />
                    ))}
                </div>

                {/* Description skeleton */}
                <div className="space-y-2">
                    <div className="h-6 bg-neutral-100 rounded-xl w-2/5 animate-pulse" />
                    <div className="h-4 bg-neutral-50 rounded-lg w-full animate-pulse" />
                    <div className="h-4 bg-neutral-50 rounded-lg w-full animate-pulse" />
                    <div className="h-4 bg-neutral-50 rounded-lg w-3/4 animate-pulse" />
                </div>
            </div>
        </div>
    )
}

// --- Main Component ---
function PropertyDetailContent({ id }: { id: string }) {
    const { user, isAuthenticated } = useUser()
    const [showAllPhotos, setShowAllPhotos] = useState(false)
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
    const [isScrolled, setIsScrolled] = useState(false)
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
    const [isDescriptionClamped, setIsDescriptionClamped] = useState(false)
    const descriptionRef = useRef<HTMLParagraphElement>(null)

    const touchStartX = useRef<number>(0)
    const touchEndX = useRef<number>(0)
    const minSwipeDistance = 50

    const trackView = useMutation(api.recentlyViewed.trackView)
    const hasTracked = useRef(false)

    // Scroll listener for frosted header
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 60)
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const convexProperty = useQuery(api.properties.getById, { propertyId: id as Id<"properties"> })

    // Track view
    useEffect(() => {
        if (convexProperty && !hasTracked.current) {
            hasTracked.current = true
            trackView({ propertyId: id as Id<"properties"> }).catch(() => { })
        }
    }, [convexProperty, id, trackView])

    // Check description clamping
    useEffect(() => {
        if (descriptionRef.current) {
            const el = descriptionRef.current
            setIsDescriptionClamped(el.scrollHeight > el.clientHeight + 2)
        }
    }, [convexProperty])

    // Touch handlers for gallery swipe
    const onTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
        touchEndX.current = 0
        touchStartX.current = e.targetTouches[0].clientX
    }, [])

    const onTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
        touchEndX.current = e.targetTouches[0].clientX
    }, [])

    const onTouchEnd = useCallback((imagesLength: number) => {
        if (!touchStartX.current || !touchEndX.current) return
        const distance = touchStartX.current - touchEndX.current
        if (distance > minSwipeDistance) setCurrentPhotoIndex((prev) => (prev + 1) % imagesLength)
        else if (distance < -minSwipeDistance) setCurrentPhotoIndex((prev) => (prev - 1 + imagesLength) % imagesLength)
        touchStartX.current = 0
        touchEndX.current = 0
    }, [])

    // Loading
    if (convexProperty === undefined) {
        return <PropertySkeleton />
    }

    if (!convexProperty) return notFound()

    const property: PropertyDetails = {
        id: convexProperty._id,
        landlordId: convexProperty.landlordId,
        title: convexProperty.title,
        description: convexProperty.description || 'No description available',
        price: convexProperty.minPriceNad ?? convexProperty.priceNad,
        maxPrice: convexProperty.maxPriceNad ?? convexProperty.priceNad,
        address: convexProperty.address,
        city: convexProperty.city,
        bedrooms: convexProperty.bedrooms || 0,
        bathrooms: convexProperty.bathrooms || 0,
        size: convexProperty.sizeSqm || 0,
        type: convexProperty.propertyType,
        listingType: convexProperty.listingType,
        unitCount: convexProperty.unitCount,
        availableUnitCount: convexProperty.availableUnitCount,
        unitTypeLabels: convexProperty.unitTypeLabels || [],
        images: convexProperty.imageUrls?.length ? convexProperty.imageUrls : ['/window.svg'],
        amenities: convexProperty.amenityNames || [],
        coordinates: convexProperty.coordinates || null,
        units: convexProperty.units || [],
        landlord: convexProperty.landlordInfo || null,
    }

    const landlordIdentity = property.landlord
        ? {
            name: property.landlord.name,
            email: property.landlord.email,
            avatarUrl: property.landlord.avatarUrl,
        }
        : null

    const isOwner = isAuthenticated && user?._id === property.landlordId
    const isMultiUnit = (property.unitCount ?? 1) > 1 || property.listingType === 'multi_unit_block' || property.listingType === 'student_accommodation'
    const priceHeading = isMultiUnit ? `From N$${property.price.toLocaleString()}` : `N$${property.price.toLocaleString()}`
    const availableInventoryCount = property.availableUnitCount ?? property.units?.filter((unit) => unit.occupancyStatus === 'vacant').length ?? 0
    const canContactLandlord = !isOwner && availableInventoryCount > 0

    // --- Full-screen gallery ---
    if (showAllPhotos) {
        return (
            <div className="fixed inset-0 z-[100] bg-black">
                {/* Gallery Header */}
                <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 safe-area-top">
                    <button
                        onClick={() => setShowAllPhotos(false)}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-md active:scale-90 transition-transform"
                    >
                        <X className="w-5 h-5 text-white" strokeWidth={2} />
                    </button>
                    <span className="text-white/90 text-[14px] font-semibold tabular-nums">
                        {currentPhotoIndex + 1} / {property.images.length}
                    </span>
                    <div className="w-9" /> {/* spacer */}
                </div>

                {/* Gallery Swipe Area */}
                <div
                    className="absolute inset-0 flex items-center justify-center pt-14 pb-8"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={() => onTouchEnd(property.images.length)}
                >
                    <div className="relative w-full h-full">
                        <OptimizedImage
                            src={property.images[currentPhotoIndex] || '/window.svg'}
                            alt={`${property.title} — Photo ${currentPhotoIndex + 1}`}
                            fill
                            className="object-contain"
                            qualityPreset="full"
                        />
                    </div>
                </div>

                {/* Gallery Dots */}
                {property.images.length > 1 && property.images.length <= 12 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/40 backdrop-blur-md px-3 py-2 rounded-full safe-area-bottom">
                        {property.images.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPhotoIndex(i)}
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-300",
                                    i === currentPhotoIndex ? "w-5 bg-white" : "w-1.5 bg-white/40"
                                )}
                            />
                        ))}
                    </div>
                )}

                {/* Scroll gallery for many photos */}
                {property.images.length > 12 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full safe-area-bottom">
                        <span className="text-white/80 text-[13px] font-semibold">{currentPhotoIndex + 1} of {property.images.length}</span>
                    </div>
                )}
            </div>
        )
    }

    // --- Page Content ---
    return (
        <div className="bg-white min-h-screen text-[#1A1A1A]" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>

            {/* ===================== MOBILE VIEW ===================== */}
            <div className="lg:hidden pb-28">

                {/* Frosted Glass Header */}
                <header
                    className={cn(
                        "fixed top-0 z-50 w-full px-4 h-14 flex items-center justify-between transition-all duration-300 safe-area-top",
                        isScrolled
                            ? "bg-white/80 backdrop-blur-2xl shadow-[0_1px_0_rgba(0,0,0,0.06)]"
                            : "bg-gradient-to-b from-black/40 to-transparent"
                    )}
                >
                    <Link
                        href="/"
                        className={cn(
                            "w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90",
                            isScrolled
                                ? "bg-neutral-100 text-neutral-900"
                                : "bg-black/20 backdrop-blur-md text-white"
                        )}
                    >
                        <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
                    </Link>

                    {/* Scrolled title */}
                    <div className={cn(
                        "absolute left-14 right-24 text-center transition-all duration-300 overflow-hidden",
                        isScrolled ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                    )}>
                        <span className="text-[15px] font-bold text-neutral-900 truncate block">
                            {property.title}
                        </span>
                    </div>

                    <div className="flex gap-1.5 items-center">
                        <button
                            className={cn(
                                "w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90",
                                isScrolled
                                    ? "bg-neutral-100 text-neutral-900"
                                    : "bg-black/20 backdrop-blur-md text-white"
                            )}
                        >
                            <Share2 className="w-[18px] h-[18px]" strokeWidth={2.5} />
                        </button>
                        {!isOwner && (
                            <div className={cn(
                                "rounded-full overflow-hidden",
                                !isScrolled && "[&_button]:bg-black/20 [&_button]:backdrop-blur-md [&_button]:border-0 [&_button]:text-white [&_button]:hover:bg-black/30 [&_svg]:text-white"
                            )}>
                                <SavePropertyButton
                                    propertyId={property.id}
                                    variant="icon"
                                    className={cn(
                                        "w-9 h-9 shadow-none border-0 transition-all",
                                        isScrolled
                                            ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-900"
                                            : ""
                                    )}
                                />
                            </div>
                        )}
                    </div>
                </header>

                <main>
                    {/* Immersive Image Gallery */}
                    <div
                        className="relative w-full aspect-[4/3] bg-neutral-100 overflow-hidden"
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={() => onTouchEnd(property.images.length)}
                    >
                        {/* Current Image with transition */}
                        <div className="relative w-full h-full">
                            <OptimizedImage
                                src={property.images[currentPhotoIndex] || '/window.svg'}
                                alt={property.title}
                                fill
                                className="object-cover"
                                qualityPreset="hero"
                                priority
                            />
                        </div>

                        {/* Photo count badge */}
                        <button
                            onClick={() => setShowAllPhotos(true)}
                            className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                        >
                            <Camera className="w-3.5 h-3.5" />
                            <span className="text-[12px] font-semibold tabular-nums">{currentPhotoIndex + 1}/{property.images.length}</span>
                        </button>

                        {/* Dot indicators */}
                        {property.images.length > 1 && property.images.length <= 8 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                                {property.images.map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "h-[6px] rounded-full transition-all duration-300",
                                            i === currentPhotoIndex ? "w-5 bg-white shadow-sm" : "w-[6px] bg-white/50"
                                        )}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="px-5 pt-5 pb-8">

                        {/* Price + Title */}
                        <div className="mb-5">
                            <div className="flex items-baseline gap-1.5 mb-1.5">
                                <span className="text-[28px] font-[900] tracking-[-0.03em] text-neutral-900 leading-none">
                                    {priceHeading}
                                </span>
                                <span className="text-[15px] font-semibold text-neutral-400">/month</span>
                            </div>
                            <h1 className="text-[22px] font-[800] leading-[1.15] tracking-[-0.02em] text-neutral-900 mb-2">
                                {property.title}
                            </h1>
                            <div className="flex items-center gap-1.5 text-neutral-500">
                                <MapPin className="w-[14px] h-[14px]" strokeWidth={2.5} />
                                <span className="text-[14px] font-semibold">{property.address}, {property.city}</span>
                            </div>
                        </div>

                        {/* Bento Stat Grid */}
                        <div className="grid grid-cols-4 gap-2 mb-6">
                            <div className="bg-neutral-50 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 border border-neutral-100/80">
                                <BedDouble className="w-5 h-5 text-neutral-600" strokeWidth={2} />
                                <span className="text-[16px] font-[900] text-neutral-900 leading-none">{property.bedrooms}</span>
                                <span className="text-[11px] font-semibold text-neutral-400">Beds</span>
                            </div>
                            <div className="bg-neutral-50 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 border border-neutral-100/80">
                                <Bath className="w-5 h-5 text-neutral-600" strokeWidth={2} />
                                <span className="text-[16px] font-[900] text-neutral-900 leading-none">{property.bathrooms}</span>
                                <span className="text-[11px] font-semibold text-neutral-400">Baths</span>
                            </div>
                            <div className="bg-neutral-50 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 border border-neutral-100/80">
                                <Maximize className="w-5 h-5 text-neutral-600" strokeWidth={2} />
                                <span className="text-[16px] font-[900] text-neutral-900 leading-none">{property.size}</span>
                                <span className="text-[11px] font-semibold text-neutral-400">m²</span>
                            </div>
                            <div className="bg-neutral-50 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 border border-neutral-100/80">
                                <Home className="w-5 h-5 text-neutral-600" strokeWidth={2} />
                                <span className="text-[13px] font-[800] text-neutral-900 leading-none capitalize truncate max-w-full">{property.type}</span>
                                <span className="text-[11px] font-semibold text-neutral-400">Type</span>
                            </div>
                        </div>

                        {/* About — iOS Grouped Section */}
                        <section className="mb-6">
                            <h2 className="text-[18px] font-[800] tracking-[-0.02em] text-neutral-900 mb-3">About</h2>
                            <div className="bg-neutral-50 rounded-2xl border border-neutral-100/80 p-4">
                                <p
                                    ref={descriptionRef}
                                    className={cn(
                                        "text-[15px] text-neutral-600 font-medium leading-[1.6] whitespace-pre-line transition-all duration-500",
                                        !isDescriptionExpanded && "line-clamp-4"
                                    )}
                                >
                                    {property.description}
                                </p>
                                {isDescriptionClamped && (
                                    <button
                                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                        className="flex items-center gap-1 mt-3 text-[14px] font-bold text-neutral-900 active:opacity-60 transition-opacity"
                                    >
                                        {isDescriptionExpanded ? 'Show less' : 'Read more'}
                                        <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isDescriptionExpanded && "rotate-180")} />
                                    </button>
                                )}
                            </div>
                        </section>

                        <UnitInventorySection property={property} isOwner={isOwner} />

                        {/* Amenities — iOS Grouped List */}
                        {property.amenities.length > 0 && (
                            <section className="mb-6">
                                <h2 className="text-[18px] font-[800] tracking-[-0.02em] text-neutral-900 mb-3">Amenities</h2>
                                <div className="bg-neutral-50 rounded-2xl border border-neutral-100/80 overflow-hidden">
                                    {property.amenities.map((amenity, idx) => {
                                        const Icon = getAmenityIcon(amenity)
                                        return (
                                            <div
                                                key={amenity}
                                                className={cn(
                                                    "flex items-center gap-3.5 px-4 py-3.5",
                                                    idx < property.amenities.length - 1 && "border-b border-neutral-100/80"
                                                )}
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-neutral-100 shrink-0">
                                                    <Icon className="w-[18px] h-[18px] text-neutral-700" strokeWidth={2} />
                                                </div>
                                                <span className="text-[15px] font-semibold text-neutral-700">{amenity}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Host Card — iOS Section */}
                        <section className="mb-6">
                            <h2 className="text-[18px] font-[800] tracking-[-0.02em] text-neutral-900 mb-3">Your Host</h2>
                            <div className="bg-neutral-50 rounded-2xl border border-neutral-100/80 p-4">
                                <div className="flex items-center gap-3.5">
                                    <UserAvatar className="w-14 h-14 shrink-0 border-2 border-white shadow-sm" user={landlordIdentity} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-[800] text-[16px] text-neutral-900 truncate leading-tight">
                                            {property.landlord?.name || property.landlord?.email || 'Property Owner'}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <Shield className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2.5} />
                                            <span className="text-[13px] font-semibold text-emerald-600">Verified Host</span>
                                        </div>
                                    </div>
                                    {property.landlord?.phone && !isOwner && (
                                        <a
                                            href={`tel:${property.landlord.phone}`}
                                            className="w-11 h-11 rounded-full bg-white flex items-center justify-center border border-neutral-200 text-neutral-900 active:scale-90 transition-transform shrink-0"
                                        >
                                            <Phone className="w-5 h-5" strokeWidth={2} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Location */}
                        {property.coordinates && (
                            <section className="mb-6">
                                <h2 className="text-[18px] font-[800] tracking-[-0.02em] text-neutral-900 mb-1">Location</h2>
                                <p className="text-[14px] font-semibold text-neutral-500 mb-3">{property.address}, {property.city}</p>
                                <div className="h-[220px] sm:h-[280px] w-full rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-100">
                                    <PropertyDetailMap coordinates={property.coordinates} address={property.address} />
                                </div>
                            </section>
                        )}

                    </div>
                </main>

                {/* Frosted Floating Action Bar */}
                <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-neutral-200/60 px-5 py-3 flex items-center justify-between safe-area-bottom z-50">
                    {isOwner ? (
                        <div className="w-full">
                            <Link
                                href={`/properties/${property.id}/edit`}
                                className="w-full bg-neutral-900 hover:bg-black text-white font-[800] rounded-[14px] h-[50px] text-[15px] flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
                            >
                                <Edit className="w-[18px] h-[18px]" /> Edit Listing
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col justify-center">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[20px] font-[900] text-neutral-900 leading-none tracking-[-0.02em]">
                                        {priceHeading}
                                    </span>
                                </div>
                                <span className="text-neutral-400 font-semibold text-[13px] mt-0.5">/month</span>
                            </div>
                            {canContactLandlord ? (
                                <ContactLandlordButton
                                    propertyId={property.id}
                                    variant="mobile"
                                    className="bg-neutral-900 hover:bg-black text-white font-[800] rounded-[14px] px-7 h-[50px] text-[15px] border-0 shadow-none transition-all active:scale-[0.97]"
                                />
                            ) : (
                                <div className="flex h-[50px] items-center justify-center rounded-[14px] bg-neutral-100 px-5 text-[14px] font-[800] text-neutral-500">
                                    Currently unavailable
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ===================== DESKTOP VIEW ===================== */}
            <div className="hidden lg:block pb-32">
                {/* Desktop Header */}
                <header className={cn(
                    "fixed top-0 left-0 right-0 z-50 h-[72px] transition-all duration-300 px-10 flex items-center justify-between",
                    isScrolled ? "bg-white/80 backdrop-blur-2xl shadow-[0_1px_0_rgba(0,0,0,0.06)]" : "bg-transparent"
                )}>
                    <Link href="/" className="w-10 h-10 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-900 flex items-center justify-center rounded-full transition-all shadow-sm active:scale-95">
                        <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
                    </Link>
                    <div className="flex gap-2 items-center">
                        <button className="flex items-center gap-2 hover:bg-neutral-100 px-4 py-2 rounded-full font-bold text-[14px] transition-colors">
                            <Share2 className="w-[18px] h-[18px]" strokeWidth={2} /> Share
                        </button>
                        {!isOwner && (
                            <SavePropertyButton variant="default" propertyId={property.id} className="h-10 font-bold text-[14px] px-4 bg-transparent hover:bg-neutral-100 rounded-full border-0 text-neutral-900 shadow-none flex-row-reverse gap-2" />
                        )}
                    </div>
                </header>

                <main className="max-w-[1200px] mx-auto pt-24 px-10">
                    {/* Desktop Title Area */}
                    <h1 className="text-[36px] font-[900] tracking-[-0.03em] leading-tight mb-2 text-neutral-900">{property.title}</h1>
                    <div className="flex items-center gap-4 text-neutral-600 mb-8">
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-[16px] h-[16px]" strokeWidth={2.5} />
                            <span className="font-semibold text-[15px] text-neutral-600">{property.address}, {property.city}</span>
                        </div>
                    </div>

                    {/* Desktop 5-image grid */}
                    <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[460px] rounded-[24px] overflow-hidden relative group">
                        <div className="col-span-2 row-span-2 relative cursor-pointer" onClick={() => setShowAllPhotos(true)}>
                            <OptimizedImage src={property.images[0] || '/window.svg'} alt="Hero" fill className="object-cover hover:brightness-95 transition-all duration-300" qualityPreset="hero" />
                        </div>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="relative cursor-pointer" onClick={() => { setCurrentPhotoIndex(i); setShowAllPhotos(true) }}>
                                <OptimizedImage src={property.images[i] || '/window.svg'} alt={`Gallery ${i}`} fill className="object-cover hover:brightness-95 transition-all duration-300" />
                            </div>
                        ))}

                        <button onClick={() => setShowAllPhotos(true)} className="absolute bottom-5 right-5 bg-white/90 backdrop-blur-md border border-neutral-200 px-4 py-2.5 rounded-xl font-[800] text-[13px] flex items-center gap-2 hover:bg-white transition-all shadow-sm active:scale-95">
                            <Grid3X3 className="w-4 h-4" /> Show all photos
                        </button>
                    </div>

                    {/* Desktop Two-Column Layout */}
                    <div className="flex gap-16 mt-10">
                        {/* Left Content */}
                        <div className="flex-1 min-w-0">
                            {/* Host + Stats Row */}
                            <div className="flex items-center justify-between pb-7 border-b border-neutral-100 mb-7">
                                <div>
                                    <h2 className="text-[24px] font-[900] tracking-[-0.02em] text-neutral-900">
                                        {isMultiUnit
                                            ? availableInventoryCount > 0
                                                ? `${availableInventoryCount} units available with ${property.landlord?.name || 'Owner'}`
                                                : `No units currently available with ${property.landlord?.name || 'Owner'}`
                                            : `${property.type.charAt(0).toUpperCase() + property.type.slice(1).toLowerCase()} hosted by ${property.landlord?.name || 'Owner'}`}
                                    </h2>
                                    <div className="flex gap-2 mt-1.5 text-[15px] text-neutral-500 font-medium">
                                        <span>{property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}</span>
                                        <span>·</span>
                                        <span>{property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}</span>
                                        <span>·</span>
                                        <span>{property.size} m²</span>
                                        {isMultiUnit && (
                                            <>
                                                <span>·</span>
                                                <span>{property.unitCount} units</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <UserAvatar className="w-14 h-14 shrink-0 border-2 border-white shadow-sm" user={landlordIdentity} />
                            </div>

                            {/* Desktop Highlights */}
                            <div className="space-y-5 pb-7 border-b border-neutral-100 mb-7">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center shrink-0 border border-neutral-100">
                                        <Home className="w-5 h-5 text-neutral-700" strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-[16px] font-[800] text-neutral-900">{isMultiUnit ? 'Grouped inventory' : 'Entire home'}</h3>
                                        <p className="text-[14px] font-medium text-neutral-500 mt-0.5">
                                            {isMultiUnit
                                                ? 'Browse individual units, rooms, or bed spaces inside this listing.'
                                                : 'You&apos;ll have the entire space to yourself.'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center shrink-0 border border-neutral-100">
                                        <Sparkles className="w-5 h-5 text-neutral-700" strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-[16px] font-[800] text-neutral-900">Enhanced Clean</h3>
                                        <p className="text-[14px] font-medium text-neutral-500 mt-0.5">This host committed to LINK&apos;s enhanced cleaning standards.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center shrink-0 border border-neutral-100">
                                        <MapPin className="w-5 h-5 text-neutral-700" strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-[16px] font-[800] text-neutral-900">Great location</h3>
                                        <p className="text-[14px] font-medium text-neutral-500 mt-0.5">Highly rated by recent tenants for its location.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <section className="pb-7 border-b border-neutral-100 mb-7">
                                <h2 className="text-[22px] font-[900] tracking-[-0.02em] mb-4">About this space</h2>
                                <p className="text-[15px] text-neutral-600 font-medium leading-[1.65] whitespace-pre-line break-words max-w-[620px]">
                                    {property.description}
                                </p>
                            </section>

                            <UnitInventorySection property={property} isOwner={isOwner} />

                            {/* Amenities Desktop */}
                            {property.amenities.length > 0 && (
                                <section className="pb-7 border-b border-neutral-100 mb-7">
                                    <h2 className="text-[22px] font-[900] tracking-[-0.02em] mb-5">What this place offers</h2>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 max-w-[620px]">
                                        {property.amenities.map(amenity => {
                                            const Icon = getAmenityIcon(amenity)
                                            return (
                                                <div key={amenity} className="flex items-center gap-3.5">
                                                    <div className="w-9 h-9 rounded-xl bg-neutral-50 flex items-center justify-center border border-neutral-100 shrink-0">
                                                        <Icon className="w-[20px] h-[20px] text-neutral-700" strokeWidth={1.5} />
                                                    </div>
                                                    <span className="text-[15px] font-medium text-neutral-700">{amenity}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Desktop Sticky Sidebar */}
                        <div className="w-[340px] max-w-[380px] shrink-0 relative">
                            <div className="sticky top-24 bg-white border border-neutral-200 rounded-[24px] shadow-[0_8px_28px_rgba(0,0,0,0.06)] p-6">
                                <div className="flex items-baseline gap-1.5 mb-6">
                                    <span className="text-[26px] font-[900] tracking-[-0.03em] text-neutral-900">{priceHeading}</span>
                                    <span className="text-[15px] font-semibold text-neutral-400 ml-0.5">/ month</span>
                                </div>

                                <div className="space-y-3">
                                    {isOwner ? (
                                        <div className="space-y-3">
                                            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100">
                                                <h3 className="font-[800] text-[14px] mb-0.5">You own this listing</h3>
                                                <p className="text-[13px] text-neutral-500 font-medium">Manage your details and pricing.</p>
                                            </div>
                                            <Link href={`/properties/${property.id}/edit`} className="w-full h-[50px] bg-neutral-900 hover:bg-black text-white text-[15px] font-[800] rounded-[14px] transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                                <Edit className="w-[18px] h-[18px]" /> Edit Listing
                                            </Link>
                                        </div>
                                    ) : (
                                        <>
                                            {canContactLandlord ? (
                                                <ContactLandlordButton
                                                    propertyId={property.id}
                                                    className="w-full h-[50px] bg-neutral-900 hover:bg-black text-white text-[15px] font-[800] rounded-[14px] border-0 transition-all active:scale-[0.98]"
                                                />
                                            ) : (
                                                <div className="flex h-[50px] items-center justify-center rounded-[14px] bg-neutral-100 text-[15px] font-[800] text-neutral-500">
                                                    Currently unavailable
                                                </div>
                                            )}
                                            <SavePropertyButton
                                                variant="default"
                                                propertyId={property.id}
                                                className="w-full h-[50px] bg-white border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-900 text-[15px] font-[700] rounded-[14px] transition-all shadow-none"
                                            />
                                        </>
                                    )}
                                </div>

                                {!isOwner && (
                                    <div className="flex justify-center pt-5">
                                        <span className="text-[13px] font-medium text-neutral-400">You won&apos;t be charged yet</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Desktop Map */}
                    {property.coordinates && (
                        <div className="pt-8 border-t border-neutral-100 mt-8">
                            <h2 className="text-[22px] font-[900] tracking-[-0.02em] mb-2">Where you&apos;ll be</h2>
                            <p className="text-[15px] font-medium text-neutral-500 mb-5">{property.address}, {property.city}</p>
                            <div className="h-[440px] w-full rounded-[20px] overflow-hidden bg-neutral-100 border border-neutral-200">
                                <PropertyDetailMap coordinates={property.coordinates} address={property.address} />
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

export default function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    return <PropertyDetailContent id={id} />
}
