'use client'

import { useEffect, useState, type ElementType, type ReactNode } from 'react'
import Link from 'next/link'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import {
    Ban,
    Building2,
    CalendarRange,
    Cat,
    ChevronLeft,
    CircleParking,
    Cigarette,
    Clock3,
    Dog,
    Home,
    Loader2,
    MessageSquareMore,
    PawPrint,
    Rabbit,
    Send,
    Upload,
    Users,
    Wallet2,
    Wrench,
    Zap,
} from 'lucide-react'

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
    PET_POLICY_LABELS,
    REQUIRED_TENANT_DOCUMENTS,
    TENANT_DOCUMENT_LABELS,
    type MaintenanceOption,
    type PetPolicy,
} from '@/constants/lease'

const money = new Intl.NumberFormat('en-NA', { style: 'currency', currency: 'NAD', maximumFractionDigits: 0 })
const dates = new Intl.DateTimeFormat('en-NA', { day: 'numeric', month: 'short', year: 'numeric' })
const formatCurrency = (value: number) => money.format(value)
const formatDate = (value: string) => dates.format(new Date(value))

interface TenantDocumentUpload {
    type: string
    storageId: Id<'_storage'>
    uploadedAt: string
}

const petPolicyIconMap: Record<PetPolicy, ElementType> = {
    no_pets: Ban,
    cats_only: Cat,
    dogs_only: Dog,
    small_pets: Rabbit,
    all_pets: PawPrint,
    negotiable: MessageSquareMore,
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
    const lease = useQuery(api.leases.getById, { leaseId: leaseId as Id<'leases'> })
    const payments = useQuery(api.payments.getByLease, { leaseId: leaseId as Id<'leases'> })
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
                    <p className="text-sm font-medium text-neutral-400">Loading your lease...</p>
                </div>
            </div>
        )
    }

    if (!lease) {
        return (
            <div className="py-20 text-center">
                <h2 className="text-lg font-semibold text-neutral-900">Lease not found</h2>
                <Link href="/tenant/leases" className="mt-2 inline-flex text-sm text-neutral-500 underline">
                    Back to my leases
                </Link>
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

    const petPolicy = ((lease.petPolicy as PetPolicy) || 'no_pets')
    const maintenanceResponsibility = ((lease.maintenanceResponsibility as MaintenanceOption) || 'shared')
    const PetPolicyIcon = petPolicyIconMap[petPolicy]
    const policyItems = [
        { icon: Clock3, label: `${lease.gracePeriodDays || 5} day grace period` },
        { icon: Wallet2, label: `${lease.lateFeeAmount || 5}${lease.lateFeeType === 'percentage' ? '%' : ' N$'} late fee` },
        { icon: PetPolicyIcon, label: PET_POLICY_LABELS[petPolicy] },
        { icon: Wrench, label: `${MAINTENANCE_LABELS[maintenanceResponsibility]} maintenance` },
        { icon: Users, label: `Max ${lease.maxOccupants || 2} occupants` },
        { icon: CalendarRange, label: `${lease.noticePeriodDays || 30} day notice` },
        { icon: CircleParking, label: lease.parkingIncluded ? 'Parking included' : 'No parking' },
        { icon: Cigarette, label: lease.smokingAllowed ? 'Smoking allowed' : 'No smoking' },
        { icon: Home, label: lease.sublettingAllowed ? 'Subletting allowed' : 'No subletting' },
        ...(lease.utilitiesIncluded?.map((utility: string) => ({ icon: Zap, label: utility })) ?? []),
    ]

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
                leaseId: leaseId as Id<'leases'>,
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
        <div className="mx-auto max-w-[820px] font-sans pb-28">
            <section className="border-b border-neutral-100 pb-6">
                <Link
                    href="/tenant/leases"
                    className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
                >
                    <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
                    My leases
                </Link>

                <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div className="h-28 w-full shrink-0 overflow-hidden rounded-[24px] bg-neutral-100 sm:h-28 sm:w-32">
                        {lease.property?.imageUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                                src={lease.property.imageUrl}
                                alt={lease.property?.title || 'Property'}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-neutral-400">
                                <Building2 className="h-8 w-8" strokeWidth={1.8} />
                            </div>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                            <p className="text-sm font-medium text-neutral-500">Tenant lease</p>
                            <LeaseStatusBadge status={lease.status} />
                        </div>
                        <h1 className="mt-2 text-[2rem] font-semibold tracking-[-0.04em] text-neutral-950">
                            {lease.property?.title || 'Property'}
                        </h1>
                        <p className="mt-2 text-[15px] leading-7 text-neutral-600">
                            {lease.property?.address}{lease.property?.city ? `, ${lease.property.city}` : ''}
                        </p>
                        <p className="mt-2 text-sm text-neutral-500">
                            Landlord: {lease.landlord?.fullName || 'Property owner'}
                        </p>
                    </div>
                </div>

                {lease.status === 'revision_requested' && (
                    <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50/80 px-5 py-4">
                        <p className="text-sm font-semibold text-amber-900">Revision requested</p>
                        <p className="mt-1 text-sm leading-6 text-amber-800">
                            {lease.landlordNotes || 'The landlord requested updates before approval.'}
                        </p>
                    </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                    <HeaderPill icon={Wallet2} label="Rent" value={formatCurrency(lease.monthlyRent)} />
                    <HeaderPill icon={Wallet2} label="Deposit" value={formatCurrency(lease.deposit ?? 0)} />
                    <HeaderPill icon={CalendarRange} label="Move in" value={formatDate(lease.startDate)} />
                    <HeaderPill
                        icon={Clock3}
                        label="Next due"
                        value={nextPayment ? formatCurrency(nextPayment.amount) : 'Up to date'}
                    />
                </div>
            </section>

            <div className="space-y-8 pt-6">
                <DetailSection
                    title="Progress"
                    description="See where the lease sits today and what happens next."
                >
                    <LeaseStatusTimeline
                        status={lease.status}
                        createdAt={lease._creationTime}
                        sentAt={lease.sentAt}
                        signedAt={lease.signedAt}
                        approvedAt={lease.approvedAt}
                    />
                </DetailSection>

                <DetailSection
                    title="Payment snapshot"
                    description="Your lease totals, latest items, and next payment."
                    action={(
                        <Link href="/tenant/payments">
                            <Button
                                variant="outline"
                                className="h-10 rounded-full border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700"
                            >
                                Open payments
                            </Button>
                        </Link>
                    )}
                >
                    <div className="flex flex-wrap gap-2">
                        <InlineMetric label="Paid" value={formatCurrency(totals.paid)} tone="success" />
                        <InlineMetric label="Pending" value={formatCurrency(totals.pending)} tone="default" />
                        <InlineMetric label="Overdue" value={formatCurrency(totals.overdue)} tone="danger" />
                    </div>

                    <div className="mt-5 divide-y divide-neutral-100 border-y border-neutral-200 bg-white">
                        {payments.length > 0 ? (
                            payments.slice(0, 4).map((payment) => (
                                <div key={payment._id} className="flex items-center justify-between gap-3 py-4">
                                    <div>
                                        <p className="text-sm font-semibold capitalize text-neutral-950">
                                            {payment.type.replace('_', ' ')}
                                        </p>
                                        <p className="mt-1 text-sm text-neutral-500">
                                            Due {formatDate(payment.dueDate)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-neutral-950">
                                            {formatCurrency(payment.amount)}
                                        </p>
                                        <p
                                            className={cn(
                                                'mt-1 text-xs font-medium capitalize',
                                                payment.status === 'paid' && 'text-emerald-700',
                                                payment.status === 'pending' && 'text-neutral-500',
                                                payment.status === 'overdue' && 'text-red-600'
                                            )}
                                        >
                                            {payment.status}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-5 text-sm text-neutral-500">
                                Payment items appear once the lease is approved.
                            </div>
                        )}
                    </div>
                </DetailSection>

                <DetailSection
                    title="Rules and policies"
                    description="The operational rules attached to this lease."
                >
                    <div className="flex flex-wrap gap-2">
                        {policyItems.map((item) => (
                            <PolicyPill key={item.label} icon={item.icon} label={item.label} />
                        ))}
                    </div>
                </DetailSection>

                <DetailSection
                    title="Agreement terms"
                    description="The clauses and commitments included in the signed agreement."
                >
                    <div className="divide-y divide-neutral-100 border-y border-neutral-200 bg-white">
                        {leaseClauses.map((clause, index: number) => (
                            <div key={clause.id?.trim() || `clause_${index}`} className="py-5">
                                <p className="text-sm font-semibold text-neutral-950">
                                    {index + 1}. {clause.title}
                                </p>
                                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-600">
                                    {clause.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </DetailSection>

                <DetailSection
                    title="Move-in total"
                    description="Your first payment and lease term summary."
                >
                    <p className="text-[2rem] font-semibold tracking-[-0.04em] text-neutral-950">
                        {formatCurrency(lease.monthlyRent + (lease.deposit ?? 0))}
                    </p>
                    <div className="mt-4 space-y-3">
                        <ValueRow label="First rent" value={formatCurrency(lease.monthlyRent)} />
                        <ValueRow label="Deposit" value={formatCurrency(lease.deposit ?? 0)} />
                        <ValueRow
                            label="Due day"
                            value={`Every ${lease.rentDueDay || 1}${ordinal(lease.rentDueDay || 1)}`}
                        />
                        <ValueRow
                            label="Lease term"
                            value={`${formatDate(lease.startDate)} to ${formatDate(lease.endDate)}`}
                        />
                    </div>
                </DetailSection>

                <DetailSection
                    title="What happens next"
                    description="The next step based on the current lease status."
                >
                    <div className="text-sm leading-7 text-neutral-600">
                        {lease.status === 'sent_to_tenant' && (
                            <p>Upload your documents and sign the lease. After that, the landlord reviews and activates it.</p>
                        )}
                        {lease.status === 'revision_requested' && (
                            <p>Update the requested documents and sign again so the landlord can finish approval.</p>
                        )}
                        {lease.status === 'tenant_signed' && (
                            <p>You are done for now. The landlord is reviewing your signed lease.</p>
                        )}
                        {lease.status === 'approved' && (
                            <p>Your lease is active. Track rent, upcoming payments, and payment history from the payments page.</p>
                        )}
                        {['terminated', 'expired', 'rejected'].includes(lease.status) && (
                            <p>This lease is no longer active, but you can still review the agreement and payment history here.</p>
                        )}
                    </div>
                </DetailSection>
            </div>

            {pendingAction && (
                <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 px-4">
                    <div className="mx-auto max-w-[820px]">
                        <Dialog open={showDialog} onOpenChange={setShowDialog}>
                            <DialogTrigger asChild>
                                <Button className="pointer-events-auto h-14 w-full rounded-[28px] border border-neutral-900 bg-neutral-950 text-base font-semibold text-white hover:bg-neutral-800">
                                    {isRevisionFlow ? 'Review changes and resend lease' : 'Review and sign lease'}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto rounded-[30px] sm:max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-semibold tracking-[-0.03em]">
                                        {isRevisionFlow ? 'Update and resend lease' : 'Review and sign lease'}
                                    </DialogTitle>
                                </DialogHeader>

                                <div className="mt-4 space-y-6">
                                    {isRevisionFlow && (
                                        <div className="rounded-[24px] border border-amber-200 bg-amber-50/80 px-5 py-4">
                                            <p className="text-sm font-semibold text-amber-900">Revision request from your landlord</p>
                                            <p className="mt-2 text-sm leading-6 text-amber-800">
                                                {lease.landlordNotes || 'Please update the requested documents and sign again.'}
                                            </p>
                                        </div>
                                    )}

                                    <div className="rounded-[24px] border border-neutral-200 bg-neutral-50/70 px-5 py-4">
                                        <p className="text-sm font-semibold text-neutral-950">Move-in payment summary</p>
                                        <div className="mt-3 space-y-3">
                                            <ValueRow label="First rent" value={formatCurrency(lease.monthlyRent)} />
                                            <ValueRow label="Deposit" value={formatCurrency(lease.deposit ?? 0)} />
                                            <ValueRow
                                                label="Total due"
                                                value={formatCurrency(lease.monthlyRent + (lease.deposit ?? 0))}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-neutral-950">
                                                    {isRevisionFlow ? 'Updated documents' : 'Required documents'}
                                                </p>
                                                <p className="mt-1 text-xs text-neutral-500">
                                                    {isRevisionFlow
                                                        ? 'Re-upload any photo or PDF that needs correction before you resend.'
                                                        : 'Upload identity and proof documents before signing.'}
                                                </p>
                                            </div>
                                            <span
                                                className={cn(
                                                    'rounded-full px-2.5 py-1 text-xs font-semibold',
                                                    missingDocs.length === 0
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                )}
                                            >
                                                {missingDocs.length === 0 ? 'Complete' : `${missingDocs.length} left`}
                                            </span>
                                        </div>

                                        <div className="mt-4 divide-y divide-neutral-100 border-y border-neutral-200 bg-white">
                                            {REQUIRED_TENANT_DOCUMENTS.map((type) => {
                                                const existingDocument = tenantDocuments.find((document) => document.type === type)
                                                return (
                                                    <div key={type} className="flex items-center justify-between gap-3 py-4">
                                                        <div>
                                                            <p className="text-sm font-semibold text-neutral-950">
                                                                {TENANT_DOCUMENT_LABELS[type]}
                                                            </p>
                                                            <p className="mt-1 text-xs text-neutral-500">
                                                                JPG, PNG, WebP, or PDF up to 5 MB.
                                                            </p>
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
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold text-neutral-950">Signature</p>
                                        <p className="mt-1 text-xs text-neutral-500">
                                            {isRevisionFlow
                                                ? 'Add a fresh signature to confirm the revised lease before it goes back to the landlord.'
                                                : 'By signing, you agree to the rules, payment terms, and lease clauses above.'}
                                        </p>
                                        <div className="mt-3">
                                            <SignatureCanvas
                                                key={`${lease.status}-${lease.signedAt ?? 'unsigned'}`}
                                                onSignatureChange={(data) => setSignatureData(data || '')}
                                                disabled={isSigning}
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleSign}
                                        disabled={isSigning || missingDocs.length > 0 || !signatureData}
                                        className="h-12 w-full rounded-[22px] bg-neutral-950 text-white hover:bg-neutral-800"
                                    >
                                        {isSigning ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : missingDocs.length > 0 ? (
                                            <Upload className="mr-2 h-4 w-4" />
                                        ) : (
                                            <Send className="mr-2 h-4 w-4" />
                                        )}
                                        {missingDocs.length > 0
                                            ? `Upload ${missingDocs.length} remaining documents`
                                            : isRevisionFlow
                                                ? 'Resend revised lease to landlord'
                                                : 'Sign and submit lease'}
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

function DetailSection({
    title,
    description,
    action,
    children,
}: {
    title: string
    description: string
    action?: ReactNode
    children: ReactNode
}) {
    return (
        <section>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-neutral-950">{title}</h2>
                    <p className="mt-1 text-sm text-neutral-500">{description}</p>
                </div>
                {action}
            </div>
            <div className="mt-5">{children}</div>
        </section>
    )
}

function HeaderPill({
    icon: Icon,
    label,
    value,
}: {
    icon: ElementType
    label: string
    value: string
}) {
    return (
        <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-700">
            <Icon className="h-4 w-4 text-neutral-500" strokeWidth={2} />
            <span className="font-medium text-neutral-500">{label}</span>
            <span className="font-semibold text-neutral-950">{value}</span>
        </span>
    )
}

function InlineMetric({
    label,
    value,
    tone,
}: {
    label: string
    value: string
    tone: 'default' | 'success' | 'danger'
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm',
                tone === 'default' && 'border-neutral-200 bg-neutral-50 text-neutral-700',
                tone === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
                tone === 'danger' && 'border-red-200 bg-red-50 text-red-700'
            )}
        >
            <span className="font-medium">{label}</span>
            <span className="font-semibold">{value}</span>
        </span>
    )
}

function PolicyPill({
    icon: Icon,
    label,
}: {
    icon: ElementType
    label: string
}) {
    return (
        <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-700">
            <Icon className="h-4 w-4 text-neutral-500" strokeWidth={2} />
            {label}
        </span>
    )
}

function ValueRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <p className="text-sm text-neutral-500">{label}</p>
            <p className="text-right text-sm font-semibold text-neutral-950">{value}</p>
        </div>
    )
}
