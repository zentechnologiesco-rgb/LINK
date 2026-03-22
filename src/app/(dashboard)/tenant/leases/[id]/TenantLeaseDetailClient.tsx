'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import { api } from '../../../../../../convex/_generated/api'
import { Id } from '../../../../../../convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { LeaseStatusBadge, LeaseStatusTimeline } from '@/components/leases/LeaseStatusTimeline'
import { SignatureCanvas } from '@/components/leases/SignatureCanvas'
import { DocumentUploader } from '@/components/leases/DocumentUploader'
import { cn } from '@/lib/utils'
import {
    MAINTENANCE_LABELS,
    PET_POLICY_ICONS,
    PET_POLICY_LABELS,
    REQUIRED_TENANT_DOCUMENTS,
    TENANT_DOCUMENT_LABELS,
    type MaintenanceOption,
    type PetPolicy,
} from '@/constants/lease'
import { AlertCircle, ArrowUpRight, Building2, Calendar, Check, ChevronLeft, DollarSign, Loader2 } from 'lucide-react'

const money = new Intl.NumberFormat('en-NA', { style: 'currency', currency: 'NAD', maximumFractionDigits: 0 })
const dates = new Intl.DateTimeFormat('en-NA', { day: 'numeric', month: 'short', year: 'numeric' })
const formatCurrency = (value: number) => money.format(value)
const formatDate = (value: string) => dates.format(new Date(value))

interface TenantDocumentUpload {
    type: string
    storageId: Id<"_storage">
    uploadedAt: string
}

function ordinal(value: number) {
    if (value > 3 && value < 21) return 'th'
    switch (value % 10) {
        case 1: return 'st'
        case 2: return 'nd'
        case 3: return 'rd'
        default: return 'th'
    }
}

