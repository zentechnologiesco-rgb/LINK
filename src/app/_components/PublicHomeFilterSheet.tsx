'use client'

import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { AMENITIES } from '@/constants/property'
import { SlidersHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'

import type { PublicHomePriceRange } from '../_lib/public-home-types'

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
    return (
        <Sheet>
            <SheetTrigger asChild>
                <button
                    className={cn(
                        'relative flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[16px] outline-none transition-all sm:h-14 sm:w-14',
                        activeFilterCount > 0
                            ? 'bg-black text-white'
                            : 'bg-neutral-100 text-black hover:bg-neutral-200'
                    )}
                >
                    <SlidersHorizontal className="h-[20px] w-[20px]" strokeWidth={2.5} />
                    {activeFilterCount > 0 ? (
                        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white shadow-sm ring-2 ring-white">
                            {activeFilterCount}
                        </span>
                    ) : null}
                </button>
            </SheetTrigger>
            <SheetContent
                side="right"
                className="flex flex-col overflow-hidden border-l-0 bg-white p-0 shadow-[0_0_40px_rgba(0,0,0,0.15)] sm:!w-[420px] sm:rounded-l-[32px] !w-[90%]"
            >
                <div className="flex items-center gap-3 border-b border-neutral-100/60 px-6 py-5 transition-colors">
                    <SheetTitle className="text-[22px] font-bold tracking-tight text-neutral-900">Filters</SheetTitle>
                    <button
                        onClick={onClearFilters}
                        className="ml-auto text-[15px] font-semibold text-neutral-500 transition-colors hover:text-black"
                    >
                        Clear All
                    </button>
                </div>
                <div className="flex-1 space-y-8 overflow-y-auto overscroll-contain px-6 py-6">
                    <div className="space-y-4">
                        <h3 className="text-[17px] font-semibold tracking-tight text-neutral-900">Price Range</h3>
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-neutral-500">N$</span>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={priceRange.min}
                                    onChange={(event) => onPriceRangeChange({ ...priceRange, min: event.target.value })}
                                    className="h-14 w-full rounded-[14px] bg-neutral-100 pl-10 pr-4 text-[15px] font-semibold outline-none transition-all placeholder:font-medium placeholder:text-neutral-400 focus:bg-white focus:ring-2 focus:ring-black"
                                />
                            </div>
                            <div className="h-[2px] w-4 shrink-0 rounded-full bg-neutral-300" />
                            <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-neutral-500">N$</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={priceRange.max}
                                    onChange={(event) => onPriceRangeChange({ ...priceRange, max: event.target.value })}
                                    className="h-14 w-full rounded-[14px] bg-neutral-100 pl-10 pr-4 text-[15px] font-semibold outline-none transition-all placeholder:font-medium placeholder:text-neutral-400 focus:bg-white focus:ring-2 focus:ring-black"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[17px] font-semibold tracking-tight text-neutral-900">Bedrooms</h3>
                        <div className="flex flex-wrap gap-2">
                            {[null, 1, 2, 3, 4].map((value) => (
                                <button
                                    key={`bed-${value}`}
                                    onClick={() => onMinBedroomsChange(value)}
                                    className={cn(
                                        'h-12 rounded-[14px] border px-6 text-[15px] font-semibold outline-none transition-all',
                                        minBedrooms === value
                                            ? 'border-black bg-black text-white'
                                            : 'border-neutral-200 bg-white text-neutral-600 hover:border-black'
                                    )}
                                >
                                    {value === null ? 'Any' : `${value}+`}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[17px] font-semibold tracking-tight text-neutral-900">Amenities</h3>
                        <div className="flex flex-wrap gap-2">
                            {AMENITIES.slice(0, 10).map((amenity) => {
                                const isSelected = selectedAmenities.includes(amenity.name)

                                return (
                                    <button
                                        key={amenity.id}
                                        type="button"
                                        onClick={() => onToggleAmenity(amenity.name)}
                                        className={cn(
                                            'rounded-[14px] border px-4 py-2.5 text-[14px] font-semibold transition-all',
                                            isSelected
                                                ? 'border-black bg-black text-white'
                                                : 'border-neutral-200 bg-white text-neutral-600 hover:border-black'
                                        )}
                                    >
                                        {amenity.name}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className="safe-area-bottom border-t border-neutral-100/60 p-6">
                    <SheetClose asChild>
                        <button className="h-14 w-full rounded-[16px] bg-black text-[16px] font-bold tracking-wide text-white transition-all hover:bg-neutral-800 active:scale-[0.98]">
                            {isLoading ? 'Show homes' : `Show ${filteredCount} properties`}
                        </button>
                    </SheetClose>
                </div>
            </SheetContent>
        </Sheet>
    )
}
