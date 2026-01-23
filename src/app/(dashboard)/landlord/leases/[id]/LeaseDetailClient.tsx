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
import { toast } from 'sonner'
import {
    ChevronLeft,
    User,
    Loader2,
    CheckCircle2,
    XCircle,
    RefreshCcw,
    FileText,
    DollarSign,
    Eye,
    Download,
    Clock,
    AlertCircle,
    Check,
    Info
} from 'lucide-react'
import { format } from 'date-fns'
import { useMutation } from "convex/react"
import { api } from "../../../../../../convex/_generated/api"
import { Id } from "../../../../../../convex/_generated/dataModel"

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

    return (
        <div className="px-6 py-6">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/landlord/leases"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to leases
                </Link>
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-semibold text-foreground">
                                {lease.property?.title}
                            </h1>
                            <LeaseStatusBadge status={lease.status} />
                        </div>
                        <p className="text-muted-foreground mt-1">{lease.property?.address}</p>
                    </div>
                </div>
            </div>

            {/* Action Required Banner */}
            {canApprove && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-lime-500/10 border border-lime-500/20 mb-6">
                    <AlertCircle className="h-5 w-5 text-lime-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-foreground">Action Required</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            The tenant has signed this lease. Please review and approve or request changes.
                        </p>
                    </div>
                </div>
            )}

            {isApproved && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-sidebar-accent/50 mb-6">
                    <CheckCircle2 className="h-5 w-5 text-lime-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-foreground">Lease Active</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            This lease is approved and active. The property has been unlisted from search.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tenant Documents */}
                    {(lease.tenant_documents || lease.tenantDocuments)?.length > 0 && (
                        <section>
                            <h2 className="text-lg font-medium text-foreground mb-4">Tenant Documents</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {(lease.tenant_documents || lease.tenantDocuments).map((doc: any, index: number) => (
                                    <a
                                        key={index}
                                        href={doc.signedUrl || doc.url || doc.storageId}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-4 rounded-xl bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors"
                                    >
                                        <div className="h-10 w-10 rounded-lg bg-sidebar-accent flex items-center justify-center">
                                            <FileText className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-foreground capitalize">
                                                {doc.type.replace('_', ' ')}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Click to view</p>
                                        </div>
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    </a>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Tenant Signature */}
                    {tenantSignature && (
                        <section>
                            <h2 className="text-lg font-medium text-foreground mb-4">Tenant Signature</h2>
                            <div className="p-4 rounded-xl bg-sidebar-accent/30 border border-border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={tenantSignature}
                                    alt="Tenant signature"
                                    className="max-w-[300px] h-auto"
                                />
                                <p className="text-sm text-muted-foreground mt-3">
                                    Signed on {format(new Date(signedAt), 'MMM d, yyyy h:mm a')}
                                </p>
                            </div>
                        </section>
                    )}

                    {/* Lease Document Preview */}
                    <section>
                        <h2 className="text-lg font-medium text-foreground mb-4">Lease Document</h2>
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
                    </section>

                    {/* Payments */}
                    {isApproved && payments.length > 0 && (
                        <section>
                            <h2 className="text-lg font-medium text-foreground mb-4">Payment History</h2>
                            <div className="space-y-2">
                                {payments.map((payment: any) => (
                                    <div
                                        key={payment.id || payment._id}
                                        className="flex items-center justify-between p-4 rounded-xl bg-sidebar-accent/30"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${payment.status === 'paid'
                                                    ? 'bg-lime-500/10 text-lime-600'
                                                    : payment.status === 'overdue'
                                                        ? 'bg-red-500/10 text-red-600'
                                                        : 'bg-sidebar-accent text-muted-foreground'
                                                }`}>
                                                {payment.status === 'paid' ? (
                                                    <Check className="h-5 w-5" />
                                                ) : payment.status === 'overdue' ? (
                                                    <AlertCircle className="h-5 w-5" />
                                                ) : (
                                                    <Clock className="h-5 w-5" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground capitalize">{payment.type}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Due: {format(new Date(payment.due_date || payment.dueDate), 'MMM d, yyyy')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="font-semibold text-foreground">N$ {payment.amount?.toLocaleString()}</p>
                                                <span className={`text-xs font-medium capitalize ${payment.status === 'paid'
                                                        ? 'text-lime-600'
                                                        : payment.status === 'overdue'
                                                            ? 'text-red-600'
                                                            : 'text-muted-foreground'
                                                    }`}>
                                                    {payment.status}
                                                </span>
                                            </div>
                                            {payment.status === 'pending' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleMarkPaid(payment.id || payment._id)}
                                                    className="bg-lime-500 hover:bg-lime-600 text-white rounded-lg"
                                                >
                                                    Mark Paid
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Status Timeline */}
                    <div className="p-4 rounded-xl bg-sidebar-accent/30">
                        <h3 className="text-sm font-medium text-muted-foreground mb-4">Lease Status</h3>
                        <LeaseStatusTimeline
                            status={lease.status}
                            createdAt={lease.created_at || lease._creationTime}
                            sentAt={lease.sent_at || lease.sentAt}
                            signedAt={signedAt}
                            approvedAt={lease.approved_at || lease.approvedAt}
                        />
                    </div>

                    {/* Actions */}
                    {canApprove && (
                        <div className="p-4 rounded-xl bg-sidebar-accent/30 space-y-3">
                            <h3 className="font-medium text-foreground">Take Action</h3>
                            <Button
                                className="w-full bg-lime-500 hover:bg-lime-600 text-white rounded-lg h-11"
                                onClick={() => setApproveDialogOpen(true)}
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Approve Lease
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full rounded-lg h-11"
                                onClick={() => setRevisionDialogOpen(true)}
                            >
                                <RefreshCcw className="h-4 w-4 mr-2" />
                                Request Revision
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full rounded-lg h-11"
                                onClick={() => setRejectDialogOpen(true)}
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                            </Button>
                        </div>
                    )}

                    {/* Tenant Info */}
                    {lease.tenant && (
                        <div className="p-4 rounded-xl bg-sidebar-accent/30">
                            <h3 className="text-sm font-medium text-muted-foreground mb-3">Tenant</h3>
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-sidebar-accent flex items-center justify-center">
                                    {(lease.tenant.avatar_url || lease.tenant.avatarUrl) ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            src={lease.tenant.avatar_url || lease.tenant.avatarUrl}
                                            alt={lease.tenant.fullName || 'Tenant'}
                                            className="h-full w-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <User className="h-6 w-6 text-muted-foreground" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">{lease.tenant.fullName || 'Tenant'}</p>
                                    <p className="text-sm text-muted-foreground">{lease.tenant.email}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-xl bg-sidebar-accent/50 text-center">
                            <p className="text-xl font-semibold text-foreground">
                                N$ {(lease.monthly_rent || lease.monthlyRent)?.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">Monthly Rent</p>
                        </div>
                        <div className="p-4 rounded-xl bg-sidebar-accent/50 text-center">
                            <p className="text-xl font-semibold text-foreground">
                                N$ {lease.deposit?.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">Deposit</p>
                        </div>
                    </div>

                    {/* Download */}
                    <Button variant="outline" className="w-full rounded-lg h-11" disabled>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF (Coming Soon)
                    </Button>
                </div>
            </div>

            {/* Approve Dialog */}
            <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Approve Lease</DialogTitle>
                        <DialogDescription>
                            By approving this lease, the property will be automatically unlisted.
                            You can optionally add your signature.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <SignatureCanvas
                            onSignatureChange={setLandlordSignature}
                            initialSignature={landlordSignature}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApproveDialogOpen(false)} className="rounded-lg">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleApprove}
                            disabled={isSubmitting}
                            className="bg-lime-500 hover:bg-lime-600 text-white rounded-lg"
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Approve Lease
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Lease</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this lease. The tenant will be notified.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="Reason for rejection..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="rounded-lg bg-sidebar-accent border-0 focus-visible:ring-2 focus-visible:ring-lime-500/50"
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)} className="rounded-lg">
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleReject}
                            disabled={isSubmitting || !notes.trim()}
                            className="rounded-lg"
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Reject Lease
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Revision Dialog */}
            <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Revision</DialogTitle>
                        <DialogDescription>
                            Ask the tenant to revise their submission. They will need to re-upload documents and sign again.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="What needs to be revised (e.g., ID is blurry, missing payslip)..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="rounded-lg bg-sidebar-accent border-0 focus-visible:ring-2 focus-visible:ring-lime-500/50"
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRevisionDialogOpen(false)} className="rounded-lg">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRequestRevision}
                            disabled={isSubmitting || !notes.trim()}
                            className="bg-lime-500 hover:bg-lime-600 text-white rounded-lg"
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
