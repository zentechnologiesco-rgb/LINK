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
    LayoutGrid,
    Search
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
import { cn } from '@/lib/utils'

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
    approvalStatus?: string
    adminNotes?: string
}

function LandlordPropertiesContent() {
    const properties = useQuery(api.properties.getByLandlord, {})
    const leases = useQuery(api.leases.getForLandlord, {})

    if (properties === undefined) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-black/10 border-t-black animate-spin" />
                    <p className="text-sm text-black/40 font-medium">Loading properties...</p>
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
        <div className="px-8 py-10 max-w-[1600px] mx-auto pb-24">
            {/* Header */}
            <div className="flex justify-end mb-12">
                <Link href="/landlord/properties/new">
                    <Button className="bg-black hover:bg-black/80 text-white rounded-full h-12 px-8 font-bold uppercase tracking-wider text-xs border border-transparent transition-all hover:scale-105 active:scale-95 shadow-none">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Property
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            {properties.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                    <StatCard label="Total Properties" value={stats.total} />
                    <StatCard label="Active Listings" value={stats.listed} />
                    <StatCard label="Currently Leased" value={stats.leased} />
                    <StatCard label="Vacant Units" value={stats.available} highlight={stats.available > 0} />
                </div>
            )}

            {/* Properties Grid */}
            {properties.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-black/40 font-bold uppercase tracking-widest text-xs mb-8">
                        <LayoutGrid className="h-4 w-4" />
                        <span>All Listings</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                        {properties.map((property: Property) => (
                            <PropertyCard
                                key={property._id}
                                property={property}
                                hasLease={propertyIdsWithLease.has(property._id)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// Stat Card Component
function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
    return (
        <div className={cn(
            "p-6 rounded-3xl border transition-all duration-300",
            highlight
                ? "bg-black border-black text-white"
                : "bg-white border-black/10 text-black hover:border-black"
        )}>
            <p className={cn(
                "text-[10px] font-bold uppercase tracking-widest mb-2",
                highlight ? "text-white/60" : "text-black/40"
            )}>
                {label}
            </p>
            <p className={cn(
                "font-[family-name:var(--font-anton)] text-5xl",
                highlight ? "text-white" : "text-black"
            )}>
                {value}
            </p>
        </div>
    )
}

// Empty State Component
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-24 px-8 text-center bg-gray-50/50 rounded-[3rem] border border-black/5 dashed">
            <div className="h-20 w-20 rounded-3xl bg-white border border-black/10 flex items-center justify-center mb-8 rotate-3 transition-transform hover:rotate-6">
                <Building2 className="h-8 w-8 text-black/20" />
            </div>
            <h3 className="font-[family-name:var(--font-anton)] text-2xl uppercase tracking-wide text-black mb-3">
                No properties yet
            </h3>
            <p className="text-black/50 mb-8 max-w-sm font-medium">
                Start building your portfolio by adding your first property listing.
            </p>
            <Link href="/landlord/properties/new">
                <Button className="bg-black hover:bg-black/90 text-white rounded-full h-14 px-10 font-bold uppercase tracking-wider text-sm shadow-none hover:scale-105 transition-all">
                    <Plus className="mr-2 h-5 w-5" />
                    List Property
                </Button>
            </Link>
        </div>
    )
}

// Property Card Component
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
            return { label: 'Leased', className: 'bg-black text-white border-black' }
        }
        if (property.approvalStatus === 'rejected') {
            return { label: 'Rejected', className: 'bg-red-500 text-white border-red-500' }
        }
        if (property.approvalStatus === 'pending') {
            return { label: 'Pending', className: 'bg-yellow-500 text-white border-yellow-500' }
        }
        if (property.isAvailable) {
            return { label: 'Listed', className: 'bg-white text-black border-black/10' }
        }
        return { label: 'Unlisted', className: 'bg-gray-100 text-black/40 border-transparent' }
    }

    const status = getStatusBadge()

    return (
        <div className="group space-y-4">
            {/* Image Container */}
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-gray-100 border border-black/10 transition-all duration-500 group-hover:scale-[1.02]">
                <Link href={`/properties/${property._id}`}>
                    {images[currentImageIndex] === '/window.svg' ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                            <Building2 className="h-12 w-12 text-black/10" />
                        </div>
                    ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={images[currentImageIndex]}
                            alt={property.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                    )}
                </Link>

                {/* Status Badge */}
                <div className="absolute left-4 top-4">
                    <span className={cn(
                        "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md",
                        status.className
                    )}>
                        {status.label}
                    </span>
                </div>

                {/* Actions Dropdown */}
                <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="h-9 w-9 rounded-full bg-white text-black hover:bg-black hover:text-white border border-black/10 flex items-center justify-center transition-all duration-300">
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl border-black/5 bg-white shadow-none border">
                            <DropdownMenuItem asChild className="rounded-xl focus:bg-black/5 font-medium cursor-pointer py-2.5">
                                <Link href={`/properties/${property._id}`} className="flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-black/60" />
                                    <span>View Details</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="rounded-xl focus:bg-black/5 font-medium cursor-pointer py-2.5">
                                <Link href={`/landlord/properties/${property._id}/edit`} className="flex items-center gap-2">
                                    <Edit className="h-4 w-4 text-black/60" />
                                    <span>Edit Property</span>
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Image Navigation */}
                {images.length > 1 && (
                    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                        <button
                            onClick={prevImage}
                            className="h-8 w-8 rounded-full bg-white/90 text-black hover:bg-black hover:text-white border border-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-auto -translate-x-2 group-hover:translate-x-0 shadow-none"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={nextImage}
                            className="h-8 w-8 rounded-full bg-white/90 text-black hover:bg-black hover:text-white border border-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-auto translate-x-2 group-hover:translate-x-0 shadow-none"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Carousel Dots */}
                {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                        {images.slice(0, 5).map((_, index) => (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setCurrentImageIndex(index)
                                }}
                                className={cn(
                                    "h-1.5 w-1.5 rounded-full transition-all duration-300",
                                    currentImageIndex === index ? "bg-white w-3" : "bg-white/50 hover:bg-white/80"
                                )}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Content */}
            <Link href={`/properties/${property._id}`} className="block group/text">
                <div className="space-y-3 px-1">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">
                                    {property.propertyType}
                                </span>
                            </div>
                            <h3 className="font-bold text-lg text-black leading-tight group-hover/text:underline decoration-2 underline-offset-4">
                                {property.city}
                            </h3>
                            <p className="text-sm font-medium text-black/60 truncate mt-0.5 max-w-[200px]">
                                {property.title}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="font-[family-name:var(--font-anton)] text-xl text-black">
                                N$ {property.priceNad?.toLocaleString()}
                            </span>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-black/30">/mo</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-black/[0.03] border border-black/[0.02]">
                            <span className="text-xs font-bold text-black/60">
                                {property.bedrooms || 0} <span className="text-black/30 font-medium">Bed</span>
                            </span>
                            <div className="w-px h-3 bg-black/10" />
                            <span className="text-xs font-bold text-black/60">
                                {property.bathrooms || 0} <span className="text-black/30 font-medium">Bath</span>
                            </span>
                            <div className="w-px h-3 bg-black/10" />
                            <span className="text-xs font-bold text-black/60">
                                {property.sizeSqm || 0} <span className="text-black/30 font-medium">m²</span>
                            </span>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    )
}

export default function LandlordPropertiesPage() {
    return <LandlordPropertiesContent />
}
