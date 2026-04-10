'use client'

import { useEffect, useMemo, useState } from 'react'

import {
    Check,
    SlidersHorizontal,
} from '@/components/ui/icons'
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { AMENITIES } from '@/constants/property'
import { cn } from '@/lib/utils'

import type { PublicHomePriceRange } from '../_lib/public-home-types'

const BEDROOM_OPTIONS = [null, 1, 2, 3, 4] as const

const DEFAULT_VISIBLE_AMENITIES = 10

export function PublicHomeFilterSheet({
    activeFilterCount,
    filteredCount,
    isLoading = false,
    minBedrooms,
    onClearFilters,
    onMinBedroomsChange,
    onPriceRangeChange,
    onToggleAmenity,
    priceRange,
    selectedAmenities,
}: {
    activeFilterCount: number
    filteredCount: number
    isLoading?: boolean
    minBedrooms: number | null
    onClearFilters: () => void
    onMinBedroomsChange: (value: number | null) => void
    onPriceRangeChange: (priceRange: PublicHomePriceRange) => void
    onToggleAmenity: (amenity: string) => void
    priceRange: PublicHomePriceRange
    selectedAmenities: string[]
}) {
    const [isDesktop, setIsDesktop] = useState(false)
    const [showAllAmenities, setShowAllAmenities] = useState(false)

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 640px)')

        const syncMatches = () => setIsDesktop(mediaQuery.matches)

        syncMatches()
        mediaQuery.addEventListener('change', syncMatches)

        return () => mediaQuery.removeEventListener('change', syncMatches)
    }, [])

    const resultLabel = `${filteredCount} ${filteredCount === 1 ? 'home' : 'homes'}`

    const visibleAmenities = useMemo(() => {
        if (showAllAmenities) return AMENITIES

        const visibleNames = new Set(
            AMENITIES
                .slice(0, DEFAULT_VISIBLE_AMENITIES)
                .map((amenity) => amenity.name)
        )

        selectedAmenities.forEach((amenity) => visibleNames.add(amenity))

        return AMENITIES.filter((amenity) => visibleNames.has(amenity.name))
    }, [selectedAmenities, showAllAmenities])

    const hasHiddenAmenities = visibleAmenities.length < AMENITIES.length

    return (
        <Sheet>
            <SheetTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        'relative flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[18px] border outline-none transition-all duration-200 sm:h-14 sm:w-14',
                        activeFilterCount > 0
                            ? 'border-neutral-900 bg-neutral-950 text-white'
                            : 'border-neutral-200 bg-neutral-100 text-neutral-950 hover:border-neutral-300 hover:bg-neutral-200/80'
                    )}
                >
                    <SlidersHorizontal className="h-[20px] w-[20px]" strokeWidth={2.5} />
                    {activeFilterCount > 0 ? (
                        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-black ring-2 ring-white">
                            {activeFilterCount}
                        </span>
                    ) : null}
                </button>
            </SheetTrigger>
            <SheetContent
                side={isDesktop ? 'right' : 'bottom'}
                className={cn(
                    'gap-0 overflow-hidden border-0 bg-transparent p-0 shadow-none',
                    isDesktop
                        ? 'h-full max-w-none !w-[min(100vw,28rem)] sm:!max-w-none sm:rounded-l-[2rem]'
                        : 'h-[min(78dvh,42rem)] !w-full rounded-t-[2rem]',
                    '[&>button]:right-5 [&>button]:top-5 [&>button]:z-30 [&>button]:flex [&>button]:h-10 [&>button]:w-10 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:border [&>button]:border-neutral-200 [&>button]:bg-white [&>button]:text-neutral-500 [&>button]:opacity-100 [&>button]:transition-colors [&>button]:hover:bg-neutral-100 [&>button]:focus:ring-2 [&>button]:focus:ring-black/10 [&>button_svg]:size-4'
                )}
            >
                <div className="flex h-full flex-col overflow-hidden bg-neutral-50 text-neutral-900">
                    <div className="border-b border-neutral-200 px-5 pb-4 pt-5 sm:px-6">
                        {!isDesktop ? (
                            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-neutral-300" />
                        ) : null}

                        <div className="flex items-center gap-3 pr-14">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 text-white">
                                <SlidersHorizontal className="h-5 w-5" strokeWidth={2.3} />
                            </div>
                            <div className="min-w-0">
                                <SheetTitle className="text-left text-[1.35rem] font-semibold tracking-tight text-neutral-950">
                                    Filters
                                </SheetTitle>
                                <p className="mt-0.5 text-sm text-neutral-500">
                                    Keep the feed clean and relevant.
                                </p>
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                                <span className="rounded-full bg-neutral-900 px-3 py-1 text-[12px] font-semibold text-white">
                                    {resultLabel}
                                </span>
                                <button
                                    type="button"
                                    onClick={onClearFilters}
                                    disabled={activeFilterCount === 0}
                                    className={cn(
                                        'inline-flex h-10 items-center justify-center rounded-full px-3.5 text-[13px] font-semibold transition-colors',
                                        activeFilterCount > 0
                                            ? 'text-neutral-600 hover:bg-neutral-200 hover:text-neutral-950'
                                            : 'text-neutral-300'
                                    )}
                                >
                                    Clear all
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
                        <section className="rounded-[1.6rem] border border-neutral-200 bg-white p-4">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-[15px] font-semibold tracking-tight text-neutral-950">Price range</h3>
                                <span className="text-[12px] font-medium text-neutral-500">Monthly</span>
                            </div>

                            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-3">
                                <label className="block min-w-0">
                                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                                        Minimum
                                    </span>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-neutral-400">
                                            N$
                                        </span>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            min="0"
                                            placeholder="Any"
                                            value={priceRange.min}
                                            onChange={(event) => onPriceRangeChange({ ...priceRange, min: event.target.value })}
                                            className="h-[3.25rem] w-full rounded-[1rem] border border-neutral-200 bg-neutral-100 pl-11 pr-4 text-[15px] font-semibold text-neutral-950 outline-none transition-all placeholder:font-medium placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:ring-2 focus:ring-black/5"
                                        />
                                    </div>
                                </label>

                                <div className="mb-6 h-px w-5 shrink-0 rounded-full bg-neutral-300" />

                                <label className="block min-w-0">
                                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                                        Maximum
                                    </span>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-neutral-400">
                                            N$
                                        </span>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            min="0"
                                            placeholder="Any"
                                            value={priceRange.max}
                                            onChange={(event) => onPriceRangeChange({ ...priceRange, max: event.target.value })}
                                            className="h-[3.25rem] w-full rounded-[1rem] border border-neutral-200 bg-neutral-100 pl-11 pr-4 text-[15px] font-semibold text-neutral-950 outline-none transition-all placeholder:font-medium placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:ring-2 focus:ring-black/5"
                                        />
                                    </div>
                                </label>
                            </div>
                        </section>

                        <section className="rounded-[1.6rem] border border-neutral-200 bg-white p-4">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-[15px] font-semibold tracking-tight text-neutral-950">Bedrooms</h3>
                                <span className="text-[12px] font-medium text-neutral-500">
                                    {minBedrooms === null ? 'Any size' : `${minBedrooms}+ beds`}
                                </span>
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
                                {BEDROOM_OPTIONS.map((value) => {
                                    const isSelected = minBedrooms === value

                                    return (
                                        <button
                                            key={`bed-${value}`}
                                            type="button"
                                            onClick={() => onMinBedroomsChange(value)}
                                            className={cn(
                                                'flex h-11 items-center justify-center rounded-[1rem] border text-[14px] font-semibold outline-none transition-all',
                                                isSelected
                                                    ? 'border-neutral-950 bg-neutral-950 text-white'
                                                    : 'border-neutral-200 bg-neutral-100 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-200/70'
                                            )}
                                        >
                                            {value === null ? 'Any' : `${value}+`}
                                        </button>
                                    )
                                })}
                            </div>
                        </section>

                        <section className="rounded-[1.6rem] border border-neutral-200 bg-white p-4">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-[15px] font-semibold tracking-tight text-neutral-950">Amenities</h3>
                                <span className="text-[12px] font-medium text-neutral-500">
                                    {selectedAmenities.length} selected
                                </span>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {visibleAmenities.map((amenity) => {
                                    const isSelected = selectedAmenities.includes(amenity.name)

                                    return (
                                        <button
                                            key={amenity.id}
                                            type="button"
                                            onClick={() => onToggleAmenity(amenity.name)}
                                            className={cn(
                                                'inline-flex min-h-[2.5rem] items-center gap-2 rounded-full border px-4 py-2 text-left text-[13px] font-semibold transition-all',
                                                isSelected
                                                    ? 'border-neutral-950 bg-neutral-950 text-white'
                                                    : 'border-neutral-200 bg-neutral-100 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-200/70'
                                            )}
                                        >
                                            {isSelected ? (
                                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-black">
                                                    <Check className="h-3 w-3" strokeWidth={3} />
                                                </span>
                                            ) : null}
                                            <span>{amenity.name}</span>
                                        </button>
                                    )
                                })}
                            </div>

                            {hasHiddenAmenities ? (
                                <button
                                    type="button"
                                    onClick={() => setShowAllAmenities(true)}
                                    className="mt-3 inline-flex h-10 items-center justify-center rounded-full bg-neutral-100 px-4 text-[13px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-200"
                                >
                                    Show more amenities
                                </button>
                            ) : showAllAmenities && AMENITIES.length > DEFAULT_VISIBLE_AMENITIES ? (
                                <button
                                    type="button"
                                    onClick={() => setShowAllAmenities(false)}
                                    className="mt-3 inline-flex h-10 items-center justify-center rounded-full bg-neutral-100 px-4 text-[13px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-200"
                                >
                                    Show less
                                </button>
                            ) : null}
                        </section>

                    </div>

                    <div className="border-t border-neutral-200 bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
                        <div className="mb-3 flex items-center justify-between gap-3 text-[13px] text-neutral-500">
                            <p className="font-medium">
                                {activeFilterCount > 0
                                    ? `${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'} active`
                                    : 'Browse everything'}
                            </p>
                            <p className="font-semibold text-neutral-900">{resultLabel}</p>
                        </div>

                        <SheetClose asChild>
                            <button
                                type="button"
                                className="h-[3.25rem] w-full rounded-[1rem] bg-neutral-950 text-[15px] font-semibold tracking-tight text-white transition-colors hover:bg-neutral-800"
                            >
                                {isLoading
                                    ? 'Updating homes...'
                                    : `Show ${filteredCount} ${filteredCount === 1 ? 'home' : 'homes'}`}
                            </button>
                        </SheetClose>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
