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
    AlertTriangle,
    Check
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

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
        <div className="space-y-6">
            {/* Current Status Badge */}
            <div className="flex items-center gap-2">
                <Badge className="bg-black text-white hover:bg-black/90 rounded-full px-3 py-1 font-medium uppercase tracking-wider text-[10px] border-0">
                    <config.icon className="h-3 w-3 mr-1.5" />
                    {config.label}
                </Badge>
            </div>

            {/* Timeline */}
            <div className="relative pl-1">
                {steps.map((step, index) => {
                    const stepIndex = statusOrder.indexOf(step.key)
                    const isCompleted = stepIndex < currentStatusIndex || (stepIndex === currentStatusIndex && statusOrder.includes(status))
                    const isCurrent = statusOrder.includes(status) && step.key === status
                    const isFuture = stepIndex > currentStatusIndex
                    const stepConfig = statusConfig[step.key]

                    // Determine circle state
                    // If current step, show icon.
                    // If completed step (past), show Check.
                    // If future, show dash or circle.

                    // Actually let's simplify logic:
                    // If index < currentStatusIndex: Completed (Check)
                    // If index == currentStatusIndex: Current (Icon)
                    // If index > currentStatusIndex: Future (Empty)

                    const isPast = index < currentStatusIndex
                    const isActive = index === currentStatusIndex

                    return (
                        <div key={step.key} className="relative flex items-start gap-4 pb-8 last:pb-0">
                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div
                                    className={cn(
                                        "absolute left-[15px] top-10 h-[calc(100%-10px)] w-px",
                                        isPast ? "bg-black" : "bg-black/10 dashed"
                                    )}
                                />
                            )}

                            {/* Step Icon */}
                            <div
                                className={cn(
                                    "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300",
                                    isPast ? "bg-black border-black text-white" :
                                        isActive ? "bg-white border-2 border-black text-black shadow-lg shadow-black/5" :
                                            "bg-white border-2 border-black/10 text-black/20"
                                )}
                            >
                                {isPast ? (
                                    <Check className="h-4 w-4" strokeWidth={3} />
                                ) : isActive ? (
                                    <stepConfig.icon className="h-4 w-4" strokeWidth={2.5} />
                                ) : (
                                    <div className="h-2 w-2 rounded-full bg-current" />
                                )}
                            </div>

                            {/* Step Content */}
                            <div className="flex-1 min-w-0 pt-1">
                                <p className={cn(
                                    "text-sm font-bold uppercase tracking-wide leading-none",
                                    isFuture ? "text-black/40" : "text-black"
                                )}>
                                    {step.label}
                                </p>
                                {step.date && (
                                    <p className="text-[10px] text-black/40 font-medium mt-1.5 uppercase tracking-wider">
                                        {format(new Date(step.date), 'MMM d, h:mm a')}
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
        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-white border-black/10 text-black px-2 py-0.5">
            <config.icon className="h-3 w-3 mr-1.5" strokeWidth={2} />
            {config.label}
        </Badge>
    )
}
