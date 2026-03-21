"use client"

import { useState, useEffect, useRef, use, useCallback, TouchEvent } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { OptimizedImage } from "@/components/ui/optimized-image"
import {
    MapPin,
    BedDouble,
    Bath,
    Maximize,
    User,
    Shield,
    X,
    Grid3X3,
    Home,
    CheckCircle2,
    ArrowLeft,
    Star,
    Box,
    Heart,
    Phone,
    Edit,
    Share
} from "lucide-react"

import { SavePropertyButton } from "@/components/properties/SavePropertyButton"
import { ContactLandlordButton } from "@/components/properties/ContactLandlordButton"
import { PropertyDetailMap } from "@/components/maps/PropertyDetailMap"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { useUser } from "@/components/providers/UserProvider"

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
    coordinates?: { lat: number; lng: number } | null
    landlord?: {
        name: string | null
        email: string
        phone: string | null
        avatarUrl?: string | null
    } | null
}

function PropertyDetailContent({ id }: { id: string }) {
    const { user, isAuthenticated } = useUser()
    const [showAllPhotos, setShowAllPhotos] = useState(false)
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
    const [isScrolled, setIsScrolled] = useState(false)

    const touchStartX = useRef<number>(0)
    const touchEndX = useRef<number>(0)
    const minSwipeDistance = 50

    const trackView = useMutation(api.recentlyViewed.trackView)
    const hasTracked = useRef(false)

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 100)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const convexProperty = useQuery(api.properties.getById, { propertyId: id as Id<"properties"> })

    useEffect(() => {
        if (convexProperty && !hasTracked.current) {
            hasTracked.current = true
            trackView({ propertyId: id as Id<"properties"> }).catch(() => { })
        }
    }, [convexProperty, id, trackView])

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

    if (convexProperty === undefined) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
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
        coordinates: convexProperty.coordinates || null,
        landlord: convexProperty.landlordInfo || null,
    }

    const isOwner = isAuthenticated && user?._id === property.landlordId

    if (showAllPhotos) {
        return (
            <div className="fixed inset-0 z-[100] bg-black">
                <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4">
                    <button onClick={() => setShowAllPhotos(false)} className="bg-white rounded-full p-2"><X className="w-5 h-5 text-black" /></button>
                    <div className="text-white text-sm">{currentPhotoIndex + 1} / {property.images.length}</div>
                </div>
                <div className="absolute inset-0 flex flex-col pt-16 pb-8 overflow-y-auto px-4 md:px-20 gap-4">
                     {property.images.map((img, idx) => (
                         <div key={idx} className="relative w-full aspect-video md:aspect-[16/9] bg-black">
                              <OptimizedImage src={img} alt={`Gallery ${idx}`} fill className="object-contain" />
                         </div>
                     ))}
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white min-h-screen text-[#1A1A1A]" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* --- MOBILE VIEW --- */}
            <div className="lg:hidden pb-32">
                <header className="fixed top-0 z-50 bg-white/90 backdrop-blur-xl w-full px-5 h-[68px] flex items-center justify-between border-b border-neutral-100/50 safe-area-top">
                    <Link href="/" className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-neutral-100 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-neutral-900" strokeWidth={2.5} />
                    </Link>
                    <div className="flex gap-1 items-center">
                        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors">
                            <Share className="w-5 h-5 text-neutral-900" strokeWidth={2.5} />
                        </button>
                        {!isOwner && (
                            <div className="scale-[0.85] origin-right flex items-center">
                                 <SavePropertyButton propertyId={property.id} variant="icon" className="shadow-none border-0 hover:bg-neutral-100" />
                            </div>
                        )}
                    </div>
                </header>

                <main className="mt-[68px]">
                    <div className="relative aspect-[4/3] w-full bg-neutral-100" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={() => onTouchEnd(property.images.length)}>
                        <OptimizedImage src={property.images[currentPhotoIndex] || '/window.svg'} alt={property.title} fill className="object-cover" priority />

                        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-neutral-100">
                            <Box className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
                            <span className="text-[12px] font-[900]">3D</span>
                        </div>

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex justify-center gap-1.5 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                            {property.images.map((_, i) => (
                                <div key={i} className={cn("h-1.5 rounded-full transition-all", i === currentPhotoIndex ? "w-4 bg-white" : "w-1.5 bg-white/60")} />
                            ))}
                        </div>
                    </div>

                    <div className="px-5 pt-6 pb-8">
                        <h1 className="text-[26px] sm:text-[32px] font-[900] leading-[1.1] tracking-[-0.03em] text-neutral-900 mb-2">
                            {property.title}
                        </h1>

                        <div className="flex items-center gap-4 text-neutral-500 mb-6">
                            <div className="flex items-center gap-1.5">
                                <Star className="w-[18px] h-[18px] text-[#FACC15] fill-[#FACC15]" />
                                <span className="text-[15px] font-[900] text-neutral-900">5.0</span>
                                <span className="text-[15px] font-bold underline decoration-neutral-300 underline-offset-2">78 reviews</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-neutral-300" />
                            <div className="flex items-center gap-1.5">
                                <MapPin className="w-[16px] h-[16px]" strokeWidth={2.5} />
                                <span className="text-[15px] font-bold underline decoration-neutral-300 underline-offset-2">
                                    {property.city}
                                </span>
                            </div>
                        </div>

                        {/* Host info */}
                        <div className="flex items-center gap-4 py-5 border-y border-neutral-100">
                            <div className="w-12 h-12 rounded-full bg-neutral-100 overflow-hidden relative shrink-0 border border-neutral-200">
                                {property.landlord?.avatarUrl ? (
                                    <OptimizedImage src={property.landlord.avatarUrl} alt="Landlord" fill className="object-cover" />
                                ) : (
                                    <div className="bg-neutral-100 w-full h-full flex items-center justify-center">
                                        <User className="w-6 h-6 text-neutral-400" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="text-[16px] font-[900] text-neutral-900">Hosted by {property.landlord?.name || 'Property Owner'}</div>
                                <div className="text-[14px] font-semibold text-neutral-500">Joined in 2024</div>
                            </div>
                        </div>

                        {/* BENTO STATS */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-6 border-b border-neutral-100">
                            <div className="bg-neutral-50 rounded-[20px] p-4 flex flex-col gap-2 relative border border-neutral-100/50">
                                <Maximize className="w-5 h-5 text-neutral-700" strokeWidth={2.5} />
                                <div>
                                    <div className="text-[17px] font-[900] leading-none">{property.size} m²</div>
                                    <div className="text-[13px] font-bold text-neutral-400 mt-1">Area</div>
                                </div>
                            </div>
                            <div className="bg-neutral-50 rounded-[20px] p-4 flex flex-col gap-2 relative border border-neutral-100/50">
                                <BedDouble className="w-5 h-5 text-neutral-700" strokeWidth={2.5} />
                                <div>
                                    <div className="text-[17px] font-[900] leading-none">{property.bedrooms}</div>
                                    <div className="text-[13px] font-bold text-neutral-400 mt-1">Beds</div>
                                </div>
                            </div>
                            <div className="bg-neutral-50 rounded-[20px] p-4 flex flex-col gap-2 relative border border-neutral-100/50">
                                <Bath className="w-5 h-5 text-neutral-700" strokeWidth={2.5} />
                                <div>
                                    <div className="text-[17px] font-[900] leading-none">{property.bathrooms}</div>
                                    <div className="text-[13px] font-bold text-neutral-400 mt-1">Baths</div>
                                </div>
                            </div>
                            <div className="bg-neutral-50 rounded-[20px] p-4 flex flex-col gap-2 relative border border-neutral-100/50">
                                <Home className="w-5 h-5 text-neutral-700" strokeWidth={2.5} />
                                <div>
                                    <div className="text-[17px] font-[900] leading-none capitalize">{property.type}</div>
                                    <div className="text-[13px] font-bold text-neutral-400 mt-1">Type</div>
                                </div>
                            </div>
                        </div>

                        {/* ABOUT */}
                        <div className="py-6 border-b border-neutral-100">
                            <h2 className="text-[22px] font-[900] tracking-[-0.03em] text-neutral-900 mb-4">About this home</h2>
                            <p className="text-[16px] text-neutral-600 font-medium leading-[1.6] whitespace-pre-line">
                                {property.description}
                            </p>
                        </div>

                        {/* AMENITIES */}
                        {property.amenities.length > 0 && (
                            <div className="py-6 border-b border-neutral-100">
                                <h2 className="text-[22px] font-[900] tracking-[-0.03em] text-neutral-900 mb-5">What this place offers</h2>
                                <div className="flex flex-col gap-4">
                                    {property.amenities.map(amenity => (
                                        <div key={amenity} className="flex items-center gap-4">
                                            <CheckCircle2 className="w-[26px] h-[26px] text-neutral-800" strokeWidth={2} />
                                            <span className="text-[16px] font-medium text-neutral-700">{amenity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* LOCATION */}
                        {property.coordinates && (
                            <div className="py-6">
                                <h2 className="text-[22px] font-[900] tracking-[-0.03em] text-neutral-900 mb-4">Where you'll be</h2>
                                <div className="mb-4">
                                    <span className="text-[16px] font-semibold text-neutral-700">{property.address}, {property.city}</span>
                                </div>
                                <div className="h-[220px] sm:h-[300px] w-full rounded-[24px] overflow-hidden bg-neutral-100 border border-neutral-200">
                                    <PropertyDetailMap coordinates={property.coordinates} address={property.address} />
                                </div>
                            </div>
                        )}
                        
                        {/* Host Contact info mobile */}
                        <div className="py-6 mt-4">
                            <div className="flex items-center gap-4 bg-neutral-50 rounded-[20px] px-5 py-5 border border-neutral-100">
                                <div className="w-14 h-14 rounded-full bg-neutral-200 overflow-hidden relative shrink-0 border border-neutral-200">
                                    {property.landlord?.avatarUrl ? (
                                        <OptimizedImage src={property.landlord.avatarUrl} alt="Landlord" fill className="object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full w-full text-neutral-400">
                                            <User className="w-7 h-7" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-[900] text-[16px] text-neutral-900 truncate">
                                        {property.landlord?.name || 'Property Owner'}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[13px] font-bold text-neutral-500 mt-0.5">
                                        <Shield className="w-3.5 h-3.5 text-[#10B981]" />
                                        <span>Verified Host</span>
                                    </div>
                                </div>
                                {property.landlord?.phone && !isOwner && (
                                    <a
                                        href={`tel:${property.landlord.phone}`}
                                        className="flex items-center justify-center w-11 h-11 rounded-full bg-white text-black border border-neutral-200 shrink-0 hover:bg-neutral-50 active:scale-95 transition-all"
                                    >
                                        <Phone className="w-5 h-5" />
                                    </a>
                                )}
                            </div>
                        </div>

                    </div>
                </main>

                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-5 py-4 flex items-center justify-between safe-area-bottom z-50">
                    {isOwner ? (
                        <div className="w-full">
                            <Link 
                                href={`/properties/${property.id}/edit`}
                                className="w-full bg-neutral-900 hover:bg-black text-white font-[900] rounded-xl h-[52px] text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                            >
                                <Edit className="w-5 h-5" /> Edit your listing
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col justify-center">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[20px] font-[900] text-neutral-900 leading-none tracking-[-0.02em]">
                                        N${property.price.toLocaleString()}
                                    </span>
                                 </div>
                                 <span className="text-neutral-500 font-semibold text-[13px] mt-0.5 underline">/month</span>
                            </div>
                            <ContactLandlordButton
                                propertyId={property.id}
                                variant="mobile"
                                className="bg-[#D9FD54] hover:bg-[#c9e74d] text-neutral-900 font-[900] rounded-xl px-8 h-[52px] text-[16px] border-0 shadow-none transition-transform active:scale-[0.98]"
                            />
                        </>
                    )}
                </div>
            </div>

            {/* --- DESKTOP VIEW --- */}
            <div className="hidden lg:block pb-32">
                <header className={cn("fixed top-0 left-0 right-0 z-50 h-[80px] transition-all px-10 flex items-center justify-between", isScrolled ? "bg-white/90 backdrop-blur-xl border-b border-neutral-100" : "bg-transparent")}>
                    <div className="flex items-center gap-4">
                        <Link href="/" className="w-11 h-11 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-900 flex items-center justify-center rounded-full transition-colors shadow-sm active:scale-95">
                            <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
                        </Link>
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 hover:bg-neutral-100 px-4 py-2 rounded-full font-bold text-[14px] transition-colors decoration-neutral-900 underline underline-offset-2">
                            <Share className="w-[18px] h-[18px]" strokeWidth={2.5} /> Share
                        </button>
                        {!isOwner && (
                            <div className="scale-95 origin-right">
                                <SavePropertyButton variant="default" propertyId={property.id} className="h-10 font-bold text-[14px] px-4 bg-transparent hover:bg-neutral-100 rounded-full border-0 text-neutral-900 shadow-none decoration-neutral-900 underline underline-offset-2 flex-row-reverse gap-2" />
                            </div>
                        )}
                    </div>
                </header>

                <main className="max-w-[1200px] mx-auto pt-24 px-10">
                    <h1 className="text-[40px] font-[900] tracking-[-0.03em] leading-tight mb-2 text-neutral-900">{property.title}</h1>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4 text-neutral-600">
                            <div className="flex items-center gap-1.5 text-neutral-900">
                                <Star className="w-[18px] h-[18px] text-neutral-900 fill-neutral-900" />
                                <span className="font-[900] text-[16px]">5.0</span>
                                <span className="font-bold text-[15px] underline decoration-neutral-300 underline-offset-2 text-neutral-500 hover:text-neutral-900 cursor-pointer transition-colors">78 reviews</span>
                            </div>
                            <span className="text-neutral-300">•</span>
                            <div className="font-bold text-[15px] underline decoration-neutral-300 underline-offset-2 text-neutral-500 hover:text-neutral-900 cursor-pointer transition-colors">
                                {property.address}, {property.city}
                            </div>
                        </div>
                    </div>

                    {/* Desktop Hero Image Grid */}
                    <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[480px] rounded-[32px] overflow-hidden relative group">
                        <div className="col-span-2 row-span-2 relative cursor-pointer" onClick={() => setShowAllPhotos(true)}>
                            <OptimizedImage src={property.images[0] || '/window.svg'} alt="Hero" fill className="object-cover hover:brightness-95 transition-all duration-300" />
                        </div>
                        <div className="col-span-1 row-span-1 relative cursor-pointer" onClick={() => setShowAllPhotos(true)}>
                            <OptimizedImage src={property.images[1] || '/window.svg'} alt="Gallery 1" fill className="object-cover hover:brightness-95 transition-all duration-300" />
                        </div>
                        <div className="col-span-1 row-span-1 relative cursor-pointer" onClick={() => setShowAllPhotos(true)}>
                            <OptimizedImage src={property.images[2] || '/window.svg'} alt="Gallery 2" fill className="object-cover hover:brightness-95 transition-all duration-300" />
                        </div>
                        <div className="col-span-1 row-span-1 relative cursor-pointer" onClick={() => setShowAllPhotos(true)}>
                            <OptimizedImage src={property.images[3] || '/window.svg'} alt="Gallery 3" fill className="object-cover hover:brightness-95 transition-all duration-300" />
                        </div>
                        <div className="col-span-1 row-span-1 relative cursor-pointer" onClick={() => setShowAllPhotos(true)}>
                            <OptimizedImage src={property.images[4] || '/window.svg'} alt="Gallery 4" fill className="object-cover hover:brightness-95 transition-all duration-300" />
                        </div>
                        
                        <button onClick={() => setShowAllPhotos(true)} className="absolute bottom-6 right-6 bg-white border border-neutral-200 px-5 py-2.5 rounded-xl font-[900] text-[14px] flex items-center gap-2 hover:bg-neutral-50 transition-colors shadow-sm active:scale-95">
                            <Grid3X3 className="w-4 h-4" /> Show all photos
                        </button>
                    </div>

                    <div className="flex gap-20 mt-12">
                        <div className="flex-1 w-[60%]">
                            <div className="flex items-center justify-between pb-8 border-b border-neutral-200">
                                <div>
                                    <h2 className="text-[26px] font-[900] tracking-[-0.03em] text-neutral-900">Entire {property.type.toLowerCase()} hosted by {property.landlord?.name || 'Owner'}</h2>
                                    <div className="flex gap-1.5 mt-1 text-[16px] text-neutral-600 font-medium">
                                        <span>{property.size} sqm</span> ·
                                        <span>{property.bedrooms} beds</span> ·
                                        <span>{property.bathrooms} baths</span>
                                    </div>
                                </div>
                                <div className="w-[60px] h-[60px] rounded-full overflow-hidden relative shrink-0 border border-neutral-200">
                                    {property.landlord?.avatarUrl ? <OptimizedImage src={property.landlord.avatarUrl} alt="L" fill className="object-cover" /> : <div className="w-full h-full bg-neutral-100 flex items-center justify-center"><User className="w-7 h-7 text-neutral-400" /></div>}
                                </div>
                            </div>

                            <div className="py-8 border-b border-neutral-200 space-y-6">
                                 <div className="flex items-start gap-5">
                                    <Home className="w-8 h-8 text-neutral-900 shrink-0" strokeWidth={1.5} />
                                    <div>
                                        <h3 className="text-[17px] font-[900] text-neutral-900 leading-tight">Entire home</h3>
                                        <p className="text-[15px] font-medium text-neutral-500 mt-1">You'll have the space to yourself.</p>
                                    </div>
                                 </div>
                                 <div className="flex items-start gap-5">
                                    <CheckCircle2 className="w-8 h-8 text-neutral-900 shrink-0" strokeWidth={1.5} />
                                    <div>
                                        <h3 className="text-[17px] font-[900] text-neutral-900 leading-tight">Enhanced Clean</h3>
                                        <p className="text-[15px] font-medium text-neutral-500 mt-1">This host committed to LINK's 5-step enhanced cleaning process.</p>
                                    </div>
                                 </div>
                                 <div className="flex items-start gap-5">
                                    <MapPin className="w-8 h-8 text-neutral-900 shrink-0" strokeWidth={1.5} />
                                    <div>
                                        <h3 className="text-[17px] font-[900] text-neutral-900 leading-tight">Great location</h3>
                                        <p className="text-[15px] font-medium text-neutral-500 mt-1">90% of recent guests gave the location a 5-star rating.</p>
                                    </div>
                                 </div>
                            </div>

                            <section className="py-10 border-b border-neutral-200">
                                <h2 className="text-[26px] font-[900] tracking-[-0.03em] mb-6">About this space</h2>
                                <p className="text-[16px] text-neutral-600 font-medium leading-[1.6] whitespace-pre-line break-words max-w-[650px]">
                                    {property.description}
                                </p>
                            </section>
                            
                            {property.amenities.length > 0 && (
                                <section className="py-10 border-b border-neutral-200">
                                    <h2 className="text-[26px] font-[900] tracking-[-0.03em] mb-6">What this place offers</h2>
                                    <div className="grid grid-cols-2 gap-y-5 gap-x-8 max-w-[650px]">
                                        {property.amenities.map(amenity => (
                                            <div key={amenity} className="flex items-center gap-4">
                                                <CheckCircle2 className="w-[24px] h-[24px] text-neutral-700" strokeWidth={1.5} />
                                                <span className="text-[16px] font-medium text-neutral-700">{amenity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        <div className="w-[33%] md:min-w-[320px] max-w-[380px] relative">
                            <div className="sticky top-28 bg-white border border-neutral-200 rounded-[28px] shadow-[0_12px_30px_rgba(0,0,0,0.06)] p-7">
                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className="text-[26px] font-[900] tracking-[-0.03em] text-neutral-900">N${property.price.toLocaleString()}</span>
                                    <span className="text-[16px] font-semibold text-neutral-500 ml-1">/ month</span>
                                </div>

                                <div className="space-y-4">
                                    {isOwner ? (
                                         <div className="space-y-4">
                                            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100">
                                                <h3 className="font-[900] text-[15px] mb-1">You own this listing</h3>
                                                <p className="text-[14px] text-neutral-500 font-medium">Manage your calendar, pricing, and details.</p>
                                            </div>
                                            <Link href={`/properties/${property.id}/edit`} className="w-full h-[52px] bg-neutral-900 hover:bg-black text-white text-[16px] font-[900] rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                                 <Edit className="w-5 h-5" /> Edit Listing
                                            </Link>
                                         </div>
                                    ) : (
                                        <>
                                            <ContactLandlordButton
                                                propertyId={property.id}
                                                className="w-full h-[54px] bg-[#D9FD54] hover:bg-[#c9e74d] text-neutral-900 text-[16px] font-[900] rounded-xl border-0 transition-transform active:scale-[0.98]"
                                            />
                                            <SavePropertyButton 
                                                variant="default"
                                                propertyId={property.id} 
                                                className="w-full h-[54px] bg-white border border-neutral-200 hover:border-black hover:bg-neutral-50 text-neutral-900 text-[16px] font-bold rounded-xl transition-all shadow-none" 
                                            />
                                        </>
                                    )}
                                </div>

                                {!isOwner && (
                                    <div className="flex justify-center pt-6">
                                        <span className="text-[14px] font-medium text-neutral-500 text-center">You won't be charged yet</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Map Desktop */}
                    {property.coordinates && (
                        <div className="pt-10 border-t border-neutral-200 mt-10">
                             <h2 className="text-[26px] font-[900] tracking-[-0.03em] mb-4">Where you'll be</h2>
                             <p className="text-[16px] font-medium text-neutral-700 mb-6">{property.address}, {property.city}</p>
                             <div className="h-[480px] w-full rounded-[24px] overflow-hidden bg-neutral-100 border border-neutral-200 relative mb-4">
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
