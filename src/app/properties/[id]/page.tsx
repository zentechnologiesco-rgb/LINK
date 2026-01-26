'use client'

import { useState } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { MOCK_PROPERTIES } from '@/lib/mock-data'
import {
    MapPin,
    Bed,
    Bath,
    Square,
    Check,
    Share2,
    ChevronLeft,
    Phone,
    User,
    Sparkles,
    Grid3X3
} from 'lucide-react'
import { InquiryDialog } from '@/components/properties/InquiryDialog'
import { SavePropertyButton } from '@/components/properties/SavePropertyButton'
import { PropertyDetailMap } from '@/components/maps/PropertyDetailMap'
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import { use } from 'react'
import { cn } from '@/lib/utils'

interface Props {
    params: Promise<{ id: string }>
}

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
    } | null
}

function PropertyDetailContent({ id }: { id: string }) {
    const [showAllPhotos, setShowAllPhotos] = useState(false)

    const mockProperty = MOCK_PROPERTIES.find((p) => p.id === id)
    const convexQueryArgs = !mockProperty ? { propertyId: id as Id<"properties"> } : "skip"
    const convexProperty = useQuery(api.properties.getById, convexQueryArgs)
    const isConvexLoading = !mockProperty && convexProperty === undefined

    if (isConvexLoading) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="h-4 w-24 bg-black/5 rounded animate-pulse mb-8" />
                <div className="flex flex-col gap-8 md:flex-row">
                    <div className="flex-1 space-y-4">
                        <div className="h-12 w-3/4 bg-black/5 rounded-xl animate-pulse" />
                        <div className="h-6 w-1/2 bg-black/5 rounded-xl animate-pulse" />
                        <div className="aspect-video w-full rounded-3xl bg-black/5 animate-pulse mt-8" />
                    </div>
                    <div className="w-full md:w-[400px] space-y-4">
                        <div className="h-[400px] bg-black/5 rounded-3xl animate-pulse" />
                    </div>
                </div>
            </div>
        )
    }

    let property: PropertyDetails | null = null

    if (mockProperty) {
        property = {
            id: mockProperty.id,
            title: mockProperty.title,
            description: mockProperty.description,
            price: mockProperty.price,
            address: mockProperty.address,
            city: mockProperty.city,
            bedrooms: mockProperty.bedrooms,
            bathrooms: mockProperty.bathrooms,
            size: mockProperty.size,
            type: mockProperty.type,
            images: mockProperty.images,
            amenities: mockProperty.amenities,
            isFromDatabase: false,
            landlord: null,
        }
    } else if (convexProperty) {
        property = {
            id: convexProperty._id,
            title: convexProperty.title,
            description: convexProperty.description || 'No description available',
            price: convexProperty.priceNad,
            address: convexProperty.address,
            city: convexProperty.city,
            bedrooms: convexProperty.bedrooms || 0,
            bathrooms: convexProperty.bathrooms || 0,
            size: convexProperty.sizeSqm || 0,
            type: convexProperty.propertyType.charAt(0).toUpperCase() + convexProperty.propertyType.slice(1),
            images: convexProperty.imageUrls || [],
            amenities: convexProperty.amenityNames || [],
            isFromDatabase: true,
            coordinates: convexProperty.coordinates || null,
            landlord: convexProperty.landlordInfo || null,
        }
    }

    if (!property) {
        notFound()
    }

    const displayImages = property.images.length > 0
        ? property.images
        : ['/window.svg'] // Fallback

    // Full screen photo gallery layout
    if (showAllPhotos) {
        return (
            <div className="min-h-screen bg-white">
                <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5 px-6 py-4">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <button
                            onClick={() => setShowAllPhotos(false)}
                            className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-black hover:opacity-70 transition-opacity"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Back to listing
                        </button>
                        <span className="text-xs font-medium text-black/40 uppercase tracking-widest">
                            {displayImages.length} photos
                        </span>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {displayImages.map((image, index) => (
                            <div key={index} className={cn(
                                "relative rounded-2xl overflow-hidden bg-black/5",
                                index % 3 === 0 ? "md:col-span-2 aspect-[2/1]" : "aspect-square"
                            )}>
                                <Image
                                    src={image}
                                    alt={`${property!.title} - Photo ${index + 1}`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 pb-20">
            {/* Nav & Actions */}
            <div className="flex items-center justify-between mb-8">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-black/40 hover:text-black transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                </Link>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-xs uppercase font-bold tracking-wider hover:bg-black/5"
                    >
                        <Share2 className="h-4 w-4" />
                        Share
                    </Button>
                    <SavePropertyButton
                        propertyId={property.id}
                        initialSaved={false}
                        className="hover:bg-black/5 border-none shadow-none"
                    />
                </div>
            </div>

            {/* Photo Gallery - Grid */}
            <div className="relative mb-12 group rounded-3xl overflow-hidden ring-1 ring-black/5 bg-gray-100">
                <div className="grid grid-cols-4 gap-1 h-[400px] md:h-[600px]">
                    {/* Main large image */}
                    <div
                        className="col-span-4 md:col-span-2 row-span-2 relative cursor-pointer"
                        onClick={() => setShowAllPhotos(true)}
                    >
                        <Image
                            src={displayImages[0]}
                            alt={property.title}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-700"
                            priority
                        />
                    </div>
                    {/* Secondary images (Hidden on mobile) */}
                    <div className="hidden md:grid col-span-2 row-span-2 grid-cols-2 grid-rows-2 gap-1">
                        {[1, 2, 3, 4].map((index) => (
                            <div
                                key={index}
                                className="relative cursor-pointer overflow-hidden"
                                onClick={() => setShowAllPhotos(true)}
                            >
                                {displayImages[index] ? (
                                    <Image
                                        src={displayImages[index]}
                                        alt={`${property!.title} - Photo ${index + 1}`}
                                        fill
                                        className="object-cover hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-black/5 flex items-center justify-center">
                                        <Sparkles className="h-6 w-6 text-black/10" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Show all button */}
                <button
                    onClick={() => setShowAllPhotos(true)}
                    className="absolute bottom-6 right-6 flex items-center gap-2 px-5 py-2.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold uppercase tracking-wider text-black shadow-lg shadow-black/5 hover:bg-white hover:scale-105 transition-all"
                >
                    <Grid3X3 className="h-4 w-4" />
                    Show all photos
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Main Content */}
                <div className="lg:col-span-8 space-y-10">
                    {/* Header */}
                    <div className="border-b border-black/5 pb-8 space-y-4">
                        <div className="flex flex-col gap-2">
                            <h1 className="font-[family-name:var(--font-anton)] text-4xl md:text-5xl uppercase tracking-wide text-black">
                                {property.title}
                            </h1>
                            <p className="text-black/60 text-lg flex items-center gap-2 font-medium">
                                <MapPin className="h-5 w-5" />
                                {property.city}, {property.address}
                            </p>
                        </div>

                        {/* Specs */}
                        <div className="flex flex-wrap gap-4 pt-2">
                            <div className="px-4 py-2 bg-black/[0.03] rounded-xl flex items-center gap-2 border border-black/[0.02]">
                                <Bed className="h-5 w-5 text-black" />
                                <span className="font-bold text-black">{property.bedrooms}</span>
                                <span className="text-black/50 text-sm font-medium uppercase tracking-wide">Bedrooms</span>
                            </div>
                            <div className="px-4 py-2 bg-black/[0.03] rounded-xl flex items-center gap-2 border border-black/[0.02]">
                                <Bath className="h-5 w-5 text-black" />
                                <span className="font-bold text-black">{property.bathrooms}</span>
                                <span className="text-black/50 text-sm font-medium uppercase tracking-wide">Bathrooms</span>
                            </div>
                            <div className="px-4 py-2 bg-black/[0.03] rounded-xl flex items-center gap-2 border border-black/[0.02]">
                                <Square className="h-5 w-5 text-black" />
                                <span className="font-bold text-black">{property.size}</span>
                                <span className="text-black/50 text-sm font-medium uppercase tracking-wide">Sq. Meters</span>
                            </div>
                        </div>
                    </div>

                    {/* Host Info */}
                    <div className="flex items-center justify-between pb-8 border-b border-black/5">
                        <div className="space-y-1">
                            <h2 className="font-[family-name:var(--font-anton)] text-xl uppercase tracking-wide text-black">
                                Hosted by {property.landlord?.name || 'Property Owner'}
                            </h2>
                            <p className="text-black/40 text-sm font-medium">
                                {property.isFromDatabase ? 'Verified Landlord' : 'Listing Agent'}
                            </p>
                        </div>
                        <div className="h-14 w-14 rounded-full bg-black flex items-center justify-center text-white">
                            <User className="h-6 w-6" />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="pb-8 border-b border-black/5 space-y-4">
                        <h2 className="font-[family-name:var(--font-anton)] text-xl uppercase tracking-wide text-black/40">
                            About this property
                        </h2>
                        <p className="text-black/80 leading-relaxed whitespace-pre-wrap text-base md:text-lg font-light">
                            {property.description}
                        </p>
                    </div>

                    {/* Amenities */}
                    {property.amenities.length > 0 && (
                        <div className="pb-8 border-b border-black/5 space-y-6">
                            <h2 className="font-[family-name:var(--font-anton)] text-xl uppercase tracking-wide text-black/40">
                                Amenities
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                                {property.amenities.map((amenity) => (
                                    <div key={amenity} className="flex items-center gap-3 group">
                                        <div className="h-8 w-8 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors duration-300">
                                            <Check className="h-4 w-4" />
                                        </div>
                                        <span className="text-black/70 font-medium group-hover:text-black transition-colors">
                                            {amenity}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Location Map */}
                    <div className="space-y-6">
                        <h2 className="font-[family-name:var(--font-anton)] text-xl uppercase tracking-wide text-black/40">
                            Location
                        </h2>
                        {property.coordinates && (
                            <div className="rounded-3xl overflow-hidden ring-1 ring-black/5 bg-gray-100 h-[400px]">
                                <PropertyDetailMap
                                    coordinates={property.coordinates}
                                    address={`${property.address}, ${property.city}`}
                                />
                            </div>
                        )}
                        <div>
                            <p className="font-bold text-black text-lg">{property.city}</p>
                            <p className="text-black/50">{property.address}</p>
                        </div>
                    </div>
                </div>

                {/* Sidebar Booking Card */}
                <div className="lg:col-span-4 relative">
                    <div className="sticky top-8 space-y-6">
                        <div className="p-8 rounded-3xl border border-black/5 bg-white shadow-2xl shadow-black/5">
                            <div className="space-y-6">
                                <div>
                                    <p className="text-black/40 text-xs font-bold uppercase tracking-widest mb-2">Monthly Rent</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-[family-name:var(--font-anton)] text-5xl text-black">
                                            N${property.price.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="h-px w-full bg-black/5" />

                                <div className="space-y-3">
                                    <div className="p-4 rounded-xl bg-black/[0.02] border border-black/5 space-y-1">
                                        <p className="text-[10px] font-bold uppercase text-black/40 tracking-wider">Property Type</p>
                                        <p className="font-medium text-black">{property.type}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-black/[0.02] border border-black/5 space-y-1">
                                        <p className="text-[10px] font-bold uppercase text-black/40 tracking-wider">Availability</p>
                                        <p className="font-medium text-black">Available Now</p>
                                    </div>
                                </div>

                                <InquiryDialog
                                    propertyId={property.id}
                                    propertyTitle={property.title}
                                    mode="message"
                                    trigger={
                                        <Button className="w-full h-14 bg-black hover:bg-black/80 text-white text-sm font-bold uppercase tracking-widest rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                                            Contact Landlord
                                        </Button>
                                    }
                                />

                                <p className="text-center text-xs text-black/30 font-medium">
                                    No hidden fees. Direct contact.
                                </p>
                            </div>
                        </div>

                        {/* Contact Details Card */}
                        {property.landlord?.phone && (
                            <div className="p-6 rounded-3xl bg-black/[0.02] border border-black/5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase text-black/40 mb-1">Quick Contact</p>
                                    <p className="font-bold text-black">{property.landlord.phone}</p>
                                </div>
                                <a
                                    href={`tel:${property.landlord.phone}`}
                                    className="h-10 w-10 rounded-full bg-white border border-black/5 flex items-center justify-center text-black hover:bg-black hover:text-white transition-all shadow-sm"
                                >
                                    <Phone className="h-4 w-4" />
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function PropertyPage({ params }: Props) {
    const { id } = use(params)
    return <PropertyDetailContent id={id} />
}
