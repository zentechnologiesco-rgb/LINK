"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Building2, ChevronLeft, ChevronRight } from "lucide-react"
import { SavePropertyButton } from "@/components/properties/SavePropertyButton"

// Define the Property type needed for the feed
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
    amenities: string[]
    description: string
    coordinates?: { lat: number; lng: number } | null
}

const ITEMS_PER_PAGE = 16 // 4x4 grid

const propertyTypes = [
    { value: 'all', label: 'All' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'room', label: 'Room' },
    { value: 'studio', label: 'Studio' },
    { value: 'penthouse', label: 'Penthouse' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'commercial', label: 'Commercial' },
]

export default function HomePage() {
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedType, setSelectedType] = useState('all')
    const properties = useQuery(api.properties.list, { onlyAvailable: true })

    // Normalize properties
    const normalizedProperties: Property[] = useMemo(() => {
        if (!properties) return []
        return properties.map((property) => ({
            id: property._id,
            title: property.title,
            description: property.description || '',
            price: property.priceNad,
            address: property.address,
            city: property.city,
            bedrooms: property.bedrooms ?? 0,
            bathrooms: property.bathrooms ?? 0,
            size: property.sizeSqm ?? 0,
            type: property.propertyType,
            images: property.imageUrls ?? [],
            amenities: [],
            coordinates: property.coordinates ?? null,
        }))
    }, [properties])

    // Filter properties by type
    const filteredProperties = useMemo(() => {
        if (selectedType === 'all') return normalizedProperties
        return normalizedProperties.filter(
            (p) => p.type.toLowerCase() === selectedType.toLowerCase()
        )
    }, [normalizedProperties, selectedType])

    // Pagination logic
    const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    const paginatedProperties = filteredProperties.slice(startIndex, endIndex)

    // Reset to page 1 when filter changes
    const handleFilterChange = (type: string) => {
        setSelectedType(type)
        setCurrentPage(1)
    }

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages: (number | string)[] = []
        const maxVisiblePages = 5

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages)
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
            }
        }
        return pages
    }

    if (properties === undefined) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="h-10 w-10 rounded-full border-2 border-lime-500/20 border-t-lime-500 animate-spin" />
                    </div>
                    <p className="text-sm text-muted-foreground">Loading properties...</p>
                </div>
            </div>
        )
    }

    if (normalizedProperties.length === 0) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-sidebar-accent mb-6">
                        <Building2 className="h-8 w-8 text-sidebar-foreground/70" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground mb-3">
                        No properties available yet
                    </h1>
                    <p className="text-muted-foreground mb-8 leading-relaxed">
                        We're currently expanding our exclusive listings. Check back soon for updates.
                    </p>
                    <Link href="/become-landlord">
                        <Button className="bg-lime-500 hover:bg-lime-600 text-white shadow-lg shadow-lime-500/20 rounded-xl px-6 h-11 font-medium transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
                            List Your Property
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            {/* Header Section */}
            <div className="px-6 pt-8 pb-6">
                <div className="flex flex-wrap items-center gap-4">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Properties
                    </h1>

                    {/* Filter Chips */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {propertyTypes.map((type) => (
                            <button
                                key={type.value}
                                onClick={() => handleFilterChange(type.value)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${selectedType === type.value
                                    ? 'bg-foreground text-background shadow-sm'
                                    : 'bg-sidebar-accent text-muted-foreground hover:bg-sidebar-accent/80 hover:text-foreground'
                                    }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Property Grid - 4x4 */}
            <div className="px-6 pb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {paginatedProperties.map((property) => (
                        <PropertyCard key={property.id} property={property} />
                    ))}
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 pb-10">
                    <div className="flex items-center justify-center gap-2">
                        {/* Previous Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent disabled:opacity-40"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                            {getPageNumbers().map((page, index) => (
                                typeof page === 'number' ? (
                                    <Button
                                        key={index}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setCurrentPage(page)}
                                        className={`h-9 w-9 rounded-lg text-sm font-medium transition-all duration-200 ${currentPage === page
                                            ? 'bg-foreground text-background shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent'
                                            }`}
                                    >
                                        {page}
                                    </Button>
                                ) : (
                                    <span key={index} className="px-1 text-muted-foreground/50">
                                        {page}
                                    </span>
                                )
                            ))}
                        </div>

                        {/* Next Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent disabled:opacity-40"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Page Info */}
                    <p className="text-center text-xs text-muted-foreground mt-3">
                        Showing {startIndex + 1}-{Math.min(endIndex, normalizedProperties.length)} of {normalizedProperties.length} properties
                    </p>
                </div>
            )}
        </div>
    )
}

// Airbnb-style PropertyCard component
function PropertyCard({ property }: { property: Property }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const images = property.images.length > 0 ? property.images : ['/window.svg']

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

    return (
        <Link href={`/properties/${property.id}`} className="group block">
            {/* Image Container */}
            <div className="relative aspect-square rounded-xl overflow-hidden bg-muted mb-3">
                <Image
                    src={images[currentImageIndex]}
                    alt={property.title}
                    fill
                    className="object-cover transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                />

                {/* Save Button - Heart */}
                <div className="absolute right-3 top-3 z-10">
                    <SavePropertyButton propertyId={property.id} />
                </div>

                {/* Image Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-105"
                        >
                            <ChevronLeft className="h-4 w-4 text-foreground" />
                        </button>
                        <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-105"
                        >
                            <ChevronRight className="h-4 w-4 text-foreground" />
                        </button>
                    </>
                )}

                {/* Carousel Dots */}
                {images.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                        {images.slice(0, 5).map((_, index) => (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setCurrentImageIndex(index)
                                }}
                                className={`h-1.5 rounded-full transition-all duration-200 ${currentImageIndex === index
                                    ? 'w-1.5 bg-white'
                                    : 'w-1.5 bg-white/60 hover:bg-white/80'
                                    }`}
                            />
                        ))}
                    </div>
                )}

                {/* Property Type Badge */}
                {property.type && (
                    <div className="absolute left-3 top-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white shadow-sm text-foreground capitalize">
                            {property.type}
                        </span>
                    </div>
                )}
            </div>

            {/* Content - Airbnb style minimal text */}
            <div className="space-y-1">
                {/* Location */}
                <div className="flex items-center justify-between">
                    <h3 className="font-medium text-foreground truncate pr-2">
                        {property.city}
                    </h3>
                </div>

                {/* Property Title */}
                <p className="text-muted-foreground text-sm truncate">
                    {property.title}
                </p>

                {/* Property Details & Price */}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                        {property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''} · {property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''} · {property.size} m²
                    </span>
                    <span className="font-semibold text-foreground whitespace-nowrap">
                        N$ {property.price.toLocaleString()}<span className="text-muted-foreground font-normal text-xs">/mo</span>
                    </span>
                </div>
            </div>
        </Link>
    )
}

