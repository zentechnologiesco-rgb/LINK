'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { LeaseStatusBadge, LeaseStatusTimeline } from '@/components/leases/LeaseStatusTimeline'
import { LeasePreview } from '@/components/leases/LeasePreview'
import { SignatureCanvas } from '@/components/leases/SignatureCanvas'
import { LeasePDF } from '@/components/leases/LeasePDF'
import dynamic from 'next/dynamic'

const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    { ssr: false }
)
import { toast } from 'sonner'
import {
    ChevronLeft,
    User,
    Loader2,
    CheckCircle2,
    XCircle,
    RefreshCcw,
    FileText,
    Download,
    Clock,
    AlertCircle,
    Check,
    Building2,
    MapPin,
    Calendar,
    ChevronDown,
    ChevronUp,
    ExternalLink
} from 'lucide-react'
import { format } from 'date-fns'
import { useMutation } from "convex/react"
import { api } from "../../../../../../convex/_generated/api"
import { Id } from "../../../../../../convex/_generated/dataModel"
import { cn } from '@/lib/utils'

interface LeaseDetailClientProps {
    lease: any
    payments: any[]
}

export function LeaseDetailClient({ lease, payments }: LeaseDetailClientProps) {
    const [landlordSignature, setLandlordSignature] = useState<string | null>(
        lease.landlord_signature_data || lease.landlordSignatureData || null
    )
    const [approveDialogOpen, setApproveDialogOpen] = useState(false)
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [revisionDialogOpen, setRevisionDialogOpen] = useState(false)
    const [notes, setNotes] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showDocument, setShowDocument] = useState(false)
    const [showTimeline, setShowTimeline] = useState(false)
    const [showPayments, setShowPayments] = useState(false)

    const landlordDecision = useMutation(api.leases.landlordDecision)
    const requestRevision = useMutation(api.leases.requestRevision)
    const recordPayment = useMutation(api.payments.record)

    const canApprove = lease.status === 'tenant_signed'
    const isApproved = lease.status === 'approved'

    const leaseDocument = lease.lease_document || lease.leaseDocument || {
        title: 'Residential Lease Agreement',
        clauses: [],
    }

    const handleApprove = async () => {
        setIsSubmitting(true)
        try {
            await landlordDecision({
                leaseId: lease.id || lease._id,
                approved: true,
                signatureData: landlordSignature || undefined
            })
            toast.success('Lease approved! Property has been unlisted.')
            setApproveDialogOpen(false)
        } catch (error) {
            toast.error('Failed to approve lease.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleReject = async () => {
        if (!notes.trim()) {
            toast.error('Please provide a reason for rejection.')
            return
        }
        setIsSubmitting(true)
        try {
            await landlordDecision({
                leaseId: lease.id || lease._id,
                approved: false,
                notes
            })
            toast.success('Lease rejected.')
            setRejectDialogOpen(false)
        } catch (error) {
            toast.error('Failed to reject lease.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRequestRevision = async () => {
        if (!notes.trim()) {
            toast.error('Please provide revision instructions.')
            return
        }
        setIsSubmitting(true)
        try {
            await requestRevision({
                leaseId: lease.id || lease._id,
                notes
            })
            toast.success('Revision requested. Tenant will be notified.')
            setRevisionDialogOpen(false)
        } catch (error) {
            toast.error('Failed to request revision.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleMarkPaid = async (paymentId: string) => {
        try {
            await recordPayment({
                paymentId: paymentId as Id<"payments">,
                paymentMethod: "Manual Recording",
                notes: "Marked as paid by landlord"
            })
            toast.success('Payment marked as paid!')
        } catch (error) {
            toast.error('Failed to record payment')
        }
    }

    const tenantSignature = lease.tenant_signature_data || lease.tenantSignatureData
    const signedAt = lease.signed_at || lease.signedAt
    const startDate = format(new Date(lease.start_date || lease.startDate), 'MMM d, yyyy')
    const endDate = format(new Date(lease.end_date || lease.endDate), 'MMM d, yyyy')

    return (
        <div className="font-sans text-neutral-900 pb-24">
            {/* Back Button */}
            <Link
                href="/landlord/leases"
                className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-6"
            >
                <ChevronLeft className="h-4 w-4" />
                Leases
            </Link>

            {/* Status Alert */}
            {canApprove && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100 mb-6">
                    <AlertCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-emerald-900 text-sm">Ready for Approval</p>
                        <p className="text-sm text-emerald-700 mt-0.5">
                            The tenant has signed. Review and approve to finalize.
                        </p>
                    </div>
                </div>
            )}

            {isApproved && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-neutral-50 border border-neutral-200 mb-6">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-neutral-900 text-sm">Lease Active</p>
                        <p className="text-sm text-neutral-600 mt-0.5">
                            This lease is approved and active.
                        </p>
                    </div>
                </div>
            )}

            {/* Property Header Card */}
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden mb-6">
                <div className="aspect-video sm:aspect-[3/1] bg-neutral-100 relative">
                    {lease.property?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={lease.property.imageUrl}
                            alt={lease.property?.title}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center">
                            <Building2 className="h-10 w-10 text-neutral-300" />
                        </div>
                    )}
                    <div className="absolute top-3 left-3">
                        <LeaseStatusBadge status={lease.status} />
                    </div>
                </div>

                <div className="p-4">
                    <h1 className="text-lg font-semibold text-neutral-900 mb-2">
                        {lease.property?.title || 'Property'}
                    </h1>
                    <div className="flex items-center gap-1.5 text-sm text-neutral-500 mb-4">
                        <MapPin className="h-3.5 w-3.5" />
                        {lease.property?.address}, {lease.property?.city}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-neutral-50 rounded-lg p-3">
                            <p className="text-xs text-neutral-500 mb-0.5">Monthly Rent</p>
                            <p className="text-lg font-bold text-neutral-900">
                                N${(lease.monthly_rent || lease.monthlyRent)?.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-neutral-50 rounded-lg p-3">
                            <p className="text-xs text-neutral-500 mb-0.5">Deposit</p>
                            <p className="text-lg font-bold text-neutral-900">
                                N${lease.deposit?.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-neutral-600 mt-4 pt-4 border-t border-neutral-100">
                        <Calendar className="h-4 w-4 text-neutral-400" />
                        {startDate} — {endDate}
                    </div>
                </div>
            </div>

            {/* Tenant Info */}
            {lease.tenant && (
                <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-neutral-100 overflow-hidden shrink-0 flex items-center justify-center">
                            {(lease.tenant.avatar_url || lease.tenant.avatarUrl) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={lease.tenant.avatar_url || lease.tenant.avatarUrl}
                                    alt={lease.tenant.fullName}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <User className="h-4 w-4 text-neutral-400" />
                            )}
                        </div>
                        <div>
                            <p className="font-medium text-neutral-900 text-sm">
                                {lease.tenant.fullName || 'Tenant'}
                            </p>
                            <p className="text-xs text-neutral-500">
                                {lease.tenant.email}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            {canApprove && (
                <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-6 space-y-2">
                    <Button
                        className="w-full bg-neutral-900 hover:bg-neutral-800 text-white h-11 rounded-lg font-medium"
                        onClick={() => setApproveDialogOpen(true)}
                    >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve Lease
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            className="w-full rounded-lg h-10 text-sm border-neutral-200"
                            onClick={() => setRevisionDialogOpen(true)}
                        >
                            <RefreshCcw className="h-4 w-4 mr-1.5" />
                            Revise
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full rounded-lg h-10 text-sm border-neutral-200 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setRejectDialogOpen(true)}
                        >
                            <XCircle className="h-4 w-4 mr-1.5" />
                            Reject
                        </Button>
                    </div>
                </div>
            )}

            {/* Tenant Documents */}
            {(lease.tenant_documents || lease.tenantDocuments)?.length > 0 && (
                <div className="bg-white rounded-xl border border-neutral-200 mb-6">
                    <div className="p-4 border-b border-neutral-100">
                        <h2 className="text-sm font-semibold text-neutral-900">Tenant Documents</h2>
                    </div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(lease.tenant_documents || lease.tenantDocuments).map((doc: any, index: number) => (
                            <a
                                key={index}
                                href={doc.signedUrl || doc.url || doc.storageId}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors"
                            >
                                <FileText className="h-4 w-4 text-neutral-500" />
                                <span className="text-sm font-medium text-neutral-700 capitalize flex-1">
                                    {doc.type.replace('_', ' ')}
                                </span>
                                <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Tenant Signature */}
            {tenantSignature && (
                <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-6">
                    <h2 className="text-sm font-semibold text-neutral-900 mb-3">Tenant Signature</h2>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={tenantSignature}
                        alt="Tenant signature"
                        className="max-w-[200px] h-auto opacity-90"
                    />
                    <p className="text-xs text-neutral-400 mt-2">
                        Signed on {format(new Date(signedAt), 'MMM d, yyyy h:mm a')}
                    </p>
                </div>
            )}

            {/* Collapsible Sections */}
            <div className="space-y-3">
                {/* Timeline */}
                <div className="bg-white rounded-xl border border-neutral-200">
                    <button
                        onClick={() => setShowTimeline(!showTimeline)}
                        className="w-full flex items-center justify-between p-4"
                    >
                        <span className="text-sm font-medium text-neutral-900">Lease Timeline</span>
                        {showTimeline ? (
                            <ChevronUp className="h-4 w-4 text-neutral-400" />
                        ) : (
                            <ChevronDown className="h-4 w-4 text-neutral-400" />
                        )}
                    </button>
                    {showTimeline && (
                        <div className="px-4 pb-4 pt-0">
                            <LeaseStatusTimeline
                                status={lease.status}
                                createdAt={lease.created_at || lease._creationTime}
                                sentAt={lease.sent_at || lease.sentAt}
                                signedAt={signedAt}
                                approvedAt={lease.approved_at || lease.approvedAt}
                            />
                        </div>
                    )}
                </div>

                {/* Lease Document */}
                <div className="bg-white rounded-xl border border-neutral-200">
                    <button
                        onClick={() => setShowDocument(!showDocument)}
                        className="w-full flex items-center justify-between p-4"
                    >
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-neutral-500" />
                            <span className="text-sm font-medium text-neutral-900">Lease Document</span>
                        </div>
                        {showDocument ? (
                            <ChevronUp className="h-4 w-4 text-neutral-400" />
                        ) : (
                            <ChevronDown className="h-4 w-4 text-neutral-400" />
                        )}
                    </button>
                    {showDocument && (
                        <div className="px-4 pb-4 pt-0 overflow-x-auto">
                            <LeasePreview
                                leaseDocument={leaseDocument}
                                property={{
                                    title: lease.property?.title || '',
                                    address: lease.property?.address || '',
                                    city: lease.property?.city || '',
                                    images: lease.property?.images,
                                }}
                                landlord={{
                                    fullName: lease.landlord?.fullName || '',
                                    email: lease.landlord?.email || '',
                                    phone: lease.landlord?.phone,
                                }}
                                tenant={lease.tenant ? {
                                    fullName: lease.tenant?.fullName || '',
                                    email: lease.tenant.email || '',
                                    phone: lease.tenant.phone,
                                } : undefined}
                                leaseTerms={{
                                    startDate: lease.start_date || lease.startDate,
                                    endDate: lease.end_date || lease.endDate,
                                    monthlyRent: lease.monthly_rent || lease.monthlyRent,
                                    deposit: lease.deposit,
                                }}
                                tenantSignature={tenantSignature}
                                landlordSignature={landlordSignature}
                                signedAt={signedAt}
                            />
                        </div>
                    )}
                </div>

                {/* Payments */}
                {isApproved && payments.length > 0 && (
                    <div className="bg-white rounded-xl border border-neutral-200">
                        <button
                            onClick={() => setShowPayments(!showPayments)}
                            className="w-full flex items-center justify-between p-4"
                        >
                            <span className="text-sm font-medium text-neutral-900">
                                Payments ({payments.length})
                            </span>
                            {showPayments ? (
                                <ChevronUp className="h-4 w-4 text-neutral-400" />
                            ) : (
                                <ChevronDown className="h-4 w-4 text-neutral-400" />
                            )}
                        </button>
                        {showPayments && (
                            <div className="px-4 pb-4 pt-0 space-y-2">
                                {payments.map((payment: any) => (
                                    <div
                                        key={payment.id || payment._id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-neutral-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-8 w-8 rounded-full flex items-center justify-center",
                                                payment.status === 'paid' ? "bg-emerald-100 text-emerald-600" :
                                                    payment.status === 'overdue' ? "bg-red-100 text-red-600" :
                                                        "bg-neutral-200 text-neutral-500"
                                            )}>
                                                {payment.status === 'paid' ? <Check className="h-4 w-4" /> :
                                                    payment.status === 'overdue' ? <AlertCircle className="h-4 w-4" /> :
                                                        <Clock className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-neutral-900 capitalize">{payment.type}</p>
                                                <p className="text-xs text-neutral-500">
                                                    Due: {format(new Date(payment.due_date || payment.dueDate), 'MMM d, yyyy')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-neutral-900">
                                                N${payment.amount?.toLocaleString()}
                                            </p>
                                            {payment.status === 'pending' && (
                                                <button
                                                    onClick={() => handleMarkPaid(payment.id || payment._id)}
                                                    className="text-xs text-emerald-600 font-medium hover:underline"
                                                >
                                                    Mark Paid
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Download PDF */}
            <div className="mt-6">
                <PDFDownloadLink
                    document={
                        <LeasePDF
                            data={{
                                leaseDocument: leaseDocument,
                                property: {
                                    title: lease.property?.title || '',
                                    address: lease.property?.address || '',
                                    city: lease.property?.city || '',
                                    images: lease.property?.images,
                                },
                                landlord: {
                                    fullName: lease.landlord?.fullName || '',
                                    email: lease.landlord?.email || '',
                                    phone: lease.landlord?.phone,
                                },
                                tenant: lease.tenant ? {
                                    fullName: lease.tenant?.fullName || '',
                                    email: lease.tenant.email || '',
                                    phone: lease.tenant.phone,
                                } : { fullName: '', email: '' },
                                leaseTerms: {
                                    startDate: lease.start_date || lease.startDate,
                                    endDate: lease.end_date || lease.endDate,
                                    monthlyRent: lease.monthly_rent || lease.monthlyRent,
                                    deposit: lease.deposit,
                                },
                                tenantSignature: tenantSignature,
                                landlordSignature: landlordSignature,
                                signedAt: signedAt,
                            }}
                        />
                    }
                    fileName={`Lease_${lease.property?.title}_${format(new Date(), 'yyyy-MM-dd')}.pdf`}
                    className="block"
                >
                    {/* @ts-ignore */}
                    {({ loading }: any) => (
                        <Button
                            variant="outline"
                            className="w-full rounded-xl h-11 border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                            disabled={loading}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            {loading ? 'Generating PDF...' : 'Download PDF'}
                        </Button>
                    )}
                </PDFDownloadLink>
            </div>

            {/* Approve Dialog */}
            <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                <DialogContent className="max-w-md rounded-2xl border border-neutral-200 p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">Approve Lease</DialogTitle>
                        <DialogDescription className="text-neutral-500">
                            The property will be automatically unlisted. You can add your signature below.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <SignatureCanvas
                            onSignatureChange={setLandlordSignature}
                            initialSignature={landlordSignature}
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setApproveDialogOpen(false)} className="rounded-lg">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleApprove}
                            disabled={isSubmitting}
                            className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg"
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent className="rounded-2xl border border-neutral-200 p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">Reject Lease</DialogTitle>
                        <DialogDescription className="text-neutral-500">
                            Please provide a reason. The tenant will be notified.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="Reason for rejection..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="rounded-lg bg-neutral-50 border-neutral-200 resize-none"
                    />
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setRejectDialogOpen(false)} className="rounded-lg">
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={isSubmitting || !notes.trim()}
                            className="rounded-lg"
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Revision Dialog */}
            <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
                <DialogContent className="rounded-2xl border border-neutral-200 p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">Request Revision</DialogTitle>
                        <DialogDescription className="text-neutral-500">
                            The tenant will need to re-upload documents and sign again.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="What needs to be revised..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="rounded-lg bg-neutral-50 border-neutral-200 resize-none"
                    />
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setRevisionDialogOpen(false)} className="rounded-lg">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRequestRevision}
                            disabled={isSubmitting || !notes.trim()}
                            className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg"
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Request Revision
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
