'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    List,
    Map as MapIcon,
} from 'lucide-react'

import { api } from '@convex/_generated/api'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { HomePageSkeleton } from '@/components/ui/skeleton'
import { useUser } from '@/components/providers/UserProvider'
import { useDebounce } from '@/hooks/useDebounce'
import { useCachedQuery } from '@/hooks/useOptimisticQuery'
import { cn } from '@/lib/utils'

import { PublicHomeResults } from './PublicHomeResults'
import { PublicHomeSearchToolbar } from './PublicHomeSearchToolbar'
import { warmPublicHomePropertyMap } from './PublicHomePropertyMap'
import {
    filterPropertiesByType,
    getActivePublicHomeFilterCount,
    getAvailablePropertyTypes,
    normalizePublicHomeProperties,
    toPublicHomeMapProperties,
} from '../_lib/public-home-helpers'
import type {
    PublicHomePriceRange,
    PublicHomeRawProperty,
} from '../_lib/public-home-types'

export function PublicHomeWorkspace() {
    const router = useRouter()
    const { user: currentUser } = useUser()

    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
    const [hasOpenedMap, setHasOpenedMap] = useState(false)
    const [priceRange, setPriceRange] = useState<PublicHomePriceRange>({ min: '', max: '' })
    const [minBedrooms, setMinBedrooms] = useState<number | null>(null)
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
    const [selectedPropertyType, setSelectedPropertyType] = useState<string | null>(null)

    const debouncedSearchQuery = useDebounce(searchQuery, 300)
    const minPrice = priceRange.min ? Number.parseInt(priceRange.min, 10) : undefined
    const maxPrice = priceRange.max ? Number.parseInt(priceRange.max, 10) : undefined

    const propertyQueryArgs = useMemo(
        () => ({
            onlyAvailable: true,
            query: debouncedSearchQuery.trim() || undefined,
            minPrice,
            maxPrice,
            bedrooms: minBedrooms ?? undefined,
            amenityNames: selectedAmenities.length > 0 ? selectedAmenities : undefined,
        }),
        [debouncedSearchQuery, maxPrice, minBedrooms, minPrice, selectedAmenities]
    )

    const {
        data: properties,
        isLoading: isPropertiesLoading,
        isRefetching: isPropertiesRefetching,
    } = useCachedQuery(
        api.properties.list,
        {
            queryName: 'public_properties_list_v1',
            storage: 'local',
        },
        propertyQueryArgs
    ) as {
        data: PublicHomeRawProperty[] | undefined
        isLoading: boolean
        isRefetching: boolean
    }

    useEffect(() => {
        if (viewMode === 'map') return

        const timeoutId = window.setTimeout(() => {
            void warmPublicHomePropertyMap()
        }, 1200)

        return () => window.clearTimeout(timeoutId)
    }, [viewMode])

    const handleRefresh = async () => {
        router.refresh()
        await new Promise((resolve) => setTimeout(resolve, 500))
    }

    const normalizedProperties = useMemo(
        () => normalizePublicHomeProperties(properties),
        [properties]
    )

    const availableTypes = useMemo(
        () => getAvailablePropertyTypes(normalizedProperties),
        [normalizedProperties]
    )

    const filteredProperties = useMemo(
        () => filterPropertiesByType(normalizedProperties, selectedPropertyType),
        [normalizedProperties, selectedPropertyType]
    )

    const mapProperties = useMemo(
        () => toPublicHomeMapProperties(filteredProperties),
        [filteredProperties]
    )

    const activeFilterCount = getActivePublicHomeFilterCount({
        minBedrooms,
        priceRange,
        selectedAmenities,
        selectedPropertyType,
    })

    const clearFilters = () => {
        setPriceRange({ min: '', max: '' })
        setMinBedrooms(null)
        setSelectedAmenities([])
        setSelectedPropertyType(null)
    }

    const handleMapIntent = () => {
        void warmPublicHomePropertyMap()
    }

    const handleViewModeToggle = () => {
        const nextViewMode = viewMode === 'grid' ? 'map' : 'grid'

        if (nextViewMode === 'map') {
            setHasOpenedMap(true)
            void warmPublicHomePropertyMap()
        }

        setViewMode(nextViewMode)
    }

    const toggleAmenity = (amenity: string) => {
        setSelectedAmenities((currentAmenities) =>
            currentAmenities.includes(amenity)
                ? currentAmenities.filter((value) => value !== amenity)
                : [...currentAmenities, amenity]
        )
    }

    const isMapView = viewMode === 'map'
    const nextViewLabel = isMapView ? 'List' : 'Map'
    const mapToggleDesktopClassName = cn(
        'border border-[#0000ff]/35 bg-[#0A0B0D]/95 text-white backdrop-blur-xl',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_0_1px_rgba(0,0,255,0.12),0_8px_20px_rgba(2,6,23,0.26),0_0_12px_rgba(0,0,255,0.14)]',
        'transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0000ff]/50 hover:bg-[#0A0B0D] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_0_1px_rgba(0,0,255,0.16),0_10px_24px_rgba(2,6,23,0.32),0_0_16px_rgba(0,0,255,0.18)] active:scale-[0.98]'
    )

    if (isPropertiesLoading) {
        return <HomePageSkeleton />
    }

    return (
        <div className="min-h-screen overflow-x-hidden bg-white pb-32 font-sans text-neutral-900 sm:pb-40">
            <Header
                user={currentUser}
                userRole={currentUser?.role}
                isLoading={currentUser === undefined}
            />

            <PullToRefresh onRefresh={handleRefresh} className="min-h-[calc(100vh-80px)]">
                <PublicHomeSearchToolbar
                    activeFilterCount={activeFilterCount}
                    availableTypes={availableTypes}
                    filteredCount={filteredProperties.length}
                    isMapView={isMapView}
                    minBedrooms={minBedrooms}
                    onClearFilters={clearFilters}
                    onClearSearch={() => setSearchQuery('')}
                    onMapIntent={handleMapIntent}
                    onMinBedroomsChange={setMinBedrooms}
                    onPriceRangeChange={setPriceRange}
                    onSearchChange={setSearchQuery}
                    onSelectPropertyType={setSelectedPropertyType}
                    onToggleAmenity={toggleAmenity}
                    onViewModeToggle={handleViewModeToggle}
                    priceRange={priceRange}
                    searchQuery={searchQuery}
                    selectedAmenities={selectedAmenities}
                    selectedPropertyType={selectedPropertyType}
                    viewMode={viewMode}
                />

                <PublicHomeResults
                    filteredProperties={filteredProperties}
                    hasOpenedMap={hasOpenedMap}
                    isMapView={isMapView}
                    isRefetching={isPropertiesRefetching}
                    mapProperties={mapProperties}
                    onClearFilters={clearFilters}
                />
            </PullToRefresh>

            <div className="pointer-events-none fixed bottom-10 right-4 z-50 hidden md:right-6 md:block lg:right-8">
                <div className="pointer-events-auto">
                    <button
                        onClick={handleViewModeToggle}
                        onMouseEnter={handleMapIntent}
                        onFocus={handleMapIntent}
                        onTouchStart={handleMapIntent}
                        className={cn(
                            'pointer-events-auto flex h-14 items-center gap-3 rounded-full px-4 pr-5 font-semibold tracking-tight',
                            mapToggleDesktopClassName
                        )}
                    >
                        <span className="flex items-center justify-center text-[#8ea2ff]">
                            {viewMode === 'grid' ? (
                                <MapIcon className="h-[18px] w-[18px]" strokeWidth={2.4} />
                            ) : (
                                <List className="h-[18px] w-[18px]" strokeWidth={2.4} />
                            )}
                        </span>
                        <span className="text-[15px]">{nextViewLabel}</span>
                    </button>
                </div>
            </div>

            <MobileNav user={currentUser} userRole={currentUser?.role} />
        </div>
    )
}
