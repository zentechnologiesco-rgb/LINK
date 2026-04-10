'use client'

import Link from 'next/link'
import { Edit, Eye, MapPin } from '@/components/ui/icons'

import { Button } from '@/components/ui/button'

import { PropertyCardClipPanel } from './PropertyCardClipPanel'
import { PropertyCardHero } from './PropertyCardHero'
import { PropertyCardStats } from './PropertyCardStats'
import { getPropertyCardViewModel } from '../_lib/property-card-helpers'
import { type PropertyCardData } from '../_lib/properties-page-types'

export function PropertyCard({ property }: { property: PropertyCardData }) {
    const viewModel = getPropertyCardViewModel(property)

    return (
        <article className='group relative overflow-hidden rounded-[24px] border border-neutral-200/80 bg-neutral-50/50 shadow-sm transition-all hover:bg-neutral-50'>
            <PropertyCardHero property={property} viewModel={viewModel} />

            <div className='p-5'>
                <div className='flex items-start justify-between gap-4'>
                    <div className='min-w-0 flex-1'>
                        <span className='text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400'>
                            {viewModel.portfolioLabel}
                        </span>
                        <h2 className='mt-1 truncate text-[20px] font-bold tracking-[-0.03em] text-neutral-950 sm:text-[22px]'>
                            {property.title}
                        </h2>
                        <div className='mt-0.5 flex items-center gap-1.5 text-neutral-500'>
                            <MapPin className='h-3.5 w-3.5 shrink-0' strokeWidth={2} />
                            <p className='truncate text-[14px]'>{property.address}, {property.city}</p>
                        </div>
                        <p className='mt-2 text-[13px] leading-relaxed text-neutral-500'>
                            {property.workflow.description}
                        </p>
                        {property.workflow.needsAttention && property.adminNotes ? (
                            <p className='mt-2 rounded-2xl bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700'>
                                {property.adminNotes}
                            </p>
                        ) : null}
                    </div>
                </div>

                <PropertyCardStats viewModel={viewModel} />

                <PropertyCardClipPanel viewModel={viewModel} />

                <div className='mt-6 flex items-center gap-3'>
                    <Button asChild variant='outline' className='h-11 flex-1 rounded-full border-neutral-200/80 bg-white text-[13px] font-bold shadow-none transition-all hover:bg-neutral-50 active:scale-[0.98]'>
                        <Link href={viewModel.editDetailsHref}>
                            <Edit className='mr-2 h-4 w-4' strokeWidth={2} />
                            Edit Details
                        </Link>
                    </Button>
                    <Button asChild className='h-11 flex-1 rounded-full bg-neutral-950 text-[13px] font-bold text-white shadow-none transition-all hover:bg-neutral-800 active:scale-[0.98]'>
                        <Link href={viewModel.viewHref}>
                            <Eye className='mr-2 h-4 w-4' strokeWidth={2} />
                            View Listing
                        </Link>
                    </Button>
                </div>
            </div>

            {property.workflow.needsAttention ? (
                <div className='absolute right-0 top-0 h-full w-1.5 bg-red-500' />
            ) : null}
        </article>
    )
}
