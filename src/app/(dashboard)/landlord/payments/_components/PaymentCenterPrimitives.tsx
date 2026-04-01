'use client'

import { type ElementType } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { getDepositStatusClasses, getDepositStatusLabel } from '../_lib/payment-formatters'

export function PaymentSectionTitle({ title, description }: { title: string; description: string }) {
    return (
        <div>
            <h2 className="text-xl font-semibold tracking-tight text-neutral-950">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-neutral-500">{description}</p>
        </div>
    )
}

export function PaymentQueueCard({
    title,
    value,
    detail,
    tone,
    actionLabel,
    onAction,
}: {
    title: string
    value: string
    detail: string
    tone: 'default' | 'warning' | 'success'
    actionLabel?: string
    onAction?: () => void
}) {
    return (
        <div
            className={cn(
                'rounded-3xl border p-5',
                tone === 'default' && 'border-neutral-200 bg-white',
                tone === 'warning' && 'border-amber-200 bg-amber-50',
                tone === 'success' && 'border-emerald-200 bg-emerald-50',
            )}
        >
            <p
                className={cn(
                    'text-xs font-semibold uppercase tracking-[0.18em]',
                    tone === 'default' && 'text-neutral-500',
                    tone === 'warning' && 'text-amber-700',
                    tone === 'success' && 'text-emerald-700',
                )}
            >
                {title}
            </p>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-neutral-950">{value}</p>
            <p
                className={cn(
                    'mt-1 text-sm',
                    tone === 'default' && 'text-neutral-500',
                    tone === 'warning' && 'text-amber-800',
                    tone === 'success' && 'text-emerald-800',
                )}
            >
                {detail}
            </p>
            {actionLabel && onAction ? (
                <Button
                    type="button"
                    variant="outline"
                    className="mt-4 h-10 rounded-xl border-neutral-200 bg-white"
                    onClick={onAction}
                >
                    {actionLabel}
                </Button>
            ) : null}
        </div>
    )
}

export function PaymentDepositStatusPill({ status }: { status: string }) {
    return (
        <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', getDepositStatusClasses(status))}>
            {getDepositStatusLabel(status)}
        </span>
    )
}

export function PaymentHeroCard({ title, body, icon: Icon }: { title: string; body: string; icon: ElementType }) {
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

export function PaymentStatCard({
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
                tone === 'danger' && 'border-red-200 bg-red-50 text-red-800',
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
