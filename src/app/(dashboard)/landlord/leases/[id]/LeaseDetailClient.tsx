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
        <div className="min-h-screen bg-[#fafafa] font-sans pb-24">
            <div className="px-4 py-8 md:px-6 max-w-[2000px] mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <Link
                        href="/landlord/leases"
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-900 transition-colors mb-6 group"
                    >
                        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back to leases
                    </Link>
                    <div className="flex flex-wrap items-start justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-4">
                                <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-anton)] uppercase tracking-wide text-neutral-900">
                                    {lease.property?.title}
                                </h1>
                                <LeaseStatusBadge status={lease.status} />
                            </div>
                            <p className="text-neutral-500 font-medium mt-2 text-lg font-light">{lease.property?.address}</p>
                        </div>
                    </div>
                </div>

                {/* Action Required Banner */}
                {canApprove && (
                    <div className="flex items-start gap-4 p-6 rounded-2xl bg-neutral-900/5 border border-neutral-200 mb-10">
                        <AlertCircle className="h-5 w-5 text-neutral-900 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-neutral-900 uppercase tracking-wide text-sm">Action Required</p>
                            <p className="text-sm text-neutral-600 mt-1 font-medium leading-relaxed">
                                The tenant has signed this lease. Please review and approve or request changes.
                            </p>
                        </div>
                    </div>
                )}

                {isApproved && (
                    <div className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-neutral-200 mb-10 shadow-sm shadow-neutral-900/5">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-emerald-700 uppercase tracking-wide text-sm">Lease Active</p>
                            <p className="text-sm text-neutral-500 mt-1 font-medium leading-relaxed">
                                This lease is approved and active. The property has been unlisted from search.
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-10">
                        {/* Tenant Documents */}
                        {(lease.tenant_documents || lease.tenantDocuments)?.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold uppercase tracking-wider text-neutral-900 mb-6 font-mono">Tenant Documents</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {(lease.tenant_documents || lease.tenantDocuments).map((doc: any, index: number) => (
                                        <a
                                            key={index}
                                            href={doc.signedUrl || doc.url || doc.storageId}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group flex items-center gap-4 p-4 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-900/5 transition-all"
                                        >
                                            <div className="h-12 w-12 rounded-full bg-neutral-50 flex items-center justify-center group-hover:bg-neutral-900 group-hover:text-white transition-colors duration-300">
                                                <FileText className="h-5 w-5 text-neutral-400 group-hover:text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-neutral-900 capitalize text-sm">
                                                    {doc.type.replace('_', ' ')}
                                                </p>
                                                <p className="text-xs text-neutral-400 font-medium mt-0.5">Click to view</p>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:text-neutral-900 group-hover:translate-x-1 transition-all" />
                                        </a>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Tenant Signature */}
                        {tenantSignature && (
                            <section>
                                <h2 className="text-lg font-bold uppercase tracking-wider text-neutral-900 mb-6 font-mono">Tenant Signature</h2>
                                <div className="p-8 rounded-2xl bg-white border border-neutral-200 shadow-sm shadow-neutral-900/5">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={tenantSignature}
                                        alt="Tenant signature"
                                        className="max-w-[300px] h-auto opacity-90 mx-auto sm:mx-0"
                                    />
                                    <p className="text-xs font-bold text-neutral-400 mt-6 uppercase tracking-wider border-t border-neutral-100 pt-4">
                                        Signed on {format(new Date(signedAt), 'MMM d, yyyy h:mm a')}
                                    </p>
                                </div>
                            </section>
                        )}

                        {/* Lease Document Preview */}
                        <section>
                            <h2 className="text-lg font-bold uppercase tracking-wider text-neutral-900 mb-6 font-mono">Lease Document</h2>
                            <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm shadow-neutral-900/5">
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
                        </section>

                        {/* Payments */}
                        {isApproved && payments.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold uppercase tracking-wider text-neutral-900 mb-6 font-mono">Payment History</h2>
                                <div className="space-y-4">
                                    {payments.map((payment: any) => (
                                        <div
                                            key={payment.id || payment._id}
                                            className="flex items-center justify-between p-5 rounded-2xl bg-white border border-neutral-200 hover:border-neutral-300 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "h-12 w-12 rounded-full flex items-center justify-center",
                                                    payment.status === 'paid' ? "bg-neutral-900 text-white" :
                                                        payment.status === 'overdue' ? "bg-red-50 text-red-600" :
                                                            "bg-neutral-100 text-neutral-500"
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
                                                    <p className="font-bold text-neutral-900 capitalize text-sm">{payment.type}</p>
                                                    <p className="text-xs font-medium text-neutral-500 mt-0.5">
                                                        Due: {format(new Date(payment.due_date || payment.dueDate), 'MMM d, yyyy')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="font-[family-name:var(--font-anton)] text-xl text-neutral-900 tracking-wide">N${payment.amount?.toLocaleString()}</p>
                                                    <span className={cn(
                                                        "text-[9px] font-bold uppercase tracking-wider",
                                                        payment.status === 'paid' ? "text-neutral-900" :
                                                            payment.status === 'overdue' ? "text-red-600" :
                                                                "text-neutral-400"
                                                    )}>
                                                        {payment.status}
                                                    </span>
                                                </div>
                                                {payment.status === 'pending' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleMarkPaid(payment.id || payment._id)}
                                                        className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg border border-transparent shadow-none"
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
                        <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm shadow-neutral-900/5">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-6 font-mono">Lease Status</h3>
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
                            <div className="p-6 rounded-2xl bg-white border border-neutral-200 space-y-3 shadow-sm shadow-neutral-900/5">
                                <h3 className="font-bold text-neutral-900 text-lg mb-4 font-[family-name:var(--font-anton)] uppercase tracking-wide">Take Action</h3>
                                <Button
                                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl h-12 font-bold shadow-lg shadow-neutral-900/10"
                                    onClick={() => setApproveDialogOpen(true)}
                                >
                                    <CheckCircle2 className="h-5 w-5 mr-3" />
                                    Approve Lease
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full rounded-xl h-12 font-medium border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900 shadow-none"
                                    onClick={() => setRevisionDialogOpen(true)}
                                >
                                    <RefreshCcw className="h-4 w-4 mr-2" />
                                    Request Revision
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full rounded-xl h-12 font-medium text-red-600 hover:bg-red-50 hover:text-red-700 shadow-none"
                                    onClick={() => setRejectDialogOpen(true)}
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                </Button>
                            </div>
                        )}

                        {/* Tenant Info */}
                        {lease.tenant && (
                            <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm shadow-neutral-900/5">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-6 font-mono">Tenant</h3>
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center border border-neutral-200 overflow-hidden">
                                        {(lease.tenant.avatar_url || lease.tenant.avatarUrl) ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={lease.tenant.avatar_url || lease.tenant.avatarUrl}
                                                alt={lease.tenant.fullName || 'Tenant'}
                                                className="h-full w-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <User className="h-6 w-6 text-neutral-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-neutral-900">{lease.tenant.fullName || 'Tenant'}</p>
                                        <p className="text-xs font-medium text-neutral-500">{lease.tenant.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-6 rounded-2xl bg-white border border-neutral-200 text-center shadow-sm shadow-neutral-900/5">
                                <p className="text-2xl font-[family-name:var(--font-anton)] text-neutral-900 tracking-wide">
                                    N$ {(lease.monthly_rent || lease.monthlyRent)?.toLocaleString()}
                                </p>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mt-1 font-mono">Monthly Rent</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-white border border-neutral-200 text-center shadow-sm shadow-neutral-900/5">
                                <p className="text-2xl font-[family-name:var(--font-anton)] text-neutral-900 tracking-wide">
                                    N$ {lease.deposit?.toLocaleString()}
                                </p>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mt-1 font-mono">Deposit</p>
                            </div>
                        </div>

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
                                        className="w-full rounded-xl h-12 border-dashed border-neutral-300 text-neutral-500 hover:text-neutral-900 hover:border-neutral-400 hover:bg-white shadow-none"
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
                    <DialogContent className="max-w-md rounded-3xl border border-neutral-200 shadow-2xl p-8 bg-white">
                        <DialogHeader>
                            <DialogTitle className="font-[family-name:var(--font-anton)] text-3xl uppercase tracking-wide text-neutral-900">Approve Lease</DialogTitle>
                            <DialogDescription className="text-neutral-500 font-medium text-base">
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
                            <Button variant="ghost" onClick={() => setApproveDialogOpen(false)} className="rounded-xl font-medium hover:bg-neutral-50 text-neutral-600 shadow-none">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleApprove}
                                disabled={isSubmitting}
                                className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl px-6 font-bold shadow-lg shadow-neutral-900/10"
                            >
                                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                Approve Lease
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Reject Dialog */}
                <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                    <DialogContent className="rounded-3xl border border-neutral-200 shadow-2xl p-8 bg-white">
                        <DialogHeader>
                            <DialogTitle className="font-[family-name:var(--font-anton)] text-3xl uppercase tracking-wide text-neutral-900">Reject Lease</DialogTitle>
                            <DialogDescription className="text-neutral-500 font-medium text-base">
                                Please provide a reason for rejecting this lease. The tenant will be notified.
                            </DialogDescription>
                        </DialogHeader>
                        <Textarea
                            placeholder="Reason for rejection..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                            className="rounded-xl bg-neutral-50 border-neutral-200 focus-visible:ring-neutral-900 resize-none shadow-none text-base"
                        />
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="ghost" onClick={() => setRejectDialogOpen(false)} className="rounded-xl font-medium hover:bg-neutral-50 text-neutral-600 shadow-none">
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
                    <DialogContent className="rounded-3xl border border-neutral-200 shadow-2xl p-8 bg-white">
                        <DialogHeader>
                            <DialogTitle className="font-[family-name:var(--font-anton)] text-3xl uppercase tracking-wide text-neutral-900">Request Revision</DialogTitle>
                            <DialogDescription className="text-neutral-500 font-medium text-base">
                                Ask the tenant to revise their submission. They will need to re-upload documents and sign again.
                            </DialogDescription>
                        </DialogHeader>
                        <Textarea
                            placeholder="What needs to be revised (e.g., ID is blurry, missing payslip)..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                            className="rounded-xl bg-neutral-50 border-neutral-200 focus-visible:ring-neutral-900 resize-none shadow-none text-base"
                        />
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="ghost" onClick={() => setRevisionDialogOpen(false)} className="rounded-xl font-medium hover:bg-neutral-50 text-neutral-600 shadow-none">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleRequestRevision}
                                disabled={isSubmitting || !notes.trim()}
                                className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl px-6 font-bold shadow-lg shadow-neutral-900/10"
                            >
                                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                Request Revision
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
