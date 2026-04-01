'use client'

import { Suspense } from 'react'
import { Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PropertyBrowseCard } from '@/features/properties/public/components/PropertyBrowseCard'
import { cn } from '@/lib/utils'

import { DiscoverVideoShelf } from './DiscoverVideoShelf'
import { PublicHomePropertyMap } from './PublicHomePropertyMap'
import type {
    PublicHomeMapProperty,
    PublicHomeProperty,
} from '../_lib/public-home-types'

/** Number of property cards to show BEFORE the discover shelf */
const SHELF_INSERT_AFTER = 4

export function PublicHomeResults({
    filteredProperties,
    hasOpenedMap,
    isMapView,
    isRefetching,
    mapProperties,
    onClearFilters,
}: {
    filteredProperties: PublicHomeProperty[]
    hasOpenedMap: boolean
    isMapView: boolean
    isRefetching: boolean
    mapProperties: PublicHomeMapProperty[]
    onClearFilters: () => void
}) {
    const firstBatch = filteredProperties.slice(0, SHELF_INSERT_AFTER)
    const remainingBatch = filteredProperties.slice(SHELF_INSERT_AFTER)

    return (
        <main className="mx-auto w-full max-w-[1440px] px-4 pt-6 sm:px-6 lg:px-8">
            {isRefetching ? (
                <div className="mb-4 text-[13px] font-medium text-neutral-400">
                    Updating results...
                </div>
            ) : null}

            {hasOpenedMap ? (
                <div
                    className={cn(
                        'relative isolate h-[75vh] w-full overflow-hidden rounded-[24px] border border-neutral-200/50 shadow-sm',
                        isMapView ? 'block' : 'hidden'
                    )}
                >
                    <PublicHomePropertyMap properties={mapProperties} isVisible={isMapView} />
                </div>
            ) : null}

            <div className={cn(isMapView ? 'hidden' : 'block')}>
                {filteredProperties.length === 0 ? (
                    <div className="flex flex-col items-center py-24 text-center">
                        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-neutral-100 bg-neutral-50">
                            <Search className="h-10 w-10 text-neutral-400" strokeWidth={2} />
                        </div>
                        <h3 className="text-[22px] font-bold tracking-tight text-black">No exact matches</h3>
                        <p className="mt-2 text-[16px] font-medium text-neutral-500">
                            Try changing or removing some of your filters.
                        </p>
                        <Button
                            variant="outline"
                            onClick={onClearFilters}
                            className="mt-8 h-12 rounded-full border-neutral-200 px-8 font-bold"
                        >
                            Clear all filters
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-10">
                        {/* First row of property cards */}
                        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {firstBatch.map((property, index) => (
                                <PropertyBrowseCard
                                    key={property.id}
                                    property={property}
                                    priority={index < 4}
                                />
                            ))}
                        </div>

                        {/* YouTube Shorts-style Discover Video Shelf */}
                        <Suspense fallback={null}>
                            <DiscoverVideoShelf />
                        </Suspense>

                        {/* Remaining property cards */}
                        {remainingBatch.length > 0 && (
                            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {remainingBatch.map((property) => (
                                    <PropertyBrowseCard
                                        key={property.id}
                                        property={property}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    )
}
