'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, MapPin, Bed, Bath, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

const ITEMS_PER_PAGE = 12

interface Property {
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
    isFromDatabase?: boolean
}

interface PropertyFeedProps {
    properties: Property[]
}

export function PropertyFeed({ properties }: PropertyFeedProps) {
    const [currentPage, setCurrentPage] = useState(1)
    const [propertyType, setPropertyType] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')

    // Filter properties
    const filteredProperties = properties.filter((property) => {
        const matchesType = propertyType === 'all' || property.type.toLowerCase() === propertyType.toLowerCase()
        const matchesSearch = searchQuery === '' ||
            property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
            property.city.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesType && matchesSearch
    })

    // Pagination
    const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const paginatedProperties = filteredProperties.slice(startIndex, startIndex + ITEMS_PER_PAGE)

    const propertyTypes = [
        { value: 'all', label: 'All' },
        { value: 'apartment', label: 'Apartments' },
        { value: 'house', label: 'Houses' },
        { value: 'studio', label: 'Studios' },
        { value: 'penthouse', label: 'Penthouses' },
    ]

    const handleTypeChange = (type: string) => {
        setPropertyType(type)
        setCurrentPage(1)
    }

    return (
        <>
            {/* Search */}
            <div className="flex justify-center mb-6">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        className="h-10 pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-lg"
                        placeholder="Search by location..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            setCurrentPage(1)
                        }}
                    />
                </div>
            </div>

            {/* Type Filters */}
            <div className="flex gap-2 mb-8 flex-wrap justify-center">
                {propertyTypes.map((type) => (
                    <Button
                        key={type.value}
                        variant="outline"
                        size="sm"
                        onClick={() => handleTypeChange(type.value)}
                        className={`rounded-full border-gray-200 ${propertyType === type.value
                            ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800 hover:text-white'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        {type.label}
                    </Button>
                ))}
            </div>

            {/* Properties Grid */}
            {paginatedProperties.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                    {paginatedProperties.map((property) => (
                        <Link
                            key={property.id}
                            href={`/properties/${property.id}`}
                            className="block"
                        >
                            <div className="rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group overflow-hidden">
                                {/* Image */}
                                <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={property.images[0]}
                                        alt={property.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    {property.isFromDatabase && (
                                        <Badge className="absolute top-2 left-2 bg-green-500 hover:bg-green-500 text-white text-xs gap-1">
                                            <Sparkles className="h-3 w-3" />
                                            New
                                        </Badge>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h3 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-gray-700">
                                            {property.title}
                                        </h3>
                                    </div>

                                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                                        <MapPin className="h-3 w-3 shrink-0" />
                                        <span className="truncate">{property.city}</span>
                                    </p>

                                    {/* Meta */}
                                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                                        <span className="flex items-center gap-1">
                                            <Bed className="h-3 w-3" />
                                            {property.bedrooms}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Bath className="h-3 w-3" />
                                            {property.bathrooms}
                                        </span>
                                        <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 text-xs">
                                            {property.size} m²
                                        </span>
                                    </div>

                                    {/* Price */}
                                    <div className="flex items-baseline gap-1">
                                        <p className="font-semibold text-gray-900">N$ {property.price.toLocaleString()}</p>
                                        <p className="text-xs text-gray-400">/mo</p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 mb-8">
                    <p className="text-gray-500">No properties found</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                    <p className="text-sm text-gray-500">
                        Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 border-gray-200"
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage(currentPage - 1)}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                        </Button>

                        {/* Page Numbers */}
                        <div className="hidden sm:flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum: number
                                if (totalPages <= 5) {
                                    pageNum = i + 1
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i
                                } else {
                                    pageNum = currentPage - 2 + i
                                }

                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? 'default' : 'ghost'}
                                        size="sm"
                                        className={`h-9 w-9 p-0 ${currentPage === pageNum
                                            ? 'bg-gray-900 text-white hover:bg-gray-800'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        onClick={() => setCurrentPage(pageNum)}
                                    >
                                        {pageNum}
                                    </Button>
                                )
                            })}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 border-gray-200"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(currentPage + 1)}
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between py-6 mt-4 border-t border-gray-100">
                <p className="text-sm text-gray-400">
                    Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredProperties.length)} of {filteredProperties.length}
                </p>
                <Link href="/become-landlord">
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900">
                        List your property →
                    </Button>
                </Link>
            </div>
        </>
    )
}
