"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Building2, ChevronLeft, ChevronRight } from "lucide-react"
import { SavePropertyButton } from "@/components/properties/SavePropertyButton"
import { cn } from "@/lib/utils"

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
                        <div className="h-10 w-10 rounded-full border-2 border-black/10 border-t-black animate-spin" />
                    </div>
                    <p className="text-sm text-black/40 font-medium">Loading properties...</p>
                </div>
            </div>
        )
    }

    if (normalizedProperties.length === 0) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-black/5 mb-6">
                        <Building2 className="h-8 w-8 text-black/40" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-black mb-3 font-[family-name:var(--font-anton)] uppercase">
                        No properties found
                    </h1>
                    <p className="text-black/60 mb-8 leading-relaxed">
                        We couldn't find any properties matching your criteria. Try adjusting your filters or check back later.
                    </p>
                    <Link href="/become-landlord">
                        <Button className="bg-black hover:bg-black/80 text-white rounded-xl px-8 h-12 font-medium transition-all duration-300">
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
            <div className="px-6 pt-8 pb-6 space-y-6">
                <div className="flex flex-col gap-1 items-center text-center md:items-start md:text-left">
                    <h1 className="font-[family-name:var(--font-anton)] text-4xl tracking-wide text-black uppercase">
                        Properties
                    </h1>
                    <p className="text-black/40 font-medium text-sm">
                        Find your next home in Namibia
                    </p>
                </div>

                {/* Filter Chips - Horizontal Scroll on Mobile */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-6 px-6 md:flex-wrap md:overflow-visible md:pb-0 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
                    {propertyTypes.map((type) => (
                        <button
                            key={type.value}
                            onClick={() => handleFilterChange(type.value)}
                            className={cn(
                                "whitespace-nowrap flex-none px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
                                selectedType === type.value
                                    ? "bg-black text-white border-black"
                                    : "bg-transparent text-black/60 border-transparent hover:bg-black/5 hover:text-black"
                            )}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Property Grid */}
            <div className="px-6 pb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {paginatedProperties.map((property) => (
                        <PropertyCard key={property.id} property={property} />
                    ))}
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 pb-12">
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center justify-center gap-2 bg-black/5 p-1 rounded-full">
                            {/* Previous Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-8 w-8 rounded-full text-black/60 hover:text-black hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            {/* Page Numbers */}
                            <div className="flex items-center gap-1 px-2">
                                {getPageNumbers().map((page, index) => (
                                    typeof page === 'number' ? (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentPage(page)}
                                            className={cn(
                                                "h-7 w-7 rounded-full text-xs font-bold transition-all duration-200 flex items-center justify-center",
                                                currentPage === page
                                                    ? "bg-black text-white shadow-md"
                                                    : "text-black/40 hover:text-black hover:bg-black/5"
                                            )}
                                        >
                                            {page}
                                        </button>
                                    ) : (
                                        <span key={index} className="px-1 text-black/30 text-xs font-medium">
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
                                className="h-8 w-8 rounded-full text-black/60 hover:text-black hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        <p className="text-center text-[10px] font-medium text-black/30 uppercase tracking-widest">
                            Viewing {startIndex + 1}-{Math.min(endIndex, normalizedProperties.length)} of {normalizedProperties.length}
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

// Clean Minimal PropertyCard
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
        <Link href={`/properties/${property.id}`} className="group block select-none">
            {/* Image Container */}
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-100 mb-4 cursor-pointer">
                <Image
                    src={images[currentImageIndex]}
                    alt={property.title}
                    fill
                    className="object-cover transition-transform duration-700 will-change-transform group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                />

                {/* Gradient protection for white text if needed, but we are using badges */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />

                {/* Top Left Badge: Type */}
                <div className="absolute left-3 top-3 z-10">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-black text-white shadow-xl shadow-black/10">
                        {property.type}
                    </span>
                </div>

                {/* Save Button */}
                <div className="absolute right-3 top-3 z-10 transition-transform duration-200 active:scale-90">
                    <SavePropertyButton propertyId={property.id} />
                </div>

                {/* Image Navigation Arrows - Only visible on hover */}
                {images.length > 1 && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                            onClick={prevImage}
                            className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 text-black shadow-lg shadow-black/10 flex items-center justify-center hover:scale-110 active:scale-95 transition-all outline-none"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={nextImage}
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 text-black shadow-lg shadow-black/10 flex items-center justify-center hover:scale-110 active:scale-95 transition-all outline-none"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Carousel Dots */}
                {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 rounded-full bg-black/20 backdrop-blur-md">
                        {images.slice(0, 5).map((_, index) => (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setCurrentImageIndex(index)
                                }}
                                className={`h-1.5 rounded-full transition-all duration-300 ${currentImageIndex === index
                                    ? 'w-4 bg-white shadow-sm'
                                    : 'w-1.5 bg-white/50 hover:bg-white/80'
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex justify-between items-start gap-4">
                <div className="space-y-1 flex-1 min-w-0">
                    <h3 className="font-bold text-black text-lg leading-tight truncate">
                        {property.title}
                    </h3>
                    <p className="text-black/50 text-sm truncate">
                        {property.city}
                    </p>
                    {/* Specs Row */}
                    <div className="flex items-center gap-3 pt-1">
                        <p className="flex items-center gap-1.5 text-xs font-medium text-black/70 bg-black/5 px-2 py-1 rounded-md">
                            <span>{property.bedrooms} Beds</span>
                        </p>
                        <p className="flex items-center gap-1.5 text-xs font-medium text-black/70 bg-black/5 px-2 py-1 rounded-md">
                            <span>{property.bathrooms} Baths</span>
                        </p>
                        <p className="flex items-center gap-1.5 text-xs font-medium text-black/70 bg-black/5 px-2 py-1 rounded-md">
                            <span>{property.size}m²</span>
                        </p>
                    </div>
                </div>

                {/* Price */}
                <div className="text-right shrink-0">
                    <p className="font-[family-name:var(--font-anton)] text-xl text-black tracking-wide">
                        N${property.price.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-black/40 font-medium uppercase tracking-wider text-right">
                        /month
                    </p>
                </div>
            </div>
        </Link>
    )
}

