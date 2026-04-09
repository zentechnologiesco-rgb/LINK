'use client'

import {
    List,
    Map as MapIcon,
    Search,
    X,
} from 'lucide-react'

import { cn } from '@/lib/utils'

import { PublicHomeCategoryRail } from './PublicHomeCategoryRail'
import { PublicHomeFilterSheet } from './PublicHomeFilterSheet'
import type { PublicHomePriceRange } from '../_lib/public-home-types'

export function PublicHomeSearchToolbar({
    activeFilterCount,
    availableTypes,
    filteredCount,
    isLoading = false,
    isMapView,
    minBedrooms,
    onClearFilters,
    onClearSearch,
    onMapIntent,
    onMinBedroomsChange,
    onPriceRangeChange,
    onSearchChange,
    onSelectPropertyType,
    onToggleAmenity,
    onViewModeToggle,
    priceRange,
    searchQuery,
    selectedAmenities,
    selectedPropertyType,
    viewMode,
}: {
    activeFilterCount: number
    availableTypes: string[]
    filteredCount: number
    isLoading?: boolean
    isMapView: boolean
    minBedrooms: number | null
    onClearFilters: () => void
    onClearSearch: () => void
    onMapIntent: () => void
    onMinBedroomsChange: (value: number | null) => void
    onPriceRangeChange: (priceRange: PublicHomePriceRange) => void
    onSearchChange: (value: string) => void
    onSelectPropertyType: (type: string | null) => void
    onToggleAmenity: (amenity: string) => void
    onViewModeToggle: () => void
    priceRange: PublicHomePriceRange
    searchQuery: string
    selectedAmenities: string[]
    selectedPropertyType: string | null
    viewMode: 'grid' | 'map'
}) {
    return (
        <div className="sticky top-16 z-40 px-4 pt-3 md:top-20 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1440px]">
                <div className="apple-glass-bar rounded-[28px] px-4 pb-3 pt-4 sm:px-5">
                    <div className="flex items-center gap-3">
                        <div className="apple-glass-control flex h-[52px] flex-1 items-center rounded-[20px] px-4 transition-[background-color,box-shadow] duration-200 hover:bg-white/80 sm:h-14">
                            <Search className="mr-2.5 h-5 w-5 shrink-0 text-neutral-500" strokeWidth={2.5} />
                            <div className="flex w-full min-w-0 flex-col justify-center pr-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(event) => onSearchChange(event.target.value)}
                                    placeholder="Address, city, or ZIP"
                                    className="w-full truncate border-none bg-transparent text-[15px] font-semibold text-neutral-900 outline-none placeholder:text-neutral-500 sm:text-[16px]"
                                />
                            </div>
                            {searchQuery ? (
                                <button
                                    type="button"
                                    onClick={onClearSearch}
                                    className="shrink-0 rounded-full p-1.5 text-neutral-500 transition-colors hover:bg-black/5 hover:text-neutral-700"
                                >
                                    <X className="h-4 w-4" strokeWidth={2.5} />
                                </button>
                            ) : null}
                        </div>

                        <button
                            type="button"
                            onClick={onViewModeToggle}
                            onMouseEnter={onMapIntent}
                            onFocus={onMapIntent}
                            onTouchStart={onMapIntent}
                            aria-label={viewMode === 'grid' ? 'Show map view' : 'Show list view'}
                            className={cn(
                                'flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[18px] outline-none transition-[background-color,color,box-shadow,transform] duration-200 md:hidden',
                                isMapView
                                    ? 'border-transparent bg-neutral-900 text-white shadow-[0_12px_24px_-16px_rgba(15,23,42,0.48)]'
                                    : 'apple-glass-control text-neutral-800 hover:text-neutral-950'
                            )}
                        >
                            {viewMode === 'grid' ? (
                                <MapIcon className="h-5 w-5" strokeWidth={2.5} />
                            ) : (
                                <List className="h-5 w-5" strokeWidth={2.5} />
                            )}
                        </button>

                        <PublicHomeFilterSheet
                            activeFilterCount={activeFilterCount}
                            filteredCount={filteredCount}
                            isLoading={isLoading}
                            minBedrooms={minBedrooms}
                            onClearFilters={onClearFilters}
                            onMinBedroomsChange={onMinBedroomsChange}
                            onPriceRangeChange={onPriceRangeChange}
                            onToggleAmenity={onToggleAmenity}
                            priceRange={priceRange}
                            selectedAmenities={selectedAmenities}
                        />
                    </div>

                    <PublicHomeCategoryRail
                        availableTypes={availableTypes}
                        onSelectPropertyType={onSelectPropertyType}
                        selectedPropertyType={selectedPropertyType}
                    />
                </div>
            </div>
        </div>
    )
}
