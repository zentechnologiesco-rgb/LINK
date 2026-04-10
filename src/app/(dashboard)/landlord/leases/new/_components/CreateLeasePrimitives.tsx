'use client'

import { type ElementType, type ReactNode } from 'react'
import { Loader2 } from '@/components/ui/icons'

import { cn } from '@/lib/utils'

export function CreateLeaseStatusCard({
    icon: Icon,
    title,
    description,
    tone,
    spinning = false,
}: {
    icon: ElementType
    title: string
    description: string
    tone: 'default' | 'success' | 'danger'
    spinning?: boolean
}) {
    return (
        <div className="flex items-start gap-3.5 rounded-2xl border border-neutral-200/80 bg-white p-4">
            <div className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                tone === 'success' ? 'bg-emerald-50 text-emerald-600'
                    : tone === 'danger' ? 'bg-red-50 text-red-600'
                        : 'bg-neutral-100 text-neutral-500',
            )}>
                <Icon className={cn('h-4 w-4', spinning && 'animate-spin')} strokeWidth={2} />
            </div>
            <div className="min-w-0 pt-0.5">
                <p className="text-[14px] font-semibold text-neutral-950">{title}</p>
                <p className="mt-0.5 text-[13px] text-neutral-500">{description}</p>
            </div>
        </div>
    )
}

export function CreateLeaseReviewCard({
    title,
    icon: Icon,
    onEdit,
    children,
}: {
    title: string
    icon: ElementType
    onEdit: () => void
    children: ReactNode
}) {
    return (
        <section className="px-5 py-5 sm:px-6">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    </div>
                    <h3 className="text-[14px] font-semibold text-neutral-950">{title}</h3>
                </div>
                <button
                    type="button"
                    onClick={onEdit}
                    className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-[12px] font-semibold text-neutral-500 transition-colors active:scale-95 hover:bg-neutral-50 hover:text-neutral-900"
                >
                    Edit
                </button>
            </div>
            {children}
        </section>
    )
}

export function CreateLeaseSummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <p className="text-[13px] text-neutral-500">{label}</p>
            <p className={cn('text-right text-[13px] text-neutral-950', bold ? 'font-bold' : 'font-semibold')}>{value}</p>
        </div>
    )
}

export function CreateLeaseMiniPill({ icon: Icon, label }: { icon: ElementType; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-100 bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold text-neutral-600">
            <Icon className="h-3 w-3 text-neutral-400" strokeWidth={2} />
            {label}
        </span>
    )
}

export function CreateLeaseWizardSkeleton() {
    return (
        <div className="mx-auto min-h-screen max-w-[760px] bg-white pb-16 font-sans">
            <div className="px-4 pt-3 sm:px-5">
                <div className="flex items-center gap-3 pb-2">
                    <div className="h-9 w-9 rounded-full bg-neutral-200/60" />
                    <div className="flex-1">
                        <div className="h-5 w-24 rounded-lg bg-neutral-200/60" />
                        <div className="mt-1.5 h-3 w-16 rounded-lg bg-neutral-200/40" />
                    </div>
                    <div className="h-4 w-8 rounded-lg bg-neutral-200/40" />
                </div>
                <div className="mt-1 h-[3px] rounded-full bg-neutral-200/40" />
                <div className="mt-3 flex gap-4">
                    {[48, 50, 44, 56, 52, 40].map((width, index) => (
                        <div key={index} className="h-4 rounded-full bg-neutral-200/40" style={{ width }} />
                    ))}
                </div>
            </div>
            <div className="mt-6 px-4 sm:px-5">
                <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
                    {[1, 2, 3].map((index) => (
                        <div key={index}>
                            <div className="flex items-center gap-3.5 px-4 py-3.5">
                                <div className="h-[56px] w-[56px] rounded-2xl bg-neutral-100" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-32 rounded-lg bg-neutral-100" />
                                    <div className="h-3 w-44 rounded-lg bg-neutral-100" />
                                    <div className="h-3 w-20 rounded-lg bg-neutral-50" />
                                </div>
                                <div className="h-5 w-5 rounded-full bg-neutral-100" />
                            </div>
                            {index < 3 ? <div className="ml-[76px] border-t border-neutral-100" /> : null}
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-8 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-neutral-300" />
            </div>
        </div>
    )
}
