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
    ChevronRight,
    Phone,
    User,
    Sparkles,
    X,
    Grid3X3
} from 'lucide-react'
import { InquiryDialog } from '@/components/properties/InquiryDialog'
import { SavePropertyButton } from '@/components/properties/SavePropertyButton'
import { PropertyDetailMap } from '@/components/maps/PropertyDetailMap'
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import { use } from 'react'

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
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    const mockProperty = MOCK_PROPERTIES.find((p) => p.id === id)
    const convexQueryArgs = !mockProperty ? { propertyId: id as Id<"properties"> } : "skip"
    const convexProperty = useQuery(api.properties.getById, convexQueryArgs)
    const isConvexLoading = !mockProperty && convexProperty === undefined

    if (isConvexLoading) {
        return (
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="h-5 w-32 bg-muted rounded animate-pulse mb-6" />
                <div className="h-8 w-2/3 bg-muted rounded animate-pulse mb-2" />
                <div className="h-5 w-1/3 bg-muted rounded animate-pulse mb-6" />
                <div className="grid grid-cols-4 gap-2 rounded-xl overflow-hidden mb-8">
                    <div className="col-span-2 row-span-2 aspect-square bg-muted animate-pulse" />
                    <div className="aspect-square bg-muted animate-pulse" />
                    <div className="aspect-square bg-muted animate-pulse" />
                    <div className="aspect-square bg-muted animate-pulse" />
                    <div className="aspect-square bg-muted animate-pulse" />
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
        : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop']

    // Full screen photo gallery
    if (showAllPhotos) {
        return (
            <div className="min-h-screen bg-white">
                <div className="sticky top-0 z-10 bg-white border-b border-border px-6 py-4">
                    <div className="max-w-5xl mx-auto flex items-center justify-between">
                        <button
                            onClick={() => setShowAllPhotos(false)}
                            className="flex items-center gap-2 text-sm font-medium text-foreground hover:underline"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Back to listing
                        </button>
                        <span className="text-sm text-muted-foreground">
                            {displayImages.length} photos
                        </span>
                    </div>
                </div>
                <div className="max-w-5xl mx-auto px-6 py-8">
                    <div className="space-y-4">
                        {displayImages.map((image, index) => (
                            <div key={index} className="rounded-xl overflow-hidden">
                                <Image
                                    src={image}
                                    alt={`${property.title} - Photo ${index + 1}`}
                                    width={1200}
                                    height={800}
                                    className="w-full h-auto object-cover"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto px-6 py-6">
            {/* Back Button */}
            <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
            >
                <ChevronLeft className="h-4 w-4" />
                Back
            </Link>

            {/* Title Section */}
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-foreground mb-1">
                    {property.title}
                </h1>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {property.city}
                        </span>
                        {property.isFromDatabase && (
                            <span className="inline-flex items-center gap-1 text-lime-600 font-medium">
                                <Sparkles className="h-3.5 w-3.5" />
                                Verified
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-sm font-medium hover:bg-sidebar-accent"
                        >
                            <Share2 className="h-4 w-4" />
                            Share
                        </Button>
                        <SavePropertyButton
                            propertyId={property.id}
                            initialSaved={false}
                        />
                    </div>
                </div>
            </div>

            {/* Photo Gallery */}
            <div className="relative mb-8">
                <div className="grid grid-cols-4 gap-2 rounded-xl overflow-hidden">
                    {/* Main large image */}
                    <div
                        className="col-span-2 row-span-2 relative aspect-square cursor-pointer group"
                        onClick={() => setShowAllPhotos(true)}
                    >
                        <Image
                            src={displayImages[0]}
                            alt={property.title}
                            fill
                            className="object-cover group-hover:brightness-95 transition-all"
                            sizes="50vw"
                            priority
                        />
                    </div>
                    {/* Smaller images */}
                    {[1, 2, 3, 4].map((index) => (
                        <div
                            key={index}
                            className="relative aspect-square cursor-pointer group"
                            onClick={() => setShowAllPhotos(true)}
                        >
                            {displayImages[index] ? (
                                <Image
                                    src={displayImages[index]}
                                    alt={`${property.title} - Photo ${index + 1}`}
                                    fill
                                    className="object-cover group-hover:brightness-95 transition-all"
                                    sizes="25vw"
                                />
                            ) : (
                                <div className="w-full h-full bg-muted" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Show all photos button */}
                <button
                    onClick={() => setShowAllPhotos(true)}
                    className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-sm font-medium text-foreground border border-border shadow-sm hover:shadow-md transition-shadow"
                >
                    <Grid3X3 className="h-4 w-4" />
                    Show all photos
                </button>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Main Content */}
                <div className="lg:col-span-2">
                    {/* Property type and host */}
                    <div className="flex items-center justify-between pb-6 border-b border-border">
                        <div>
                            <h2 className="text-xl font-medium text-foreground">
                                {property.type} in {property.city}
                            </h2>
                            <p className="text-muted-foreground mt-1">
                                {property.bedrooms} bedroom{property.bedrooms !== 1 ? 's' : ''} · {property.bathrooms} bathroom{property.bathrooms !== 1 ? 's' : ''} · {property.size} m²
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="font-medium text-foreground">
                                    {property.landlord?.name || 'Property Owner'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {property.isFromDatabase ? 'Landlord' : 'Agent'}
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-sidebar-accent flex items-center justify-center">
                                <User className="h-6 w-6 text-muted-foreground" />
                            </div>
                        </div>
                    </div>

                    {/* Quick highlights */}
                    <div className="py-6 border-b border-border">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-lg bg-sidebar-accent flex items-center justify-center shrink-0">
                                    <Bed className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">{property.bedrooms} Bedrooms</p>
                                    <p className="text-sm text-muted-foreground">Spacious rooms</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-lg bg-sidebar-accent flex items-center justify-center shrink-0">
                                    <Bath className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">{property.bathrooms} Bathrooms</p>
                                    <p className="text-sm text-muted-foreground">Modern fixtures</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-lg bg-sidebar-accent flex items-center justify-center shrink-0">
                                    <Square className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">{property.size} m²</p>
                                    <p className="text-sm text-muted-foreground">Total area</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="py-6 border-b border-border">
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                            {property.description}
                        </p>
                    </div>

                    {/* Amenities */}
                    {property.amenities.length > 0 && (
                        <div className="py-6 border-b border-border">
                            <h2 className="text-lg font-medium text-foreground mb-4">
                                What this place offers
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                {property.amenities.map((amenity) => (
                                    <div
                                        key={amenity}
                                        className="flex items-center gap-3"
                                    >
                                        <Check className="h-5 w-5 text-foreground" />
                                        <span className="text-foreground">{amenity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Location */}
                    <div className="py-6">
                        <h2 className="text-lg font-medium text-foreground mb-4">
                            Where you'll be
                        </h2>
                        {property.coordinates ? (
                            <>
                                <div className="rounded-xl overflow-hidden mb-4">
                                    <PropertyDetailMap
                                        coordinates={property.coordinates}
                                        address={`${property.address}, ${property.city}`}
                                    />
                                </div>
                                <p className="text-foreground font-medium">{property.city}</p>
                                <p className="text-muted-foreground mt-1">{property.address}</p>
                            </>
                        ) : (
                            <>
                                <p className="text-foreground font-medium">{property.city}</p>
                                <p className="text-muted-foreground mt-1">{property.address}</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Sticky Booking Card */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6">
                        <div className="p-6 rounded-xl border border-border bg-card shadow-lg">
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-2xl font-semibold text-foreground">
                                    N$ {property.price.toLocaleString()}
                                </span>
                                <span className="text-muted-foreground">/ month</span>
                            </div>

                            <div className="mb-4">
                                <InquiryDialog
                                    propertyId={property.id}
                                    propertyTitle={property.title}
                                    mode="message"
                                    trigger={
                                        <Button className="w-full h-12 bg-lime-500 hover:bg-lime-600 text-white font-medium rounded-lg transition-colors">
                                            Send Message
                                        </Button>
                                    }
                                />
                            </div>

                            <p className="text-center text-sm text-muted-foreground">
                                Contact the landlord directly
                            </p>
                        </div>

                        {/* Contact info */}
                        {property.landlord?.phone && (
                            <div className="mt-4 p-4 rounded-xl border border-border bg-card">
                                <p className="text-sm text-muted-foreground mb-2">Contact directly</p>
                                <a
                                    href={`tel:${property.landlord.phone}`}
                                    className="flex items-center gap-2 text-foreground font-medium hover:text-lime-600 transition-colors"
                                >
                                    <Phone className="h-4 w-4" />
                                    {property.landlord.phone}
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
