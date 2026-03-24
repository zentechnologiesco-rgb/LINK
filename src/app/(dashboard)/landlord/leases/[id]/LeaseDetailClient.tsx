'use client'

import { useState, type ElementType, type ReactNode } from 'react'
import Link from 'next/link'
import { format, differenceInDays } from 'date-fns'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import {
    Ban,
    Building2,
    CalendarRange,
    Cat,
    Check,
    ChevronLeft,
    CircleParking,
    Cigarette,
    Clock3,
    Dog,
    Download,
    Eye,
    FileText,
    Home,
    Loader2,
    MessageSquareMore,
    PawPrint,
    Rabbit,
    RotateCcw,
    Send,
    User,
    Users,
    Wallet2,
    Wrench,
    X,
    Zap,
} from 'lucide-react'

import { api } from '../../../../../../convex/_generated/api'
import { Id } from '../../../../../../convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SignatureCanvas } from '@/components/leases/SignatureCanvas'
import { LeaseStatusBadge, LeaseStatusTimeline } from '@/components/leases/LeaseStatusTimeline'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
    MAINTENANCE_LABELS,
    PET_POLICY_LABELS,
    TENANT_DOCUMENT_LABELS,
    type MaintenanceOption,
    type PetPolicy,
} from '@/constants/lease'

const currency = new Intl.NumberFormat('en-NA', {
    style: 'currency',
    currency: 'NAD',
    maximumFractionDigits: 0,
})

type TenantDocumentUpload = {
    type: string
    storageId: Id<'_storage'>
    uploadedAt: string
}

const petPolicyIconMap: Record<PetPolicy, ElementType> = {
    no_pets: Ban,
    cats_only: Cat,
    dogs_only: Dog,
    small_pets: Rabbit,
    all_pets: PawPrint,
    negotiable: MessageSquareMore,
}

