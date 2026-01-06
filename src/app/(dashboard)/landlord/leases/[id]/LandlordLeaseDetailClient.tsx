'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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
import { LeaseStatusTimeline } from '@/components/leases/LeaseStatusTimeline'
import { LeasePreview } from '@/components/leases/LeasePreview'
import { SignatureCanvas } from '@/components/leases/SignatureCanvas'
import { approveLease, rejectLease, requestRevision, recordPayment } from '../actions'
import { toast } from 'sonner'
import {
    ArrowLeft,
    Building2,
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

    const statusColors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-700',
        paid: 'bg-green-100 text-green-700',
        overdue: 'bg-red-100 text-red-700',
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/landlord/leases">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">{lease.property?.title}</h1>
                        <p className="text-muted-foreground">{lease.property?.address}</p>
                    </div>
                </div>
            </div>

            {/* Action Required Alert */}
            {canApprove && (
                <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-800">Action Required</AlertTitle>
                    <AlertDescription className="text-yellow-700">
                        The tenant has signed this lease and uploaded their documents. Please review and approve or request changes.
                    </AlertDescription>
                </Alert>
            )}

            {isApproved && (
                <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Lease Active</AlertTitle>
                    <AlertDescription className="text-green-700">
                        This lease is approved and active. The property has been unlisted from search.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tenant Documents (if signed) */}
                    {lease.tenant_documents && lease.tenant_documents.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Tenant Documents</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {lease.tenant_documents.map((doc: any, index: number) => (
                                        <a
                                            key={index}
                                            href={doc.signedUrl || doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                            <FileText className="h-5 w-5 text-muted-foreground" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm capitalize">
                                                    {doc.type.replace('_', ' ')}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {doc.name}
                                                </p>
                                            </div>
                                            <Eye className="h-4 w-4" />
                                        </a>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Tenant Signature */}
                    {lease.tenant_signature_data && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Tenant Signature</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-lg p-4 bg-white">
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
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Payment History
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {payments.map((payment: any) => (
                                        <div key={payment.id} className="flex items-center justify-between p-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${payment.status === 'paid' ? 'bg-green-100' :
                                                    payment.status === 'overdue' ? 'bg-red-100' : 'bg-yellow-100'
                                                    }`}>
                                                    {payment.status === 'paid' ? (
                                                        <Check className="h-5 w-5 text-green-600" />
                                                    ) : payment.status === 'overdue' ? (
                                                        <AlertCircle className="h-5 w-5 text-red-600" />
                                                    ) : (
                                                        <Clock className="h-5 w-5 text-yellow-600" />
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
                                                    <span className={`text-xs px-2 py-0.5 rounded ${statusColors[payment.status]}`}>
                                                        {payment.status}
                                                    </span>
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Lease Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
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
                        <Card className="border-2 border-yellow-200">
                            <CardHeader>
                                <CardTitle className="text-lg">Take Action</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    onClick={() => setApproveDialogOpen(true)}
                                >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Approve Lease
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setRevisionDialogOpen(true)}
                                >
                                    <RefreshCcw className="h-4 w-4 mr-2" />
                                    Request Revision
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full text-red-600 hover:text-red-700"
                                    onClick={() => setRejectDialogOpen(true)}
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Tenant Info */}
                    {lease.tenant && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Tenant
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                                        {lease.tenant?.avatar_url ? (
                                            <Image
                                                src={lease.tenant.avatar_url}
                                                alt={lease.tenant?.full_name || 'Tenant'}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center">
                                                <User className="h-6 w-6 text-gray-400" />
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
                    <Card>
                        <CardContent className="p-4">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold text-green-600">
                                        N$ {lease.monthly_rent?.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Monthly Rent</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        N$ {lease.deposit?.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Deposit</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Download PDF */}
                    <Button variant="outline" className="w-full" disabled>
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
                        <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleApprove}
                            disabled={isSubmitting}
                            className="bg-green-600 hover:bg-green-700"
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
                        <DialogTitle className="text-red-600">Reject Lease</DialogTitle>
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
                            variant="destructive"
                            onClick={handleReject}
                            disabled={isSubmitting || !notes.trim()}
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
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRevisionDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRequestRevision}
                            disabled={isSubmitting || !notes.trim()}
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
