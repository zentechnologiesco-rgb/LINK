"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import {
    Building2,
    Plus,
    Edit,
    Eye,
    MapPin,
    BedDouble,
    Bath,
    Maximize,
    TrendingUp
} from 'lucide-react'
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

export default function LandlordPropertiesPage() {
    const router = useRouter()
    const [isRefreshing, setIsRefreshing] = useState(false)
    const properties = useQuery(api.properties.getByLandlord, {})
    const leases = useQuery(api.leases.getForLandlord, {})

    const handleRefresh = async () => {
        setIsRefreshing(true)
        router.refresh()
        // Small delay for visual feedback since Convex updates are instant
        await new Promise(resolve => setTimeout(resolve, 500))
        setIsRefreshing(false)
    }

    if (properties === undefined) {
        return (
            <div className="font-sans text-neutral-900">
                {/* Stats Skeleton */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white rounded-xl border border-neutral-200 p-4">
                            <div className="h-3 w-16 bg-neutral-100 rounded animate-pulse mb-2" />
                            <div className="h-8 w-10 bg-neutral-100 rounded animate-pulse" />
                        </div>
                    ))}
                </div>
                {/* Cards Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                            <div className="aspect-[4/3] bg-neutral-100 animate-pulse" />
                            <div className="p-4 space-y-2">
                                <div className="h-4 w-3/4 bg-neutral-100 rounded animate-pulse" />
                                <div className="h-3 w-1/2 bg-neutral-100 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // Calculate stats
    const activeLeases = leases?.filter((l: any) => l.status === 'approved') || []
    const propertyIdsWithLease = new Set(activeLeases.map((l: any) => l.propertyId))

    // Group properties
    const actionRequired = properties.filter((p: Property) => p.approvalStatus === 'rejected')
    const pendingReview = properties.filter((p: Property) => p.approvalStatus === 'pending')
    const activeListings = properties.filter((p: Property) =>
        p.isAvailable &&
        p.approvalStatus !== 'rejected' &&
        p.approvalStatus !== 'pending' &&
        !propertyIdsWithLease.has(p._id)
    )
    const leasedProperties = properties.filter((p: Property) => propertyIdsWithLease.has(p._id))
    const unlistedProperties = properties.filter((p: Property) =>
        !p.isAvailable &&
        p.approvalStatus !== 'rejected' &&
        p.approvalStatus !== 'pending' &&
        !propertyIdsWithLease.has(p._id)
    )

    const stats = {
        actionRequired: actionRequired.length,
        listed: activeListings.length,
        leased: propertyIdsWithLease.size,
        total: properties.length,
    }

    return (
        <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
            <div className="font-sans text-neutral-900">
                {/* Header */}
                <div className="flex items-center justify-end mb-6 pb-4 border-b border-neutral-100">
                    {properties.length > 0 && (
                        <Link href="/landlord/properties/new">
                            <Button className="h-10 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg px-4 text-sm font-medium transition-colors">
                                <Plus className="mr-1.5 h-4 w-4" />
                                Add Property
                            </Button>
                        </Link>
                    )}
                </div>

                {properties.length > 0 ? (
                    <div className="space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <StatCard
                                label="Action Required"
                                value={stats.actionRequired}
                                highlight={stats.actionRequired > 0}
                            />
                            <StatCard label="Listed" value={stats.listed} />
                            <StatCard label="Leased" value={stats.leased} />
                            <StatCard label="Total" value={stats.total} />
                        </div>

                        {/* Property Sections */}
                        {actionRequired.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                    <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                                        Action Required
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {actionRequired.map((property: Property) => (
                                        <PropertyCard
                                            key={property._id}
                                            property={property}
                                            hasLease={propertyIdsWithLease.has(property._id)}
                                            highlight
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {pendingReview.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                                    <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                                        Pending Review
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {pendingReview.map((property: Property) => (
                                        <PropertyCard
                                            key={property._id}
                                            property={property}
                                            hasLease={propertyIdsWithLease.has(property._id)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {activeListings.length > 0 && (
                            <section>
                                <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wide mb-3">
                                    Active Listings
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {activeListings.map((property: Property) => (
                                        <PropertyCard
                                            key={property._id}
                                            property={property}
                                            hasLease={propertyIdsWithLease.has(property._id)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {leasedProperties.length > 0 && (
                            <section>
                                <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-3">
                                    Currently Leased
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 opacity-80">
                                    {leasedProperties.map((property: Property) => (
                                        <PropertyCard
                                            key={property._id}
                                            property={property}
                                            hasLease={true}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {unlistedProperties.length > 0 && (
                            <section>
                                <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-3">
                                    Unlisted
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 opacity-60">
                                    {unlistedProperties.map((property: Property) => (
                                        <PropertyCard
                                            key={property._id}
                                            property={property}
                                            hasLease={false}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                        <div className="h-14 w-14 rounded-xl bg-neutral-100 flex items-center justify-center mb-5">
                            <TrendingUp className="h-6 w-6 text-neutral-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                            No properties yet
                        </h3>
                        <p className="text-sm text-neutral-500 max-w-xs mb-6">
                            Start building your portfolio by adding your first property.
                        </p>
                        <Link href="/landlord/properties/new">
                            <Button className="h-10 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg px-6 text-sm font-medium">
                                <Plus className="mr-1.5 h-4 w-4" />
                                Add First Property
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </PullToRefresh>
    )
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
    return (
        <div className={cn(
            "p-4 rounded-xl border transition-all",
            highlight && value > 0
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white border-neutral-200"
        )}>
            <p className={cn(
                "text-[10px] font-bold uppercase tracking-wide mb-1",
                highlight && value > 0 ? "text-neutral-400" : "text-neutral-500"
            )}>
                {label}
            </p>
            <p className="text-2xl font-bold">
                {value}
            </p>
        </div>
    )
}

function PropertyCard({ property, hasLease, highlight }: { property: Property; hasLease: boolean; highlight?: boolean }) {
    const images = property.imageUrls && property.imageUrls.length > 0
        ? property.imageUrls
        : ['/window.svg']

    const status = (() => {
        if (hasLease) return { label: 'Leased', color: 'bg-neutral-900 text-white' }
        if (property.approvalStatus === 'rejected') return { label: 'Action Required', color: 'bg-red-500 text-white' }
        if (property.approvalStatus === 'pending') return { label: 'Reviewing', color: 'bg-amber-400 text-neutral-900' }
        if (!property.isAvailable) return { label: 'Unlisted', color: 'bg-neutral-200 text-neutral-500' }
        return { label: 'Active', color: 'bg-emerald-500 text-white' }
    })()

    return (
        <div className={cn(
            "group bg-white rounded-xl overflow-hidden border transition-all",
            highlight
                ? "border-red-200"
                : "border-neutral-200 hover:border-neutral-300"
        )}>
            {/* Image */}
            <Link href={`/properties/${property._id}`} className="block">
                <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                        <span className={cn(
                            "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide",
                            status.color
                        )}>
                            {status.label}
                        </span>
                    </div>
                </div>
            </Link>

            {/* Content */}
            <div className="p-4">
                <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="min-w-0">
                        <Link href={`/properties/${property._id}`}>
                            <h3 className="font-semibold text-neutral-900 text-sm truncate hover:text-neutral-600 transition-colors">
                                {property.title}
                            </h3>
                        </Link>
                        <div className="flex items-center gap-1 mt-0.5 text-neutral-400">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <p className="text-xs truncate">{property.city}</p>
                        </div>
                    </div>
                    <p className="font-bold text-neutral-900 text-sm shrink-0">
                        N${property.priceNad.toLocaleString()}
                    </p>
                </div>

                {/* Specs */}
                <div className="flex items-center gap-4 text-xs text-neutral-500 py-3 border-t border-neutral-100">
                    <span className="flex items-center gap-1">
                        <BedDouble className="h-3.5 w-3.5" />
                        {property.bedrooms || 0}
                    </span>
                    <span className="flex items-center gap-1">
                        <Bath className="h-3.5 w-3.5" />
                        {property.bathrooms || 0}
                    </span>
                    <span className="flex items-center gap-1">
                        <Maximize className="h-3.5 w-3.5" />
                        {property.sizeSqm || 0}m²
                    </span>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-neutral-100">
                    <Link
                        href={`/landlord/properties/${property._id}/edit`}
                        className="flex items-center justify-center gap-1.5 h-9 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-700 transition-colors"
                    >
                        <Edit className="h-3.5 w-3.5" />
                        Manage
                    </Link>
                    <Link
                        href={`/properties/${property._id}`}
                        className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-medium transition-colors"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        View
                    </Link>
                </div>
            </div>
        </div>
    )
}
