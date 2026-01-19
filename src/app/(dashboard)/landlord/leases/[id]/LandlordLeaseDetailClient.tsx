'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { approveLease, rejectLease, requestRevision, recordPayment } from '../actions'
import { toast } from 'sonner'
import {
    ArrowLeft,
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
    Check
} from 'lucide-react'
import { format } from 'date-fns'

interface LandlordLeaseDetailClientProps {
    lease: any
    payments: any[]
}

export function LandlordLeaseDetailClient({ lease, payments }: LandlordLeaseDetailClientProps) {
    const router = useRouter()
    const [landlordSignature, setLandlordSignature] = useState<string | null>(
        lease.landlord_signature_data || null
    )
    const [approveDialogOpen, setApproveDialogOpen] = useState(false)
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [revisionDialogOpen, setRevisionDialogOpen] = useState(false)
    const [notes, setNotes] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const canApprove = lease.status === 'tenant_signed'
    const isApproved = lease.status === 'approved'

    // Default lease document if not set
    const leaseDocument = lease.lease_document || {
        title: 'Residential Lease Agreement',
        clauses: [
            { id: '1', title: 'Rent Payment', content: 'Tenant agrees to pay the monthly rent amount on or before the 1st day of each month.' },
            { id: '2', title: 'Security Deposit', content: 'Tenant shall pay a security deposit which will be returned at the end of the lease term.' },
            { id: '3', title: 'Property Condition', content: 'Tenant agrees to maintain the property in good condition.' },
        ],
        petPolicy: 'no_pets',
        utilitiesIncluded: [],
        parkingIncluded: false,
        maintenanceResponsibility: 'shared',
        noticePeriodDays: 30,
        lateFeePercentage: 5,
        specialConditions: '',
    }

    const handleApprove = async () => {
        setIsSubmitting(true)
        try {
            const result = await approveLease(lease.id, landlordSignature || undefined)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Lease approved! Property has been unlisted.')
                setApproveDialogOpen(false)
                router.refresh()
            }
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
            const result = await rejectLease(lease.id, notes)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Lease rejected.')
                setRejectDialogOpen(false)
                router.refresh()
            }
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
            const result = await requestRevision(lease.id, notes)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Revision requested. Tenant will be notified.')
                setRevisionDialogOpen(false)
                router.refresh()
            }
        } catch (error) {
            toast.error('Failed to request revision.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleMarkPaid = async (paymentId: string) => {
        const result = await recordPayment(paymentId)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Payment marked as paid!')
            router.refresh()
        }
    }

    return (
        <div className="px-4 py-6 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-background">
                        <FileText className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight truncate">
                                {lease.property?.title}
                            </h1>
                            <LeaseStatusBadge status={lease.status} />
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{lease.property?.address}</p>
                    </div>
                </div>

                <Link href="/landlord/leases" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:w-auto">
                        <ArrowLeft className="mr-2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                        Back to leases
                    </Button>
                </Link>
            </div>

            {/* Action Required Alert */}
            {canApprove && (
                <Alert className="bg-muted/40">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    <AlertTitle>Action Required</AlertTitle>
                    <AlertDescription className="text-muted-foreground">
                        The tenant has signed this lease and uploaded their documents. Please review and approve or request changes.
                    </AlertDescription>
                </Alert>
            )}

            {isApproved && (
                <Alert className="bg-muted/40">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    <AlertTitle>Lease Active</AlertTitle>
                    <AlertDescription className="text-muted-foreground">
                        This lease is approved and active. The property has been unlisted from search.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tenant Documents (if signed) */}
                    {lease.tenant_documents && lease.tenant_documents.length > 0 && (
                        <Card className="gap-0 py-0">
                            <CardHeader className="border-b px-4 sm:px-6 py-4">
                                <CardTitle className="text-base font-semibold tracking-tight">Tenant Documents</CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 sm:px-6 py-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {lease.tenant_documents.map((doc: any, index: number) => (
                                        <a
                                            key={index}
                                            href={doc.signedUrl || doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 border rounded-xl hover:bg-muted/40 transition-colors"
                                        >
                                            <FileText className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm capitalize">
                                                    {doc.type.replace('_', ' ')}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {doc.name}
                                                </p>
                                            </div>
                                            <Eye className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                                        </a>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Tenant Signature */}
                    {lease.tenant_signature_data && (
                        <Card className="gap-0 py-0">
                            <CardHeader className="border-b px-4 sm:px-6 py-4">
                                <CardTitle className="text-base font-semibold tracking-tight">Tenant Signature</CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 sm:px-6 py-6">
                                <div className="border rounded-xl p-4 bg-muted/20">
                                    <Image
                                        src={lease.tenant_signature_data}
                                        alt="Tenant signature"
                                        width={300}
                                        height={100}
                                        className="object-contain"
                                    />
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Signed on {format(new Date(lease.signed_at), 'MMM d, yyyy h:mm a')}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Lease Document */}
                    <LeasePreview
                        leaseDocument={leaseDocument}
                        property={{
                            title: lease.property?.title || '',
                            address: lease.property?.address || '',
                            city: lease.property?.city || '',
                            images: lease.property?.images,
                        }}
                        landlord={{
                            full_name: lease.landlord?.full_name || '',
                            email: lease.landlord?.email || '',
                            phone: lease.landlord?.phone,
                        }}
                        tenant={lease.tenant ? {
                            full_name: lease.tenant.full_name || '',
                            email: lease.tenant.email || '',
                            phone: lease.tenant.phone,
                        } : undefined}
                        leaseTerms={{
                            startDate: lease.start_date,
                            endDate: lease.end_date,
                            monthlyRent: lease.monthly_rent,
                            deposit: lease.deposit,
                        }}
                        tenantSignature={lease.tenant_signature_data}
                        landlordSignature={lease.landlord_signature_data}
                        signedAt={lease.signed_at}
                    />

                    {/* Payments (if approved) */}
                    {isApproved && payments.length > 0 && (
                        <Card className="gap-0 py-0">
                            <CardHeader className="border-b px-4 sm:px-6 py-4">
                                <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                                    Payment History
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {payments.map((payment: any) => (
                                        <div key={payment.id} className="flex items-center justify-between p-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full flex items-center justify-center border bg-muted/30">
                                                    {payment.status === 'paid' ? (
                                                        <Check className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                                                    ) : payment.status === 'overdue' ? (
                                                        <AlertCircle className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                                                    ) : (
                                                        <Clock className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium capitalize">{payment.type}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Due: {format(new Date(payment.due_date), 'MMM d, yyyy')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="font-semibold">N$ {payment.amount?.toLocaleString()}</p>
                                                    <Badge variant="secondary" className="mt-1 capitalize text-muted-foreground">
                                                        {payment.status}
                                                    </Badge>
                                                </div>
                                                {payment.status === 'pending' && (
                                                    <Button size="sm" onClick={() => handleMarkPaid(payment.id)}>
                                                        Mark Paid
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Status Timeline */}
                    <Card className="gap-0 py-0">
                        <CardHeader className="border-b px-4 py-4">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Lease Status</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 py-5">
                            <LeaseStatusTimeline
                                status={lease.status}
                                createdAt={lease.created_at}
                                sentAt={lease.sent_at}
                                signedAt={lease.signed_at}
                                approvedAt={lease.approved_at}
                            />
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    {canApprove && (
                        <Card className="gap-0 py-0">
                            <CardHeader className="border-b px-4 py-4">
                                <CardTitle className="text-base font-semibold tracking-tight">Take Action</CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 py-5 space-y-3">
                                <Button
                                    className="w-full"
                                    onClick={() => setApproveDialogOpen(true)}
                                >
                                    <CheckCircle2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
                                    Approve Lease
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setRevisionDialogOpen(true)}
                                >
                                    <RefreshCcw className="h-4 w-4 mr-2 text-muted-foreground" strokeWidth={1.5} />
                                    Request Revision
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setRejectDialogOpen(true)}
                                >
                                    <XCircle className="h-4 w-4 mr-2 text-muted-foreground" strokeWidth={1.5} />
                                    Reject
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Tenant Info */}
                    {lease.tenant && (
                        <Card className="gap-0 py-0">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Tenant
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    <div className="relative h-12 w-12 rounded-full overflow-hidden border bg-muted/30">
                                        {lease.tenant?.avatar_url ? (
                                            <Image
                                                src={lease.tenant.avatar_url}
                                                alt={lease.tenant?.full_name || 'Tenant'}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center">
                                                <User className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{lease.tenant?.full_name || 'Tenant'}</p>
                                        <p className="text-sm text-muted-foreground">{lease.tenant?.email}</p>
                                        {lease.tenant?.phone && (
                                            <p className="text-sm text-muted-foreground">{lease.tenant.phone}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Quick Stats */}
                    <Card className="gap-0 py-0">
                        <CardContent className="p-4">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-semibold tracking-tight">
                                        N$ {lease.monthly_rent?.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Monthly Rent</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-semibold tracking-tight">
                                        N$ {lease.deposit?.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Deposit</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Download PDF */}
                    <Button variant="outline" className="w-full" disabled>
                        <Download className="h-4 w-4 mr-2 text-muted-foreground" strokeWidth={1.5} />
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
                        <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleApprove}
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" strokeWidth={1.5} />}
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
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleReject}
                            disabled={isSubmitting || !notes.trim()}
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" strokeWidth={1.5} />}
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
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRevisionDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRequestRevision}
                            disabled={isSubmitting || !notes.trim()}
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" strokeWidth={1.5} />}
                            Request Revision
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
