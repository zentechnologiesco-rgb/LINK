'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
    Building2,
    Plus,
    MoreHorizontal,
    Eye,
    Edit,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { Id } from "../../../../../convex/_generated/dataModel"

interface Property {
    _id: Id<"properties">
    title: string
    propertyType: string
    city: string
    address: string
    bedrooms?: number
    bathrooms?: number
    sizeSqm?: number
    priceNad: number
    isAvailable: boolean
    imageUrls?: string[]
    status?: string
}

function LandlordPropertiesContent() {
    const properties = useQuery(api.properties.getByLandlord, {})
    const leases = useQuery(api.leases.getForLandlord, {})

    if (properties === undefined) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-lime-500/20 border-t-lime-500 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading properties...</p>
                </div>
            </div>
        )
    }

    // Calculate stats
    const activeLeases = leases?.filter((l: any) => l.status === 'approved') || []
    const propertyIdsWithLease = new Set(activeLeases.map((l: any) => l.propertyId))

    const stats = {
        total: properties.length,
        listed: properties.filter((p: Property) => p.isAvailable).length,
        leased: propertyIdsWithLease.size,
        available: properties.filter((p: Property) => p.isAvailable).length - propertyIdsWithLease.size,
    }

    return (
        <div className="px-6 py-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">My Properties</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage your property listings</p>
                </div>
                <Link href="/landlord/properties/new">
                    <Button className="bg-lime-500 hover:bg-lime-600 text-white rounded-lg h-10 px-4 font-medium shadow-lg shadow-lime-500/20 transition-all hover:shadow-xl">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Property
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                <StatCard label="Total" value={stats.total} />
                <StatCard label="Listed" value={stats.listed} />
                <StatCard label="Leased" value={stats.leased} />
                <StatCard label="Available" value={stats.available} />
            </div>

            {/* Properties Grid */}
            {properties.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {properties.map((property: Property) => (
                        <PropertyCard
                            key={property._id}
                            property={property}
                            hasLease={propertyIdsWithLease.has(property._id)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// Stat Card Component
function StatCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="p-4 rounded-xl bg-sidebar-accent/50">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold text-foreground mt-1">{value}</p>
        </div>
    )
}

// Empty State Component
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="h-16 w-16 rounded-2xl bg-sidebar-accent flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No properties yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
                Start by adding your first property listing to reach potential tenants.
            </p>
            <Link href="/landlord/properties/new">
                <Button className="bg-lime-500 hover:bg-lime-600 text-white rounded-lg h-11 px-5 font-medium">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Property
                </Button>
            </Link>
        </div>
    )
}

// Property Card Component - Airbnb style
function PropertyCard({ property, hasLease }: { property: Property; hasLease: boolean }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const images = property.imageUrls && property.imageUrls.length > 0
        ? property.imageUrls
        : ['/window.svg']

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

    const getStatusBadge = () => {
        if (hasLease) {
            return { label: 'Leased', className: 'bg-lime-500 text-white' }
        }
        if (property.isAvailable) {
            return { label: 'Listed', className: 'bg-foreground text-background' }
        }
        return { label: 'Unlisted', className: 'bg-sidebar-accent text-muted-foreground' }
    }

    const status = getStatusBadge()

    return (
        <div className="group">
            {/* Image Container */}
            <div className="relative aspect-square rounded-xl overflow-hidden bg-muted mb-3">
                <Link href={`/properties/${property._id}`}>
                    {images[currentImageIndex] === '/window.svg' ? (
                        <div className="w-full h-full flex items-center justify-center bg-sidebar-accent">
                            <Building2 className="h-12 w-12 text-muted-foreground" />
                        </div>
                    ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={images[currentImageIndex]}
                            alt={property.title}
                            className="w-full h-full object-cover"
                        />
                    )}
                </Link>

                {/* Status Badge */}
                <div className="absolute left-3 top-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.className}`}>
                        {status.label}
                    </span>
                </div>

                {/* Actions Dropdown */}
                <div className="absolute right-3 top-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center transition-colors">
                                <MoreHorizontal className="h-4 w-4 text-foreground" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem asChild>
                                <Link href={`/properties/${property._id}`} className="flex items-center">
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/landlord/properties/${property._id}/edit`} className="flex items-center">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
                                className={`h-1.5 w-1.5 rounded-full transition-all duration-200 ${currentImageIndex === index ? 'bg-white' : 'bg-white/60'
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Content */}
            <Link href={`/properties/${property._id}`} className="block">
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium text-foreground truncate pr-2">
                            {property.city}
                        </h3>
                        <span className="text-xs text-muted-foreground capitalize">
                            {property.propertyType}
                        </span>
                    </div>
                    <p className="text-muted-foreground text-sm truncate">
                        {property.title}
                    </p>
                    <div className="flex items-center justify-between text-sm pt-1">
                        <span className="text-muted-foreground">
                            {property.bedrooms || 0} bed{(property.bedrooms || 0) !== 1 ? 's' : ''} · {property.bathrooms || 0} bath{(property.bathrooms || 0) !== 1 ? 's' : ''} · {property.sizeSqm || 0} m²
                        </span>
                    </div>
                    <p className="pt-1">
                        <span className="font-semibold text-foreground">N$ {property.priceNad?.toLocaleString()}</span>
                        <span className="text-muted-foreground text-xs">/mo</span>
                    </p>
                </div>
            </Link>
        </div>
    )
}

export default function LandlordPropertiesPage() {
    return <LandlordPropertiesContent />
}
