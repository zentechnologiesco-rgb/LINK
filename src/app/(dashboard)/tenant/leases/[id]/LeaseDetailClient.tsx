'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LeaseStatusTimeline } from '@/components/leases/LeaseStatusTimeline'
import { LeasePreview } from '@/components/leases/LeasePreview'
import { SignatureCanvas } from '@/components/leases/SignatureCanvas'
import { DocumentUploader, DocumentFile } from '@/components/leases/DocumentUploader'
import { toast } from 'sonner'
import {
    ChevronLeft,
    Building2,
    User,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    Send,
    FileText,
    Info
} from 'lucide-react'
import { useMutation } from "convex/react"
import { api } from "../../../../../../convex/_generated/api"

interface LeaseDetailClientProps {
    lease: any
}

export function LeaseDetailClient({ lease }: LeaseDetailClientProps) {
    const router = useRouter()
    const [signature, setSignature] = useState<string | null>(lease.tenantSignatureData || null)
    const [documents, setDocuments] = useState<DocumentFile[]>(lease.tenantDocuments || [])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const tenantSign = useMutation(api.leases.tenantSign)

    const canSign = ['sent_to_tenant', 'revision_requested'].includes(lease.status)
    const hasSigned = lease.status === 'tenant_signed' || lease.status === 'approved'
    const isApproved = lease.status === 'approved'
    const isRejected = lease.status === 'rejected'
    const needsRevision = lease.status === 'revision_requested'

    const hasRequiredDocs = documents.some(d => d.type === 'id_front') &&
        documents.some(d => d.type === 'id_back')
    const canSubmit = canSign && signature && hasRequiredDocs

    const handleSubmit = async () => {
        if (!canSubmit) return

        setIsSubmitting(true)
        try {
            await tenantSign({
                leaseId: lease._id,
                signatureData: signature!,
                tenantDocuments: documents.map(d => ({
                    type: d.type,
                    storageId: d.storageId,
                    uploadedAt: d.uploadedAt
                })),
            })

            toast.success('Lease signed and submitted successfully!')
            router.refresh()
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Failed to submit lease. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const leaseDocument = lease.leaseDocument || {
        title: 'Residential Lease Agreement',
        clauses: [],
    }

    return (
        <div className="px-6 py-6">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/tenant/leases"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to leases
                </Link>
                <h1 className="text-2xl font-semibold text-foreground">{lease.property?.title}</h1>
                <p className="text-muted-foreground mt-1">{lease.property?.address}</p>
            </div>

            {/* Status Alerts */}
            {needsRevision && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-foreground">Revision Requested</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {lease.landlordNotes || 'Please review and resubmit.'}
                        </p>
                    </div>
                </div>
            )}

            {hasSigned && !isApproved && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-sidebar-accent/50 mb-6">
                    <CheckCircle2 className="h-5 w-5 text-lime-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-foreground">Lease Signed</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Your signed lease has been submitted. Waiting for landlord approval.
                        </p>
                    </div>
                </div>
            )}

            {isApproved && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-lime-500/10 border border-lime-500/20 mb-6">
                    <CheckCircle2 className="h-5 w-5 text-lime-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-foreground">Lease Approved!</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Congratulations! Your tenancy begins on {new Date(lease.startDate).toLocaleDateString()}.
                        </p>
                    </div>
                </div>
            )}

            {isRejected && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-foreground">Lease Rejected</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {lease.landlordNotes || 'The landlord has rejected this lease agreement.'}
                        </p>
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Lease Document Preview */}
                    <section>
                        <h2 className="text-lg font-medium text-foreground mb-4">Lease Document</h2>
                        <LeasePreview
                            leaseDocument={leaseDocument}
                            property={{
                                title: lease.property?.title || 'Property',
                                address: lease.property?.address || '',
                                city: lease.property?.city || '',
                                images: lease.property?.images,
                            }}
                            landlord={{
                                fullName: lease.landlord?.fullName || '',
                                email: lease.landlord?.email || '',
                                phone: lease.landlord?.phone,
                            }}
                            tenant={{
                                fullName: lease.tenant?.fullName || '',
                                email: lease.tenant?.email || '',
                                phone: lease.tenant?.phone,
                            }}
                            leaseTerms={{
                                startDate: lease.startDate,
                                endDate: lease.endDate,
                                monthlyRent: lease.monthlyRent,
                                deposit: lease.deposit,
                            }}
                            tenantSignature={lease.tenantSignatureData}
                            landlordSignature={lease.landlordSignatureData}
                            signedAt={lease.signedAt}
                        />
                    </section>

                    {/* Signing Section */}
                    {canSign && (
                        <>
                            {/* Document Upload */}
                            <section>
                                <h2 className="text-lg font-medium text-foreground mb-4">Upload Required Documents</h2>
                                <div className="p-5 rounded-xl bg-sidebar-accent/30">
                                    <DocumentUploader
                                        tenantId={lease.tenantId || ''}
                                        leaseId={lease._id}
                                        documents={documents}
                                        onDocumentsChange={setDocuments}
                                        requiredDocuments={['id_front', 'id_back']}
                                    />
                                </div>
                            </section>

                            {/* Signature */}
                            <section>
                                <h2 className="text-lg font-medium text-foreground mb-4">Sign the Lease</h2>
                                <div className="p-5 rounded-xl bg-sidebar-accent/30">
                                    <SignatureCanvas
                                        onSignatureChange={setSignature}
                                        initialSignature={signature}
                                    />
                                </div>
                            </section>

                            {/* Submit Button */}
                            <div className="p-6 rounded-xl bg-lime-500/10 border border-lime-500/20">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div>
                                        <h3 className="font-medium text-foreground">Ready to Submit?</h3>
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            {!hasRequiredDocs && 'Please upload your ID documents. '}
                                            {!signature && 'Please sign the lease. '}
                                            {canSubmit && 'Review the lease and submit when ready.'}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={!canSubmit || isSubmitting}
                                        className="bg-lime-500 hover:bg-lime-600 text-white rounded-lg h-11 px-6 font-medium shadow-lg shadow-lime-500/20"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Send className="h-4 w-4 mr-2" />
                                        )}
                                        {isSubmitting ? 'Submitting...' : 'Submit Signed Lease'}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Status Timeline */}
                    <div className="p-4 rounded-xl bg-sidebar-accent/30">
                        <h3 className="text-sm font-medium text-muted-foreground mb-4">Lease Status</h3>
                        <LeaseStatusTimeline
                            status={lease.status}
                            createdAt={lease.createdAt || lease.sentAt}
                            sentAt={lease.sentAt}
                            signedAt={lease.signedAt}
                            approvedAt={lease.approvedAt}
                        />
                    </div>

                    {/* Landlord Info */}
                    <div className="p-4 rounded-xl bg-sidebar-accent/30">
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">Landlord</h3>
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-sidebar-accent flex items-center justify-center">
                                {lease.landlord?.avatarUrl ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={lease.landlord.avatarUrl}
                                        alt={lease.landlord?.fullName || 'Landlord'}
                                        className="h-full w-full rounded-full object-cover"
                                    />
                                ) : (
                                    <User className="h-6 w-6 text-muted-foreground" />
                                )}
                            </div>
                            <div>
                                <p className="font-medium text-foreground">{lease.landlord?.fullName || 'Landlord'}</p>
                                <p className="text-sm text-muted-foreground">{lease.landlord?.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Property Info */}
                    <div className="p-4 rounded-xl bg-sidebar-accent/30">
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">Property</h3>
                        <div className="h-32 rounded-lg overflow-hidden bg-sidebar-accent mb-3 flex items-center justify-center">
                            {lease.property?.imageUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={lease.property.imageUrl}
                                    alt={lease.property?.title || 'Property'}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <Building2 className="h-8 w-8 text-muted-foreground" />
                            )}
                        </div>
                        <p className="font-medium text-foreground">{lease.property?.title}</p>
                        <p className="text-sm text-muted-foreground">
                            {lease.property?.address}, {lease.property?.city}
                        </p>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-xl bg-sidebar-accent/50 text-center">
                            <p className="text-xl font-semibold text-lime-600">
                                N$ {lease.monthlyRent?.toLocaleString()}
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
                </div>
            </div>
        </div>
    )
}
