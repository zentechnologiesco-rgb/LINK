'use client'

import { useState, useMemo, type ReactNode } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { TrustCard } from '@/components/properties/TrustCard'
import { PropertyCardSkeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Heart, ArrowUpDown, Check } from 'lucide-react'
import Link from 'next/link'

const SORT_OPTIONS = [
    { id: 'newest', label: 'Recently Saved' },
    { id: 'price-low', label: 'Price: Low to High' },
    { id: 'price-high', label: 'Price: High to Low' },
]

export default function SavedPropertiesPage() {
    const savedProperties = useQuery(api.savedProperties.list)
    const [sortBy, setSortBy] = useState('newest')
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
        let result = [...normalizedProperties]

        switch (sortBy) {
            case 'price-low':
                result.sort((a, b) => a.price - b.price)
                break
            case 'price-high':
                result.sort((a, b) => b.price - a.price)
                break
            default:
                break
        }

        return result
    }, [normalizedProperties, sortBy])

    // ── Skeleton UI ──
    if (savedProperties === undefined) {
        return (
            <div className="mx-auto min-h-[80vh] w-full max-w-[1400px] animate-in fade-in duration-500 font-sans">
                {/* Header Skeleton */}
                <div className="flex h-14 items-center justify-between px-4 sm:px-6">
                    <div className="h-6 w-32 rounded-lg bg-neutral-100" />
                    <div className="h-8 w-8 rounded-full bg-neutral-100" />
                </div>
                <div className="px-4 pt-4 sm:px-6">
                    <div className="h-10 w-48 rounded-xl bg-neutral-100" />
                    <div className="mt-2 h-4 w-32 rounded-lg bg-neutral-100" />
                </div>
                {/* Grid Skeleton */}
                <div className="mt-8 grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="w-full">
                            <PropertyCardSkeleton />
                        </div>
                    ))}
                </div>
            </div>
        )
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
                            <TrustCard property={property} priority={idx < 4} />
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
            <IOSDialog
                open={showSortMenu}
                onOpenChange={setShowSortMenu}
                title="Sort By"
            >
                <div className="-mx-6 border-y border-neutral-100/60 bg-white">
                    {SORT_OPTIONS.map((option) => {
                        const isSelected = sortBy === option.id
                        return (
                            <button
                                key={option.id}
                                onClick={() => {
                                    setSortBy(option.id)
                                    setShowSortMenu(false)
                                }}
                                className="flex w-full items-center justify-between border-b border-neutral-100/60 px-6 py-4 transition-colors last:border-0 hover:bg-neutral-50 active:bg-neutral-100"
                            >
                                <span className={cn(
                                    "text-[16px]",
                                    isSelected ? "font-bold text-neutral-950" : "font-medium text-neutral-600"
                                )}>
                                    {option.label}
                                </span>
                                {isSelected && (
                                    <Check className="h-5 w-5 text-neutral-950" strokeWidth={2.5} />
                                )}
                            </button>
                        )
                    })}
                </div>
            </IOSDialog>

        </div>
    )
}

/* ── UI Helpers ── */

function IOSDialog({ open, onOpenChange, title, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: ReactNode }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="fixed bottom-0 top-auto translate-y-0 rounded-t-[32px] sm:bottom-auto sm:top-[50%] sm:-translate-y-1/2 sm:rounded-[32px] max-h-[90vh] w-full max-w-md gap-0 border-0 p-6 shadow-2xl overflow-y-auto">
                <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-neutral-200 sm:hidden" />
                <DialogTitle className="mb-6 text-[22px] font-bold tracking-[-0.04em] text-neutral-950">{title}</DialogTitle>
                {children}
            </DialogContent>
        </Dialog>
    )
}
