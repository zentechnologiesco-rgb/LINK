import { Check } from '@/components/ui/icons'

import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog'
import { PropertyCardSkeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import {
    SORT_OPTIONS,
    type TenantSavedSortId,
} from '../_lib/tenant-saved-helpers'

export function TenantSavedWorkspaceSkeleton() {
    return (
        <div className="mx-auto min-h-[80vh] w-full max-w-[1400px] animate-in fade-in duration-500 font-sans">
            <div className="flex h-14 items-center justify-between px-4 sm:px-6">
                <div className="h-6 w-32 rounded-lg bg-neutral-100" />
                <div className="h-8 w-8 rounded-full bg-neutral-100" />
            </div>
            <div className="px-4 pt-4 sm:px-6">
                <div className="h-10 w-48 rounded-xl bg-neutral-100" />
                <div className="mt-2 h-4 w-32 rounded-lg bg-neutral-100" />
            </div>
            <div className="mt-8 grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="w-full">
                        <PropertyCardSkeleton />
                    </div>
                ))}
            </div>
        </div>
    )
}

export function TenantSavedSortDialog({
    onOpenChange,
    onSelect,
    open,
    sortBy,
}: {
    onOpenChange: (open: boolean) => void
    onSelect: (sortBy: TenantSavedSortId) => void
    open: boolean
    sortBy: TenantSavedSortId
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="fixed bottom-0 top-auto max-h-[90vh] w-full max-w-md translate-y-0 gap-0 overflow-y-auto rounded-t-[32px] border-0 p-6 shadow-2xl sm:bottom-auto sm:top-[50%] sm:-translate-y-1/2 sm:rounded-[32px]">
                <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-neutral-200 sm:hidden" />
                <DialogTitle className="mb-6 text-[22px] font-bold tracking-[-0.04em] text-neutral-950">Sort By</DialogTitle>
                <div className="-mx-6 border-y border-neutral-100/60 bg-white">
                    {SORT_OPTIONS.map((option) => {
                        const isSelected = sortBy === option.id

                        return (
                            <button
                                key={option.id}
                                onClick={() => onSelect(option.id)}
                                className="flex w-full items-center justify-between border-b border-neutral-100/60 px-6 py-4 transition-colors last:border-0 hover:bg-neutral-50 active:bg-neutral-100"
                            >
                                <span
                                    className={cn(
                                        'text-[16px]',
                                        isSelected ? 'font-bold text-neutral-950' : 'font-medium text-neutral-600'
                                    )}
                                >
                                    {option.label}
                                </span>
                                {isSelected ? <Check className="h-5 w-5 text-neutral-950" strokeWidth={2.5} /> : null}
                            </button>
                        )
                    })}
                </div>
            </DialogContent>
        </Dialog>
    )
}
