'use client'

import type { ElementType, ReactNode } from 'react'
import { Eye, FileText, Loader2 } from '@/components/ui/icons'

import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export function SectionHeader({ title, description }: { title: string; description?: string }) {
    return (
        <div className="px-5 pb-3 pt-2 sm:px-6">
            <h2 className="text-[17px] font-bold tracking-[-0.03em] text-neutral-950">{title}</h2>
            {description && <p className="mt-0.5 text-[13px] text-neutral-500">{description}</p>}
        </div>
    )
}

export function GroupedSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div>
            <SectionHeader title={title} />
            <div className="px-4 sm:px-5">
                <div className="overflow-hidden rounded-[20px] border border-neutral-200/80 bg-white">
                    <div className="divide-y divide-neutral-100">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}

export function ListRow({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
    return (
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-3 text-[14px] text-neutral-600">
                <Icon className="h-4 w-4 text-neutral-400" strokeWidth={2} />
                <span>{label}</span>
            </div>
            <span className="text-[14px] font-semibold text-neutral-950">{value}</span>
        </div>
    )
}

export function ListStackItem({ children }: { children: ReactNode }) {
    return <div className="px-4 py-4 sm:px-5">{children}</div>
}

export function ListDocumentItem({
    title,
    subtitle,
    url,
}: {
    title: string
    subtitle: string
    url: string | null
}) {
    return (
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-neutral-100 text-neutral-500">
                    <FileText className="h-4 w-4" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-neutral-950">{title}</p>
                    <p className="text-[12px] text-neutral-500">{subtitle}</p>
                </div>
            </div>
            {url ? (
                <button
                    onClick={() => window.open(url, '_blank')}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition-colors active:bg-neutral-200"
                >
                    <Eye className="h-4 w-4" strokeWidth={2} />
                </button>
            ) : (
                <span className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Loading</span>
            )}
        </div>
    )
}

export function MiniPill({ icon: Icon, label }: { icon: ElementType; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-[10px] border border-neutral-100 bg-neutral-50 px-2.5 py-1.5 text-[12px] font-medium text-neutral-600">
            <Icon className="h-3.5 w-3.5 text-neutral-400" strokeWidth={2} />
            {label}
        </span>
    )
}

export function MiniStat({
    label,
    value,
    tone,
}: {
    label: string
    value: string
    tone: 'default' | 'success' | 'danger'
}) {
    return (
        <div
            className={cn(
                'flex-1 rounded-[16px] border px-3 py-2.5',
                tone === 'default' && 'border-neutral-200/80 bg-neutral-50',
                tone === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-900',
                tone === 'danger' && 'border-red-200 bg-red-50 text-red-900'
            )}
        >
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] opacity-60">{label}</p>
            <p className="mt-0.5 text-[16px] font-bold tracking-tight">{value}</p>
        </div>
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
            <DialogContent className="fixed bottom-0 top-auto max-h-[90vh] w-full max-w-md translate-y-0 gap-0 overflow-y-auto rounded-t-[32px] border-0 p-6 shadow-2xl sm:bottom-auto sm:top-[50%] sm:-translate-y-1/2 sm:rounded-[32px]">
                <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-neutral-200 sm:hidden" />
                <DialogTitle className="mb-6 text-[22px] font-bold tracking-[-0.04em] text-neutral-950">{title}</DialogTitle>
                {children}
            </DialogContent>
        </Dialog>
    )
}

export function PageSkeleton() {
    return (
        <div className="mx-auto min-h-screen max-w-[820px] bg-white pb-16 font-sans">
            <div className="h-14 border-b border-neutral-100 bg-white" />
            <div className="px-5 pt-4 sm:px-6">
                <div className="aspect-[21/9] w-full rounded-[20px] bg-neutral-100 sm:aspect-[21/7]" />
                <div className="mt-5 space-y-2">
                    <div className="h-8 w-64 rounded-xl bg-neutral-100" />
                    <div className="h-4 w-40 rounded-lg bg-neutral-100" />
                </div>
                <div className="mt-6 h-20 rounded-[20px] bg-neutral-50" />
            </div>
            <div className="mt-10 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-300" />
            </div>
        </div>
    )
}
