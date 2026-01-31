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
    Download
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
        <div className="px-4 py-8 md:px-6 max-w-[2000px] mx-auto">
            {/* Header */}
            <div className="mb-10">
                <Link
                    href="/tenant/leases"
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black/40 hover:text-black transition-colors mb-6 group"
                >
                    <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back to leases
                </Link>
                <h1 className="font-[family-name:var(--font-anton)] text-4xl uppercase tracking-wide text-black mb-2">
                    {lease.property?.title}
                </h1>
                <p className="text-black/60 font-medium">{lease.property?.address}</p>
            </div>

            {/* Status Alerts */}
            {needsRevision && (
                <div className="flex items-start gap-4 p-6 rounded-3xl bg-red-50 border border-red-100 mb-8">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                        <p className="font-bold text-red-900 uppercase tracking-wide text-sm">Revision Requested</p>
                        <p className="text-sm text-red-700 mt-1 font-medium">
                            {lease.landlordNotes || 'Please review and resubmit.'}
                        </p>
                    </div>
                </div>
            )}

            {hasSigned && !isApproved && (
                <div className="flex items-start gap-4 p-6 rounded-3xl bg-gray-50 border border-black/5 mb-8">
                    <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-black" />
                    </div>
                    <div>
                        <p className="font-bold text-black uppercase tracking-wide text-sm">Lease Signed</p>
                        <p className="text-sm text-black/60 mt-1 font-medium">
                            Your signed lease has been submitted. Waiting for landlord approval.
                        </p>
                    </div>
                </div>
            )}

            {isApproved && (
                <div className="flex items-start gap-4 p-6 rounded-3xl bg-black text-white mb-8 border border-black shadow-xl">
                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <p className="font-bold uppercase tracking-wide text-sm">Lease Approved</p>
                        <p className="text-sm text-white/80 mt-1 font-medium">
                            Congratulations! Your tenancy begins on {new Date(lease.startDate).toLocaleDateString()}.
                        </p>
                    </div>
                </div>
            )}

            {isRejected && (
                <div className="flex items-start gap-4 p-6 rounded-3xl bg-red-50 border border-red-100 mb-8">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                        <p className="font-bold text-red-900 uppercase tracking-wide text-sm">Lease Rejected</p>
                        <p className="text-sm text-red-700 mt-1 font-medium">
                            {lease.landlordNotes || 'The landlord has rejected this lease agreement.'}
                        </p>
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Lease Document Preview */}
                    <section>
                        <h2 className="font-[family-name:var(--font-anton)] text-2xl uppercase text-black mb-6">
                            Lease Document
                        </h2>
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
                                <h2 className="font-[family-name:var(--font-anton)] text-2xl uppercase text-black mb-6">
                                    Required Documents
                                </h2>
                                <div className="p-6 rounded-3xl border border-black/5 bg-gray-50/50">
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
                                <h2 className="font-[family-name:var(--font-anton)] text-2xl uppercase text-black mb-6">
                                    Sign Here
                                </h2>
                                <div className="p-6 rounded-3xl border border-black/5 bg-gray-50/50">
                                    <SignatureCanvas
                                        onSignatureChange={setSignature}
                                        initialSignature={signature}
                                    />
                                </div>
                            </section>

                            {/* Submit Button */}
                            <div className="p-8 rounded-3xl bg-black text-white shadow-2xl shadow-black/20">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="space-y-1">
                                        <h3 className="font-[family-name:var(--font-anton)] text-2xl uppercase tracking-wide">
                                            Submit Lease
                                        </h3>
                                        <p className="text-sm text-white/60 font-medium">
                                            {!hasRequiredDocs && 'Please upload your ID documents. '}
                                            {!signature && 'Please sign the lease. '}
                                            {canSubmit && 'Review terms and submit.'}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={!canSubmit || isSubmitting}
                                        className="bg-white text-black hover:bg-white/90 rounded-full h-14 px-8 font-bold uppercase tracking-widest text-xs transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Send className="h-4 w-4 mr-2" />
                                        )}
                                        {isSubmitting ? 'Sending...' : 'Sign & Submit'}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Status Timeline */}
                    <div className="p-6 rounded-3xl border border-black/5 bg-white shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-black/40 mb-6">Detailed Status</h3>
                        <LeaseStatusTimeline
                            status={lease.status}
                            createdAt={lease.createdAt || lease.sentAt}
                            sentAt={lease.sentAt}
                            signedAt={lease.signedAt}
                            approvedAt={lease.approvedAt}
                        />
                    </div>

                    {/* Landlord Info */}
                    <div className="p-6 rounded-3xl border border-black/5 bg-white shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-black/40 mb-4">Landlord</h3>
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                                {lease.landlord?.avatarUrl ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={lease.landlord.avatarUrl}
                                        alt={lease.landlord?.fullName || 'Landlord'}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <User className="h-6 w-6 text-black/40" />
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-black">{lease.landlord?.fullName || 'Landlord'}</p>
                                <p className="text-xs text-black/50 font-medium">{lease.landlord?.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Property Info */}
                    <div className="p-6 rounded-3xl border border-black/5 bg-white shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-black/40 mb-4">Property</h3>
                        <div className="aspect-video rounded-2xl overflow-hidden bg-gray-100 mb-4 flex items-center justify-center relative">
                            {lease.property?.imageUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={lease.property.imageUrl}
                                    alt={lease.property?.title || 'Property'}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <Building2 className="h-8 w-8 text-black/20" />
                            )}
                        </div>
                        <p className="font-bold text-black">{lease.property?.title}</p>
                        <p className="text-xs text-black/50 font-medium mt-1">
                            {lease.property?.address}, {lease.property?.city}
                        </p>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-3xl bg-black text-white flex flex-col items-center justify-center text-center">
                            <p className="font-[family-name:var(--font-anton)] text-2xl tracking-wide">
                                N$ {lease.monthlyRent?.toLocaleString()}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">Rent</p>
                        </div>
                        <div className="p-5 rounded-3xl border border-black/5 bg-white flex flex-col items-center justify-center text-center">
                            <p className="font-[family-name:var(--font-anton)] text-2xl tracking-wide text-black">
                                N$ {lease.deposit?.toLocaleString()}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mt-1">Deposit</p>
                        </div>
                    </div>

                    {/* Actions */}
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
                            className="w-full block"
                        >
                            {/* @ts-ignore - render prop type mismatch in some versions */}
                            {({ loading, error }: any) => (
                                <Button
                                    variant="outline"
                                    className="w-full rounded-2xl h-12 border-dashed border-black/20 text-black/40 hover:text-black hover:border-black/40 hover:bg-black/5 shadow-none"
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
        </div>
    )
}
