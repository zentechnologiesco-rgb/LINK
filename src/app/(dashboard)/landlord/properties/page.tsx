"use client"

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import {
    Blocks,
    Plus,
    Edit,
    Eye,
    MapPin,
    BedDouble,
    Bath,
    Maximize,
    TrendingUp,
    Building2,
    AlertCircle,
    CheckCircle2,
    Clock3,
} from 'lucide-react'
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { Id } from "../../../../../convex/_generated/dataModel"
import { cn } from '@/lib/utils'
import { getPropertyWorkflow, type PropertyWorkflow } from '@/lib/property-workflow'
import { PropertyActions } from './PropertyActions'
import { useUser } from '@/components/providers/UserProvider'
import { useCachedQuery } from '@/hooks/useOptimisticQuery'

interface Property {
    _id: Id<"properties">
    title: string
    listingType?: 'single_home' | 'multi_unit_block' | 'student_accommodation'
    propertyType: string
    city: string
    address: string
    bedrooms?: number
    bathrooms?: number
    sizeSqm?: number
    priceNad: number
    minPriceNad?: number
    maxPriceNad?: number
    isAvailable: boolean
    imageUrls?: string[]
    status?: string
    approvalStatus?: 'pending' | 'approved' | 'rejected'
    publicationStatus?: 'published' | 'unpublished'
    adminNotes?: string
    unitCount?: number
    availableUnitCount?: number
}

type PropertyCardData = Property & {
    workflow: PropertyWorkflow
    activeLeaseCount: number
    reservedLeaseCount: number
}

type LandlordLease = {
    propertyId: Id<"properties">
    status: string
}

const RESERVED_LEASE_STATUSES = new Set([
    'draft',
    'sent_to_tenant',
    'tenant_signed',
    'revision_requested',
])

const currency = new Intl.NumberFormat('en-NA', {
    style: 'currency',
    currency: 'NAD',
    maximumFractionDigits: 0,
})

function formatCurrency(value: number) {
    return currency.format(value || 0)
}

type FilterTab = 'all' | 'live' | 'review' | 'changes' | 'reserved' | 'leased' | 'off_market'

