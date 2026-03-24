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
    ChevronRight,
    CircleParking,
    Cigarette,
    Clock3,
    Dog,
    Download,
    Eye,
    FileText,
    Home,
    Layers3,
    Loader2,
    MapPin,
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

/* ── Formats ── */
const currency = new Intl.NumberFormat('en-NA', {
    style: 'currency',
    currency: 'NAD',
    maximumFractionDigits: 0,
})

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

/* ── Types & Maps ── */
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

const utilityIconMap: Record<string, ElementType> = {
    Electricity: Zap,
    Water: Zap,
    Gas: Zap,
    Internet: Zap,
    Trash: Zap,
    Sewage: Zap,
}

/* ── Main Component ── */
export function LeaseDetailClient({ leaseId }: { leaseId: string }) {
    // ── Queries ──
    const lease = useQuery(api.leases.getById, { leaseId: leaseId as Id<'leases'> })
    const payments = useQuery(api.payments.getByLease, { leaseId: leaseId as Id<'leases'> })
    const documentUrls = useQuery(
        api.files.getUrls,
        lease?.tenantDocuments?.length
            ? { storageIds: lease.tenantDocuments.map((document: TenantDocumentUpload) => document.storageId) }
            : 'skip',
    )

    // ── Mutations ──
    const landlordDecision = useMutation(api.leases.landlordDecision)
    const requestRevision = useMutation(api.leases.requestRevision)
    const terminateLease = useMutation(api.leases.terminate)
    const sendToTenant = useMutation(api.leases.sendToTenant)

    // ── State ──
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

    // ── Render: Loading & Error ──
    if (lease === undefined || payments === undefined) {
        return <PageSkeleton />
    }

    if (!lease) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-white px-5 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                    <FileText className="h-7 w-7 text-neutral-400" strokeWidth={1.8} />
                </div>
                <h2 className="mt-5 text-lg font-semibold text-neutral-900">Lease not found</h2>
                <p className="mt-2 text-sm text-neutral-500">The lease you&rsquo;re looking for doesn&rsquo;t exist or was removed.</p>
                <Link href="/landlord/leases" className="mt-6 flex h-11 items-center rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white active:scale-95">
                    Back to leases
                </Link>
            </div>
        )
    }

    // ── Computations ──
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
        ...(lease.utilitiesIncluded?.map((utility: string) => ({ icon: utilityIconMap[utility] || Zap, label: utility })) ?? []),
    ]

    // ── Action Bar Configuration ──
    const actionBar = (() => {
        if (lease.status === 'draft') {
            return {
                primary: {
                    label: 'Send to tenant',
                    disabled: false,
                    icon: Send,
                    danger: false,
                    action: async () => {
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
                },
                secondary: [],
            }
        }
        if (lease.status === 'tenant_signed') {
            return {
                primary: {
                    label: 'Approve',
                    disabled: false,
                    icon: Check,
                    danger: false,
                    action: () => setShowApproveDialog(true),
                },
                secondary: [
                    { label: 'Revise', icon: RotateCcw, danger: false, action: () => setShowRevisionDialog(true) },
                    { label: 'Reject', icon: X, danger: true, action: () => setShowRejectDialog(true) },
                ],
            }
        }
        if (lease.status === 'approved') {
            return {
                primary: null,
                secondary: [
                    { label: 'Terminate lease', icon: Ban, danger: true, action: () => setShowTerminateDialog(true) },
                ],
            }
        }
        return null
    })()

    // ── Handlers ──
    const handleApprove = async () => {
        if (!signatureData) {
            toast.error('Please sign the lease first')
            return
        }
        setIsApproving(true)
        try {
            await landlordDecision({ leaseId: leaseId as Id<'leases'>, approved: true, signatureData })
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
            await landlordDecision({ leaseId: leaseId as Id<'leases'>, approved: false, notes: rejectReason })
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
            await requestRevision({ leaseId: leaseId as Id<'leases'>, notes: revisionNotes })
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
            await terminateLease({ leaseId: leaseId as Id<'leases'>, reason: terminateReason })
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
        <div className="mx-auto min-h-screen max-w-[820px] bg-white pb-32 font-sans">
            {/* ── Sticky Header ── */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl">
                <div className="flex h-14 items-center justify-between px-3 sm:px-4">
                    <Link
                        href="/landlord/leases"
                        className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 transition-colors active:scale-95 hover:bg-neutral-100"
                        aria-label="Back to leases"
                    >
                        <ChevronLeft className="h-6 w-6" strokeWidth={2} />
                    </Link>
                    <p className="text-[15px] font-semibold tracking-[-0.02em] text-neutral-950">
                        {lease.property?.title || 'Lease Detail'}
                    </p>
                    <div className="w-10" /> {/* Spacer for centering */}
                </div>
            </header>

            {/* ── Hero Section ── */}
            <div className="px-5 pt-2 sm:px-6">
                {/* Property thumbnail full width */}
                <div className="relative aspect-[21/9] w-full overflow-hidden rounded-[20px] bg-neutral-100 sm:aspect-[21/7]">
                    {lease.property?.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={lease.property.imageUrl}
                            alt={lease.property?.title || 'Property'}
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
                            <Building2 className="h-10 w-10" strokeWidth={1.5} />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/60" />
                    <div className="absolute bottom-4 left-4 right-4">
                        <LeaseStatusBadge status={lease.status} />
                    </div>
                </div>

                {/* Title & Tenant block */}
                <div className="mt-5">
                    <h1 className="text-[2rem] font-bold tracking-[-0.04em] text-neutral-950 sm:text-[2.25rem]">
                        {lease.property?.title || 'Property'}
                    </h1>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[15px] text-neutral-500">
                        <MapPin className="h-4 w-4 shrink-0" strokeWidth={2} />
                        <span className="truncate">{lease.property?.address || 'Address not available'}</span>
                    </div>

                    <div className="mt-6 flex items-center gap-3.5 rounded-[20px] border border-neutral-200/80 bg-neutral-50/50 p-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-white ring-1 ring-neutral-200/60 shadow-sm">
                            <User className="h-5 w-5 text-neutral-500" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-[15px] font-semibold text-neutral-950">
                                {lease.tenant?.fullName || 'Unassigned Tenant'}
                            </p>
                            <p className="truncate text-[13px] text-neutral-500">
                                {lease.tenant?.email || 'No email attached'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Banner: Revision ── */}
            {lease.status === 'revision_requested' && (
                <div className="px-5 pt-6 sm:px-6">
                    <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-5 py-4">
                        <p className="text-[14px] font-bold text-amber-900">Waiting for tenant updates</p>
                        <p className="mt-1 text-[13px] leading-6 text-amber-800">
                            {lease.landlordNotes || 'A revision request was sent and the tenant still needs to update the submission.'}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Main Content Grid ── */}
            <div className="mt-8 space-y-8">

                {/* Term Overview */}
                <GroupedSection title="Term overview">
                    <ListRow icon={Wallet2} label="Monthly rent" value={formatCurrency(lease.monthlyRent)} />
                    <ListRow icon={Wallet2} label="Deposit" value={formatCurrency(lease.deposit ?? 0)} />
                    <ListRow
                        icon={Clock3}
                        label={lease.status === 'approved' ? 'Days remaining' : 'Lease term'}
                        value={daysRemaining !== null
                            ? `${Math.max(daysRemaining, 0)} days`
                            : `${Math.ceil(Math.abs(new Date(lease.endDate).getTime() - new Date(lease.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} months`
                        }
                    />
                </GroupedSection>

                {/* Progress */}
                <SectionHeader title="Timeline" description="Track the current state of this lease." />
                <div className="px-5 sm:px-6">
                    <LeaseStatusTimeline
                        status={lease.status}
                        createdAt={lease._creationTime}
                        sentAt={lease.sentAt}
                        signedAt={lease.signedAt}
                        approvedAt={lease.approvedAt}
                    />
                </div>

                {/* Payments */}
                <SectionHeader title="Financials" description="Snapshot of payments related to this lease." />
                <div className="px-5 sm:px-6">
                    <div className="flex flex-wrap gap-2 pb-4">
                        <MiniStat label="Collected" value={formatCurrency(totalCollected)} tone="success" />
                        <MiniStat label="Pending" value={formatCurrency(totalPending)} tone="default" />
                        <MiniStat label="Overdue" value={formatCurrency(totalOverdue)} tone="danger" />
                    </div>
                    <div className="overflow-hidden rounded-[20px] border border-neutral-200/80 bg-neutral-50/50">
                        {payments.length > 0 ? (
                            <div className="divide-y divide-neutral-200/60">
                                {payments.slice(0, 5).map((payment) => (
                                    <div key={payment._id} className="flex items-center justify-between px-4 py-3 sm:px-5">
                                        <div>
                                            <p className="text-[14px] font-semibold capitalize text-neutral-950">
                                                {payment.type.replace('_', ' ')}
                                            </p>
                                            <p className="mt-0.5 text-[12px] text-neutral-500">
                                                Due {format(new Date(payment.dueDate), 'MMM d, yyyy')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[14px] font-semibold text-neutral-950">
                                                {formatCurrency(payment.amount)}
                                            </p>
                                            <p className={cn(
                                                'mt-0.5 text-[11px] font-bold uppercase tracking-wide',
                                                payment.status === 'paid' && 'text-emerald-600',
                                                payment.status === 'pending' && 'text-neutral-500',
                                                payment.status === 'overdue' && 'text-red-600'
                                            )}>
                                                {payment.status}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="px-5 py-6 text-center text-[13px] text-neutral-500">
                                No payment records generated yet.
                            </div>
                        )}
                        {payments.length > 5 && (
                            <Link href="/landlord/payments" className="block border-t border-neutral-200/60 bg-white py-3 text-center text-[13px] font-semibold text-neutral-600 hover:bg-neutral-50">
                                View all payments
                            </Link>
                        )}
                    </div>
                </div>

                {/* Policies */}
                <GroupedSection title="Rules & Policies">
                    <div className="p-4 sm:p-5">
                        <div className="flex flex-wrap gap-1.5">
                            {policyItems.map((item) => (
                                <MiniPill key={item.label} icon={item.icon} label={item.label} />
                            ))}
                        </div>
                    </div>
                </GroupedSection>

                {/* Dates */}
                <GroupedSection title="Lease Period">
                    <ListRow icon={CalendarRange} label="Start date" value={format(new Date(lease.startDate), 'MMM d, yyyy')} />
                    <ListRow icon={CalendarRange} label="End date" value={format(new Date(lease.endDate), 'MMM d, yyyy')} />
                    {daysRemaining !== null && (
                        <ListRow icon={Clock3} label="Time remaining" value={`${Math.max(daysRemaining, 0)} days`} />
                    )}
                </GroupedSection>

                {/* Clauses */}
                <GroupedSection title="Agreement Terms">
                    {leaseClauses.length > 0 ? (
                        leaseClauses.map((clause, index: number) => (
                            <ListStackItem key={clause.id?.trim() || `clause_${index}`}>
                                <p className="text-[14px] font-semibold text-neutral-950">
                                    {index + 1}. {clause.title}
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-[13px] leading-6 text-neutral-500">
                                    {clause.content}
                                </p>
                            </ListStackItem>
                        ))
                    ) : (
                        <div className="px-5 py-6 text-center text-[13px] text-neutral-500">
                            No clauses are available on this lease yet.
                        </div>
                    )}
                </GroupedSection>

                {/* Documents & Signatures */}
                {((lease.tenantDocuments && lease.tenantDocuments.length > 0) || lease.tenantSignatureData) && (
                    <GroupedSection title="Documents & Signatures">
                        {lease.tenantDocuments?.map((document, index) => {
                            const documentUrl = documentUrlMap[document.storageId] ?? null
                            const documentLabel = TENANT_DOCUMENT_LABELS[document.type as keyof typeof TENANT_DOCUMENT_LABELS] || document.type.replace(/_/g, ' ')

                            return (
                                <ListDocumentItem
                                    key={document.storageId}
                                    title={documentLabel}
                                    subtitle={`Uploaded ${format(new Date(document.uploadedAt), 'MMM d, yyyy')}`}
                                    url={documentUrl}
                                />
                            )
                        })}

                        {documentUrls === undefined && lease.tenantDocuments?.length && (
                            <div className="px-5 py-4 text-[12px] text-neutral-400">
                                Fetching secure document links...
                            </div>
                        )}

                        {lease.tenantSignatureData && lease.status !== 'revision_requested' && (
                            <div className="p-4 sm:p-5">
                                <p className="text-[13px] font-medium text-neutral-500">Tenant signature</p>
                                <div className="mt-2 flex h-20 items-center justify-center rounded-[16px] border border-neutral-200/80 bg-neutral-50">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={lease.tenantSignatureData} alt="Tenant signature" className="h-12" />
                                </div>
                            </div>
                        )}
                    </GroupedSection>
                )}

            </div>

            {/* ── Bottom Action Bar ── */}
            {actionBar && (
                <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-5">
                    <div className="mx-auto max-w-[820px]">
                        <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-[24px] border border-neutral-200/80 bg-white/90 p-3 shadow-xl shadow-neutral-950/5 backdrop-blur-xl">

                            <div className="hidden min-w-0 sm:block sm:px-2">
                                <p className="text-[14px] font-semibold text-neutral-950">Actions</p>
                                <p className="truncate text-[12px] text-neutral-500">
                                    {lease.status === 'draft' ? 'Send draft to the tenant for review.' : ''}
                                    {lease.status === 'tenant_signed' ? 'Review tenant docs and make a final decision.' : ''}
                                    {lease.status === 'approved' ? 'Terminate early if necessary.' : ''}
                                </p>
                            </div>

                            <div className="flex w-full items-center justify-end gap-2.5 sm:w-auto">
                                {actionBar.secondary.map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={action.action}
                                        className={cn(
                                            'flex h-[44px] flex-1 items-center justify-center gap-1.5 rounded-[16px] text-[14px] font-semibold transition-all active:scale-95 sm:flex-initial sm:px-5',
                                            action.danger
                                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80'
                                        )}
                                    >
                                        <action.icon className="h-4 w-4" strokeWidth={2.2} />
                                        {action.label}
                                    </button>
                                ))}

                                {actionBar.primary && (
                                    <button
                                        onClick={actionBar.primary.action}
                                        disabled={actionBar.primary.disabled || isSending}
                                        className={cn(
                                            'flex h-[44px] flex-1 items-center justify-center gap-1.5 rounded-[16px] px-5 text-[14px] font-semibold text-white transition-all active:scale-95 disabled:opacity-50 sm:flex-initial',
                                            actionBar.primary.danger ? 'bg-red-600' : 'bg-neutral-950'
                                        )}
                                    >
                                        {(actionBar.primary.disabled && lease.status === 'draft') || isSending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <actionBar.primary.icon className="h-4 w-4" strokeWidth={2.2} />
                                        )}
                                        {actionBar.primary.label}
                                    </button>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* ── Dialogs (iOS Modal Style) ── */}

            {/* Approve Dialog */}
            <IOSDialog open={showApproveDialog} onOpenChange={setShowApproveDialog} title="Approve Lease">
                <div className="space-y-5">
                    <div className="rounded-[20px] bg-neutral-50 p-4 ring-1 ring-inset ring-neutral-200/80">
                        <div className="flex justify-between border-b border-neutral-200/60 pb-2">
                            <span className="text-[13px] text-neutral-500">Rent</span>
                            <span className="text-[13px] font-bold text-neutral-900">{formatCurrency(lease.monthlyRent)}</span>
                        </div>
                        <div className="flex justify-between pt-2">
                            <span className="text-[13px] text-neutral-500">Tenant</span>
                            <span className="text-[13px] font-bold text-neutral-900">{lease.tenant?.fullName || 'Tenant'}</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[14px] font-semibold text-neutral-950">Landlord signature</p>
                        <p className="mt-0.5 text-[12px] text-neutral-500">Require signature to finalize the agreement.</p>
                        <div className="mt-3">
                            <SignatureCanvas onSignatureChange={(data) => setSignatureData(data || '')} disabled={isApproving} />
                        </div>
                    </div>
                    <button
                        onClick={handleApprove}
                        disabled={isApproving || !signatureData}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-[20px] bg-neutral-950 text-[15px] font-bold text-white transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isApproving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" strokeWidth={2.5} />}
                        Confirm Approval
                    </button>
                </div>
            </IOSDialog>

            {/* Revision Dialog */}
            <IOSDialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog} title="Request Revision">
                <div className="space-y-5">
                    <p className="text-[14px] leading-6 text-neutral-600">
                        Ask the tenant to fix or update something in their submission. They will get a notification to review these notes.
                    </p>
                    <Textarea
                        value={revisionNotes}
                        onChange={(e) => setRevisionNotes(e.target.value)}
                        placeholder="E.g., Please upload a clearer copy of your ID..."
                        rows={4}
                        className="rounded-[16px] border-neutral-200 bg-neutral-50 px-4 py-3 text-[14px] shadow-none focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-neutral-950"
                    />
                    <button
                        onClick={handleRequestRevision}
                        disabled={isRequestingRevision || !revisionNotes.trim()}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-[20px] bg-neutral-950 text-[15px] font-bold text-white transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isRequestingRevision ? <Loader2 className="h-5 w-5 animate-spin" /> : <RotateCcw className="h-5 w-5" strokeWidth={2.5} />}
                        Send Request
                    </button>
                </div>
            </IOSDialog>

            {/* Reject Dialog */}
            <IOSDialog open={showRejectDialog} onOpenChange={setShowRejectDialog} title="Reject Lease">
                <div className="space-y-5">
                    <div className="rounded-[20px] bg-red-50 p-4 ring-1 ring-inset ring-red-200">
                        <p className="text-[13px] font-bold text-red-900">This action is final.</p>
                        <p className="text-[12px] leading-5 text-red-800">The lease will be marked as rejected and closed. Add a reason for clarity.</p>
                    </div>
                    <Textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Why is this lease being rejected?"
                        rows={4}
                        className="rounded-[16px] border-red-200 bg-red-50/50 px-4 py-3 text-[14px] text-red-900 shadow-none focus-visible:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500"
                    />
                    <button
                        onClick={handleReject}
                        disabled={isRejecting}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-[20px] bg-red-600 text-[15px] font-bold text-white transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isRejecting ? <Loader2 className="h-5 w-5 animate-spin" /> : <X className="h-5 w-5" strokeWidth={2.5} />}
                        Confirm Rejection
                    </button>
                </div>
            </IOSDialog>

            {/* Terminate Dialog */}
            <IOSDialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog} title="Terminate Lease">
                <div className="space-y-5">
                    <div className="rounded-[20px] bg-red-50 p-4 ring-1 ring-inset ring-red-200">
                        <p className="text-[13px] font-bold text-red-900">End this active lease.</p>
                        <p className="text-[12px] leading-5 text-red-800">The lease will be closed and the property will become available again.</p>
                    </div>
                    <Textarea
                        value={terminateReason}
                        onChange={(e) => setTerminateReason(e.target.value)}
                        placeholder="Reason for early termination..."
                        rows={4}
                        className="rounded-[16px] border-red-200 bg-red-50/50 px-4 py-3 text-[14px] text-red-900 shadow-none focus-visible:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500"
                    />
                    <button
                        onClick={handleTerminate}
                        disabled={isTerminating}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-[20px] bg-red-600 text-[15px] font-bold text-white transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isTerminating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Ban className="h-5 w-5" strokeWidth={2.5} />}
                        Confirm Termination
                    </button>
                </div>
            </IOSDialog>

        </div>
    )
}

/* ── UI Helpers ── */

function SectionHeader({ title, description }: { title: string; description?: string }) {
    return (
        <div className="px-5 pb-3 pt-2 sm:px-6">
            <h2 className="text-[17px] font-bold tracking-[-0.03em] text-neutral-950">{title}</h2>
            {description && <p className="mt-0.5 text-[13px] text-neutral-500">{description}</p>}
        </div>
    )
}

function GroupedSection({ title, children }: { title: string; children: ReactNode }) {
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

function ListRow({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
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

function ListStackItem({ children }: { children: ReactNode }) {
    return (
        <div className="px-4 py-4 sm:px-5">
            {children}
        </div>
    )
}

function ListDocumentItem({ title, subtitle, url }: { title: string; subtitle: string; url: string | null }) {
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

function MiniPill({ icon: Icon, label }: { icon: ElementType; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-[10px] border border-neutral-100 bg-neutral-50 px-2.5 py-1.5 text-[12px] font-medium text-neutral-600">
            <Icon className="h-3.5 w-3.5 text-neutral-400" strokeWidth={2} />
            {label}
        </span>
    )
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: 'default' | 'success' | 'danger' }) {
    return (
        <div className={cn(
            'flex-1 rounded-[16px] border px-3 py-2.5',
            tone === 'default' && 'border-neutral-200/80 bg-neutral-50',
            tone === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-900',
            tone === 'danger' && 'border-red-200 bg-red-50 text-red-900'
        )}>
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] opacity-60">{label}</p>
            <p className="mt-0.5 text-[16px] font-bold tracking-tight">{value}</p>
        </div>
    )
}

function IOSDialog({ open, onOpenChange, title, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: ReactNode }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="fixed bottom-0 top-auto translate-y-0 rounded-t-[32px] sm:bottom-auto sm:top-[50%] sm:-translate-y-1/2 sm:rounded-[32px] max-h-[90vh] w-full max-w-md gap-0 border-0 p-6 shadow-2xl overflow-y-auto">
                <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-neutral-200 sm:hidden" />
                <DialogTitle className="mb-6 text-[22px] font-bold tracking-[-0.04em] text-neutral-950">{title}</DialogTitle>
                {children}
            </DialogContent>
        </Dialog>
    )
}

function PageSkeleton() {
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