export function TenantLeaseDetailClient({ leaseId }: { leaseId: string }) {
    const lease = useQuery(api.leases.getById, { leaseId: leaseId as Id<"leases"> })
    const payments = useQuery(api.payments.getByLease, { leaseId: leaseId as Id<"leases"> })
    const tenantSign = useMutation(api.leases.tenantSign)

    const [showDialog, setShowDialog] = useState(false)
    const [isSigning, setIsSigning] = useState(false)
    const [signatureData, setSignatureData] = useState('')
    const [tenantDocuments, setTenantDocuments] = useState<TenantDocumentUpload[]>([])

    useEffect(() => {
        if (lease?.tenantDocuments) {
            setTenantDocuments(lease.tenantDocuments)
        }
    }, [lease?.tenantDocuments])

    if (lease === undefined || payments === undefined) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
                    <p className="text-sm text-neutral-400 font-medium">Loading your lease…</p>
                </div>
            </div>
        )
    }

    if (!lease) {
        return (
            <div className="py-16 text-center">
                <h2 className="text-lg font-semibold text-neutral-900 mb-2">Lease not found</h2>
                <Link href="/tenant/leases" className="text-sm text-neutral-500 underline">Back to my leases</Link>
            </div>
        )
    }

    const isRevisionFlow = lease.status === 'revision_requested'
    const pendingAction = ['sent_to_tenant', 'revision_requested'].includes(lease.status)
    const missingDocs = REQUIRED_TENANT_DOCUMENTS.filter((type) => !tenantDocuments.find((document) => document.type === type))
    const nextPayment = payments.find((payment) => payment.status !== 'paid') ?? null
    const totals = payments.reduce((acc, payment) => {
        acc[payment.status] += payment.amount
        return acc
    }, { paid: 0, pending: 0, overdue: 0 })
    const leaseClauses = Array.from(
        new Map(
            (lease.leaseDocument?.clauses ?? []).map((clause, index: number) => [
                clause.id?.trim() || `clause_${index}`,
                clause,
            ])
        ).values()
    )

    const handleSign = async () => {
        if (!signatureData) {
            toast.error('Add your signature before submitting.')
            return
        }
        if (missingDocs.length > 0) {
            toast.error(`Upload: ${missingDocs.map((type) => TENANT_DOCUMENT_LABELS[type]).join(', ')}`)
            return
        }

        setIsSigning(true)
        try {
            await tenantSign({
                leaseId: leaseId as Id<"leases">,
                signatureData,
                tenantDocuments,
            })
            toast.success(isRevisionFlow ? 'Revised lease sent back to the landlord.' : 'Lease signed. The landlord can approve it now.')
            setShowDialog(false)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Failed to sign lease')
        } finally {
            setIsSigning(false)
        }
    }

    return (
        <div className="font-sans pb-28">
            <div className="mb-6">
                <Link href="/tenant/leases" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-4">
                    <ChevronLeft className="h-4 w-4" />
                    My Leases
                </Link>
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-neutral-200 bg-neutral-950 text-white mb-6">
                {lease.property?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={lease.property.imageUrl} alt={lease.property?.title || 'Property'} className="h-64 w-full object-cover opacity-60" />
                ) : (
                    <div className="flex h-64 items-center justify-center bg-neutral-900">
                        <Building2 className="h-12 w-12 text-white/30" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Tenant Lease</p>
                        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{lease.property?.title || 'Property'}</h1>
                        <p className="mt-1 text-sm text-white/75">{lease.property?.address}{lease.property?.city ? `, ${lease.property.city}` : ''}</p>
                        <p className="mt-3 text-sm text-white/70">Landlord: {lease.landlord?.fullName || 'Property owner'}</p>
                    </div>
                    <LeaseStatusBadge status={lease.status} />
                </div>
            </div>

            {lease.status === 'revision_requested' && (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <p className="text-sm leading-6 text-amber-800">{lease.landlordNotes || 'The landlord requested updates before approval.'}</p>
                </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                <Stat label="Rent" value={formatCurrency(lease.monthlyRent)} hint={`Due every ${lease.rentDueDay || 1}${ordinal(lease.rentDueDay || 1)}`} icon={DollarSign} />
                <Stat label="Deposit" value={formatCurrency(lease.deposit ?? 0)} hint="Paid at move-in" icon={DollarSign} />
                <Stat label="Move-In" value={formatDate(lease.startDate)} hint={`Ends ${formatDate(lease.endDate)}`} icon={Calendar} />
                <Stat label="Next Due" value={nextPayment ? formatCurrency(nextPayment.amount) : 'Up to Date'} hint={nextPayment ? `${nextPayment.type.replace('_', ' ')} on ${formatDate(nextPayment.dueDate)}` : 'No open balance'} icon={ArrowUpRight} />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                <div className="space-y-6">
                    <Section title="Progress">
                        <LeaseStatusTimeline status={lease.status} createdAt={lease._creationTime} sentAt={lease.sentAt} signedAt={lease.signedAt} approvedAt={lease.approvedAt} />
                    </Section>

                    <Section title="Payment Snapshot" action={<Link href="/tenant/payments"><Button variant="outline" className="h-10 rounded-xl border-neutral-200">Open Payments</Button></Link>}>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <Mini label="Paid" value={formatCurrency(totals.paid)} tone="success" />
                            <Mini label="Pending" value={formatCurrency(totals.pending)} tone="default" />
                            <Mini label="Overdue" value={formatCurrency(totals.overdue)} tone="danger" />
                        </div>
                        <div className="mt-4 space-y-3">
                            {payments.length > 0 ? payments.slice(0, 4).map((payment) => (
                                <div key={payment._id} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-4 py-3">
                                    <div>
                                        <p className="text-sm font-semibold capitalize text-neutral-900">{payment.type.replace('_', ' ')}</p>
                                        <p className="text-xs text-neutral-500">Due {formatDate(payment.dueDate)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-neutral-900">{formatCurrency(payment.amount)}</p>
                                        <p className={cn('text-xs font-medium capitalize', payment.status === 'paid' && 'text-emerald-700', payment.status === 'pending' && 'text-neutral-500', payment.status === 'overdue' && 'text-red-600')}>{payment.status}</p>
                                    </div>
                                </div>
                            )) : <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-5 text-sm text-neutral-500">Payment items appear once the lease is approved.</div>}
                        </div>
                    </Section>

                    <Section title="Rules & Policies">
                        <div className="flex flex-wrap gap-2">
                            <Chip icon="⏳" label={`${lease.gracePeriodDays || 5} day grace period`} />
                            <Chip icon="💸" label={`${lease.lateFeeAmount || 5}${lease.lateFeeType === 'percentage' ? '%' : ' N$'} late fee`} />
                            <Chip icon={PET_POLICY_ICONS[(lease.petPolicy as PetPolicy) || 'no_pets']} label={PET_POLICY_LABELS[(lease.petPolicy as PetPolicy) || 'no_pets']} />
                            <Chip icon="🔧" label={`${MAINTENANCE_LABELS[(lease.maintenanceResponsibility as MaintenanceOption) || 'shared']} maintenance`} />
                            <Chip icon="👥" label={`Max ${lease.maxOccupants || 2} occupants`} />
                            <Chip icon="📋" label={`${lease.noticePeriodDays || 30} day notice`} />
                            {lease.parkingIncluded && <Chip icon="🅿️" label="Parking included" />}
                            {!lease.smokingAllowed && <Chip icon="🚭" label="No smoking" />}
                            {lease.smokingAllowed && <Chip icon="🚬" label="Smoking allowed" />}
                            {lease.sublettingAllowed && <Chip icon="🏠" label="Subletting allowed" />}
                            {lease.utilitiesIncluded?.map((utility: string) => <Chip key={utility} icon="⚡" label={utility} />)}
                        </div>
                    </Section>

                    <Section title="Agreement Terms">
                        <div className="space-y-3">
                            {leaseClauses.map((clause, index: number) => (
                                <div key={clause.id?.trim() || `clause_${index}`} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                                    <p className="text-sm font-semibold text-neutral-900">{index + 1}. {clause.title}</p>
                                    <p className="mt-1 text-sm leading-6 text-neutral-600 whitespace-pre-wrap">{clause.content}</p>
                                </div>
                            ))}
                        </div>
                    </Section>
                </div>

                <div className="space-y-6">
                    <Section title="Move-In Total">
                        <p className="text-3xl font-semibold tracking-tight text-neutral-900">{formatCurrency(lease.monthlyRent + (lease.deposit ?? 0))}</p>
                        <div className="mt-4 space-y-2 text-sm text-neutral-600">
                            <div className="flex items-center justify-between"><span>First rent</span><span className="font-medium text-neutral-900">{formatCurrency(lease.monthlyRent)}</span></div>
                            <div className="flex items-center justify-between"><span>Deposit</span><span className="font-medium text-neutral-900">{formatCurrency(lease.deposit ?? 0)}</span></div>
                            <div className="flex items-center justify-between border-t border-neutral-200 pt-2"><span>Lease term</span><span className="font-medium text-neutral-900">{formatDate(lease.startDate)} to {formatDate(lease.endDate)}</span></div>
                        </div>
                    </Section>

                    <Section title="What Happens Next">
                        <div className="space-y-3 text-sm leading-6 text-neutral-600">
                            {lease.status === 'sent_to_tenant' && <p>Upload your documents and sign the lease. After that, the landlord reviews and activates it.</p>}
                            {lease.status === 'revision_requested' && <p>Update the requested documents and sign again so the landlord can finish approval.</p>}
                            {lease.status === 'tenant_signed' && <p>You’re done for now. The landlord is reviewing your signed lease.</p>}
                            {lease.status === 'approved' && <p>Your lease is active. Track upcoming rent, overdue items, and payment history from the payments page.</p>}
                            {['terminated', 'expired', 'rejected'].includes(lease.status) && <p>This lease is no longer active, but you can still review the agreement and payment history here.</p>}
                        </div>
                    </Section>
                </div>
            </div>

            {pendingAction && (
                <div className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white/95 p-4 backdrop-blur">
                    <div className="mx-auto max-w-xl">
                        <Dialog open={showDialog} onOpenChange={setShowDialog}>
                            <DialogTrigger asChild>
                                <Button className="h-14 w-full rounded-2xl bg-neutral-900 text-base font-semibold text-white hover:bg-neutral-800">
                                    {isRevisionFlow ? 'Review Changes & Resend Lease' : 'Review & Sign Lease'}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto rounded-3xl sm:max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-semibold">
                                        {isRevisionFlow ? 'Update & Resend Lease' : 'Review & Sign Lease'}
                                    </DialogTitle>
                                </DialogHeader>

                                <div className="mt-4 space-y-6">
                                    {isRevisionFlow && (
                                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                            <p className="text-sm font-semibold text-amber-900">Revision request from your landlord</p>
                                            <p className="mt-2 text-sm leading-6 text-amber-800">{lease.landlordNotes || 'Please update the requested documents and sign again.'}</p>
                                            <p className="mt-3 text-xs text-amber-700">Re-upload any document photos or PDFs that need changes, then sign again and resend the revised lease back to the landlord.</p>
                                        </div>
                                    )}

                                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                                        <p className="text-sm font-semibold text-neutral-900">Move-in payment summary</p>
                                        <div className="mt-3 space-y-2 text-sm text-neutral-600">
                                            <div className="flex justify-between"><span>First rent</span><span className="font-medium text-neutral-900">{formatCurrency(lease.monthlyRent)}</span></div>
                                            <div className="flex justify-between"><span>Deposit</span><span className="font-medium text-neutral-900">{formatCurrency(lease.deposit ?? 0)}</span></div>
                                            <div className="flex justify-between border-t border-neutral-200 pt-2 text-neutral-900"><span className="font-semibold">Total due</span><span className="font-semibold">{formatCurrency(lease.monthlyRent + (lease.deposit ?? 0))}</span></div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-neutral-900">{isRevisionFlow ? 'Updated documents' : 'Required documents'}</p>
                                                <p className="text-xs text-neutral-500">{isRevisionFlow ? 'Review the landlord note, then re-upload any photo or PDF that needs correction before you resend.' : 'Upload identity and proof documents before signing.'}</p>
                                            </div>
                                            <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', missingDocs.length === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                                                {missingDocs.length === 0 ? 'Complete' : `${missingDocs.length} left`}
                                            </span>
                                        </div>

                                        {REQUIRED_TENANT_DOCUMENTS.map((type) => {
                                            const existingDocument = tenantDocuments.find((document) => document.type === type)
                                            return (
                                                <div key={type} className="rounded-2xl border border-neutral-200 p-4 flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-neutral-900">{TENANT_DOCUMENT_LABELS[type]}</p>
                                                        <p className="text-xs text-neutral-500">JPG, PNG, WebP, or PDF up to 5 MB.</p>
                                                    </div>
                                                    <DocumentUploader
                                                        type={type}
                                                        currentStorageId={existingDocument?.storageId}
                                                        onUploadComplete={(storageId) => {
                                                            setTenantDocuments((currentDocuments) => {
                                                                const remainingDocuments = currentDocuments.filter((document) => document.type !== type)
                                                                return [...remainingDocuments, { type, storageId, uploadedAt: new Date().toISOString() }]
                                                            })
                                                        }}
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold text-neutral-900">Signature</p>
                                        <p className="mt-1 text-xs text-neutral-500">{isRevisionFlow ? 'Add a fresh signature to confirm the revised lease before it goes back to the landlord.' : 'By signing, you agree to the rules, payment terms, and lease clauses above.'}</p>
                                        <div className="mt-3">
                                            <SignatureCanvas
                                                key={`${lease.status}-${lease.signedAt ?? 'unsigned'}`}
                                                onSignatureChange={(data) => setSignatureData(data || '')}
                                                disabled={isSigning}
                                            />
                                        </div>
                                    </div>

                                    <Button onClick={handleSign} disabled={isSigning || missingDocs.length > 0 || !signatureData} className="h-12 w-full rounded-2xl bg-neutral-900 text-white hover:bg-neutral-800">
                                        {isSigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                        {missingDocs.length > 0 ? `Upload ${missingDocs.length} remaining documents` : isRevisionFlow ? 'Resend Revised Lease To Landlord' : 'Sign & Submit Lease'}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            )}
        </div>
    )
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
    return <div className="rounded-2xl border border-neutral-200 bg-white p-5"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">{title}</p>{action}</div><div className="mt-4">{children}</div></div>
}

function Stat({ label, value, hint, icon: Icon }: { label: string; value: string; hint: string; icon: React.ElementType }) {
    return <div className="rounded-2xl border border-neutral-200 bg-white p-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">{label}</p><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700"><Icon className="h-4 w-4" /></div></div><p className="mt-4 text-xl font-semibold tracking-tight text-neutral-900">{value}</p><p className="mt-1 text-xs text-neutral-500">{hint}</p></div>
}

function Mini({ label, value, tone }: { label: string; value: string; tone: 'default' | 'success' | 'danger' }) {
    return <div className={cn('rounded-xl px-4 py-3', tone === 'default' && 'bg-neutral-100 text-neutral-900', tone === 'success' && 'bg-emerald-50 text-emerald-800', tone === 'danger' && 'bg-red-50 text-red-700')}><p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">{label}</p><p className="mt-2 text-lg font-semibold">{value}</p></div>
}

function Chip({ icon, label }: { icon: string; label: string }) {
    return <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700"><span>{icon}</span>{label}</span>
}
