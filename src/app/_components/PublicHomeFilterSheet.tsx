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
    SheetDescription,
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
                    'gap-0 overflow-hidden border-0 bg-transparent p-0 shadow-2xl',
                    isDesktop
                        ? 'h-[calc(100vh-2rem)] right-4 top-4 max-w-none !w-[min(100vw-2rem,24rem)] sm:!max-w-none sm:rounded-3xl'
                        : 'h-[min(85dvh,48rem)] !w-full rounded-t-[2rem]',
                    '[&>button]:hidden'
                )}
            >
                <div className="flex h-full flex-col overflow-hidden bg-white text-neutral-900 shadow-sm">
                    <div className="px-5 pb-4 pt-6 sm:px-6 relative shrink-0">
                        {!isDesktop ? (
                            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-neutral-200" />
                        ) : null}

                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <SheetTitle className="text-[28px] font-bold tracking-tight text-neutral-900 leading-none">
                                    Filters
                                </SheetTitle>
                                <SheetDescription className="sr-only">
                                    Refine homes by price range, bedrooms, and amenities.
                                </SheetDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <SheetClose asChild>
                                    <button
                                        type="button"
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-900 sm:hidden"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                        </svg>
                                    </button>
                                </SheetClose>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6 sm:px-6">
                        <div className="space-y-8">
                            <section>
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-[17px] font-bold tracking-tight text-neutral-900">Price range</h3>
                                    <span className="text-[13px] font-medium text-neutral-500">Monthly</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex-1 relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-neutral-400">
                                            N$
                                        </span>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            min="0"
                                            placeholder="Min"
                                            value={priceRange.min}
                                            onChange={(event) => onPriceRangeChange({ ...priceRange, min: event.target.value })}
                                            className="h-14 w-full rounded-2xl bg-[#f2f2f7] pl-11 pr-4 text-[16px] font-semibold text-neutral-900 outline-none transition-all placeholder:font-medium placeholder:text-neutral-400 focus:bg-[#e8e8ed]"
                                        />
                                    </div>
                                    <div className="h-0.5 w-3 shrink-0 rounded-full bg-neutral-300" />
                                    <div className="flex-1 relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-neutral-400">
                                            N$
                                        </span>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            min="0"
                                            placeholder="Max"
                                            value={priceRange.max}
                                            onChange={(event) => onPriceRangeChange({ ...priceRange, max: event.target.value })}
                                            className="h-14 w-full rounded-2xl bg-[#f2f2f7] pl-11 pr-4 text-[16px] font-semibold text-neutral-900 outline-none transition-all placeholder:font-medium placeholder:text-neutral-400 focus:bg-[#e8e8ed]"
                                        />
                                    </div>
                                </div>
                            </section>

                            <div className="h-px bg-neutral-100" />

                            <section>
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-[17px] font-bold tracking-tight text-neutral-900">Bedrooms</h3>
                                    <span className="text-[13px] font-medium text-neutral-500">
                                        {minBedrooms === null ? 'Any' : `${minBedrooms}+ beds`}
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    {BEDROOM_OPTIONS.map((value) => {
                                        const isSelected = minBedrooms === value;
                                        return (
                                            <button
                                                key={`bed-${value}`}
                                                type="button"
                                                onClick={() => onMinBedroomsChange(value)}
                                                className={cn(
                                                    'flex-1 h-[3.25rem] flex items-center justify-center rounded-[14px] text-[15px] font-semibold tracking-tight transition-all',
                                                    isSelected
                                                        ? 'bg-neutral-900 text-white shadow-sm'
                                                        : 'bg-[#f2f2f7] text-neutral-700 hover:bg-[#e8e8ed]'
                                                )}
                                            >
                                                {value === null ? 'Any' : `${value}+`}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            <div className="h-px bg-neutral-100" />

                            <section>
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-[17px] font-bold tracking-tight text-neutral-900">Amenities</h3>
                                </div>

                                <div className="flex flex-wrap gap-2.5">
                                    {visibleAmenities.map((amenity) => {
                                        const isSelected = selectedAmenities.includes(amenity.name);

                                        return (
                                            <button
                                                key={amenity.id}
                                                type="button"
                                                onClick={() => onToggleAmenity(amenity.name)}
                                                className={cn(
                                                    'inline-flex h-11 items-center gap-2 rounded-full px-4 text-[14px] font-medium tracking-tight transition-all',
                                                    isSelected
                                                        ? 'bg-neutral-900 text-white shadow-sm'
                                                        : 'bg-[#f2f2f7] text-neutral-700 hover:bg-[#e8e8ed]'
                                                )}
                                            >
                                                {isSelected ? (
                                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-black">
                                                        <Check className="h-[10px] w-[10px]" strokeWidth={4} />
                                                    </span>
                                                ) : null}
                                                <span>{amenity.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {hasHiddenAmenities ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowAllAmenities(true)}
                                        className="mt-4 block text-[14px] font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
                                    >
                                        Show all amenities
                                    </button>
                                ) : showAllAmenities && AMENITIES.length > DEFAULT_VISIBLE_AMENITIES ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowAllAmenities(false)}
                                        className="mt-4 block text-[14px] font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
                                    >
                                        Show less
                                    </button>
                                ) : null}
                            </section>
                        </div>
                    </div>

                    <div className="border-t border-neutral-100 bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 shrink-0 flex items-center justify-between gap-4">
                        <button
                            type="button"
                            onClick={onClearFilters}
                            disabled={activeFilterCount === 0}
                            className={cn(
                                'text-[15px] font-medium underline-offset-4 transition-all',
                                activeFilterCount > 0
                                    ? 'text-neutral-900 hover:underline'
                                    : 'text-neutral-300 pointer-events-none'
                            )}
                        >
                            Clear all
                        </button>
                        
                        <SheetClose asChild>
                            <button
                                type="button"
                                className="h-[3.25rem] min-w-[140px] px-6 rounded-2xl bg-neutral-900 text-[15px] font-semibold tracking-tight text-white transition-colors hover:bg-neutral-800 shadow-sm"
                            >
                                {isLoading
                                    ? 'Updating...'
                                    : `Show ${filteredCount} ${filteredCount === 1 ? 'home' : 'homes'}`}
                            </button>
                        </SheetClose>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
