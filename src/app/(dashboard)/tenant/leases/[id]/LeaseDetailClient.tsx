'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LeaseStatusTimeline, LeaseStatusBadge } from '@/components/leases/LeaseStatusTimeline'
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
    Download,
    Calendar,
    MapPin,
    FileText,
    ChevronDown,
    ChevronUp
} from 'lucide-react'
import { LeasePDF } from '@/components/leases/LeasePDF'
import dynamic from 'next/dynamic'
import { format } from 'date-fns'

const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    { ssr: false }
)
import { useMutation } from "convex/react"
import { api } from "../../../../../../convex/_generated/api"
import { cn } from '@/lib/utils'

interface LeaseDetailClientProps {
    lease: any
}

export function LeaseDetailClient({ lease }: LeaseDetailClientProps) {
    const router = useRouter()
    const [signature, setSignature] = useState<string | null>(lease.tenantSignatureData || null)
    const [documents, setDocuments] = useState<DocumentFile[]>(lease.tenantDocuments || [])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showFullDocument, setShowFullDocument] = useState(false)
    const [showTimeline, setShowTimeline] = useState(false)
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

    const startDate = format(new Date(lease.startDate), 'MMM d, yyyy')
    const endDate = format(new Date(lease.endDate), 'MMM d, yyyy')

    return (
        <div className="font-sans text-neutral-900 pb-24">
            {/* Back Button */}
            <Link
                href="/tenant/leases"
                className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-6"
            >
                <ChevronLeft className="h-4 w-4" />
                Leases
            </Link>

            {/* Status Alert */}
            {needsRevision && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100 mb-6">
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-red-900 text-sm">Revision Requested</p>
                        <p className="text-sm text-red-700 mt-0.5">
                            {lease.landlordNotes || 'Please review and resubmit.'}
                        </p>
                    </div>
                </div>
            )}

            {hasSigned && !isApproved && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-neutral-50 border border-neutral-200 mb-6">
                    <CheckCircle2 className="h-5 w-5 text-neutral-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-neutral-900 text-sm">Lease Signed</p>
                        <p className="text-sm text-neutral-600 mt-0.5">
                            Waiting for landlord approval.
                        </p>
                    </div>
                </div>
            )}

            {isApproved && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100 mb-6">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-emerald-900 text-sm">Lease Approved</p>
                        <p className="text-sm text-emerald-700 mt-0.5">
                            Your tenancy begins {startDate}.
                        </p>
                    </div>
                </div>
            )}

            {isRejected && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100 mb-6">
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-red-900 text-sm">Lease Rejected</p>
                        <p className="text-sm text-red-700 mt-0.5">
                            {lease.landlordNotes || 'The landlord has rejected this lease.'}
                        </p>
                    </div>
                </div>
            )}

            {/* Property Header Card */}
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden mb-6">
                {/* Property Image */}
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

                {/* Property Info */}
                <div className="p-4">
                    <h1 className="text-lg font-semibold text-neutral-900 mb-2">
                        {lease.property?.title || 'Property'}
                    </h1>
                    <div className="flex items-center gap-1.5 text-sm text-neutral-500 mb-4">
                        <MapPin className="h-3.5 w-3.5" />
                        {lease.property?.address}, {lease.property?.city}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-neutral-50 rounded-lg p-3">
                            <p className="text-xs text-neutral-500 mb-0.5">Monthly Rent</p>
                            <p className="text-lg font-bold text-neutral-900">
                                N${lease.monthlyRent?.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-neutral-50 rounded-lg p-3">
                            <p className="text-xs text-neutral-500 mb-0.5">Deposit</p>
                            <p className="text-lg font-bold text-neutral-900">
                                N${lease.deposit?.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center gap-2 text-sm text-neutral-600 mt-4 pt-4 border-t border-neutral-100">
                        <Calendar className="h-4 w-4 text-neutral-400" />
                        {startDate} — {endDate}
                    </div>
                </div>
            </div>

            {/* Landlord Info */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-neutral-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {lease.landlord?.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={lease.landlord.avatarUrl}
                                alt={lease.landlord?.fullName}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <User className="h-4 w-4 text-neutral-400" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="font-medium text-neutral-900 text-sm truncate">
                            {lease.landlord?.fullName || 'Landlord'}
                        </p>
                        <p className="text-xs text-neutral-500 truncate">
                            {lease.landlord?.email}
                        </p>
                    </div>
                </div>
            </div>

            {/* Status Timeline - Collapsible */}
            <div className="bg-white rounded-xl border border-neutral-200 mb-6">
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
                            createdAt={lease.createdAt || lease.sentAt}
                            sentAt={lease.sentAt}
                            signedAt={lease.signedAt}
                            approvedAt={lease.approvedAt}
                        />
                    </div>
                )}
            </div>

            {/* Lease Document - Collapsible */}
            <div className="bg-white rounded-xl border border-neutral-200 mb-6">
                <button
                    onClick={() => setShowFullDocument(!showFullDocument)}
                    className="w-full flex items-center justify-between p-4"
                >
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-neutral-500" />
                        <span className="text-sm font-medium text-neutral-900">Lease Document</span>
                    </div>
                    {showFullDocument ? (
                        <ChevronUp className="h-4 w-4 text-neutral-400" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-neutral-400" />
                    )}
                </button>
                {showFullDocument && (
                    <div className="px-4 pb-4 pt-0 overflow-x-auto">
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
                    </div>
                )}
            </div>

            {/* Signing Section */}
            {canSign && (
                <div className="space-y-6">
                    {/* Documents Upload */}
                    <div className="bg-white rounded-xl border border-neutral-200 p-4">
                        <h2 className="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                            <span className={cn(
                                "h-5 w-5 rounded-full text-xs flex items-center justify-center font-bold",
                                hasRequiredDocs
                                    ? "bg-emerald-100 text-emerald-600"
                                    : "bg-neutral-100 text-neutral-500"
                            )}>
                                1
                            </span>
                            Upload ID Documents
                        </h2>
                        <DocumentUploader
                            tenantId={lease.tenantId || ''}
                            leaseId={lease._id}
                            documents={documents}
                            onDocumentsChange={setDocuments}
                            requiredDocuments={['id_front', 'id_back']}
                        />
                    </div>

                    {/* Signature */}
                    <div className="bg-white rounded-xl border border-neutral-200 p-4">
                        <h2 className="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                            <span className={cn(
                                "h-5 w-5 rounded-full text-xs flex items-center justify-center font-bold",
                                signature
                                    ? "bg-emerald-100 text-emerald-600"
                                    : "bg-neutral-100 text-neutral-500"
                            )}>
                                2
                            </span>
                            Sign Lease
                        </h2>
                        <SignatureCanvas
                            onSignatureChange={setSignature}
                            initialSignature={signature}
                        />
                    </div>

                    {/* Submit */}
                    <div className="bg-neutral-900 rounded-xl p-4 text-white">
                        <h3 className="font-semibold mb-1">Submit Lease</h3>
                        <p className="text-sm text-neutral-400 mb-4">
                            {!hasRequiredDocs && 'Please upload your ID documents. '}
                            {!signature && 'Please sign the lease. '}
                            {canSubmit && 'Once submitted, this action cannot be undone.'}
                        </p>
                        <Button
                            onClick={handleSubmit}
                            disabled={!canSubmit || isSubmitting}
                            className="w-full bg-white text-neutral-900 hover:bg-neutral-100 h-11 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Send className="h-4 w-4 mr-2" />
                            )}
                            {isSubmitting ? 'Submitting...' : 'Sign & Submit'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Download PDF - Show when signed/approved */}
            {(hasSigned || isApproved) && (
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
                                    tenant: {
                                        fullName: lease.tenant?.fullName || '',
                                        email: lease.tenant?.email || '',
                                        phone: lease.tenant?.phone,
                                    },
                                    leaseTerms: {
                                        startDate: lease.startDate,
                                        endDate: lease.endDate,
                                        monthlyRent: lease.monthlyRent,
                                        deposit: lease.deposit,
                                    },
                                    tenantSignature: lease.tenantSignatureData,
                                    landlordSignature: lease.landlordSignatureData,
                                    signedAt: lease.signedAt,
                                }}
                            />
                        }
                        fileName={`Lease_${lease.property?.title}_${format(new Date(), 'yyyy-MM-dd')}.pdf`}
                        className="block"
                    >
                        {/* @ts-ignore - render prop type mismatch in some versions */}
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
            )}
        </div>
    )
}
