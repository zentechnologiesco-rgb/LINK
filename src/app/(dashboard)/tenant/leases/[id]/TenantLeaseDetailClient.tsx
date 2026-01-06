'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { LeaseStatusTimeline } from '@/components/leases/LeaseStatusTimeline'
import { LeasePreview } from '@/components/leases/LeasePreview'
import { SignatureCanvas } from '@/components/leases/SignatureCanvas'
import { DocumentUploader, DocumentFile } from '@/components/leases/DocumentUploader'
import { submitSignedLease } from '../actions'
import { toast } from 'sonner'
import {
    ArrowLeft,
    Building2,
    User,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    Send,
    FileText
} from 'lucide-react'

interface TenantLeaseDetailClientProps {
    lease: any
}

export function TenantLeaseDetailClient({ lease }: TenantLeaseDetailClientProps) {
    const router = useRouter()
    const [signature, setSignature] = useState<string | null>(lease.tenant_signature_data || null)
    const [documents, setDocuments] = useState<DocumentFile[]>(lease.tenant_documents || [])
    const [isSubmitting, setIsSubmitting] = useState(false)

    const canSign = ['sent_to_tenant', 'revision_requested'].includes(lease.status)
    const hasSigned = lease.status === 'tenant_signed' || lease.status === 'approved'
    const isApproved = lease.status === 'approved'
    const isRejected = lease.status === 'rejected'
    const needsRevision = lease.status === 'revision_requested'

    // Check if required documents are uploaded
    const hasRequiredDocs = documents.some(d => d.type === 'id_front') &&
        documents.some(d => d.type === 'id_back')
    const canSubmit = canSign && signature && hasRequiredDocs

    const handleSubmit = async () => {
        if (!canSubmit) return

        setIsSubmitting(true)
        try {
            const result = await submitSignedLease({
                leaseId: lease.id,
                signature: signature!,
                documents,
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Lease signed and submitted successfully!')
                router.refresh()
            }
        } catch (error) {
            toast.error('Failed to submit lease. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/tenant/leases">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Lease Agreement</h1>
                        <p className="text-muted-foreground">{lease.property?.title}</p>
                    </div>
                </div>
            </div>

            {/* Status Alerts */}
            {needsRevision && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Revision Requested</AlertTitle>
                    <AlertDescription>
                        The landlord has requested changes: {lease.landlord_notes || 'Please review and resubmit.'}
                    </AlertDescription>
                </Alert>
            )}

            {hasSigned && !isApproved && (
                <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Lease Signed</AlertTitle>
                    <AlertDescription>
                        Your signed lease has been submitted. Waiting for landlord approval.
                    </AlertDescription>
                </Alert>
            )}

            {isApproved && (
                <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Lease Approved!</AlertTitle>
                    <AlertDescription className="text-green-700">
                        Congratulations! Your lease has been approved. Your tenancy begins on {new Date(lease.start_date).toLocaleDateString()}.
                    </AlertDescription>
                </Alert>
            )}

            {isRejected && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Lease Rejected</AlertTitle>
                    <AlertDescription>
                        {lease.landlord_notes || 'The landlord has rejected this lease agreement.'}
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Lease Document Preview */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="h-5 w-5" />
                            <h2 className="text-lg font-semibold">Lease Document</h2>
                        </div>
                        <LeasePreview
                            leaseDocument={leaseDocument}
                            property={{
                                title: lease.property?.title || 'Property',
                                address: lease.property?.address || '',
                                city: lease.property?.city || '',
                                images: lease.property?.images,
                            }}
                            landlord={{
                                full_name: lease.landlord?.full_name || '',
                                email: lease.landlord?.email || '',
                                phone: lease.landlord?.phone,
                            }}
                            tenant={{
                                full_name: lease.tenant?.full_name || '',
                                email: lease.tenant?.email || '',
                                phone: lease.tenant?.phone,
                            }}
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
                    </div>

                    {/* Signing Section (only if can sign) */}
                    {canSign && (
                        <>
                            <Separator />

                            {/* Document Upload */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Upload Required Documents</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <DocumentUploader
                                        tenantId={lease.tenant?.id || ''}
                                        leaseId={lease.id}
                                        documents={documents}
                                        onDocumentsChange={setDocuments}
                                        requiredDocuments={['id_front', 'id_back']}
                                    />
                                </CardContent>
                            </Card>

                            {/* Signature */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Sign the Lease</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <SignatureCanvas
                                        onSignatureChange={setSignature}
                                        initialSignature={signature}
                                    />
                                </CardContent>
                            </Card>

                            {/* Submit Button */}
                            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                        <div>
                                            <h3 className="font-semibold text-green-800">Ready to Submit?</h3>
                                            <p className="text-sm text-green-700">
                                                {!hasRequiredDocs && 'Please upload your ID documents. '}
                                                {!signature && 'Please sign the lease. '}
                                                {canSubmit && 'Review the lease and submit when ready.'}
                                            </p>
                                        </div>
                                        <Button
                                            size="lg"
                                            onClick={handleSubmit}
                                            disabled={!canSubmit || isSubmitting}
                                            className="bg-green-600 hover:bg-green-700 gap-2"
                                        >
                                            {isSubmitting ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Send className="h-4 w-4" />
                                            )}
                                            {isSubmitting ? 'Submitting...' : 'Submit Signed Lease'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
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

                    {/* Landlord Info */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Landlord
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                                    {lease.landlord?.avatar_url ? (
                                        <Image
                                            src={lease.landlord.avatar_url}
                                            alt={lease.landlord?.full_name || 'Landlord'}
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
                                    <p className="font-semibold">{lease.landlord?.full_name || 'Landlord'}</p>
                                    <p className="text-sm text-muted-foreground">{lease.landlord?.email}</p>
                                    {lease.landlord?.phone && (
                                        <p className="text-sm text-muted-foreground">{lease.landlord.phone}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Property Info */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Property
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative h-32 rounded-lg overflow-hidden bg-gray-100 mb-3">
                                {lease.property?.images?.[0] ? (
                                    <Image
                                        src={lease.property.images[0]}
                                        alt={lease.property?.title || 'Property'}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center">
                                        <Building2 className="h-8 w-8 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <p className="font-semibold">{lease.property?.title}</p>
                            <p className="text-sm text-muted-foreground">
                                {lease.property?.address}, {lease.property?.city}
                            </p>
                        </CardContent>
                    </Card>

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
                </div>
            </div>
        </div>
    )
}
