'use client'

import { Badge } from '@/components/ui/badge'
import {
    FileText,
    Send,
    PenTool,
    CheckCircle2,
    XCircle,
    RefreshCcw,
    Clock,
    AlertTriangle
} from 'lucide-react'
import { format } from 'date-fns'

interface LeaseStatusTimelineProps {
    status: string
    createdAt: string
    sentAt?: string | null
    signedAt?: string | null
    approvedAt?: string | null
}

const statusConfig: Record<string, {
    icon: React.ElementType
    color: string
    bgColor: string
    label: string
}> = {
    draft: {
        icon: FileText,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        label: 'Draft'
    },
    sent_to_tenant: {
        icon: Send,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        label: 'Sent to Tenant'
    },
    tenant_signed: {
        icon: PenTool,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        label: 'Tenant Signed'
    },
    approved: {
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        label: 'Approved'
    },
    rejected: {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        label: 'Rejected'
    },
    revision_requested: {
        icon: RefreshCcw,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        label: 'Revision Requested'
    },
    expired: {
        icon: Clock,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        label: 'Expired'
    },
    terminated: {
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        label: 'Terminated'
    },
}

const statusOrder = ['draft', 'sent_to_tenant', 'tenant_signed', 'approved']

export function LeaseStatusTimeline({
    status,
    createdAt,
    sentAt,
    signedAt,
    approvedAt
}: LeaseStatusTimelineProps) {
    const currentStatusIndex = statusOrder.indexOf(status)
    const config = statusConfig[status] || statusConfig.draft

    const steps = [
        { key: 'draft', label: 'Created', date: createdAt },
        { key: 'sent_to_tenant', label: 'Sent', date: sentAt },
        { key: 'tenant_signed', label: 'Signed', date: signedAt },
        { key: 'approved', label: 'Approved', date: approvedAt },
    ]

    return (
        <div className="space-y-4">
            {/* Current Status Badge */}
            <div className="flex items-center gap-2">
                <Badge className={`${config.bgColor} ${config.color} border-0`}>
                    <config.icon className="h-3 w-3 mr-1" />
                    {config.label}
                </Badge>
            </div>

            {/* Timeline */}
            <div className="relative">
                {steps.map((step, index) => {
                    const stepIndex = statusOrder.indexOf(step.key)
                    const isCompleted = stepIndex <= currentStatusIndex
                    const isCurrent = step.key === status
                    const stepConfig = statusConfig[step.key]

                    return (
                        <div key={step.key} className="flex items-start gap-3 pb-4 last:pb-0">
                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div
                                    className={`absolute left-[15px] top-8 w-0.5 h-[calc(100%-32px)] ${isCompleted ? 'bg-green-300' : 'bg-gray-200'
                                        }`}
                                    style={{
                                        top: `${32 + index * 56}px`,
                                        height: '40px'
                                    }}
                                />
                            )}

                            {/* Step Icon */}
                            <div className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center ${isCompleted
                                    ? isCurrent
                                        ? `${stepConfig.bgColor} ring-2 ring-offset-2 ring-${stepConfig.color.replace('text-', '')}`
                                        : 'bg-green-100'
                                    : 'bg-gray-100'
                                }`}>
                                {isCompleted ? (
                                    isCurrent ? (
                                        <stepConfig.icon className={`h-4 w-4 ${stepConfig.color}`} />
                                    ) : (
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    )
                                ) : (
                                    <div className="h-2 w-2 rounded-full bg-gray-300" />
                                )}
                            </div>

                            {/* Step Content */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'
                                    }`}>
                                    {step.label}
                                </p>
                                {step.date && (
                                    <p className="text-xs text-muted-foreground">
                                        {format(new Date(step.date), 'MMM d, yyyy h:mm a')}
                                    </p>
                                )}
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

    return (
        <Badge className={`${config.bgColor} ${config.color} border-0`}>
            <config.icon className="h-3 w-3 mr-1" />
            {config.label}
        </Badge>
    )
}
