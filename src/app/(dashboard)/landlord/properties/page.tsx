"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
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

function LandlordPropertiesContent() {
    const properties = useQuery(api.properties.getByLandlord, {})
    const leases = useQuery(api.leases.getForLandlord, {})

    if (properties === undefined) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-6 w-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
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
        total: properties.length,
        listed: activeListings.length,
        leased: propertyIdsWithLease.size,
        available: activeListings.length + unlistedProperties.length, // Total vacant
    }

    return (
        <div className="min-h-screen bg-[#fafafa] font-sans text-neutral-900 pb-24">
            <main className="max-w-[2000px] mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12">

                {/* Action Bar */}
                <div className="flex items-center justify-end gap-4 mb-12 border-b border-neutral-200/60 pb-8">
                    {properties.length > 0 && (
                        <Link href="/landlord/properties/new">
                            <Button className="h-14 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full px-8 text-base font-bold tracking-wide shadow-xl shadow-neutral-900/10 transition-all hover:scale-[1.02]">
                                <Plus className="mr-2 h-5 w-5" />
                                Create New Property
                            </Button>
                        </Link>
                    )}
                </div>

                {properties.length > 0 ? (
                    <div className="space-y-16">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            <StatCard
                                label="Action Required"
                                value={actionRequired.length}
                                highlight={actionRequired.length > 0}
                            />
                            <StatCard label="Live Listings" value={stats.listed} />
                            <StatCard label="Leased" value={stats.leased} />
                            <StatCard label="Total Units" value={stats.total} />
                        </div>

                        <div className="space-y-16">
                            {/* Action Required */}
                            {actionRequired.length > 0 && (
                                <section>
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                            <h2 className="text-xl font-bold font-[family-name:var(--font-anton)] tracking-wide text-neutral-900 uppercase">
                                                Action Required
                                            </h2>
                                            <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full text-xs font-mono font-medium">
                                                {actionRequired.length}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

                            {/* Pending Review */}
                            {pendingReview.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                                        <h2 className="text-xl font-bold font-[family-name:var(--font-anton)] tracking-wide text-neutral-900 uppercase">
                                            Pending Review
                                        </h2>
                                        <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full text-xs font-mono font-medium">
                                            {pendingReview.length}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

                            {/* Active Listings */}
                            {activeListings.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-3 mb-8">
                                        <h2 className="text-xl font-bold font-[family-name:var(--font-anton)] tracking-wide text-neutral-900 uppercase">
                                            Active Listings
                                        </h2>
                                        <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full text-xs font-mono font-medium">
                                            {activeListings.length}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

                            {/* Leased Properties */}
                            {leasedProperties.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-3 mb-8">
                                        <h2 className="text-xl font-bold font-[family-name:var(--font-anton)] tracking-wide text-neutral-900 uppercase">
                                            Currently Leased
                                        </h2>
                                        <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full text-xs font-mono font-medium">
                                            {leasedProperties.length}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-80 hover:opacity-100 transition-opacity">
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

                            {/* Unlisted/Off-market */}
                            {unlistedProperties.length > 0 && (
                                <section className="pt-8 border-t border-neutral-100">
                                    <div className="flex items-center gap-3 mb-8 opacity-40">
                                        <h2 className="text-xl font-bold font-[family-name:var(--font-anton)] tracking-wide text-neutral-900 uppercase">
                                            Unlisted & Drafts
                                        </h2>
                                        <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full text-xs font-mono font-medium">
                                            {unlistedProperties.length}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-50 hover:opacity-100 transition-opacity duration-300">
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
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 px-4 text-center border border-dashed border-neutral-200 rounded-3xl bg-white/50">
                        <div className="h-24 w-24 rounded-full bg-white shadow-sm border border-neutral-100 flex items-center justify-center mb-8">
                            <TrendingUp className="h-10 w-10 text-neutral-300" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-bold text-neutral-900 mb-3 tracking-tight">No properties yet</h3>
                        <p className="text-neutral-500 mb-10 max-w-md text-lg font-light">
                            Start building your portfolio by adding your first property.
                        </p>
                        <Link href="/landlord/properties/new">
                            <Button className="h-14 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full px-10 text-base font-bold shadow-xl shadow-neutral-900/10 transition-all hover:scale-[1.02]">
                                <Plus className="mr-2 h-5 w-5" />
                                Create First Property
                            </Button>
                        </Link>
                    </div>
                )}
            </main>
        </div>
    )
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
    return (
        <div className={cn(
            "p-6 sm:p-8 rounded-2xl border transition-all duration-300",
            highlight && value > 0
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white border-neutral-200 text-neutral-900 hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-900/5"
        )}>
            <p className={cn(
                "text-[10px] font-bold uppercase tracking-widest mb-2 opacity-60 font-mono",
                highlight && value > 0 ? "text-white" : "text-neutral-500"
            )}>{label}</p>
            <p className="text-4xl sm:text-5xl font-[family-name:var(--font-anton)] tracking-wide">
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
            "group flex flex-col bg-white rounded-3xl overflow-hidden border transition-all duration-300",
            highlight
                ? "border-red-200 shadow-xl shadow-red-900/5"
                : "border-neutral-200 hover:border-neutral-300 hover:shadow-xl hover:shadow-neutral-900/5"
        )}>
            {/* Image & Status */}
            <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
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
                        "px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md shadow-sm",
                        status.color
                    )}>
                        {status.label}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col gap-4 flex-1">
                <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1 mr-4">
                        <Link href={`/properties/${property._id}`} className="block">
                            <h3 className="text-lg font-bold text-neutral-900 leading-tight truncate group-hover:text-neutral-600 transition-colors">
                                {property.title}
                            </h3>
                        </Link>
                        <div className="flex items-center gap-1.5 mt-1.5 text-neutral-400">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            <p className="text-xs font-medium truncate">{property.city}</p>
                        </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <span className="font-mono font-bold text-neutral-900 text-lg">
                            N${property.priceNad.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-neutral-100">
                    <div className="flex flex-col items-center justify-center p-2 bg-neutral-50 rounded-xl">
                        <BedDouble className="h-4 w-4 text-neutral-400 mb-1" />
                        <span className="text-xs font-bold text-neutral-900">{property.bedrooms || 0}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 bg-neutral-50 rounded-xl">
                        <Bath className="h-4 w-4 text-neutral-400 mb-1" />
                        <span className="text-xs font-bold text-neutral-900">{property.bathrooms || 0}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 bg-neutral-50 rounded-xl">
                        <Maximize className="h-4 w-4 text-neutral-400 mb-1" />
                        <span className="text-xs font-bold text-neutral-900">{property.sizeSqm || 0}m²</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 mt-auto">
                    <Link
                        href={`/landlord/properties/${property._id}/edit`}
                        className="flex items-center justify-center gap-2 h-10 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 text-xs font-bold text-neutral-700 transition-colors"
                    >
                        <Edit className="h-3.5 w-3.5" />
                        Manage
                    </Link>
                    <Link
                        href={`/properties/${property._id}`}
                        className="flex items-center justify-center gap-2 h-10 rounded-xl border border-transparent bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-bold transition-colors"
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
