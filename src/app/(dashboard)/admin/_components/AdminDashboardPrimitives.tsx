'use client'

import Link from 'next/link'
import type { ElementType, ReactNode } from 'react'
import { ArrowRight, Trash2, TrendingDown, TrendingUp } from '@/components/ui/icons'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { cn } from '@/lib/utils'

import {
    dateFormatter,
    formatNumber,
    formatRelativeTime,
    surfaceClassName,
} from '../_lib/admin-dashboard-formatters'
import type { DashboardOverview, DashboardUser, Trend } from '../_lib/admin-dashboard-types'

export function Surface({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn(surfaceClassName, className)}>{children}</div>
}

export function SectionHeader({
    label,
    title,
    trailing,
}: {
    label: string
    title: string
    trailing?: ReactNode
}) {
    return (
        <div className="flex items-end justify-between gap-4">
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-400">{label}</p>
                <h2 className="mt-2 text-[30px] font-semibold tracking-[-0.05em] text-neutral-950">{title}</h2>
            </div>
            {trailing}
        </div>
    )
}

export function TrendPill({ trend, label }: { trend: Trend; label: string }) {
    const Icon = trend.direction === 'down' ? TrendingDown : TrendingUp
    const tone =
        trend.direction === 'up'
            ? 'bg-emerald-50 text-emerald-700'
            : trend.direction === 'down'
                ? 'bg-red-50 text-red-700'
                : 'bg-[#f2f2f7] text-neutral-500'

    return (
        <span className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold', tone)}>
            {trend.direction === 'flat' ? null : <Icon className="h-3.5 w-3.5" />}
            {trend.delta === 0 ? `Flat ${label}` : `${trend.delta > 0 ? '+' : '−'}${formatNumber(Math.abs(trend.delta))} ${label}`}
        </span>
    )
}

export function MetricCell({ label, value, meta }: { label: string; value: string; meta: string }) {
    return (
        <div className="px-5 py-5 sm:px-6">
            <p className="text-[12px] font-medium text-neutral-500">{label}</p>
            <p className="mt-2 text-[32px] font-semibold tracking-[-0.05em] text-neutral-950 tabular-nums">{value}</p>
            <p className="mt-1 text-[13px] text-neutral-500">{meta}</p>
        </div>
    )
}

export function ActionRow({
    href,
    icon: Icon,
    title,
    meta,
}: {
    href: string
    icon: ElementType
    title: string
    meta: string
}) {
    return (
        <Link href={href} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f2f7] text-neutral-700">
                <Icon className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="font-semibold text-neutral-950">{title}</p>
                <p className="text-[13px] text-neutral-500">{meta}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-neutral-300 transition-transform group-hover:translate-x-0.5" />
        </Link>
    )
}

export function StatRow({
    label,
    value,
    meta,
    tone = 'default',
}: {
    label: string
    value: string
    meta?: string
    tone?: 'default' | 'warning' | 'danger'
}) {
    const valueTone =
        tone === 'danger' ? 'text-red-600' : tone === 'warning' ? 'text-amber-600' : 'text-neutral-950'

    return (
        <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
                <p className="font-medium text-neutral-900">{label}</p>
                {meta ? <p className="text-[13px] text-neutral-500">{meta}</p> : null}
            </div>
            <p className={cn('shrink-0 text-[17px] font-semibold tabular-nums', valueTone)}>{value}</p>
        </div>
    )
}

export function InlineBar({ value, max }: { value: number; max: number }) {
    return (
        <div className="mt-2 h-1.5 rounded-full bg-[#eef0f4]">
            <div className="h-full rounded-full bg-neutral-900/80" style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }} />
        </div>
    )
}

export function ActivityRow({ item }: { item: DashboardOverview['recentActivity'][number] }) {
    const row = (
        <div className="px-5 py-4 transition-colors hover:bg-black/[0.02]">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="font-medium text-neutral-950">{item.label}</p>
                    <p className="truncate text-[13px] text-neutral-500">{item.targetLabel}</p>
                </div>
                <span className="shrink-0 text-[12px] font-medium text-neutral-400">{formatRelativeTime(item.timestamp)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-[12px] text-neutral-400">
                <span className="truncate">{item.adminName}</span>
                <span>{dateFormatter.format(item.timestamp)}</span>
            </div>
            {item.detail ? <p className="mt-2 text-[13px] text-neutral-500">{item.detail}</p> : null}
        </div>
    )

    return item.href
        ? <Link href={item.href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{row}</Link>
        : row
}

export function DeletePropertyButton({
    title,
    onConfirm,
}: {
    title: string
    onConfirm: () => Promise<void>
}) {
    return (
        <ConfirmDialog
            title="Delete Property"
            description={`Delete "${title}" from the platform.`}
            confirmText="Delete"
            variant="destructive"
            onConfirm={onConfirm}
            trigger={
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 rounded-full bg-[#fff1f2] p-0 text-red-600 hover:bg-[#ffe4e6]"
                    aria-label={`Delete ${title}`}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            }
        />
    )
}

export function RoleSelector({
    user,
    onAssignRole,
}: {
    user: DashboardUser
    onAssignRole: (userId: DashboardUser['_id'], nextRole: DashboardUser['role']) => Promise<void>
}) {
    const roles: DashboardUser['role'][] = ['tenant', 'landlord', 'admin']

    return (
        <div className="flex flex-wrap gap-1 rounded-full bg-[#f2f2f7] p-1">
            {roles.map((role) => {
                const isActive = user.role === role

                return (
                    <Button
                        key={role}
                        size="sm"
                        variant="ghost"
                        className={cn(
                            'h-7 rounded-full px-3 text-[12px] font-semibold capitalize',
                            isActive
                                ? 'bg-white text-neutral-950 shadow-[0_1px_2px_rgba(15,23,42,0.08)]'
                                : 'text-neutral-500 hover:bg-white/70 hover:text-neutral-900',
                        )}
                        disabled={isActive}
                        onClick={() => onAssignRole(user._id, role)}
                    >
                        {role}
                    </Button>
                )
            })}
        </div>
    )
}
