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
    DollarSign,
    Eye,
    Download,
    Clock,
    AlertCircle,
    Check,
    Info,
    ArrowRight
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
        <div className="px-4 py-8 md:px-6 max-w-[2000px] mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/landlord/leases"
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black/40 hover:text-black transition-colors mb-6 group"
                >
                    <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back to leases
                </Link>
                <div className="flex flex-wrap items-start justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-4xl font-[family-name:var(--font-anton)] uppercase tracking-wide text-black">
                                {lease.property?.title}
                            </h1>
                            <LeaseStatusBadge status={lease.status} />
                        </div>
                        <p className="text-black/60 font-medium mt-1">{lease.property?.address}</p>
                    </div>
                </div>
            </div>

            {/* Action Required Banner */}
            {canApprove && (
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-black/5 border border-black/5 mb-8">
                    <AlertCircle className="h-5 w-5 text-black shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-black uppercase tracking-wide text-sm">Action Required</p>
                        <p className="text-sm text-black/60 mt-0.5 font-medium">
                            The tenant has signed this lease. Please review and approve or request changes.
                        </p>
                    </div>
                </div>
            )}

            {isApproved && (
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-gray-50 border border-black/5 mb-8">
                    <CheckCircle2 className="h-5 w-5 text-black shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-black uppercase tracking-wide text-sm">Lease Active</p>
                        <p className="text-sm text-black/60 mt-0.5 font-medium">
                            This lease is approved and active. The property has been unlisted from search.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Tenant Documents */}
                    {(lease.tenant_documents || lease.tenantDocuments)?.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold uppercase tracking-wider text-black mb-4">Tenant Documents</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {(lease.tenant_documents || lease.tenantDocuments).map((doc: any, index: number) => (
                                    <a
                                        key={index}
                                        href={doc.signedUrl || doc.url || doc.storageId}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center gap-4 p-4 rounded-xl bg-white border border-black/5 hover:border-black hover:bg-black/5 transition-all"
                                    >
                                        <div className="h-10 w-10 rounded-lg bg-black/5 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                                            <FileText className="h-5 w-5 text-black/40 group-hover:text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-black capitalize">
                                                {doc.type.replace('_', ' ')}
                                            </p>
                                            <p className="text-xs text-black/40 font-medium">Click to view</p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-black/20 group-hover:text-black group-hover:translate-x-1 transition-all" />
                                    </a>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Tenant Signature */}
                    {tenantSignature && (
                        <section>
                            <h2 className="text-lg font-bold uppercase tracking-wider text-black mb-4">Tenant Signature</h2>
                            <div className="p-6 rounded-2xl bg-white border border-black/5">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={tenantSignature}
                                    alt="Tenant signature"
                                    className="max-w-[300px] h-auto opacity-90"
                                />
                                <p className="text-xs font-bold text-black/40 mt-4 uppercase tracking-wider">
                                    Signed on {format(new Date(signedAt), 'MMM d, yyyy h:mm a')}
                                </p>
                            </div>
                        </section>
                    )}

                    {/* Lease Document Preview */}
                    <section>
                        <h2 className="text-lg font-bold uppercase tracking-wider text-black mb-4">Lease Document</h2>
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
                            <h2 className="text-lg font-bold uppercase tracking-wider text-black mb-4">Payment History</h2>
                            <div className="space-y-3">
                                {payments.map((payment: any) => (
                                    <div
                                        key={payment.id || payment._id}
                                        className="flex items-center justify-between p-5 rounded-2xl bg-white border border-black/5 hover:border-black/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center",
                                                payment.status === 'paid' ? "bg-black text-white" :
                                                    payment.status === 'overdue' ? "bg-red-50 text-red-600" :
                                                        "bg-gray-100 text-gray-500"
                                            )}>
                                                {payment.status === 'paid' ? (
                                                    <Check className="h-5 w-5" />
                                                ) : payment.status === 'overdue' ? (
                                                    <AlertCircle className="h-5 w-5" />
                                                ) : (
                                                    <Clock className="h-5 w-5" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-black capitalize">{payment.type}</p>
                                                <p className="text-sm font-medium text-black/40">
                                                    Due: {format(new Date(payment.due_date || payment.dueDate), 'MMM d, yyyy')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="font-[family-name:var(--font-anton)] text-xl text-black">N$ {payment.amount?.toLocaleString()}</p>
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase tracking-wider",
                                                    payment.status === 'paid' ? "text-black" :
                                                        payment.status === 'overdue' ? "text-red-600" :
                                                            "text-black/40"
                                                )}>
                                                    {payment.status}
                                                </span>
                                            </div>
                                            {payment.status === 'pending' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleMarkPaid(payment.id || payment._id)}
                                                    className="bg-black hover:bg-black/80 text-white rounded-lg border border-transparent shadow-none"
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
                    <div className="p-6 rounded-2xl bg-white border border-black/5">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-black/40 mb-6">Lease Status</h3>
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
                        <div className="p-6 rounded-2xl bg-white border border-black/5 space-y-3">
                            <h3 className="font-bold text-black text-lg mb-2">Take Action</h3>
                            <Button
                                className="w-full bg-black hover:bg-black/90 text-white rounded-xl h-12 font-bold shadow-none"
                                onClick={() => setApproveDialogOpen(true)}
                            >
                                <CheckCircle2 className="h-5 w-5 mr-3" />
                                Approve Lease
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full rounded-xl h-12 font-medium border-black/10 hover:bg-gray-50 hover:text-black shadow-none"
                                onClick={() => setRevisionDialogOpen(true)}
                            >
                                <RefreshCcw className="h-4 w-4 mr-2" />
                                Request Revision
                            </Button>
                            <Button
                                variant="destructive"
                                className="w-full rounded-xl h-12 font-medium bg-white text-red-600 border border-black/5 hover:bg-red-50 hover:text-red-700 hover:border-red-100 shadow-none"
                                onClick={() => setRejectDialogOpen(true)}
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                            </Button>
                        </div>
                    )}

                    {/* Tenant Info */}
                    {lease.tenant && (
                        <div className="p-6 rounded-2xl bg-white border border-black/5">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-black/40 mb-4">Tenant</h3>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center border border-black/5 overflow-hidden">
                                    {(lease.tenant.avatar_url || lease.tenant.avatarUrl) ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            src={lease.tenant.avatar_url || lease.tenant.avatarUrl}
                                            alt={lease.tenant.fullName || 'Tenant'}
                                            className="h-full w-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <User className="h-6 w-6 text-black/40" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-black">{lease.tenant.fullName || 'Tenant'}</p>
                                    <p className="text-xs font-medium text-black/60">{lease.tenant.email}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-5 rounded-2xl bg-white border border-black/5 text-center">
                            <p className="text-2xl font-[family-name:var(--font-anton)] text-black">
                                N$ {(lease.monthly_rent || lease.monthlyRent)?.toLocaleString()}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-black/40">Monthly Rent</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-white border border-black/5 text-center">
                            <p className="text-2xl font-[family-name:var(--font-anton)] text-black">
                                N$ {lease.deposit?.toLocaleString()}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-black/40">Deposit</p>
                        </div>
                    </div>

                    {/* Download */}
                    {/* Download */}
                    <div className="w-full">
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
                            className="w-full block"
                        >
                            {/* @ts-ignore - render prop type mismatch in some versions */}
                            {({ loading, error }: any) => (
                                <Button
                                    variant="outline"
                                    className="w-full rounded-xl h-11 border-dashed border-black/20 text-black/40 hover:text-black hover:border-black/40 hover:bg-black/5 shadow-none"
                                    disabled={loading}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    {loading ? 'Generating PDF...' : 'Download PDF'}
                                </Button>
                            )}
                        </PDFDownloadLink>
                    </div>
                </div>
            </div>

            {/* Approve Dialog */}
            <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                <DialogContent className="max-w-md rounded-3xl border border-black/5 shadow-none p-6">
                    <DialogHeader>
                        <DialogTitle className="font-[family-name:var(--font-anton)] text-2xl uppercase tracking-wide">Approve Lease</DialogTitle>
                        <DialogDescription className="text-black/60 font-medium">
                            By approving this lease, the property will be automatically unlisted.
                            You can optionally add your signature.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6">
                        <SignatureCanvas
                            onSignatureChange={setLandlordSignature}
                            initialSignature={landlordSignature}
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setApproveDialogOpen(false)} className="rounded-xl font-medium hover:bg-black/5 shadow-none">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleApprove}
                            disabled={isSubmitting}
                            className="bg-black hover:bg-black/90 text-white rounded-xl px-6 font-bold shadow-none"
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Approve Lease
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent className="rounded-3xl border border-black/5 shadow-none p-6">
                    <DialogHeader>
                        <DialogTitle className="font-[family-name:var(--font-anton)] text-2xl uppercase tracking-wide">Reject Lease</DialogTitle>
                        <DialogDescription className="text-black/60 font-medium">
                            Please provide a reason for rejecting this lease. The tenant will be notified.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="Reason for rejection..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="rounded-xl bg-gray-50 border-black/5 focus-visible:ring-black/20 resize-none shadow-none"
                    />
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setRejectDialogOpen(false)} className="rounded-xl font-medium hover:bg-black/5 shadow-none">
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={isSubmitting || !notes.trim()}
                            className="rounded-xl px-6 font-bold shadow-none"
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Reject Lease
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Revision Dialog */}
            <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
                <DialogContent className="rounded-3xl border border-black/5 shadow-none p-6">
                    <DialogHeader>
                        <DialogTitle className="font-[family-name:var(--font-anton)] text-2xl uppercase tracking-wide">Request Revision</DialogTitle>
                        <DialogDescription className="text-black/60 font-medium">
                            Ask the tenant to revise their submission. They will need to re-upload documents and sign again.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="What needs to be revised (e.g., ID is blurry, missing payslip)..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="rounded-xl bg-gray-50 border-black/5 focus-visible:ring-black/20 resize-none shadow-none"
                    />
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setRevisionDialogOpen(false)} className="rounded-xl font-medium hover:bg-black/5 shadow-none">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRequestRevision}
                            disabled={isSubmitting || !notes.trim()}
                            className="bg-black hover:bg-black/90 text-white rounded-xl px-6 font-bold shadow-none"
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
