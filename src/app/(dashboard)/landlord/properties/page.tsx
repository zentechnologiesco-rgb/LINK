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
    Search,
    MapPin,
    BedDouble,
    Bath,
    Maximize,
    AlertCircle
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
                    <p className="text-sm text-black/40 font-medium">Loading portfolio...</p>
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
        <div className="min-h-screen bg-white">
            <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-12 pb-32">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div>
                        <h1 className="font-[family-name:var(--font-anton)] text-5xl md:text-7xl uppercase text-black leading-[0.9] mb-4">
                            Property<br />Portfolio
                        </h1>
                        <p className="text-black/60 font-medium max-w-md">
                            Manage your listings, track automated leasing, and monitor property performance in real-time.
                        </p>
                    </div>
                    <div>
                        <Link href="/landlord/properties/new">
                            <Button className="bg-black hover:bg-neutral-800 text-white h-14 px-8 rounded-xl font-bold tracking-wide transition-all hover:-translate-y-1 shadow-xl shadow-black/10">
                                <Plus className="mr-2 h-5 w-5" />
                                Add New Property
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                {properties.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
                        <StatCard label="Total Units" value={stats.total} />
                        <StatCard label="Active Listings" value={stats.listed} />
                        <StatCard label="Currently Leased" value={stats.leased} />
                        <StatCard label="Vacant Units" value={stats.available} highlight={stats.available > 0} />
                    </div>
                )}

                {/* Properties Grid */}
                {properties.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="flex items-center justify-between border-b border-black/5 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-mono font-bold uppercase tracking-widest text-black/40">
                                    Live Listings ({properties.length})
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-x-8 gap-y-12">
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
        </div>
    )
}

// Stat Card Component
function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
    return (
        <div className={cn(
            "p-8 rounded-2xl transition-all duration-300 flex flex-col justify-between h-32 md:h-40 group",
            highlight
                ? "bg-neutral-900 text-white ring-1 ring-black"
                : "bg-neutral-50 hover:bg-white border border-neutral-100 hover:border-neutral-200 hover:shadow-lg hover:shadow-black/5"
        )}>
            <div className="flex justify-between items-start">
                <span className={cn(
                    "text-[10px] uppercase tracking-widest font-mono font-bold",
                    highlight ? "text-neutral-400" : "text-neutral-400"
                )}>
                    {label}
                </span>
                {highlight && <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
            </div>

            <p className={cn(
                "font-[family-name:var(--font-anton)] text-5xl md:text-6xl leading-none",
                highlight ? "text-white" : "text-neutral-900"
            )}>
                {value}
            </p>
        </div>
    )
}

// Empty State Component
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-32 px-8 text-center bg-neutral-50 rounded-3xl border border-dashed border-neutral-200">
            <div className="h-24 w-24 rounded-full bg-white border border-neutral-100 flex items-center justify-center mb-6 shadow-sm">
                <Building2 className="h-10 w-10 text-neutral-300" />
            </div>
            <h3 className="font-[family-name:var(--font-anton)] text-3xl text-neutral-900 mb-2 uppercase tracking-wide">
                No properties yet
            </h3>
            <p className="text-neutral-500 mb-8 max-w-sm">
                Your portfolio is empty. Add your first property to start receiving inquiries.
            </p>
            <Link href="/landlord/properties/new">
                <Button className="bg-neutral-900 hover:bg-neutral-800 text-white h-12 px-8 rounded-xl font-bold tracking-wide">
                    List First Property
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

    const status = (() => {
        if (hasLease) return { label: 'Leased', color: 'bg-neutral-900 text-white' }
        if (property.approvalStatus === 'rejected') return { label: 'Rejected', color: 'bg-red-500 text-white' }
        if (property.approvalStatus === 'pending') return { label: 'Pending', color: 'bg-amber-400 text-neutral-900' }
        if (!property.isAvailable) return { label: 'Unlisted', color: 'bg-neutral-200 text-neutral-500' }
        return { label: 'Active', color: 'bg-emerald-500 text-white' }
    })()

    return (
        <div className="group flex flex-col gap-4">
            {/* Image & Status */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 group-hover:shadow-2xl group-hover:shadow-black/5 transition-all duration-500 group-hover:-translate-y-1">
                <Link href={`/properties/${property._id}`} className="block h-full w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                </Link>

                <div className="absolute top-4 left-4">
                    <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md",
                        status.color
                    )}>
                        {status.label}
                    </span>
                </div>
            </div>

            {/* Info */}
            <div className="space-y-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-neutral-900 leading-tight line-clamp-1 group-hover:text-neutral-600 transition-colors">
                            {property.title}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1 text-neutral-400">
                            <MapPin className="h-3 w-3" />
                            <p className="text-xs font-medium">{property.city}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="font-mono font-bold text-neutral-900 text-lg">
                            N${property.priceNad.toLocaleString()}
                        </span>
                        <p className="text-[10px] text-neutral-400 font-mono">/mo</p>
                    </div>
                </div>

                {/* Specs */}
                <div className="flex items-center gap-2 pt-2 border-t border-dashed border-neutral-200">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-neutral-50 rounded-md">
                        <BedDouble className="h-3.5 w-3.5 text-neutral-400" />
                        <span className="text-xs font-mono font-bold text-neutral-700">{property.bedrooms || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-neutral-50 rounded-md">
                        <Bath className="h-3.5 w-3.5 text-neutral-400" />
                        <span className="text-xs font-mono font-bold text-neutral-700">{property.bathrooms || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-neutral-50 rounded-md">
                        <Maximize className="h-3.5 w-3.5 text-neutral-400" />
                        <span className="text-xs font-mono font-bold text-neutral-700">{property.sizeSqm || 0}m²</span>
                    </div>
                </div>

                {/* Quick Actions Management Bar */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                        href={`/landlord/properties/${property._id}/edit`}
                        className="flex items-center justify-center gap-2 h-9 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 text-xs font-bold text-neutral-700 transition-colors"
                    >
                        <Edit className="h-3.5 w-3.5" />
                        Manage
                    </Link>
                    <Link
                        href={`/properties/${property._id}`}
                        className="flex items-center justify-center gap-2 h-9 rounded-lg border border-transparent bg-neutral-50 hover:bg-neutral-100 text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        Preview
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default function LandlordPropertiesPage() {
    return <LandlordPropertiesContent />
}
