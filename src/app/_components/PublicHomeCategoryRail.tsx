'use client'

import { Compass } from '@/components/ui/icons'

import { cn } from '@/lib/utils'

import { getIconForType } from '../_lib/public-home-helpers'

export function PublicHomeCategoryRail({
    availableTypes,
    onSelectPropertyType,
    selectedPropertyType,
}: {
    availableTypes: string[]
    onSelectPropertyType: (type: string | null) => void
    selectedPropertyType: string | null
}) {
    return (
        <div className="flex items-center gap-[22px] overflow-x-auto no-scrollbar px-1.5 pb-3 pt-5 snap-x">
            <button
                onClick={() => onSelectPropertyType(null)}
                className="group flex min-w-[56px] shrink-0 snap-start flex-col items-center gap-2 outline-none"
            >
                <div
                    className={cn(
                        'p-0 text-neutral-500 transition-all',
                        !selectedPropertyType ? 'text-black' : 'group-hover:text-black'
                    )}
                >
                    <Compass className="h-[26px] w-[26px]" strokeWidth={!selectedPropertyType ? 2.5 : 2} />
                </div>
                <span
                    className={cn(
                        'whitespace-nowrap pb-1 text-[12px] transition-all',
                        !selectedPropertyType
                            ? 'border-b-[2px] border-black font-bold text-black'
                            : 'font-medium text-neutral-500 group-hover:text-black'
                    )}
                >
                    All Homes
                </span>
            </button>

            {availableTypes.map((type) => {
                const Icon = getIconForType(type)

                return (
                    <button
                        key={type}
                        onClick={() => onSelectPropertyType(type)}
                        className="group flex min-w-[64px] shrink-0 snap-start flex-col items-center gap-2 outline-none"
                    >
                        <div
                            className={cn(
                                'p-0 text-neutral-400 transition-all',
                                selectedPropertyType === type ? 'scale-110 text-black' : 'group-hover:text-black'
                            )}
                        >
                            <Icon className="h-5 w-5" />
                        </div>
                        <span
                            className={cn(
                                'whitespace-nowrap pb-1 text-[12px] transition-all',
                                selectedPropertyType === type
                                    ? 'border-b-[2px] border-black font-bold text-black'
                                    : 'font-medium text-neutral-500 group-hover:text-black'
                            )}
                        >
                            {type}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
