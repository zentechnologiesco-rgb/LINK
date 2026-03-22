'use client'

import { useState } from 'react'
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../../convex/_generated/api"
import { Id } from "../../../../../../convex/_generated/dataModel"
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { LeaseStatusTimeline, LeaseStatusBadge } from '@/components/leases/LeaseStatusTimeline'
import { SignatureCanvas } from '@/components/leases/SignatureCanvas'
import {
    ChevronLeft,
    Building2,
    User,
    Calendar,
    DollarSign,
    Check,
    X,
    RotateCcw,
    Clock,
    AlertTriangle,
    Loader2,
    FileText,
    Eye,
    Download,
    Ban,
    Send,
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    PET_POLICY_LABELS,
    PET_POLICY_ICONS,
    MAINTENANCE_LABELS,
    TENANT_DOCUMENT_LABELS,
    type PetPolicy,
    type MaintenanceOption,
} from '@/constants/lease'

export function LeaseDetailClient({ leaseId }: { leaseId: string }) {
    const lease = useQuery(api.leases.getById, { leaseId: leaseId as Id<"leases"> })
    const payments = useQuery(api.payments.getByLease, { leaseId: leaseId as Id<"leases"> })
    const documentUrls = useQuery(
        api.files.getUrls,
        lease?.tenantDocuments?.length
            ? { storageIds: lease.tenantDocuments.map((document: { storageId: Id<"_storage"> }) => document.storageId) }
            : "skip",
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
    const [showApproveDialog, setShowApproveDialog] = useState(false)
    const [showRevisionDialog, setShowRevisionDialog] = useState(false)
    const [showRejectDialog, setShowRejectDialog] = useState(false)
    const [showTerminateDialog, setShowTerminateDialog] = useState(false)

    if (lease === undefined) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
                    <p className="text-sm text-neutral-400 font-medium">Loading lease...</p>
                </div>
            </div>
        )
    }

    if (!lease) {
        return (
            <div className="py-16 text-center">
                <h2 className="text-lg font-semibold text-neutral-900 mb-2">Lease not found</h2>
                <Link href="/landlord/leases" className="text-sm text-neutral-500 underline">
                    Back to leases
                </Link>
            </div>
        )
    }

    const daysRemaining = lease.status === 'approved' && lease.endDate
        ? differenceInDays(new Date(lease.endDate), new Date())
        : null

    const paidPayments = payments?.filter((payment) => payment.status === 'paid') || []
    const pendingPayments = payments?.filter((payment) => payment.status === 'pending') || []
    const overduePayments = payments?.filter((payment) => payment.status === 'overdue') || []

    const totalCollected = paidPayments.reduce((sum, payment) => sum + payment.amount, 0)
    const totalPending = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0)
    const totalOverdue = overduePayments.reduce((sum, payment) => sum + payment.amount, 0)
    const documentUrlMap = Object.fromEntries((documentUrls ?? []).map(({ id, url }) => [id, url]))

    // Handlers
    const handleApprove = async () => {
        if (!signatureData) {
            toast.error('Please sign the lease first')
            return
        }
        setIsApproving(true)
        try {
            await landlordDecision({
                leaseId: leaseId as Id<"leases">,
                approved: true,
                signatureData,
            })
            toast.success('Lease approved! Property marked as leased.')
            setShowApproveDialog(false)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Failed to approve')
        } finally {
            setIsApproving(false)
        }
    }

    const handleReject = async () => {
        try {
            await landlordDecision({
                leaseId: leaseId as Id<"leases">,
                approved: false,
                notes: rejectReason,
            })
            toast.success('Lease rejected.')
            setShowRejectDialog(false)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Failed to reject')
        }
    }

    const handleRequestRevision = async () => {
        if (!revisionNotes.trim()) {
            toast.error('Please provide revision notes')
            return
        }
        try {
            await requestRevision({
                leaseId: leaseId as Id<"leases">,
                notes: revisionNotes,
            })
            toast.success('Revision request sent to tenant.')
            setShowRevisionDialog(false)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Failed to request revision')
        }
    }

    const handleTerminate = async () => {
        try {
            await terminateLease({
                leaseId: leaseId as Id<"leases">,
                reason: terminateReason,
            })
            toast.success('Lease terminated. Property is now available.')
            setShowTerminateDialog(false)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Failed to terminate')
        }
    }

    return (
        <div className="font-sans pb-6">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/landlord/leases"
                    className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-4"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Leases
                </Link>
            </div>

            {/* Property Hero */}
            <div className="relative rounded-2xl overflow-hidden bg-neutral-100 mb-6">
                {lease.property?.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={lease.property.imageUrl}
                        alt={lease.property?.title || ''}
                        className="w-full h-48 object-cover"
                    />
                ) : (
                    <div className="h-48 flex items-center justify-center">
                        <Building2 className="h-12 w-12 text-neutral-300" />
                    </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <h1 className="text-white font-semibold text-lg">
                        {lease.property?.title || 'Property'}
                    </h1>
                    <p className="text-white/70 text-sm">
                        {lease.property?.address}
                    </p>
                </div>
                <div className="absolute top-3 right-3">
                    <LeaseStatusBadge status={lease.status} />
                </div>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <StatCard label="Monthly Rent" value={`N$${lease.monthlyRent?.toLocaleString()}`} icon={DollarSign} />
                <StatCard label="Deposit" value={`N$${(lease.deposit || 0).toLocaleString()}`} icon={DollarSign} />
                <StatCard
                    label={lease.status === 'approved' ? 'Days Left' : 'Duration'}
                    value={
                        daysRemaining !== null
                            ? `${daysRemaining}d`
                            : `${Math.ceil(Math.abs(new Date(lease.endDate).getTime() - new Date(lease.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))}mo`
                    }
                    icon={Clock}
                />
            </div>

            {/* Tenant Info */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-neutral-500" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-neutral-900">
                            {lease.tenant?.fullName || 'Tenant'}
                        </p>
                        <p className="text-xs text-neutral-500">{lease.tenant?.email}</p>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-4">
                <LeaseStatusTimeline
                    status={lease.status}
                    createdAt={lease._creationTime}
                    sentAt={lease.sentAt}
                    signedAt={lease.signedAt}
                    approvedAt={lease.approvedAt}
                />
            </div>

            {lease.status === 'revision_requested' && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Waiting For Tenant Updates</p>
                    <p className="mt-2 text-sm leading-6 text-amber-800">{lease.landlordNotes || 'A revision request was sent and the tenant still needs to update the submission.'}</p>
                </div>
            )}

            {/* Rental Rules */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-4">
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-3">
                    Rental Rules
                </h3>
                <div className="flex flex-wrap gap-1.5">
                    <RuleBadge icon="📅" label={`Due: ${lease.rentDueDay || 1}${getOrdinal(lease.rentDueDay || 1)}`} />
                    <RuleBadge icon="⏳" label={`${lease.gracePeriodDays || 5}d grace`} />
                    <RuleBadge
                        icon="💸"
                        label={`${lease.lateFeeAmount || 5}${lease.lateFeeType === 'percentage' ? '%' : ' N$'} late fee`}
                    />
                    <RuleBadge
                        icon={PET_POLICY_ICONS[(lease.petPolicy as PetPolicy) || 'no_pets']}
                        label={PET_POLICY_LABELS[(lease.petPolicy as PetPolicy) || 'no_pets']}
                    />
                    <RuleBadge icon="🔧" label={`${MAINTENANCE_LABELS[(lease.maintenanceResponsibility as MaintenanceOption) || 'shared']} maintenance`} />
                    <RuleBadge icon="👥" label={`Max ${lease.maxOccupants || 2}`} />
                    <RuleBadge icon="📋" label={`${lease.noticePeriodDays || 30}d notice`} />
                    {lease.parkingIncluded && <RuleBadge icon="🅿️" label="Parking" />}
                    {!lease.smokingAllowed && <RuleBadge icon="🚭" label="No Smoking" />}
                    {lease.smokingAllowed && <RuleBadge icon="🚬" label="Smoking OK" />}
                    {lease.sublettingAllowed && <RuleBadge icon="🏠" label="Subletting OK" />}
                    {lease.utilitiesIncluded?.map((u: string) => (
                        <RuleBadge key={u} icon="⚡" label={u} />
                    ))}
                </div>
            </div>

            {/* Lease Period */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-4">
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-3">
                    Lease Period
                </h3>
                <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-neutral-400" />
                    <p className="text-sm text-neutral-900 font-medium">
                        {format(new Date(lease.startDate), 'MMM d, yyyy')} — {format(new Date(lease.endDate), 'MMM d, yyyy')}
                    </p>
                </div>
            </div>

            {/* ── Payment Dashboard (Active leases only) ── */}
            {lease.status === 'approved' && (
                <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-4">
                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-3">
                        Payment Summary
                    </h3>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center p-3 bg-emerald-50 rounded-lg">
                            <p className="text-xs text-emerald-600 mb-0.5">Collected</p>
                            <p className="text-lg font-bold text-emerald-700">N${totalCollected.toLocaleString()}</p>
                        </div>
                        <div className="text-center p-3 bg-amber-50 rounded-lg">
                            <p className="text-xs text-amber-600 mb-0.5">Pending</p>
                            <p className="text-lg font-bold text-amber-700">N${totalPending.toLocaleString()}</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                            <p className="text-xs text-red-600 mb-0.5">Overdue</p>
                            <p className="text-lg font-bold text-red-700">N${totalOverdue.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Tenant Documents ── */}
            {lease.tenantDocuments && lease.tenantDocuments.length > 0 && (
                <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wide">
                            Tenant Documents
                        </h3>
                        <span className="text-xs text-neutral-400">
                            {lease.tenantDocuments.length} uploaded
                        </span>
                    </div>
                    <div className="space-y-3">
                        {lease.tenantDocuments.map((doc, i: number) => {
                            const docUrl = documentUrlMap[doc.storageId] ?? null
                            const docLabel = TENANT_DOCUMENT_LABELS[doc.type as keyof typeof TENANT_DOCUMENT_LABELS] || doc.type.replace(/_/g, ' ')

                            return (
                                <div key={`${doc.storageId}-${i}`} className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-neutral-200">
                                        <FileText className="h-4 w-4 text-neutral-500" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-neutral-800">
                                            {docLabel}
                                        </p>
                                        <p className="text-xs text-neutral-500">
                                            Uploaded {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                    {docUrl ? (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="rounded-lg border-neutral-200"
                                                onClick={() => window.open(docUrl, '_blank', 'noopener,noreferrer')}
                                            >
                                                <Eye className="mr-1.5 h-4 w-4" />
                                                View
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 rounded-lg text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900"
                                                onClick={() => window.open(docUrl, '_blank', 'noopener,noreferrer')}
                                            >
                                                <Download className="h-4 w-4" />
                                                <span className="sr-only">Open document in new tab</span>
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
                            Fetching secure document links…
                        </p>
                    )}
                    {lease.tenantSignatureData && lease.status !== 'revision_requested' && (
                        <div className="mt-4 p-3 bg-neutral-50 rounded-lg">
                            <p className="text-xs text-neutral-500 mb-2">Tenant Signature</p>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={lease.tenantSignatureData}
                                alt="Tenant signature"
                                className="h-16 bg-white rounded border p-1"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* ── Action Buttons ── */}
            {/* Approval Flow */}
            {lease.status === 'tenant_signed' && (
                <div className="space-y-3 mt-6">
                    <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                        <DialogTrigger asChild>
                            <Button className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl h-12 font-semibold">
                                <Check className="h-4 w-4 mr-2" />
                                Approve Lease
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-semibold">
                                    Sign & Approve Lease
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-2">
                                <p className="text-sm text-neutral-500">
                                    Add your signature to approve this lease. The property will be marked as leased and payments will be automatically generated.
                                </p>
                                <SignatureCanvas
                                    onSignatureChange={(data) => setSignatureData(data || '')}
                                    disabled={isApproving}
                                />
                                <Button
                                    onClick={handleApprove}
                                    disabled={isApproving || !signatureData}
                                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl h-11"
                                >
                                    {isApproving ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Check className="h-4 w-4 mr-2" />
                                    )}
                                    Confirm Approval
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <div className="flex gap-3">
                        <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="flex-1 rounded-xl h-11 border-neutral-200">
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Request Revision
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Request Revision</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 mt-2">
                                    <p className="text-sm text-neutral-500">
                                        Tell the tenant what needs to be updated.
                                    </p>
                                    <Textarea
                                        value={revisionNotes}
                                        onChange={(e) => setRevisionNotes(e.target.value)}
                                        placeholder="e.g., Please re-upload your ID — it was blurry."
                                        rows={3}
                                        className="rounded-xl"
                                    />
                                    <Button
                                        onClick={handleRequestRevision}
                                        className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl h-11"
                                    >
                                        Send Revision Request
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="flex-1 rounded-xl h-11 border-red-200 text-red-600 hover:bg-red-50">
                                    <X className="h-4 w-4 mr-2" />
                                    Reject
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Reject Lease</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 mt-2">
                                    <p className="text-sm text-neutral-500">
                                        Provide a reason for rejecting this lease.
                                    </p>
                                    <Textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="Reason for rejection..."
                                        rows={3}
                                        className="rounded-xl"
                                    />
                                    <Button
                                        onClick={handleReject}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl h-11"
                                    >
                                        Confirm Rejection
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            )}

            {/* Terminate (active only) */}
            {lease.status === 'approved' && (
                <div className="mt-6">
                    <Dialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full rounded-xl h-11 border-red-200 text-red-600 hover:bg-red-50"
                            >
                                <Ban className="h-4 w-4 mr-2" />
                                Terminate Lease
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Terminate Lease</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-2">
                                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                    <p className="text-sm text-red-700">
                                        This will end the lease and make the property available again.
                                    </p>
                                </div>
                                <Textarea
                                    value={terminateReason}
                                    onChange={(e) => setTerminateReason(e.target.value)}
                                    placeholder="Reason for termination..."
                                    rows={3}
                                    className="rounded-xl"
                                />
                                <Button
                                    onClick={handleTerminate}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl h-11"
                                >
                                    Confirm Termination
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            )}

            {/* Send to Tenant (draft only) */}
            {lease.status === 'draft' && (
                <div className="mt-6">
                    <Button
                        className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl h-12 font-semibold"
                        onClick={async () => {
                            try {
                                await sendToTenant({ leaseId: leaseId as Id<"leases"> })
                                toast.success('Lease sent to tenant!')
                            } catch (error: unknown) {
                                toast.error(error instanceof Error ? error.message : 'Failed to send')
                            }
                        }}
                    >
                        <Send className="h-4 w-4 mr-2" />
                        Send to Tenant
                    </Button>
                </div>
            )}
        </div>
    )
}

// ── Helper Components ──

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
    return (
        <div className="bg-white rounded-xl border border-neutral-200 p-3 text-center">
            <Icon className="h-4 w-4 text-neutral-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-neutral-900">{value}</p>
            <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-wide">{label}</p>
        </div>
    )
}

function RuleBadge({ icon, label }: { icon: string; label: string }) {
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 text-xs font-medium text-neutral-700">
            <span>{icon}</span> {label}
        </span>
    )
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
