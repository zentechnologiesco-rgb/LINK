'use client'

import Link from 'next/link'
import { Clapperboard } from '@/components/ui/icons'

import { Button } from '@/components/ui/button'
import { DISCOVER_EXPERIENCE_ENABLED } from '@/config/features'
import { cn } from '@/lib/utils'

import { type PropertyCardViewModel } from '../_lib/property-card-helpers'

export function PropertyCardClipPanel({ viewModel }: { viewModel: PropertyCardViewModel }) {
    if (!DISCOVER_EXPERIENCE_ENABLED) {
        return null
    }

    return (
        <div className='mt-4 rounded-[22px] border border-neutral-200/80 bg-white p-4'>
            <div className='flex items-start justify-between gap-4'>
                <div className='min-w-0'>
                    <div className='flex items-center gap-2'>
                        <Clapperboard
                            className={cn(
                                'h-4 w-4',
                                viewModel.hasDiscoveryClip ? 'text-sky-500' : 'text-neutral-400',
                            )}
                            strokeWidth={2.1}
                        />
                        <p className='text-[14px] font-semibold tracking-[-0.02em] text-neutral-950'>
                            {viewModel.clipStatusLabel}
                        </p>
                    </div>
                    <p className='mt-1 text-[13px] leading-relaxed text-neutral-500'>
                        {viewModel.clipDescription}
                    </p>
                </div>
                <Button
                    asChild
                    className={cn(
                        'h-10 rounded-full px-4 text-[13px] font-semibold shadow-none transition-all active:scale-[0.98]',
                        viewModel.hasDiscoveryClip
                            ? 'border border-neutral-200 bg-white text-neutral-950 hover:bg-neutral-50'
                            : 'bg-neutral-950 text-white hover:bg-neutral-800',
                    )}
                >
                    <Link href={viewModel.clipHref}>
                        <Clapperboard className='mr-2 h-4 w-4' strokeWidth={2.1} />
                        {viewModel.clipActionLabel}
                    </Link>
                </Button>
            </div>
        </div>
    )
}
