'use client'

import { type ElementType } from 'react'
import { format } from 'date-fns'
import {
    AlertTriangle,
    Check,
    CheckCircle2,
    Clock3,
    FileText,
    PenTool,
    RefreshCcw,
    Send,
    XCircle,
} from '@/components/ui/icons'

import { cn } from '@/lib/utils'

interface LeaseStatusTimelineProps {
    status: string
    createdAt: string | number
    sentAt?: string | number | null
    signedAt?: string | number | null
    approvedAt?: string | number | null
}

type StatusMeta = {
    icon: ElementType
    label: string
    badgeClassName: string
}

const statusConfig: Record<string, StatusMeta> = {
    draft: {
        icon: FileText,
        label: 'Draft',
        badgeClassName: 'border-neutral-200 bg-neutral-50 text-neutral-700',
    },
    sent_to_tenant: {
        icon: Send,
        label: 'Sent to tenant',
        badgeClassName: 'border-sky-200 bg-sky-50 text-sky-700',
    },
    tenant_signed: {
        icon: PenTool,
        label: 'Tenant signed',
        badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700',
    },
    approved: {
        icon: CheckCircle2,
        label: 'Approved',
        badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    rejected: {
        icon: XCircle,
        label: 'Rejected',
        badgeClassName: 'border-red-200 bg-red-50 text-red-700',
    },
    revision_requested: {
        icon: RefreshCcw,
        label: 'Revision requested',
        badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700',
    },
    expired: {
        icon: Clock3,
        label: 'Expired',
        badgeClassName: 'border-neutral-200 bg-neutral-50 text-neutral-500',
    },
    terminated: {
        icon: AlertTriangle,
        label: 'Terminated',
        badgeClassName: 'border-red-200 bg-red-50 text-red-700',
    },
}

const currentStatusIndexMap: Record<string, number> = {
    draft: 0,
    sent_to_tenant: 1,
    tenant_signed: 2,
    revision_requested: 2,
    approved: 3,
    rejected: 2,
    terminated: 3,
    expired: 3,
}

export function LeaseStatusTimeline({
    status,
    createdAt,
    sentAt,
    signedAt,
    approvedAt,
}: LeaseStatusTimelineProps) {
    const currentStatusIndex = currentStatusIndexMap[status] ?? 0
    const currentStatus = statusConfig[status] || statusConfig.draft

    const steps = [
        { key: 'draft', label: 'Draft created', date: createdAt },
        { key: 'sent_to_tenant', label: 'Sent to tenant', date: sentAt },
        { key: 'tenant_signed', label: status === 'revision_requested' ? 'Returned by tenant' : 'Tenant signed', date: signedAt },
        { key: 'approved', label: 'Approved', date: approvedAt },
    ]

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
                <LeaseStatusBadge status={status} />
                <p className="text-sm text-neutral-500">
                    {currentStatus.label} is the current lease state.
                </p>
            </div>

            {status === 'revision_requested' && (
                <div className="rounded-[20px] border border-amber-200 bg-amber-50/80 px-4 py-4">
                    <p className="text-sm font-semibold text-amber-900">Returned for changes</p>
                    <p className="mt-1 text-sm leading-6 text-amber-800">
                        The lease was reviewed and sent back for updated documents or another signature pass.
                    </p>
                </div>
            )}

            <div className="divide-y divide-neutral-100 border-y border-neutral-200 bg-white">
                {steps.map((step, index) => {
                    const stepMeta = statusConfig[step.key] || statusConfig.draft
                    const isCompleted = index < currentStatusIndex
                    const isCurrent = index === currentStatusIndex

                    return (
                        <div
                            key={step.key}
                            className={cn(
                                'flex items-start gap-4 py-5',
                                isCurrent && 'bg-neutral-50/70'
                            )}
                        >
                            <div
                                className={cn(
                                    'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border',
                                    isCompleted
                                        ? 'border-neutral-900 bg-neutral-900 text-white'
                                        : isCurrent
                                            ? 'border-sky-200 bg-sky-50 text-sky-700'
                                            : 'border-neutral-200 bg-white text-neutral-300'
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="h-4 w-4" strokeWidth={2.5} />
                                ) : isCurrent ? (
                                    <stepMeta.icon className="h-4 w-4" strokeWidth={2} />
                                ) : (
                                    <div className="h-2.5 w-2.5 rounded-full bg-current" />
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-neutral-950">{step.label}</p>
                                        <p className="mt-1 text-sm text-neutral-500">
                                            {step.date ? format(new Date(step.date), 'MMM d, yyyy') : 'Not reached yet'}
                                        </p>
                                    </div>
                                    <span
                                        className={cn(
                                            'rounded-full px-2.5 py-1 text-xs font-semibold',
                                            isCompleted
                                                ? 'bg-neutral-100 text-neutral-700'
                                                : isCurrent
                                                    ? 'bg-sky-100 text-sky-700'
                                                    : 'bg-neutral-100 text-neutral-400'
                                        )}
                                    >
                                        {isCompleted ? 'Completed' : isCurrent ? 'Current' : 'Upcoming'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export function LeaseStatusBadge({ status }: { status: string }) {
    const config = statusConfig[status] || statusConfig.draft
    const Icon = config.icon

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                config.badgeClassName
            )}
        >
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            {config.label}
        </span>
    )
}
