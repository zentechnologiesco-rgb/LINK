'use client'

import { Bath, BedDouble, Blocks, Maximize } from '@/components/ui/icons'

import { type PropertyCardViewModel } from '../_lib/property-card-helpers'

export function PropertyCardStats({ viewModel }: { viewModel: PropertyCardViewModel }) {
    return (
        <div className='mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4'>
            <div className='flex items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-inset ring-neutral-200/60 transition-transform hover:scale-[1.02]'>
                <BedDouble className='h-4 w-4 text-neutral-400' strokeWidth={2} />
                <span className='text-[13px] font-semibold text-neutral-950'>{viewModel.bedroomsLabel}</span>
            </div>
            <div className='flex items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-inset ring-neutral-200/60 transition-transform hover:scale-[1.02]'>
                <Bath className='h-4 w-4 text-neutral-400' strokeWidth={2} />
                <span className='text-[13px] font-semibold text-neutral-950'>{viewModel.bathroomsLabel}</span>
            </div>
            <div className='flex items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-inset ring-neutral-200/60 transition-transform hover:scale-[1.02]'>
                <Maximize className='h-4 w-4 text-neutral-400' strokeWidth={2} />
                <span className='text-[13px] font-semibold text-neutral-950'>{viewModel.sizeLabel}</span>
            </div>
            {viewModel.isMultiUnit ? (
                <div className='hidden items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-inset ring-neutral-200/60 transition-transform hover:scale-[1.02] sm:flex'>
                    <Blocks className='h-4 w-4 text-neutral-400' strokeWidth={2} />
                    <span className='text-[13px] font-semibold text-neutral-950'>{viewModel.unitCountLabel}</span>
                </div>
            ) : null}
        </div>
    )
}
