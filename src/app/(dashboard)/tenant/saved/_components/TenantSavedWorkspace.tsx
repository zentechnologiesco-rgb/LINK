'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpDown, Heart } from '@/components/ui/icons'

import { PropertyBrowseCard } from '@/features/properties/public/components/PropertyBrowseCard'
import { api } from '@convex/_generated/api'
import { useUser } from '@/components/providers/UserProvider'
import { useCachedQuery } from '@/hooks/useOptimisticQuery'
import {
    sortSavedProperties,
    type TenantSavedSortId,
} from '../_lib/tenant-saved-helpers'
import {
    TenantSavedSortDialog,
    TenantSavedWorkspaceSkeleton,
} from './TenantSavedPrimitives'

export function TenantSavedWorkspace() {
    const { user: currentUser } = useUser()
    const { data: savedProperties } = useCachedQuery(
        api.savedProperties.list,
        {
            queryName: 'tenant_saved_properties_v1',
            cacheKeySuffix: currentUser?._id ?? 'anonymous',
            storage: 'session',
        }
    )
    const [sortBy, setSortBy] = useState<TenantSavedSortId>('newest')
    const [showSortMenu, setShowSortMenu] = useState(false)

    // Normalize Data
    const normalizedProperties = useMemo(() => {
        if (!savedProperties) return []
        return savedProperties.map((p) => ({
            id: p._id,
            title: p.title,
            price: p.priceNad,
            address: p.address,
            city: p.city || '',
            bedrooms: p.bedrooms ?? 0,
            bathrooms: p.bathrooms ?? 0,
            size: p.sizeSqm ?? 0,
            type: p.propertyType,
            images: p.mainImage ? [p.mainImage] : [],
            amenities: p.amenityNames || [],
            description: p.description,
            coordinates: null,
            landlordId: p.landlordId,
        }))
    }, [savedProperties])

    // Sort logic
    const sortedProperties = useMemo(() => {
        return sortSavedProperties(normalizedProperties, sortBy)
    }, [normalizedProperties, sortBy])

    // ── Skeleton UI ──
    if (savedProperties === undefined) {
        return <TenantSavedWorkspaceSkeleton />
    }

    return (
        <div className="mx-auto min-h-screen w-full max-w-[1400px] bg-white pb-32 font-sans font-medium text-neutral-900 animate-in fade-in duration-500">
            {/* ── Sticky Header ── */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-neutral-100/60">
                <div className="flex h-14 items-center justify-between px-4 sm:px-6">
                    <p className="text-[17px] font-bold tracking-[-0.03em] text-neutral-950">
                        Saved Properties
                    </p>
                    {normalizedProperties.length > 0 && (
                        <button
                            onClick={() => setShowSortMenu(true)}
                            className="flex h-[36px] items-center justify-center gap-2 rounded-full bg-neutral-100 px-4 text-[13px] font-semibold text-neutral-700 transition-colors active:scale-95 hover:bg-neutral-200/80"
                            aria-label="Sort properties"
                        >
                            <span className="hidden sm:inline">Sort</span>
                            <ArrowUpDown className="h-4 w-4" strokeWidth={2.2} />
                        </button>
                    )}
                </div>
            </header>

            {/* ── Hero Title ── */}
            {normalizedProperties.length > 0 && (
                <div className="px-4 pt-6 sm:px-6">
                    <h1 className="text-[2.25rem] font-bold tracking-[-0.04em] text-neutral-950 sm:text-[2.75rem]">
                        My Favorites
                    </h1>
                    <p className="mt-1 text-[15px] font-medium text-neutral-500">
                        {sortedProperties.length} {sortedProperties.length === 1 ? 'saved property' : 'saved properties'}
                    </p>
                </div>
            )}

            {/* ── Content Grid ── */}
            {sortedProperties.length > 0 ? (
                <div className="mt-8 grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-8 pb-10">
                    {sortedProperties.map((property, idx) => (
                        <div key={property.id} className="w-full">
                            <PropertyBrowseCard property={property} priority={idx < 4} />
                        </div>
                    ))}
                </div>
            ) : (
                /* ── Empty State (Premium Native Design) ── */
                <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
                    <div className="mb-6 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-red-50/80 ring-1 ring-inset ring-red-100">
                        <Heart className="h-10 w-10 text-red-500" strokeWidth={2} />
                    </div>
                    <h3 className="text-[22px] font-bold tracking-[-0.03em] text-neutral-950">
                        No saved properties yet
                    </h3>
                    <p className="mt-2.5 max-w-[320px] text-[15px] leading-relaxed text-neutral-500">
                        Save properties you love by tapping the heart icon. They will appear right here for easy access.
                    </p>
                    <Link
                        href="/"
                        className="mt-8 flex h-12 items-center justify-center rounded-full bg-neutral-950 px-8 text-[15px] font-semibold text-white transition-all active:scale-95 hover:bg-neutral-800"
                    >
                        Browse Properties
                    </Link>
                </div>
            )}

            {/* ── Sort Action Sheet (iOS Dialog) ── */}
            <TenantSavedSortDialog
                open={showSortMenu}
                onOpenChange={setShowSortMenu}
                onSelect={(nextSort) => {
                    setSortBy(nextSort)
                    setShowSortMenu(false)
                }}
                sortBy={sortBy}
            />

        </div>
    )
}