export function LeaseDetailClient({ leaseId }: { leaseId: string }) {
    const lease = useQuery(api.leases.getById, { leaseId: leaseId as Id<'leases'> })
    const payments = useQuery(api.payments.getByLease, { leaseId: leaseId as Id<'leases'> })
    const documentUrls = useQuery(
        api.files.getUrls,
        lease?.tenantDocuments?.length
            ? { storageIds: lease.tenantDocuments.map((document: TenantDocumentUpload) => document.storageId) }
            : 'skip',
    )

    const landlordDecision = useMutation(api.leases.landlordDecision)
    const requestRevision = useMutation(api.leases.requestRevision)
    const terminateLease = useMutation(api.leases.terminate)
    const sendToTenant = useMutation(api.leases.sendToTenant)

    const [signatureData, setSignatureData] = useState('')
    const [revisionNotes, setRevisionNotes] = useState('')
    const [rejectReason, setRejectReason] = useState('')
    const [terminateReason, setTerminateReason] = useState('')
    const [isApproving, setIsApproving] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [isRequestingRevision, setIsRequestingRevision] = useState(false)
    const [isRejecting, setIsRejecting] = useState(false)
    const [isTerminating, setIsTerminating] = useState(false)
    const [showApproveDialog, setShowApproveDialog] = useState(false)
    const [showRevisionDialog, setShowRevisionDialog] = useState(false)
    const [showRejectDialog, setShowRejectDialog] = useState(false)
    const [showTerminateDialog, setShowTerminateDialog] = useState(false)

    if (lease === undefined || payments === undefined) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
                    <p className="text-sm font-medium text-neutral-400">Loading lease...</p>
                </div>
            </div>
        )
    }

    if (!lease) {
        return (
            <div className="py-20 text-center">
                <h2 className="text-lg font-semibold text-neutral-900">Lease not found</h2>
                <Link href="/landlord/leases" className="mt-2 inline-flex text-sm text-neutral-500 underline">
                    Back to leases
                </Link>
            </div>
        )
    }

    const daysRemaining = lease.status === 'approved' && lease.endDate
        ? differenceInDays(new Date(lease.endDate), new Date())
        : null

    const paidPayments = payments.filter((payment) => payment.status === 'paid')
    const pendingPayments = payments.filter((payment) => payment.status === 'pending')
    const overduePayments = payments.filter((payment) => payment.status === 'overdue')

    const totalCollected = paidPayments.reduce((sum, payment) => sum + payment.amount, 0)
    const totalPending = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0)
    const totalOverdue = overduePayments.reduce((sum, payment) => sum + payment.amount, 0)
    const documentUrlMap = Object.fromEntries((documentUrls ?? []).map(({ id, url }) => [id, url]))

    const petPolicy = ((lease.petPolicy as PetPolicy) || 'no_pets')
    const maintenanceResponsibility = ((lease.maintenanceResponsibility as MaintenanceOption) || 'shared')
    const PetPolicyIcon = petPolicyIconMap[petPolicy]
    const leaseClauses = Array.from(
        new Map(
            (lease.leaseDocument?.clauses ?? []).map((clause, index: number) => [
                clause.id?.trim() || `clause_${index}`,
                clause,
            ])
        ).values()
    )

    const policyItems = [
        { icon: CalendarRange, label: `Due on the ${lease.rentDueDay || 1}${getOrdinal(lease.rentDueDay || 1)}` },
        { icon: Clock3, label: `${lease.gracePeriodDays || 5} day grace period` },
        { icon: Wallet2, label: `${lease.lateFeeAmount || 5}${lease.lateFeeType === 'percentage' ? '%' : ' N$'} late fee` },
        { icon: PetPolicyIcon, label: PET_POLICY_LABELS[petPolicy] },
        { icon: Wrench, label: `${MAINTENANCE_LABELS[maintenanceResponsibility]} maintenance` },
        { icon: Users, label: `Max ${lease.maxOccupants || 2} occupants` },
        { icon: FileText, label: `${lease.noticePeriodDays || 30} day notice` },
        { icon: CircleParking, label: lease.parkingIncluded ? 'Parking included' : 'No parking' },
        { icon: Cigarette, label: lease.smokingAllowed ? 'Smoking allowed' : 'No smoking' },
        { icon: Home, label: lease.sublettingAllowed ? 'Subletting allowed' : 'No subletting' },
        ...(lease.utilitiesIncluded?.map((utility: string) => ({ icon: Zap, label: utility })) ?? []),
    ]

    const headerPills = [
        { icon: Wallet2, label: 'Rent', value: formatCurrency(lease.monthlyRent) },
        { icon: Wallet2, label: 'Deposit', value: formatCurrency(lease.deposit ?? 0) },
        {
            icon: Clock3,
            label: lease.status === 'approved' ? 'Days left' : 'Term',
            value: daysRemaining !== null
                ? `${Math.max(daysRemaining, 0)} days`
                : `${Math.ceil(Math.abs(new Date(lease.endDate).getTime() - new Date(lease.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} months`,
        },
        { icon: User, label: 'Tenant', value: lease.tenant?.fullName || 'Tenant' },
    ]

    const actionBar = (() => {
        if (lease.status === 'draft') {
            return {
                primaryLabel: 'Send to tenant',
                primaryAction: async () => {
                    setIsSending(true)
                    try {
                        await sendToTenant({ leaseId: leaseId as Id<'leases'> })
                        toast.success('Lease sent to tenant!')
                    } catch (error: unknown) {
                        toast.error(error instanceof Error ? error.message : 'Failed to send')
                    } finally {
                        setIsSending(false)
                    }
                },
                primaryDisabled: isSending,
                primaryIcon: isSending ? Loader2 : Send,
                primaryDanger: false,
                secondary: null,
            }
        }

        if (lease.status === 'tenant_signed') {
            return {
                primaryLabel: 'Approve lease',
                primaryAction: () => setShowApproveDialog(true),
                primaryDisabled: false,
                primaryIcon: Check,
                primaryDanger: false,
                secondary: {
                    first: {
                        label: 'Request revision',
                        action: () => setShowRevisionDialog(true),
                        icon: RotateCcw,
                    },
                    second: {
                        label: 'Reject',
                        action: () => setShowRejectDialog(true),
                        icon: X,
                        danger: true,
                    },
                },
            }
        }

        if (lease.status === 'approved') {
            return {
                primaryLabel: 'Terminate lease',
                primaryAction: () => setShowTerminateDialog(true),
                primaryDisabled: false,
                primaryIcon: Ban,
                primaryDanger: true,
                secondary: null,
            }
        }

        return null
    })()

    const handleApprove = async () => {
        if (!signatureData) {
            toast.error('Please sign the lease first')
            return
        }

        setIsApproving(true)
        try {
            await landlordDecision({
                leaseId: leaseId as Id<'leases'>,
                approved: true,
                signatureData,
            })
            toast.success('Lease approved. Property marked as leased.')
            setShowApproveDialog(false)
            setSignatureData('')
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Failed to approve')
        } finally {
            setIsApproving(false)
        }
    }

    const handleReject = async () => {
        setIsRejecting(true)
        try {
            await landlordDecision({
                leaseId: leaseId as Id<'leases'>,
                approved: false,
                notes: rejectReason,
            })
            toast.success('Lease rejected.')
            setShowRejectDialog(false)
            setRejectReason('')
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Failed to reject')
        } finally {
            setIsRejecting(false)
        }
    }

    const handleRequestRevision = async () => {
        if (!revisionNotes.trim()) {
            toast.error('Please provide revision notes')
            return
        }

        setIsRequestingRevision(true)
        try {
            await requestRevision({
                leaseId: leaseId as Id<'leases'>,
                notes: revisionNotes,
            })
            toast.success('Revision request sent to tenant.')
            setShowRevisionDialog(false)
            setRevisionNotes('')
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Failed to request revision')
        } finally {
            setIsRequestingRevision(false)
        }
    }

    const handleTerminate = async () => {
        setIsTerminating(true)
        try {
            await terminateLease({
                leaseId: leaseId as Id<'leases'>,
                reason: terminateReason,
            })
            toast.success('Lease terminated. Property is now available.')
            setShowTerminateDialog(false)
            setTerminateReason('')
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Failed to terminate')
        } finally {
            setIsTerminating(false)
        }
    }

    return (
        <>
            <div className="mx-auto max-w-[820px] font-sans pb-28">
                <section className="border-b border-neutral-100 pb-6">
                    <Link
                        href="/landlord/leases"
                        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
                    >
                        <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
                        Leases
                    </Link>

                    <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
                        <div className="h-28 w-full shrink-0 overflow-hidden rounded-[24px] bg-neutral-100 sm:h-28 sm:w-32">
                            {lease.property?.imageUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={lease.property.imageUrl}
                                    alt={lease.property?.title || 'Property'}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-neutral-400">
                                    <Building2 className="h-8 w-8" strokeWidth={1.8} />
                                </div>
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                                <p className="text-sm font-medium text-neutral-500">Lease detail</p>
                                <LeaseStatusBadge status={lease.status} />
                            </div>
                            <h1 className="mt-2 text-[2rem] font-semibold tracking-[-0.04em] text-neutral-950">
                                {lease.property?.title || 'Property'}
                            </h1>
                            <p className="mt-2 text-[15px] leading-7 text-neutral-600">
                                {lease.property?.address || 'Address not available'}
                            </p>
                            <p className="mt-2 text-sm text-neutral-500">
                                Tenant: {lease.tenant?.fullName || 'Tenant'}{lease.tenant?.email ? ` • ${lease.tenant.email}` : ''}
                            </p>
                        </div>
                    </div>

                    {lease.status === 'revision_requested' && (
                        <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50/80 px-5 py-4">
                            <p className="text-sm font-semibold text-amber-900">Waiting for tenant updates</p>
                            <p className="mt-1 text-sm leading-6 text-amber-800">
                                {lease.landlordNotes || 'A revision request was sent and the tenant still needs to update the submission.'}
                            </p>
                        </div>
                    )}

                    <div className="mt-5 flex flex-wrap gap-2">
                        {headerPills.map((pill) => (
                            <HeaderPill key={pill.label} icon={pill.icon} label={pill.label} value={pill.value} />
                        ))}
                    </div>
                </section>

                <div className="space-y-8 pt-6">
                    <DetailSection
                        title="Progress"
                        description="Track the current lease state and the steps already completed."
                    >
                        <LeaseStatusTimeline
                            status={lease.status}
                            createdAt={lease._creationTime}
                            sentAt={lease.sentAt}
                            signedAt={lease.signedAt}
                            approvedAt={lease.approvedAt}
                        />
                    </DetailSection>

                    <DetailSection
                        title="Payment summary"
                        description="Snapshot of collected, pending, and overdue amounts for this agreement."
                    >
                        <div className="flex flex-wrap gap-2">
                            <InlineMetric label="Collected" value={formatCurrency(totalCollected)} tone="success" />
                            <InlineMetric label="Pending" value={formatCurrency(totalPending)} tone="default" />
                            <InlineMetric label="Overdue" value={formatCurrency(totalOverdue)} tone="danger" />
                        </div>

                        <div className="mt-5 divide-y divide-neutral-100 border-y border-neutral-200 bg-white">
                            {payments.length > 0 ? (
                                payments.slice(0, 6).map((payment) => (
                                    <div key={payment._id} className="flex items-center justify-between gap-3 py-4">
                                        <div>
                                            <p className="text-sm font-semibold capitalize text-neutral-950">
                                                {payment.type.replace('_', ' ')}
                                            </p>
                                            <p className="mt-1 text-sm text-neutral-500">
                                                Due {format(new Date(payment.dueDate), 'MMM d, yyyy')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-neutral-950">
                                                {formatCurrency(payment.amount)}
                                            </p>
                                            <p
                                                className={cn(
                                                    'mt-1 text-xs font-medium capitalize',
                                                    payment.status === 'paid' && 'text-emerald-700',
                                                    payment.status === 'pending' && 'text-neutral-500',
                                                    payment.status === 'overdue' && 'text-red-600'
                                                )}
                                            >
                                                {payment.status}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-5 text-sm text-neutral-500">
                                    Payment items will appear here once this lease starts generating payment records.
                                </div>
                            )}
                        </div>
                    </DetailSection>

                    <DetailSection
                        title="Rules and policies"
                        description="The rent terms, operational rules, and property policies attached to this lease."
                    >
                        <div className="flex flex-wrap gap-2">
                            {policyItems.map((item) => (
                                <PolicyPill key={item.label} icon={item.icon} label={item.label} />
                            ))}
                        </div>
                    </DetailSection>

                    <DetailSection
                        title="Lease period"
                        description="Start and end dates for this agreement."
                    >
                        <div className="space-y-3">
                            <ValueRow label="Start date" value={format(new Date(lease.startDate), 'MMM d, yyyy')} />
                            <ValueRow label="End date" value={format(new Date(lease.endDate), 'MMM d, yyyy')} />
                            {daysRemaining !== null && (
                                <ValueRow label="Time remaining" value={`${Math.max(daysRemaining, 0)} days`} />
                            )}
                        </div>
                    </DetailSection>

                    <DetailSection
                        title="Agreement terms"
                        description="The clauses currently included in the lease document."
                    >
                        <div className="divide-y divide-neutral-100 border-y border-neutral-200 bg-white">
                            {leaseClauses.length > 0 ? (
                                leaseClauses.map((clause, index: number) => (
                                    <div key={clause.id?.trim() || `clause_${index}`} className="py-5">
                                        <p className="text-sm font-semibold text-neutral-950">
                                            {index + 1}. {clause.title}
                                        </p>
                                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-600">
                                            {clause.content}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="py-5 text-sm text-neutral-500">
                                    No clauses are available on this lease yet.
                                </div>
                            )}
                        </div>
                    </DetailSection>

                    {lease.tenantDocuments && lease.tenantDocuments.length > 0 && (
                        <DetailSection
                            title="Tenant documents"
                            description="Files submitted by the tenant for review."
                        >
                            <div className="divide-y divide-neutral-100 border-y border-neutral-200 bg-white">
                                {lease.tenantDocuments.map((document, index: number) => {
                                    const documentUrl = documentUrlMap[document.storageId] ?? null
                                    const documentLabel = TENANT_DOCUMENT_LABELS[document.type as keyof typeof TENANT_DOCUMENT_LABELS] || document.type.replace(/_/g, ' ')

                                    return (
                                        <div key={`${document.storageId}-${index}`} className="flex items-center justify-between gap-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-neutral-200 bg-neutral-50 text-neutral-500">
                                                    <FileText className="h-4 w-4" strokeWidth={2} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-neutral-950">
                                                        {documentLabel}
                                                    </p>
                                                    <p className="mt-1 text-sm text-neutral-500">
                                                        Uploaded {format(new Date(document.uploadedAt), 'MMM d, yyyy')}
                                                    </p>
                                                </div>
                                            </div>

                                            {documentUrl ? (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-10 rounded-full border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700"
                                                        onClick={() => window.open(documentUrl, '_blank', 'noopener,noreferrer')}
                                                    >
                                                        <Eye className="mr-1.5 h-4 w-4" strokeWidth={2} />
                                                        View
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 rounded-full border border-neutral-200 text-neutral-500 shadow-none hover:bg-neutral-50 hover:text-neutral-900"
                                                        onClick={() => window.open(documentUrl, '_blank', 'noopener,noreferrer')}
                                                    >
                                                        <Download className="h-4 w-4" strokeWidth={2} />
                                                        <span className="sr-only">Open document</span>
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-medium text-amber-700">
                                                    File unavailable
                                                </span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {documentUrls === undefined && (
                                <p className="mt-3 text-xs text-neutral-400">
                                    Fetching secure document links...
                                </p>
                            )}

                            {lease.tenantSignatureData && lease.status !== 'revision_requested' && (
                                <div className="mt-5 rounded-[24px] border border-neutral-200 bg-neutral-50/70 px-5 py-4">
                                    <p className="text-sm font-semibold text-neutral-950">Tenant signature</p>
                                    <div className="mt-3 rounded-[18px] border border-neutral-200 bg-white p-3">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={lease.tenantSignatureData}
                                            alt="Tenant signature"
                                            className="h-16"
                                        />
                                    </div>
                                </div>
                            )}
                        </DetailSection>
                    )}

                    <DetailSection
                        title="Decision guide"
                        description="The likely next move for this lease based on its current state."
                    >
                        <div className="text-sm leading-7 text-neutral-600">
                            {lease.status === 'draft' && (
                                <p>Review the terms one more time, then send the lease to the tenant for signature.</p>
                            )}
                            {lease.status === 'sent_to_tenant' && (
                                <p>The lease is waiting for the tenant to review the terms, upload documents, and sign.</p>
                            )}
                            {lease.status === 'tenant_signed' && (
                                <p>Everything is back from the tenant. Approve to activate the lease, request changes, or reject the agreement.</p>
                            )}
                            {lease.status === 'revision_requested' && (
                                <p>The lease has been returned for updates. Wait for the tenant to resend the revised submission.</p>
                            )}
                            {lease.status === 'approved' && (
                                <p>The lease is active. Continue monitoring term progress and payment performance, or terminate if needed.</p>
                            )}
                            {['rejected', 'terminated', 'expired'].includes(lease.status) && (
                                <p>This lease is closed. You can still review the full record, terms, and submission history here.</p>
                            )}
                        </div>
                    </DetailSection>
                </div>

                {actionBar && (
                    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 px-4">
                        <div className="mx-auto max-w-[820px]">
                            <div className="pointer-events-auto flex flex-col gap-3 rounded-[28px] border border-neutral-200 bg-white/92 p-3 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-4">
                                <div className="hidden sm:block">
                                    <p className="text-sm font-semibold text-neutral-950">
                                        {lease.property?.title || 'Lease action'}
                                    </p>
                                    <p className="mt-1 text-sm text-neutral-500">
                                        {lease.status === 'draft' && 'Send the agreement when the draft is ready.'}
                                        {lease.status === 'tenant_signed' && 'A decision is needed from you to move this lease forward.'}
                                        {lease.status === 'approved' && 'End the active lease if the tenancy should close.'}
                                    </p>
                                </div>

                                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                                    {actionBar.secondary && (
                                        <>
                                            <Button
                                                variant="outline"
                                                onClick={actionBar.secondary.first.action}
                                                className="h-11 rounded-full border-neutral-200 bg-white px-5 text-sm font-medium text-neutral-700"
                                            >
                                                <actionBar.secondary.first.icon className="mr-2 h-4 w-4" strokeWidth={2} />
                                                {actionBar.secondary.first.label}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={actionBar.secondary.second.action}
                                                className={cn(
                                                    'h-11 rounded-full px-5 text-sm font-medium',
                                                    actionBar.secondary.second.danger
                                                        ? 'border-red-200 bg-white text-red-600 hover:bg-red-50'
                                                        : 'border-neutral-200 bg-white text-neutral-700'
                                                )}
                                            >
                                                <actionBar.secondary.second.icon className="mr-2 h-4 w-4" strokeWidth={2} />
                                                {actionBar.secondary.second.label}
                                            </Button>
                                        </>
                                    )}

                                    <Button
                                        onClick={actionBar.primaryAction}
                                        disabled={actionBar.primaryDisabled}
                                        className={cn(
                                            'h-11 rounded-full px-5 text-sm font-medium text-white',
                                            actionBar.primaryDanger
                                                ? 'bg-red-600 hover:bg-red-700'
                                                : 'bg-neutral-950 hover:bg-neutral-800'
                                        )}
                                    >
                                        <actionBar.primaryIcon className={cn('mr-2 h-4 w-4', actionBar.primaryDisabled && 'animate-spin')} strokeWidth={2} />
                                        {actionBar.primaryLabel}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto rounded-[30px] sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold tracking-[-0.03em]">
                            Approve lease
                        </DialogTitle>
                    </DialogHeader>

                    <div className="mt-4 space-y-6">
                        <div className="rounded-[24px] border border-neutral-200 bg-neutral-50/70 px-5 py-4">
                            <p className="text-sm font-semibold text-neutral-950">Approval summary</p>
                            <div className="mt-3 space-y-3">
                                <ValueRow label="Property" value={lease.property?.title || 'Property'} />
                                <ValueRow label="Tenant" value={lease.tenant?.fullName || 'Tenant'} />
                                <ValueRow label="Monthly rent" value={formatCurrency(lease.monthlyRent)} />
                                <ValueRow label="Deposit" value={formatCurrency(lease.deposit ?? 0)} />
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-neutral-950">Landlord signature</p>
                            <p className="mt-1 text-xs text-neutral-500">
                                Add your signature to activate this lease and generate payment records.
                            </p>
                            <div className="mt-3">
                                <SignatureCanvas
                                    onSignatureChange={(data) => setSignatureData(data || '')}
                                    disabled={isApproving}
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleApprove}
                            disabled={isApproving || !signatureData}
                            className="h-12 w-full rounded-[22px] bg-neutral-950 text-white hover:bg-neutral-800"
                        >
                            {isApproving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Check className="mr-2 h-4 w-4" strokeWidth={2} />
                            )}
                            Confirm approval
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
                <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto rounded-[30px] sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold tracking-[-0.03em]">
                            Request revision
                        </DialogTitle>
                    </DialogHeader>

                    <div className="mt-4 space-y-4">
                        <p className="text-sm leading-6 text-neutral-500">
                            Tell the tenant what needs to be updated before this lease can move forward.
                        </p>
                        <Textarea
                            value={revisionNotes}
                            onChange={(e) => setRevisionNotes(e.target.value)}
                            placeholder="Explain what the tenant should update before resubmitting."
                            rows={5}
                            className="rounded-[18px] border-neutral-200 bg-neutral-50 shadow-none focus-visible:border-[#1d9bf0] focus-visible:ring-4 focus-visible:ring-[#1d9bf0]/10"
                        />
                        <Button
                            onClick={handleRequestRevision}
                            disabled={isRequestingRevision}
                            className="h-12 w-full rounded-[22px] bg-neutral-950 text-white hover:bg-neutral-800"
                        >
                            {isRequestingRevision ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RotateCcw className="mr-2 h-4 w-4" strokeWidth={2} />
                            )}
                            Send revision request
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto rounded-[30px] sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold tracking-[-0.03em]">
                            Reject lease
                        </DialogTitle>
                    </DialogHeader>

                    <div className="mt-4 space-y-4">
                        <div className="rounded-[24px] border border-red-200 bg-red-50/80 px-5 py-4">
                            <p className="text-sm font-semibold text-red-900">This decision closes the current approval flow.</p>
                            <p className="mt-1 text-sm leading-6 text-red-800">
                                Add a reason so the tenant has a clear record of why the lease was rejected.
                            </p>
                        </div>
                        <Textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection..."
                            rows={5}
                            className="rounded-[18px] border-neutral-200 bg-neutral-50 shadow-none focus-visible:border-red-300 focus-visible:ring-4 focus-visible:ring-red-100"
                        />
                        <Button
                            onClick={handleReject}
                            disabled={isRejecting}
                            className="h-12 w-full rounded-[22px] bg-red-600 text-white hover:bg-red-700"
                        >
                            {isRejecting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <X className="mr-2 h-4 w-4" strokeWidth={2} />
                            )}
                            Confirm rejection
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
                <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto rounded-[30px] sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold tracking-[-0.03em]">
                            Terminate lease
                        </DialogTitle>
                    </DialogHeader>

                    <div className="mt-4 space-y-4">
                        <div className="rounded-[24px] border border-red-200 bg-red-50/80 px-5 py-4">
                            <p className="text-sm font-semibold text-red-900">Terminating will end the lease and reopen the property.</p>
                            <p className="mt-1 text-sm leading-6 text-red-800">
                                Add a reason so the termination is recorded clearly in the lease history.
                            </p>
                        </div>
                        <Textarea
                            value={terminateReason}
                            onChange={(e) => setTerminateReason(e.target.value)}
                            placeholder="Reason for termination..."
                            rows={5}
                            className="rounded-[18px] border-neutral-200 bg-neutral-50 shadow-none focus-visible:border-red-300 focus-visible:ring-4 focus-visible:ring-red-100"
                        />
                        <Button
                            onClick={handleTerminate}
                            disabled={isTerminating}
                            className="h-12 w-full rounded-[22px] bg-red-600 text-white hover:bg-red-700"
                        >
                            {isTerminating ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Ban className="mr-2 h-4 w-4" strokeWidth={2} />
                            )}
                            Confirm termination
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

function DetailSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
    return (
        <section>
            <div>
                <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-neutral-950">{title}</h2>
                <p className="mt-1 text-sm text-neutral-500">{description}</p>
            </div>
            <div className="mt-5">{children}</div>
        </section>
    )
}

function HeaderPill({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
    return (
        <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-700">
            <Icon className="h-4 w-4 text-neutral-500" strokeWidth={2} />
            <span className="font-medium text-neutral-500">{label}</span>
            <span className="font-semibold text-neutral-950">{value}</span>
        </span>
    )
}

function InlineMetric({ label, value, tone }: { label: string; value: string; tone: 'default' | 'success' | 'danger' }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm',
                tone === 'default' && 'border-neutral-200 bg-neutral-50 text-neutral-700',
                tone === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
                tone === 'danger' && 'border-red-200 bg-red-50 text-red-700'
            )}
        >
            <span className="font-medium">{label}</span>
            <span className="font-semibold">{value}</span>
        </span>
    )
}

function PolicyPill({ icon: Icon, label }: { icon: ElementType; label: string }) {
    return (
        <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-700">
            <Icon className="h-4 w-4 text-neutral-500" strokeWidth={2} />
            {label}
        </span>
    )
}

function ValueRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <p className="text-sm text-neutral-500">{label}</p>
            <p className="text-right text-sm font-semibold text-neutral-950">{value}</p>
        </div>
    )
}

function formatCurrency(value: number | null | undefined) {
    return currency.format(value || 0)
}

function getOrdinal(n: number) {
    if (n > 3 && n < 21) return 'th'
    switch (n % 10) {
        case 1: return 'st'
        case 2: return 'nd'
        case 3: return 'rd'
        default: return 'th'
    }
}
