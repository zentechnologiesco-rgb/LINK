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
    label: string
}> = {
    draft: { icon: FileText, label: 'Draft' },
    sent_to_tenant: { icon: Send, label: 'Sent to Tenant' },
    tenant_signed: { icon: PenTool, label: 'Tenant Signed' },
    approved: { icon: CheckCircle2, label: 'Approved' },
    rejected: { icon: XCircle, label: 'Rejected' },
    revision_requested: { icon: RefreshCcw, label: 'Revision Requested' },
    expired: { icon: Clock, label: 'Expired' },
    terminated: { icon: AlertTriangle, label: 'Terminated' },
}

const statusOrder = ['draft', 'sent_to_tenant', 'tenant_signed', 'approved']

export function LeaseStatusTimeline({
    status,
    createdAt,
    sentAt,
    signedAt,
    approvedAt
}: LeaseStatusTimelineProps) {
    const currentStatusIndex = Math.max(statusOrder.indexOf(status), 0)
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
                <Badge variant="secondary" className="text-muted-foreground">
                    <config.icon className="h-3 w-3 mr-1 text-muted-foreground" strokeWidth={1.5} />
                    {config.label}
                </Badge>
            </div>

            {/* Timeline */}
            <div className="relative">
                {steps.map((step, index) => {
                    const stepIndex = statusOrder.indexOf(step.key)
                    const isCompleted = stepIndex <= currentStatusIndex
                    const isCurrent = statusOrder.includes(status) && step.key === status
                    const stepConfig = statusConfig[step.key]

                    return (
                        <div key={step.key} className="relative flex items-start gap-3 pb-4 last:pb-0">
                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div
                                    className={`absolute left-4 top-8 h-[calc(100%-2rem)] w-px ${isCompleted ? 'bg-border' : 'bg-border/60'}`}
                                />
                            )}

                            {/* Step Icon */}
                            <div
                                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border ${isCompleted
                                    ? 'bg-muted/30'
                                    : 'bg-background'
                                    }`}
                            >
                                {isCompleted ? (
                                    isCurrent ? (
                                        <stepConfig.icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                                    ) : (
                                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                                    )
                                ) : (
                                    <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                                )}
                            </div>

                            {/* Step Content */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
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
        <Badge variant="secondary" className="text-muted-foreground">
            <config.icon className="h-3 w-3 mr-1 text-muted-foreground" strokeWidth={1.5} />
            {config.label}
        </Badge>
    )
}
