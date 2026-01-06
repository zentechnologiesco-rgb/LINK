import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MOCK_PROPERTIES } from '@/lib/mock-data'
import { createClient } from '@/lib/supabase/server'
import { MapPin, Bed, Bath, Square, Check, Share2, Heart, ArrowLeft, Phone, User, Sparkles } from 'lucide-react'
import { InquiryDialog } from '@/components/properties/InquiryDialog'
import { getSavedStatus } from '@/actions/saved-properties'
import { SavePropertyButton } from '@/components/properties/SavePropertyButton'
import { PropertyDetailMap } from '@/components/maps/PropertyDetailMap'

interface Props {
    params: Promise<{ id: string }>
}

// Unified property interface
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
        avatar_url: string | null
    } | null
}

async function getProperty(id: string): Promise<PropertyDetails | null> {
    // First, try to find in mock data
    const mockProperty = MOCK_PROPERTIES.find((p) => p.id === id)
    if (mockProperty) {
        return {
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
    }

    // If not in mock data, try database
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('properties')
        .select(`
            *,
            coordinates,
            landlord:profiles!landlord_id (
                full_name,
                email,
                phone,
                avatar_url
            )
        `)
        .eq('id', id)
        .single()

    if (error || !data) {
        return null
    }

    return {
        id: data.id,
        title: data.title,
        description: data.description,
        price: data.price_nad,
        address: data.address,
        city: data.city,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        size: data.size_sqm,
        type: data.property_type.charAt(0).toUpperCase() + data.property_type.slice(1),
        images: data.images || [],
        amenities: data.amenities || [],
        isFromDatabase: true,
        coordinates: data.coordinates || null,
        landlord: data.landlord ? {
            name: data.landlord.full_name,
            email: data.landlord.email,
            phone: data.landlord.phone,
            avatar_url: data.landlord.avatar_url,
        } : null,
    }
}

export default async function PropertyPage({ params }: Props) {
    const { id } = await params
    const property = await getProperty(id)
    const isSaved = await getSavedStatus(id)

    if (!property) {
        notFound()
    }

    return (
        <div className="p-6 lg:p-8">
            {/* Back Button */}
            <Link
                href="/"
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to listings
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Image */}
                    <div className="aspect-[16/9] rounded-xl overflow-hidden bg-gray-100 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={property.images[0]}
                            alt={property.title}
                            className="w-full h-full object-cover"
                        />
                        {property.isFromDatabase && (
                            <Badge className="absolute top-4 left-4 bg-green-500 hover:bg-green-500 text-white gap-1">
                                <Sparkles className="h-3 w-3" />
                                Verified Listing
                            </Badge>
                        )}
                    </div>

                    {/* Title & Location */}
                    <div>
                        <div className="flex items-start justify-between gap-4 mb-2">
                            <h1 className="text-2xl font-semibold text-gray-900">
                                {property.title}
                            </h1>
                            <div className="flex gap-2 shrink-0">
                                <Button size="icon" variant="ghost" className="h-9 w-9 text-gray-400 hover:text-gray-600">
                                    <Share2 className="h-4 w-4" />
                                </Button>
                                <SavePropertyButton
                                    propertyId={property.id}
                                    initialSaved={isSaved}
                                    variant="default"
                                    className="h-9 px-3 border-0 bg-transparent hover:bg-gray-100 text-gray-600"
                                />
                            </div>
                        </div>
                        <p className="text-gray-500 flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {property.address}, {property.city}
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 py-4 border-y border-gray-100">
                        <div className="flex items-center gap-2">
                            <Bed className="h-5 w-5 text-gray-400" />
                            <span className="font-medium text-gray-900">{property.bedrooms}</span>
                            <span className="text-gray-500">Beds</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Bath className="h-5 w-5 text-gray-400" />
                            <span className="font-medium text-gray-900">{property.bathrooms}</span>
                            <span className="text-gray-500">Baths</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Square className="h-5 w-5 text-gray-400" />
                            <span className="font-medium text-gray-900">{property.size}</span>
                            <span className="text-gray-500">m²</span>
                        </div>
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-600">
                            {property.type}
                        </span>
                    </div>

                    {/* Description */}
                    <div>
                        <h2 className="text-lg font-medium text-gray-900 mb-3">About</h2>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {property.description}
                        </p>
                    </div>

                    {/* Amenities */}
                    {property.amenities.length > 0 && (
                        <div>
                            <h2 className="text-lg font-medium text-gray-900 mb-3">Amenities</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {property.amenities.map((amenity) => (
                                    <div key={amenity} className="flex items-center gap-2 text-gray-600">
                                        <Check className="h-4 w-4 text-green-500" />
                                        {amenity}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Location Map */}
                    {property.coordinates && (
                        <div>
                            <h2 className="text-lg font-medium text-gray-900 mb-3">Location</h2>
                            <PropertyDetailMap
                                coordinates={property.coordinates}
                                address={`${property.address}, ${property.city}`}
                            />
                            <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {property.address}, {property.city}
                            </p>
                        </div>
                    )}

                    {/* Gallery */}
                    {property.images.length > 1 && (
                        <div>
                            <h2 className="text-lg font-medium text-gray-900 mb-3">Photos</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {property.images.map((image, index) => (
                                    <div key={index} className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={image}
                                            alt={`${property.title} - Photo ${index + 1}`}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6 space-y-6">
                        {/* Price Card */}
                        <div className="p-6 rounded-xl border border-gray-100 bg-white">
                            <p className="text-sm text-gray-500 mb-1">Monthly Rent</p>
                            <p className="text-3xl font-semibold text-gray-900 mb-6">
                                N$ {property.price.toLocaleString()}
                            </p>

                            <div className="space-y-3">
                                <InquiryDialog
                                    propertyId={property.id}
                                    propertyTitle={property.title}
                                    mode="viewing"
                                    trigger={
                                        <Button className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white">
                                            Request Viewing
                                        </Button>
                                    }
                                />
                                <InquiryDialog
                                    propertyId={property.id}
                                    propertyTitle={property.title}
                                    mode="message"
                                    trigger={
                                        <Button variant="outline" className="w-full h-11 border-gray-200">
                                            Send Message
                                        </Button>
                                    }
                                />
                            </div>
                        </div>

                        {/* Landlord Card */}
                        <div className="p-6 rounded-xl border border-gray-100 bg-white">
                            <p className="text-sm text-gray-500 mb-4">Listed by</p>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                    {property.landlord?.avatar_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={property.landlord.avatar_url}
                                            alt={property.landlord.name || 'Landlord'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="h-6 w-6 text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {property.landlord?.name || 'Property Owner'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {property.isFromDatabase ? 'Verified Landlord' : 'Property Agent'}
                                    </p>
                                </div>
                            </div>
                            {property.landlord?.phone && (
                                <div className="space-y-2 text-sm">
                                    <a
                                        href={`tel:${property.landlord.phone}`}
                                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                                    >
                                        <Phone className="h-4 w-4" />
                                        {property.landlord.phone}
                                    </a>
                                </div>
                            )}
                            {!property.landlord?.phone && (
                                <p className="text-sm text-gray-500">
                                    Contact via the app for inquiries
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
