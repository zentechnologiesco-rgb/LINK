'use client'

import type { ElementType, ReactNode } from 'react'

import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export function SectionHeader({ title, description }: { title: string; description: string }) {
    return (
        <div className="mb-3 px-4 sm:px-6">
            <h2 className="text-[18px] font-bold tracking-[-0.03em] text-neutral-950">{title}</h2>
            {description && <p className="mt-0.5 text-[14px] text-neutral-500">{description}</p>}
        </div>
    )
}

export function GroupedSection({ children }: { children: ReactNode }) {
    return (
        <div className="px-4 sm:px-6">
            <div className="overflow-hidden rounded-[20px] border border-neutral-200/80 bg-white shadow-sm">
                <div className="divide-y divide-neutral-100/60">
                    {children}
                </div>
            </div>
        </div>
    )
}

export function ListRow({
    label,
    subLabel,
    value,
    valueDetail,
    statusTone,
}: {
    label: string
    subLabel?: string
    value: string
    valueDetail?: string
    statusTone?: string
}) {
    return (
        <div className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-neutral-50">
            <div>
                <p className="max-w-[200px] truncate text-[15px] font-semibold capitalize text-neutral-950 sm:max-w-[400px]">{label}</p>
                {subLabel && <p className="mt-0.5 text-[13px] text-neutral-500">{subLabel}</p>}
            </div>
            <div className="text-right">
                <p className="text-[15px] font-semibold text-neutral-950">{value}</p>
                {valueDetail && (
                    <p
                        className={cn(
                            'mt-0.5 text-[12px] font-semibold capitalize',
                            statusTone === 'paid'
                                ? 'text-emerald-600'
                                : statusTone === 'pending'
                                    ? 'text-neutral-500'
                                    : 'text-red-500'
                        )}
                    >
                        {valueDetail}
                    </p>
                )}
            </div>
        </div>
    )
}

export function ListStackItem({ title, content }: { title: string; content: string }) {
    return (
        <div className="px-5 py-5 transition-colors hover:bg-neutral-50">
            <p className="text-[15px] font-semibold text-neutral-950">{title}</p>
            <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-neutral-600">{content}</p>
        </div>
    )
}

export function MiniStat({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
    return (
        <div className="flex flex-col rounded-[20px] bg-neutral-50 p-4 ring-1 ring-inset ring-neutral-200/60">
            <Icon className="mb-3 h-5 w-5 text-neutral-500" strokeWidth={2.2} />
            <p className="text-[12px] font-bold uppercase tracking-[0.04em] text-neutral-400">{label}</p>
            <p className="mt-1 block w-full truncate text-[15px] font-bold tracking-tight text-neutral-950" title={value}>{value}</p>
        </div>
    )
}

export function InlineMetric({
    label,
    value,
    tone,
}: {
    label: string
    value: string
    tone: 'default' | 'success' | 'danger'
}) {
    return (
        <span
            className={cn(
                'flex shrink-0 items-center justify-center gap-2 rounded-full border px-4 py-2 text-[14px]',
                tone === 'default' && 'border-neutral-200/60 bg-neutral-50 text-neutral-700',
                tone === 'success' && 'border-emerald-200/60 bg-emerald-50 text-emerald-800',
                tone === 'danger' && 'border-red-200/60 bg-red-50 text-red-800'
            )}
        >
            <span className="font-medium">{label}</span>
            <span className="font-bold">{value}</span>
        </span>
    )
}

export function MiniPill({ icon: Icon, label }: { icon: ElementType; label: string }) {
    return (
        <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200/60 bg-neutral-50 px-3.5 py-2 text-[13px] font-semibold text-neutral-700">
            <Icon className="h-4 w-4 text-neutral-500" strokeWidth={2.2} />
            {label}
        </span>
    )
}

export function IOSDialog({
    open,
    onOpenChange,
    title,
    children,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    children: ReactNode
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="fixed bottom-0 top-auto max-h-[90vh] w-full max-w-md translate-y-0 gap-0 overflow-y-auto rounded-t-[32px] border-0 bg-white p-6 shadow-[0_-10px_60px_-15px_rgba(0,0,0,0.1)] hide-scrollbar sm:bottom-auto sm:top-[50%] sm:-translate-y-1/2 sm:rounded-[32px]">
                <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-neutral-200 sm:hidden" />
                <DialogTitle className="mb-2 text-[22px] font-bold tracking-[-0.04em] text-neutral-950">{title}</DialogTitle>
                {children}
            </DialogContent>
        </Dialog>
    )
}

export function PageSkeleton() {
    return (
        <div className="mx-auto min-h-screen max-w-[820px] bg-white pb-16 font-sans">
            <div className="h-14 border-b border-neutral-100/60 bg-white" />
            <div className="px-4 pt-6 sm:px-6">
                <div className="aspect-[21/9] w-full rounded-[24px] bg-neutral-100 sm:aspect-[21/7]" />
                <div className="mt-8 space-y-4">
                    <div className="h-8 w-64 rounded-xl bg-neutral-100" />
                    <div className="h-4 w-48 rounded-lg bg-neutral-100" />
                </div>
                <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="h-24 rounded-[20px] bg-neutral-100" />
                    <div className="h-24 rounded-[20px] bg-neutral-100" />
                    <div className="h-24 rounded-[20px] bg-neutral-100" />
                    <div className="h-24 rounded-[20px] bg-neutral-100" />
                </div>
            </div>
        </div>
    )
}
