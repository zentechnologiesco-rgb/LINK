'use client'

import { useEffect, useState, type ElementType } from 'react'
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

import { api } from '@convex/_generated/api'
import { type Id } from '@convex/_generated/dataModel'
import { LeaseStatusBadge, LeaseStatusTimeline } from '@/features/leases/shared/components/LeaseStatusTimeline'
import { SignatureCanvas } from '@/features/leases/shared/components/SignatureCanvas'
import { LeaseDocumentUploader } from '@/features/tenant/leases/components/LeaseDocumentUploader'
import { cn } from '@/lib/utils'
import {
    MAINTENANCE_LABELS,
    PET_POLICY_LABELS,
    REQUIRED_TENANT_DOCUMENTS,
    TENANT_DOCUMENT_LABELS,
    type MaintenanceOption,
    type PetPolicy,
} from '@/constants/lease'
import {
    GroupedSection,
    InlineMetric,
    IOSDialog,
    ListRow,
    ListStackItem,
    MiniPill,
    MiniStat,
    PageSkeleton,
    SectionHeader,
} from './TenantLeaseDetailPrimitives'
import {
    formatCurrency,
    formatDate,
    ordinal,
} from '../_lib/tenant-lease-detail-formatters'

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

export function TenantLeaseDetailWorkspace({ leaseId }: { leaseId: string }) {
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
        return <PageSkeleton />
    }

    if (!lease) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center pb-24">
                <div className="mb-6 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-neutral-50 ring-1 ring-inset ring-neutral-200/60">
                    <Building2 className="h-10 w-10 text-neutral-400" strokeWidth={1.8} />
                </div>
                <h3 className="text-[22px] font-bold tracking-[-0.03em] text-neutral-950">
                    Lease not found
                </h3>
                <Link
                    href="/tenant/leases"
                    className="mt-8 flex h-12 items-center justify-center rounded-full bg-neutral-950 px-8 text-[15px] font-semibold text-white transition-all active:scale-95 hover:bg-neutral-800"
                >
                    Back to my leases
                </Link>
            </div>
        )
    }

    const isRevisionFlow = lease.status === 'revision_requested'
    const pendingAction = ['sent_to_tenant', 'revision_requested'].includes(lease.status)
    const missingDocs = REQUIRED_TENANT_DOCUMENTS.filter((type) => !tenantDocuments.find((document) => document.type === type))
    const upcomingRentPayments = payments
        .filter((payment) => payment.type === 'rent' && payment.status !== 'paid')
        .toSorted((a, b) => a.dueDate.localeCompare(b.dueDate))
    const nextPayment = upcomingRentPayments[0] ?? null
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
        <div className="mx-auto min-h-screen max-w-[820px] bg-white pb-32 font-sans md:pb-36 xl:rounded-xl xl:border-x xl:border-neutral-100/60 xl:shadow-sm">
            {/* ── Sticky Header ── */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-neutral-100/60">
                <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
                    <Link
                        href="/tenant/leases"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition-colors active:scale-95 hover:bg-neutral-200/80"
                        aria-label="Back to leases"
                    >
                        <ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                        <h1 className="truncate text-[15px] font-semibold text-neutral-950">
                            {lease.property?.title || 'Property Lease'}
                        </h1>
                        <p className="truncate text-[12px] font-medium text-neutral-500">
                            {lease.property?.address || 'Address unavailable'}
                        </p>
                    </div>
                </div>
            </header>

            {/* ── Immersive Hero Section ── */}
            <section className="px-4 pt-6 sm:px-6">
                <div className="relative aspect-[21/9] w-full overflow-hidden rounded-[24px] bg-neutral-100 sm:aspect-[21/7]">
                    {lease.property?.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={lease.property.imageUrl}
                            alt={lease.property?.title || 'Property'}
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
                            <Building2 className="h-8 w-8" strokeWidth={1.8} />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5">
                        <LeaseStatusBadge status={lease.status} />
                    </div>
                </div>

                <div className="mt-5 px-1">
                    <h2 className="text-[2rem] font-bold tracking-[-0.04em] text-neutral-950 sm:text-[2.25rem] leading-tight">
                        {lease.property?.title || 'Property Lease'}
                    </h2>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-neutral-500">
                        {lease.property?.address}{lease.property?.city ? `, ${lease.property.city}` : ''}
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 ring-1 ring-inset ring-neutral-200/60">
                            <Users className="h-4 w-4 text-neutral-500" strokeWidth={2.2} />
                        </div>
                        <p className="text-[14px] font-medium text-neutral-700">
                            Landlord: <span className="font-semibold text-neutral-950">{lease.landlord?.fullName || 'Property owner'}</span>
                        </p>
                    </div>
                </div>
                
                {lease.status === 'revision_requested' && (
                    <div className="mt-5 rounded-[20px] bg-amber-50 px-5 py-4 ring-1 ring-inset ring-amber-200/80">
                        <p className="text-[13px] font-bold tracking-[0.04em] uppercase text-amber-900">Revision requested</p>
                        <p className="mt-1 text-[14px] leading-relaxed text-amber-800">
                            {lease.landlordNotes || 'The landlord requested updates before approval.'}
                        </p>
                    </div>
                )}
            </section>

            {/* ── Main Details List ── */}
            <div className="mt-8 flex flex-col gap-8">

                <section>
                    <SectionHeader title="Metrics" description="Key dates and financial amounts." />
                    <div className="mt-2 grid grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:px-6">
                        <MiniStat icon={Wallet2} label="Rent" value={formatCurrency(lease.monthlyRent ?? 0)} />
                        <MiniStat icon={Wallet2} label="Deposit" value={formatCurrency(lease.deposit ?? 0)} />
                        <MiniStat icon={CalendarRange} label="Move In" value={formatDate(lease.startDate)} />
                        <MiniStat icon={Clock3} label="Next Due" value={nextPayment ? formatCurrency(nextPayment.amount) : 'Up to date'} />
                    </div>
                </section>

                <section>
                    <SectionHeader title="Progress" description="See where the lease sits today." />
                    <GroupedSection>
                        <div className="p-5">
                            <LeaseStatusTimeline
                                status={lease.status}
                                createdAt={lease._creationTime}
                                sentAt={lease.sentAt}
                                signedAt={lease.signedAt}
                                approvedAt={lease.approvedAt}
                            />
                        </div>
                    </GroupedSection>
                </section>

                <section>
                    <div className="flex items-end justify-between px-5 sm:px-6">
                        <SectionHeader title="Rent Schedule" description="Your next rent items in due-date order." />
                        <Link href="/tenant/payments" className="mb-3">
                            <span className="text-[13px] font-semibold text-neutral-950 hover:underline">View all</span>
                        </Link>
                    </div>
                    <div className="mt-1 overflow-x-auto px-4 pb-4 sm:px-6 hide-scrollbar flex gap-2">
                        <InlineMetric label="Paid" value={formatCurrency(totals.paid)} tone="success" />
                        <InlineMetric label="Pending" value={formatCurrency(totals.pending)} tone="default" />
                        <InlineMetric label="Overdue" value={formatCurrency(totals.overdue)} tone="danger" />
                    </div>
                    <GroupedSection>
                        {upcomingRentPayments.length > 0 ? (
                            upcomingRentPayments.slice(0, 4).map((payment) => (
                                <ListRow 
                                    key={payment._id}
                                    label={payment.type.replace('_', ' ')}
                                    subLabel={`Due ${formatDate(payment.dueDate)}`}
                                    value={formatCurrency(payment.amount)}
                                    valueDetail={payment.status}
                                    statusTone={payment.status}
                                />
                            ))
                        ) : (
                            <div className="px-5 py-6 text-center text-[14px] text-neutral-500">
                                {payments.length > 0
                                    ? 'No upcoming rent items are waiting right now.'
                                    : 'Payment items appear once the lease is approved.'}
                            </div>
                        )}
                    </GroupedSection>
                </section>

                <section>
                    <SectionHeader title="Rules and Policies" description="Operational rules attached to this lease." />
                    <div className="mt-2 flex flex-wrap gap-2 px-4 sm:px-6">
                        {policyItems.map((item) => (
                            <MiniPill key={item.label} icon={item.icon} label={item.label} />
                        ))}
                    </div>
                </section>

                <section>
                    <SectionHeader title="Agreement Terms" description="Clauses and commitments." />
                    <GroupedSection>
                        {leaseClauses.map((clause, index: number) => (
                            <ListStackItem 
                                key={clause.id?.trim() || `clause_${index}`}
                                title={`${index + 1}. ${clause.title}`}
                                content={clause.content}
                            />
                        ))}
                    </GroupedSection>
                </section>

                <section>
                    <SectionHeader title="Move-in Total" description="Initial payment summary." />
                    <GroupedSection>
                        <div className="px-5 py-5 border-b border-neutral-100/60 pb-5">
                            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-neutral-500">Total Due Before Move-in</p>
                            <p className="mt-1 text-[2.25rem] font-bold tracking-tight text-neutral-950 leading-none">
                                {formatCurrency((lease.monthlyRent ?? 0) + (lease.deposit ?? 0))}
                            </p>
                        </div>
                        <ListRow label="First rent" value={formatCurrency(lease.monthlyRent ?? 0)} />
                        <ListRow label="Deposit" value={formatCurrency(lease.deposit ?? 0)} />
                        <ListRow label="Due day" value={`Every ${lease.rentDueDay || 1}${ordinal(lease.rentDueDay || 1)}`} />
                        <ListRow label="Lease term" value={`${formatDate(lease.startDate)} to ${formatDate(lease.endDate)}`} />
                    </GroupedSection>
                </section>

                <section>
                    <SectionHeader title="What happens next" description="Next steps based on the current status." />
                    <div className="px-4 sm:px-6">
                        <div className="rounded-[20px] bg-neutral-50 p-5 ring-1 ring-inset ring-neutral-200/60">
                            <p className="text-[14px] leading-relaxed text-neutral-600">
                                {lease.status === 'sent_to_tenant' && 'Upload your documents and sign the lease. After that, the landlord reviews and activates it.'}
                                {lease.status === 'revision_requested' && 'Update the requested documents and sign again so the landlord can finish approval.'}
                                {lease.status === 'tenant_signed' && 'You are done for now. The landlord is reviewing your signed lease.'}
                                {lease.status === 'approved' && 'Your lease is active. Track rent, upcoming payments, and payment history from the payments page.'}
                                {['terminated', 'expired', 'rejected'].includes(lease.status) && 'This lease is no longer active, but you can still review the agreement and payment history here.'}
                            </p>
                        </div>
                    </div>
                </section>

            </div>

            {/* ── Frosted Floating Action Bar ── */}
            {pendingAction && (
                <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-safe pt-4 sm:px-6">
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-xl border-t border-neutral-200/60 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)]" />
                    <div className="relative mx-auto flex max-w-[820px] items-center gap-3 pb-6 md:pb-8">
                        <button
                            onClick={() => setShowDialog(true)}
                            className="flex h-14 w-full items-center justify-center rounded-full bg-neutral-950 px-8 text-[16px] font-semibold text-white shadow-xl shadow-neutral-950/20 transition-all active:scale-95 hover:bg-neutral-800"
                        >
                            {isRevisionFlow ? 'Review and Resend Lease' : 'Review and Sign Lease'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── iOS Signature Bottom Sheet ── */}
            <IOSDialog
                open={showDialog}
                onOpenChange={setShowDialog}
                title={isRevisionFlow ? 'Update and Resend' : 'Complete and Sign'}
            >
                <div className="space-y-8 pb-4 pt-4">
                    {/* Move-in total receipt style */}
                    <div>
                        <h3 className="mb-4 text-[13px] font-bold uppercase tracking-[0.05em] text-neutral-400">Move-in Summary</h3>
                        <div className="space-y-3 px-1 text-[15px]">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-neutral-600">First rent</span>
                                <span className="font-semibold text-neutral-950">{formatCurrency(lease.monthlyRent ?? 0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-neutral-600">Deposit</span>
                                <span className="font-semibold text-neutral-950">{formatCurrency(lease.deposit ?? 0)}</span>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-dashed border-neutral-200/80 pt-4">
                                <span className="text-[16px] font-bold text-neutral-950">Total Due</span>
                                <span className="text-[20px] font-bold tracking-tight text-neutral-950">
                                    {formatCurrency((lease.monthlyRent ?? 0) + (lease.deposit ?? 0))}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Document Uploads - Clean Row Style */}
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-[13px] font-bold uppercase tracking-[0.05em] text-neutral-400">Required Documents</h3>
                            <span className={cn(
                                'rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em]',
                                missingDocs.length === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                            )}>
                                {missingDocs.length === 0 ? 'Complete' : `${missingDocs.length} left`}
                            </span>
                        </div>
                        <div className="flex flex-col gap-4">
                            {REQUIRED_TENANT_DOCUMENTS.map((type) => {
                                const existingDocument = tenantDocuments.find((document) => document.type === type)
                                return (
                                    <div key={type} className="flex items-center justify-between gap-3 rounded-[16px] bg-neutral-50 px-4 py-3.5 transition-colors hover:bg-neutral-100/60">
                                        <div className="min-w-0 flex-1 pr-2">
                                            <p className="text-[14px] font-bold tracking-[-0.01em] text-neutral-950 truncate">
                                                {TENANT_DOCUMENT_LABELS[type]}
                                            </p>
                                            <p className="mt-0.5 text-[12px] font-medium text-neutral-400 truncate">
                                                JPG, PNG, PDF (Max 5MB)
                                            </p>
                                        </div>
                                        <LeaseDocumentUploader
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

                    {/* Signature Area */}
                    <div>
                        <h3 className="mb-4 text-[13px] font-bold uppercase tracking-[0.05em] text-neutral-400">Signature</h3>
                        <div className="overflow-hidden rounded-[24px] bg-neutral-50 p-2 ring-1 ring-inset ring-neutral-200/60">
                            <SignatureCanvas
                                key={`${lease.status}-${lease.signedAt ?? 'unsigned'}`}
                                onSignatureChange={(data) => setSignatureData(data || '')}
                                disabled={isSigning}
                            />
                        </div>
                        <p className="mt-3 text-center text-[12px] font-medium text-neutral-400">
                            By signing, you agree to the rules and lease clauses.
                        </p>
                    </div>

                    <button
                        onClick={handleSign}
                        disabled={isSigning || missingDocs.length > 0 || !signatureData}
                        className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-neutral-950 px-8 text-[16px] font-semibold text-white shadow-xl shadow-neutral-950/20 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none hover:bg-neutral-800"
                    >
                        {isSigning ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : missingDocs.length > 0 ? (
                            <Upload className="mr-2 h-5 w-5" />
                        ) : (
                            <Send className="mr-2 h-5 w-5" />
                        )}
                        {missingDocs.length > 0 ? `Upload ${missingDocs.length} remaining` : isRevisionFlow ? 'Resend to Landlord' : 'Sign & Complete'}
                    </button>
                </div>
            </IOSDialog>

        </div>
    )
}

