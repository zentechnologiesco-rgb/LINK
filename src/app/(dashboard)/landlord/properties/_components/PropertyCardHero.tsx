'use client'

import { type PropertyCardData } from '../_lib/properties-page-types'

import { PropertyListingActions } from './PropertyListingActions'
import { OptimizedImage } from '@/components/ui/optimized-image'
import { cn } from '@/lib/utils'

import { type PropertyCardViewModel } from '../_lib/property-card-helpers'

export function PropertyCardHero({
    property,
    viewModel,
}: {
    property: PropertyCardData
    viewModel: PropertyCardViewModel
}) {
    return (
        <div className='relative aspect-[16/10] w-full shrink-0 bg-neutral-100 sm:aspect-[16/11]'>
            <OptimizedImage
                src={viewModel.imageSrc}
                alt={property.title}
                fill
                sizes='(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw'
                qualityPreset='card'
                className='absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105'
            />
            <div className='absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40' />

            <div className='absolute left-4 top-4'>
                <span
                    className={cn(
                        'inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md',
                        property.workflow.badgeClassName,
                    )}
                >
                    {property.workflow.label}
                </span>
            </div>

            <div className='absolute right-3 top-3'>
                <div className='rounded-full bg-white/90 p-0.5 shadow-sm backdrop-blur-sm'>
                    <PropertyListingActions
                        propertyId={property._id}
                        propertyTitle={property.title}
                        propertyPrice={property.priceNad}
                        approvalStatus={property.approvalStatus ?? 'pending'}
                        publicationStatus={property.publicationStatus ?? 'unpublished'}
                        adminNotes={property.adminNotes || null}
                        availableUnitCount={property.workflow.availableUnits}
                        hasDiscoveryClip={viewModel.hasDiscoveryClip}
                        hasActiveLease={property.activeLeaseCount > 0}
                        hasReservedLease={property.reservedLeaseCount > 0}
                    />
                </div>
            </div>

            <div className='absolute bottom-4 right-4'>
                <span className='inline-flex h-9 items-center justify-center rounded-full bg-white/95 px-4 text-[14px] font-bold text-neutral-950 shadow-sm backdrop-blur-sm'>
                    {viewModel.priceLabel}
                </span>
            </div>
        </div>
    )
}
