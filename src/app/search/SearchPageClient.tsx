'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { PropertyMap } from '@/components/maps/PropertyMap'
import { List, Map, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { SavePropertyButton } from '@/components/properties/SavePropertyButton'

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
    const [showMap, setShowMap] = useState(true)
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
        <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)] bg-background">
            {/* Search Header */}
            <div className="px-5 py-4 border-b border-border">
                <div className="flex flex-wrap gap-4 items-center">
                    {/* Search Input */}
                    <div className="flex-1 min-w-[200px] max-w-md relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-sidebar-accent border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-lime-500/50 transition-all"
                        />
                    </div>

                    {/* Type Filters */}
                    <div className="flex gap-2 flex-wrap">
                        {propertyTypes.map((type) => (
                            <button
                                key={type.value}
                                onClick={() => setPropertyType(type.value)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${propertyType === type.value
                                    ? 'bg-foreground text-background'
                                    : 'bg-sidebar-accent text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>

                    {/* View Toggle */}
                    <div className="flex gap-1 ml-auto bg-sidebar-accent rounded-lg p-1">
                        <button
                            onClick={() => setShowMap(false)}
                            className={`h-8 w-8 rounded-md flex items-center justify-center transition-all ${!showMap
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <List className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setShowMap(true)}
                            className={`h-8 w-8 rounded-md flex items-center justify-center transition-all ${showMap
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Map className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Count */}
            <div className="px-5 py-2 border-b border-border">
                <p className="text-sm text-muted-foreground">
                    {filteredProperties.length} property{filteredProperties.length !== 1 ? 'ies' : 'y'} found
                </p>
            </div>

            {/* Main Content */}
            {showMap ? (
                <div className="flex flex-1 overflow-hidden">
                    {/* Property List Sidebar */}
                    <div className="w-96 overflow-y-auto border-r border-border hidden md:block">
                        {filteredProperties.length === 0 ? (
                            <EmptyState onClear={() => { setSearchQuery(''); setPropertyType('all'); }} />
                        ) : (
                            <div className="p-3 space-y-2">
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
                    <div className="flex-1 bg-muted relative">
                        <PropertyMap
                            properties={mapProperties}
                            onPropertyClick={(id) => setSelectedPropertyId(id)}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto p-5">
                    {filteredProperties.length === 0 ? (
                        <EmptyState onClear={() => { setSearchQuery(''); setPropertyType('all'); }} />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {filteredProperties.map((property) => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// Empty State Component
function EmptyState({ onClear }: { onClear: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="h-14 w-14 rounded-2xl bg-sidebar-accent flex items-center justify-center mb-4">
                <Search className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No properties found</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
                We couldn't find any properties matching your criteria. Try adjusting your filters.
            </p>
            <Button
                onClick={onClear}
                variant="outline"
                className="rounded-lg"
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
            className="block"
            onMouseEnter={onMouseEnter}
        >
            <div className={`flex gap-3 p-3 rounded-xl transition-all duration-200 ${isSelected
                ? 'bg-sidebar-accent ring-1 ring-border'
                : 'hover:bg-sidebar-accent/50'
                }`}>
                <div className="w-24 h-20 rounded-lg bg-muted overflow-hidden shrink-0 relative">
                    <Image
                        src={property.images[0] || '/window.svg'}
                        alt={property.title}
                        fill
                        className="object-cover"
                        sizes="96px"
                    />
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                    <h3 className="font-medium text-foreground text-sm truncate">
                        {property.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{property.city}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        {property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''} · {property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}
                    </p>
                    <p className="font-semibold text-foreground text-sm mt-1">
                        N$ {property.price.toLocaleString()}<span className="text-xs text-muted-foreground font-normal">/mo</span>
                    </p>
                </div>
            </div>
        </Link>
    )
}

// Airbnb-style Property Card (for grid view)
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

                {/* Save Button */}
                <div className="absolute right-3 top-3 z-10">
                    <SavePropertyButton propertyId={property.id} />
                </div>

                {/* Image Navigation */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                            <ChevronLeft className="h-4 w-4 text-foreground" />
                        </button>
                        <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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
                                className={`h-1.5 w-1.5 rounded-full transition-all duration-200 ${currentImageIndex === index
                                    ? 'bg-white'
                                    : 'bg-white/60'
                                    }`}
                            />
                        ))}
                    </div>
                )}

                {/* Property Type Badge */}
                <div className="absolute left-3 top-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white shadow-sm text-foreground capitalize">
                        {property.type}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-1">
                <h3 className="font-medium text-foreground truncate">
                    {property.city}
                </h3>
                <p className="text-muted-foreground text-sm truncate">
                    {property.title}
                </p>
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
