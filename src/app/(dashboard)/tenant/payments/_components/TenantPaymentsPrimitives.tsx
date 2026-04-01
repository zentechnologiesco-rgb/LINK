import type { ElementType } from 'react'

import { cn } from '@/lib/utils'

export function TenantPaymentsLoadingState() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 rounded-full border-2 border-black/10 border-t-black animate-spin" />
                <p className="text-sm font-medium text-black/40">Loading payments...</p>
            </div>
        </div>
    )
}

export function FeaturePill({ label }: { label: string }) {
    return (
        <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-600">
            {label}
        </span>
    )
}

export function HeroCard({
    title,
    body,
    icon: Icon,
}: {
    title: string
    body: string
    icon: ElementType
}) {
    return (
        <div className="rounded-3xl bg-neutral-950 p-5 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                <Icon className="h-5 w-5" />
            </div>
            <p className="mt-5 text-lg font-semibold tracking-tight">{title}</p>
            <p className="mt-1 text-sm text-white/65">{body}</p>
        </div>
    )
}

export function StatCard({
    label,
    value,
    tone,
    icon: Icon,
}: {
    label: string
    value: string
    tone: 'dark' | 'default' | 'danger'
    icon: ElementType
}) {
    return (
        <div
            className={cn(
                'rounded-3xl border p-5',
                tone === 'dark' && 'border-neutral-950 bg-neutral-950 text-white',
                tone === 'default' && 'border-neutral-200 bg-white text-neutral-900',
                tone === 'danger' && 'border-red-200 bg-red-50 text-red-800'
            )}
        >
            <div className="flex items-center justify-between gap-3">
                <p className={cn('text-xs font-semibold uppercase tracking-[0.18em]', tone === 'dark' ? 'text-white/60' : 'text-current/70')}>
                    {label}
                </p>
                <Icon className="h-4 w-4" />
            </div>
            <p className="mt-5 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
    )
}