export default function LandlordPropertiesPage() {
    const router = useRouter()
    const { user: currentUser } = useUser()
    const { data: properties } = useCachedQuery(
        api.properties.getByLandlord,
        {
            queryName: 'landlord_properties_v1',
            cacheKeySuffix: currentUser?._id,
            storage: 'session',
        },
        {}
    )
    const leases = useQuery(api.leases.getForLandlord, {}) as LandlordLease[] | undefined
    const [activeTab, setActiveTab] = useState<FilterTab>('all')

    const handleRefresh = async () => {
        router.refresh()
        await new Promise(resolve => setTimeout(resolve, 800))
    }

    // Calculate stats and filter properties
    const {
        stats,
        filteredProperties,
    } = useMemo(() => {
        if (!properties) return { 
            stats: { total: 0, live: 0, review: 0, changes: 0, reserved: 0, leased: 0, offMarket: 0 }, 
            filteredProperties: [],
        }

        const activeLeases = leases?.filter((lease) => lease.status === 'approved') || []
        const reservedLeases = leases?.filter((lease) => RESERVED_LEASE_STATUSES.has(lease.status)) || []
        
        const activeCounts = new Map<string, number>()
        const reservedCounts = new Map<string, number>()

        activeLeases.forEach((lease) => {
            activeCounts.set(String(lease.propertyId), (activeCounts.get(String(lease.propertyId)) ?? 0) + 1)
        })
        reservedLeases.forEach((lease) => {
            reservedCounts.set(String(lease.propertyId), (reservedCounts.get(String(lease.propertyId)) ?? 0) + 1)
        })

        const propertiesWithWorkflow: PropertyCardData[] = properties.map((property: Property) => {
            const activeLeaseCount = activeCounts.get(String(property._id)) ?? 0
            const reservedLeaseCount = reservedCounts.get(String(property._id)) ?? 0
            return {
                ...property,
                activeLeaseCount,
                reservedLeaseCount,
                workflow: getPropertyWorkflow({
                    approvalStatus: property.approvalStatus,
                    publicationStatus: property.publicationStatus,
                    availableUnitCount: property.availableUnitCount,
                    isAvailable: property.isAvailable,
                    activeLeaseCount,
                    reservedLeaseCount,
                }),
            }
        })

        const stats = {
            total: propertiesWithWorkflow.length,
            live: propertiesWithWorkflow.filter((property) => property.workflow.group === 'live').length,
            review: propertiesWithWorkflow.filter((property) => property.workflow.group === 'review').length,
            changes: propertiesWithWorkflow.filter((property) => property.workflow.group === 'changes').length,
            reserved: propertiesWithWorkflow.filter((property) => property.workflow.group === 'reserved').length,
            leased: propertiesWithWorkflow.filter((property) => property.workflow.group === 'leased').length,
            offMarket: propertiesWithWorkflow.filter((property) => property.workflow.group === 'off_market').length,
        }

        let filtered = propertiesWithWorkflow
        if (activeTab !== 'all') {
            filtered = propertiesWithWorkflow.filter((property) => property.workflow.group === activeTab)
        }

        return { 
            stats, 
            filteredProperties: filtered,
        }
    }, [properties, leases, activeTab])

    if (properties === undefined) {
        return <PageSkeleton />
    }

    const summaryItems = [
        { id: 'all' as FilterTab, label: 'All', value: stats.total, icon: Building2 },
        { id: 'live' as FilterTab, label: 'Live', value: stats.live, icon: CheckCircle2 },
        { id: 'review' as FilterTab, label: 'Review', value: stats.review, icon: Clock3 },
        { id: 'changes' as FilterTab, label: 'Changes', value: stats.changes, icon: AlertCircle },
        { id: 'reserved' as FilterTab, label: 'Reserved', value: stats.reserved, icon: Clock3 },
        { id: 'leased' as FilterTab, label: 'Leased', value: stats.leased, icon: Building2 },
        { id: 'off_market' as FilterTab, label: 'Off Market', value: stats.offMarket, icon: TrendingUp },
    ]

    return (
        <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-white">
            <div className="mx-auto max-w-[1240px] pb-32 font-sans">
                {/* ── Sticky Header ── */}
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-neutral-100/60">
                    <div className="flex h-14 items-center justify-between px-4 sm:px-6">
                        <p className="text-[15px] font-semibold tracking-[-0.02em] text-neutral-950">
                            Properties
                        </p>
                        <Link href="/landlord/properties/new">
                            <Button className="h-9 rounded-full bg-neutral-950 px-4 text-[13px] font-semibold text-white transition-all active:scale-95 hover:bg-neutral-800">
                                <Plus className="mr-1.5 h-4 w-4" strokeWidth={2.5} />
                                Add New
                            </Button>
                        </Link>
                    </div>
                </header>

                {/* ── Hero Title ── */}
                <div className="px-4 pt-6 sm:px-6">
                    <h1 className="text-[2.25rem] font-bold tracking-[-0.04em] text-neutral-950 sm:text-[2.75rem]">
                        Portfolio
                    </h1>
                </div>

                {properties.length > 0 && (
                    <div className="mt-4 overflow-x-auto px-4 pb-2 sm:px-6 hide-scrollbar">
                        <div className="flex w-max shrink-0 items-center justify-start gap-2">
                            {summaryItems.map((item) => {
                                const Icon = item.icon
                                const isActive = activeTab === item.id
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={cn(
                                            "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-all active:scale-95",
                                            isActive 
                                                ? "border-neutral-950 bg-neutral-950 text-white" 
                                                : "border-neutral-200/60 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                                        )}
                                    >
                                        <Icon className={cn("h-4 w-4", isActive ? "text-neutral-300" : "text-neutral-500")} strokeWidth={2.2} />
                                        <span className={isActive ? "text-white" : "text-neutral-950"}>{item.value}</span>
                                        <span>{item.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* ── Main Content ── */}
                <div className="mt-6">
                    {properties.length === 0 ? (
                        /* ── Empty State ── */
                        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
                            <div className="mb-6 flex h-[88px] w-[88px] items-center justify-center rounded-3xl bg-neutral-50 ring-1 ring-inset ring-neutral-200/60">
                                <TrendingUp className="h-10 w-10 text-neutral-400" strokeWidth={1.8} />
                            </div>
                            <h3 className="text-[22px] font-bold tracking-[-0.03em] text-neutral-950">
                                No properties yet
                            </h3>
                            <p className="mt-2.5 max-w-[320px] text-[15px] leading-relaxed text-neutral-500">
                                Start building your portfolio by listing your first property. It&apos;s quick and easy.
                            </p>
                            <Link
                                href="/landlord/properties/new"
                                className="mt-8 flex h-12 items-center justify-center rounded-full bg-neutral-950 px-8 text-[15px] font-semibold text-white transition-all active:scale-95 hover:bg-neutral-800"
                            >
                                <Plus className="mr-2 h-5 w-5" />
                                Add Property
                            </Link>
                        </div>
                    ) : filteredProperties.length === 0 ? (
                        /* ── No Results Filter ── */
                        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                            <p className="text-[15px] text-neutral-500">
                                No properties found in this category.
                            </p>
                            <Button 
                                variant="link" 
                                onClick={() => setActiveTab('all')}
                                className="mt-2 text-neutral-950 font-semibold"
                            >
                                Show all properties
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 sm:px-6">
                            {filteredProperties.map((property: PropertyCardData) => (
                                <PropertyCard
                                    key={property._id}
                                    property={property}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PullToRefresh>
    )
}

function PropertyCard({
    property,
}: {
    property: PropertyCardData
}) {
    const images = property.imageUrls && property.imageUrls.length > 0
        ? property.imageUrls
        : ['/window.svg']

    const unitCount = property.unitCount ?? 1
    const isMultiUnit = unitCount > 1 || property.listingType === 'multi_unit_block' || property.listingType === 'student_accommodation'

    return (
        <article className="group relative overflow-hidden rounded-[24px] border border-neutral-200/80 bg-neutral-50/50 transition-all hover:bg-neutral-50 shadow-sm">
            {/* Property Image Hero */}
            <div className="relative aspect-[16/10] w-full shrink-0 bg-neutral-100 sm:aspect-[16/11]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={images[0]}
                    alt={property.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />
                
                {/* Status Badge */}
                <div className="absolute left-4 top-4">
                    <span className={cn(
                        "inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md",
                        property.workflow.badgeClassName
                    )}>
                        {property.workflow.label}
                    </span>
                </div>

                {/* More Actions Menu */}
                <div className="absolute right-3 top-3">
                    <div className="rounded-full bg-white/90 p-0.5 shadow-sm backdrop-blur-sm">
                        <PropertyActions
                            propertyId={property._id}
                            propertyTitle={property.title}
                            propertyPrice={property.priceNad}
                            approvalStatus={property.approvalStatus ?? 'pending'}
                            publicationStatus={property.publicationStatus ?? 'unpublished'}
                            adminNotes={property.adminNotes || null}
                            availableUnitCount={property.workflow.availableUnits}
                            hasActiveLease={property.activeLeaseCount > 0}
                            hasReservedLease={property.reservedLeaseCount > 0}
                        />
                    </div>
                </div>

                {/* Quick Price Tag */}
                <div className="absolute right-4 bottom-4">
                    <span className="inline-flex h-9 items-center justify-center rounded-full bg-white/95 px-4 text-[14px] font-bold text-neutral-950 shadow-sm backdrop-blur-sm">
                        {formatCurrency(property.minPriceNad ?? property.priceNad)}
                    </span>
                </div>
            </div>

            {/* Content Details */}
            <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                            {isMultiUnit ? `${unitCount} Units Portfolio` : property.propertyType}
                        </span>
                        <h2 className="mt-1 truncate text-[20px] font-bold tracking-[-0.03em] text-neutral-950 sm:text-[22px]">
                            {property.title}
                        </h2>
                        <div className="mt-0.5 flex items-center gap-1.5 text-neutral-500">
                            <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                            <p className="truncate text-[14px]">{property.address}, {property.city}</p>
                        </div>
                        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
                            {property.workflow.description}
                        </p>
                        {property.workflow.needsAttention && property.adminNotes && (
                            <p className="mt-2 rounded-2xl bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700">
                                {property.adminNotes}
                            </p>
                        )}
                    </div>
                </div>

                {/* Specs Row */}
                <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    <div className="flex items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-inset ring-neutral-200/60 transition-transform hover:scale-[1.02]">
                        <BedDouble className="h-4 w-4 text-neutral-400" strokeWidth={2} />
                        <span className="text-[13px] font-semibold text-neutral-950">{property.bedrooms || 0}</span>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-inset ring-neutral-200/60 transition-transform hover:scale-[1.02]">
                        <Bath className="h-4 w-4 text-neutral-400" strokeWidth={2} />
                        <span className="text-[13px] font-semibold text-neutral-950">{property.bathrooms || 0}</span>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-inset ring-neutral-200/60 transition-transform hover:scale-[1.02]">
                        <Maximize className="h-4 w-4 text-neutral-400" strokeWidth={2} />
                        <span className="text-[13px] font-semibold text-neutral-950">{property.sizeSqm || 0}m²</span>
                    </div>
                    {isMultiUnit && (
                        <div className="hidden sm:flex items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-inset ring-neutral-200/60 transition-transform hover:scale-[1.02]">
                            <Blocks className="h-4 w-4 text-neutral-400" strokeWidth={2} />
                            <span className="text-[13px] font-semibold text-neutral-950">{unitCount} Units</span>
                        </div>
                    )}
                </div>

                {/* Actions Bar */}
                <div className="mt-6 flex items-center gap-3">
                    <Button asChild variant="outline" className="h-11 flex-1 rounded-full border-neutral-200/80 bg-white shadow-none font-bold text-[13px] transition-all hover:bg-neutral-50 active:scale-[0.98]">
                        <Link href={`/landlord/properties/${property._id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" strokeWidth={2} />
                            Manage
                        </Link>
                    </Button>
                    <Button asChild className="h-11 flex-1 rounded-full bg-neutral-950 text-white shadow-none font-bold text-[13px] transition-all hover:bg-neutral-800 active:scale-[0.98]">
                        <Link href={`/properties/${property._id}`}>
                            <Eye className="mr-2 h-4 w-4" strokeWidth={2} />
                            View Listing
                        </Link>
                    </Button>
                </div>
            </div>
            
            {/* Visual indicator for "Action Required" status */}
            {property.workflow.needsAttention && (
                <div className="absolute right-0 top-0 h-full w-1.5 bg-red-500" />
            )}
        </article>
    )
}

function PageSkeleton() {
    return (
        <div className="mx-auto min-h-screen max-w-[1240px] bg-white pb-16 font-sans">
            <div className="h-14 border-b border-neutral-100/60 bg-white" />
            <div className="px-4 pt-6 sm:px-6">
                <div className="h-10 w-48 rounded-[12px] bg-neutral-100 animate-pulse" />
                <div className="mt-4 flex gap-2 overflow-hidden">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-9 w-24 shrink-0 rounded-full bg-neutral-100 animate-pulse" />
                    ))}
                </div>
            </div>
            <div className="mt-8 px-4 sm:px-6 space-y-8">
                {[1, 2].map(i => (
                    <div key={i} className="h-[320px] w-full rounded-[24px] bg-neutral-50 animate-pulse border border-neutral-100" />
                ))}
            </div>
        </div>
    )
}
