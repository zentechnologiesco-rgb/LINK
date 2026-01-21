'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PropertyMap } from '@/components/maps/PropertyMap'
import { List, Map, Search, MapPin } from 'lucide-react'

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

    // Prepare map properties with stable coordinates
    // For properties WITHOUT coordinates (mock data), generate them deterministically
    const mapProperties = useMemo(() => filteredProperties.map((p, index) => {
        let lat = p.coordinates?.lat
        let lng = p.coordinates?.lng

        // Generate coordinates for mock data if missing
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

    const propertyTypes = [
        { value: 'all', label: 'All' },
        { value: 'apartment', label: 'Apartments' },
        { value: 'house', label: 'Houses' },
        { value: 'studio', label: 'Studios' },
        { value: 'penthouse', label: 'Penthouses' },
    ]

    return (
        <div className="flex flex-col h-full">
            {/* Search Bar */}
            <div className="p-4 border-b border-gray-100 bg-white">
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex-1 min-w-[200px] max-w-md relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-10 bg-gray-50 border-gray-200 rounded-lg"
                        />
                    </div>

                    {/* Type Filters */}
                    <div className="flex gap-2 flex-wrap">
                        {propertyTypes.map((type) => (
                            <Button
                                key={type.value}
                                variant="outline"
                                size="sm"
                                onClick={() => setPropertyType(type.value)}
                                className={`rounded-full border-gray-200 ${propertyType === type.value
                                    ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800 hover:text-white'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {type.label}
                            </Button>
                        ))}
                    </div>

                    {/* View Toggle */}
                    <div className="flex gap-1 ml-auto">
                        <Button
                            variant={!showMap ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => setShowMap(false)}
                            className={`h-9 w-9 ${!showMap ? 'bg-gray-900 text-white' : 'border-gray-200'}`}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={showMap ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => setShowMap(true)}
                            className={`h-9 w-9 ${showMap ? 'bg-gray-900 text-white' : 'border-gray-200'}`}
                        >
                            <Map className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Results Count */}
            <div className="px-4 py-2 border-b border-gray-100 bg-white">
                <p className="text-sm text-gray-500">{filteredProperties.length} properties found</p>
            </div>

            {/* Main Content */}
            {showMap ? (
                <div className="flex flex-1" style={{ height: 'calc(100vh - 200px)' }}>
                    {/* Property List */}
                    <div className="w-[380px] overflow-y-auto border-r border-gray-100 bg-white hidden md:block">
                        <div className="p-3 space-y-2">
                            {filteredProperties.map((property) => (
                                <Link
                                    key={property.id}
                                    href={`/properties/${property.id}`}
                                    className="block"
                                    onMouseEnter={() => setSelectedPropertyId(property.id)}
                                // Don't set null on leave to avoid excessive re-render if mouse briefly leaves
                                // onMouseLeave={() => setSelectedPropertyId(null)}
                                >
                                    <div className={`flex gap-3 p-3 rounded-lg border transition-all ${selectedPropertyId === property.id
                                        ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900'
                                        : 'border-gray-100 hover:border-gray-200'
                                        }`}>
                                        <div className="w-20 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={property.images[0] || '/window.svg'}
                                                alt={property.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-900 text-sm truncate">
                                                {property.title}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-0.5">{property.city}</p>
                                            <p className="font-semibold text-gray-900 text-sm mt-1">
                                                N$ {property.price.toLocaleString()}<span className="text-xs text-gray-400 font-normal">/mo</span>
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Map Container */}
                    <div className="flex-1 bg-gray-200 relative">
                        <PropertyMap
                            properties={mapProperties}
                            onPropertyClick={(id) => {
                                setSelectedPropertyId(id)
                                // Scroll into view logic could go here
                            }}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProperties.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                <p>No properties found matching your criteria.</p>
                                <button
                                    onClick={() => {
                                        setSearchQuery('')
                                        setPropertyType('all')
                                    }}
                                    className="text-gray-900 hover:underline mt-2"
                                >
                                    Clear filters
                                </button>
                            </div>
                        ) : (
                            filteredProperties.map((property) => (
                                <Link
                                    key={property.id}
                                    href={`/properties/${property.id}`}
                                    className="block"
                                >
                                    <div className="rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all overflow-hidden group">
                                        <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={property.images[0] || '/window.svg'}
                                                alt={property.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-medium text-gray-900 text-sm truncate">
                                                {property.title}
                                            </h3>
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <MapPin className="h-3 w-3" />
                                                {property.city}
                                            </p>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                                <span>{property.bedrooms} beds</span>
                                                <span>{property.bathrooms} baths</span>
                                                <span>{property.size} m²</span>
                                            </div>
                                            <p className="font-semibold text-gray-900 mt-2">
                                                N$ {property.price.toLocaleString()}<span className="text-xs text-gray-400 font-normal">/mo</span>
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
