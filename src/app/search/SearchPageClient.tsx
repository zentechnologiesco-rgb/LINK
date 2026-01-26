'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { PropertyMap } from '@/components/maps/PropertyMap'
import { List, Map, Search, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { SavePropertyButton } from '@/components/properties/SavePropertyButton'
import { cn } from '@/lib/utils'

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

interface SearchPageClientProps {
    initialProperties: Property[]
}

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

export function SearchPageClient({ initialProperties }: SearchPageClientProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [propertyType, setPropertyType] = useState('all')
    const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)

    // Filter properties
    const filteredProperties = useMemo(() => {
        return initialProperties.filter((property) => {
            const matchesType = propertyType === 'all' || property.type.toLowerCase() === propertyType.toLowerCase()
            const matchesSearch = searchQuery === '' ||
                property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                property.city.toLowerCase().includes(searchQuery.toLowerCase())
            return matchesType && matchesSearch
        })
    }, [initialProperties, propertyType, searchQuery])

    // Prepare map properties
    const mapProperties = useMemo(() => filteredProperties.map((p, index) => {
        let lat = p.coordinates?.lat
        let lng = p.coordinates?.lng

        if (!lat || !lng) {
            lat = -22.5609 + (index * 0.01) - 0.12
            lng = 17.0658 + ((index % 5) * 0.02) - 0.05
        }

        return {
            id: p.id,
            title: p.title,
            price_nad: p.price,
            address: p.address,
            images: p.images,
            coordinates: { lat, lng }
        }
    }), [filteredProperties])

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)] bg-white">
            {/* Search Header */}
            <div className="px-6 py-4 border-b border-black/5">
                <div className="flex flex-wrap gap-4 items-center">
                    {/* Search Input */}
                    <div className="flex-1 min-w-[200px] max-w-md relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40 group-focus-within:text-black transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-full bg-black/5 border-transparent text-black placeholder:text-black/40 focus:outline-none focus:bg-black/10 transition-all font-medium"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Type Filters */}
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 md:flex-wrap md:overflow-visible md:pb-0 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden items-center">
                        {propertyTypes.map((type) => (
                            <button
                                key={type.value}
                                onClick={() => setPropertyType(type.value)}
                                className={cn(
                                    "whitespace-nowrap flex-none px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-200 border",
                                    propertyType === type.value
                                        ? "bg-black text-white border-black"
                                        : "bg-transparent text-black/60 border-transparent hover:bg-black/5 hover:text-black"
                                )}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results Count */}
            <div className="px-6 py-3 border-b border-black/5 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-black/40">
                    {filteredProperties.length} property{filteredProperties.length !== 1 ? 'ies' : 'y'} found
                </p>
            </div>

            {/* Main Content - Always Split View */}
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* Property List Sidebar */}
                <div className="w-full h-[45vh] md:h-auto md:w-[400px] overflow-y-auto border-t md:border-t-0 md:border-r border-black/5 bg-white order-2 md:order-1 relative z-10">
                    {filteredProperties.length === 0 ? (
                        <EmptyState onClear={() => { setSearchQuery(''); setPropertyType('all'); }} />
                    ) : (
                        <div className="p-4 space-y-4">
                            {filteredProperties.map((property) => (
                                <PropertyListItem
                                    key={property.id}
                                    property={property}
                                    isSelected={selectedPropertyId === property.id}
                                    onMouseEnter={() => setSelectedPropertyId(property.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Map Container */}
                <div className="flex-1 bg-gray-100 relative order-1 md:order-2">
                    <PropertyMap
                        properties={mapProperties}
                        onPropertyClick={(id) => setSelectedPropertyId(id)}
                    />
                </div>
            </div>
        </div>
    )
}

// Empty State Component
function EmptyState({ onClear }: { onClear: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="h-16 w-16 rounded-full bg-black/5 flex items-center justify-center mb-6">
                <Search className="h-8 w-8 text-black/20" />
            </div>
            <h3 className="text-xl font-bold uppercase tracking-wide text-black mb-2">No properties found</h3>
            <p className="text-black/50 mb-8 max-w-sm">
                We couldn't find any properties matching your criteria. Try adjusting your filters.
            </p>
            <Button
                onClick={onClear}
                variant="outline"
                className="rounded-full px-8 border-black text-black hover:bg-black hover:text-white transition-colors uppercase font-bold text-xs tracking-widest"
            >
                Clear all filters
            </Button>
        </div>
    )
}

// Property List Item (for sidebar with map)
function PropertyListItem({
    property,
    isSelected,
    onMouseEnter
}: {
    property: Property
    isSelected: boolean
    onMouseEnter: () => void
}) {
    return (
        <Link
            href={`/properties/${property.id}`}
            className="block group"
            onMouseEnter={onMouseEnter}
        >
            <div className={cn(
                "flex gap-3 p-3 rounded-2xl transition-all duration-300 border border-transparent",
                isSelected
                    ? "bg-black text-white shadow-lg transform scale-[1.02]"
                    : "hover:bg-gray-50 hover:border-black/5"
            )}>
                <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0 relative">
                    <Image
                        src={property.images[0] || '/window.svg'}
                        alt={property.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                    />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                    <div className="flex justify-between items-start">
                        <h3 className={cn("font-bold text-sm truncate pr-2", isSelected ? "text-white" : "text-black")}>
                            {property.title}
                        </h3>
                    </div>

                    <p className={cn("text-xs truncate", isSelected ? "text-white/60" : "text-black/40")}>
                        {property.city}
                    </p>

                    <p className={cn("text-[10px] font-medium truncate mt-1", isSelected ? "text-white/80" : "text-black/60")}>
                        {property.bedrooms} Bed · {property.bathrooms} Bath · {property.size}m²
                    </p>

                    <p className={cn(
                        "font-[family-name:var(--font-anton)] text-lg tracking-wide mt-1",
                        isSelected ? "text-white" : "text-black"
                    )}>
                        N$ {property.price.toLocaleString()}
                    </p>
                </div>
            </div>
        </Link>
    )
}

// Updated Property Card (Grid View) - Matches Home Page Design
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
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-100 mb-4 cursor-pointer">
                <Image
                    src={images[currentImageIndex]}
                    alt={property.title}
                    fill
                    className="object-cover transition-transform duration-700 will-change-transform group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                />

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Save Button */}
                <div className="absolute right-3 top-3 z-10">
                    <SavePropertyButton propertyId={property.id} className="bg-white/90 hover:bg-white text-black border-none shadow-sm" />
                </div>

                {/* Type Badge */}
                <div className="absolute left-3 top-3 z-10">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-black text-white shadow-xl shadow-black/10">
                        {property.type}
                    </span>
                </div>

                {/* Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 backdrop-blur-md hover:bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 backdrop-blur-md hover:bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </>
                )}

                {/* Dots */}
                {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                        {images.slice(0, 5).map((_, index) => (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setCurrentImageIndex(index)
                                }}
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-300 shadow-sm",
                                    currentImageIndex === index ? "w-4 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                                )}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex justify-between items-start gap-4">
                <div className="space-y-1 flex-1 min-w-0">
                    <h3 className="font-bold text-black text-lg leading-tight truncate">
                        {property.title}
                    </h3>
                    <p className="text-black/50 text-sm truncate">
                        {property.city}
                    </p>
                    {/* Specs Row - Cleaner text based */}
                    <div className="flex items-center gap-2 pt-1 text-sm font-medium text-black/60">
                        <span>{property.bedrooms} Bed</span>
                        <span className="text-black/20">·</span>
                        <span>{property.bathrooms} Bath</span>
                        <span className="text-black/20">·</span>
                        <span>{property.size} m²</span>
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
