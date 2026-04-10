'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
    BadgeCheck,
    Bookmark,
    Building2,
    CalendarRange,
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    CircleParking,
    Cigarette,
    Clock3,
    FileText,
    Home,
    Layers3,
    Loader2,
    MapPin,
    PawPrint,
    Save,
    Search,
    Send,
    Sparkles,
    User,
    Users,
    Wallet2,
    Wrench,
    Zap,
} from '@/components/ui/icons'
import { useMutation, useQuery, useConvex } from 'convex/react'

import { api } from '@convex/_generated/api'
import { type Id } from '@convex/_generated/dataModel'
import {
    CreateLeaseMiniPill,
    CreateLeaseReviewCard,
    CreateLeaseStatusCard,
    CreateLeaseSummaryRow,
    CreateLeaseWizardSkeleton,
} from './CreateLeasePrimitives'
import {
    BLOCKING_LEASE_STATUSES,
    formatCurrency,
    humanDate,
    STEPS,
} from '../_lib/create-lease-constants'
import {
    applyTemplateToRules,
    buildLeaseRulesPrefill,
    getAutoSelectedUnit,
    getDefaultClauses,
    getDefaultRentalRules,
    getLeaseContextLabel,
    getLeaseableUnits,
    getOrdinal,
    getPropertyTypeLabel,
    getUnitSelectionKey,
    isSameUnit,
    requiresUnitSelection,
} from '../_lib/create-lease-helpers'
import {
    type LandlordLeaseSummary,
    type LandlordProperty,
    type LandlordPropertyUnit,
    type LeaseTemplateRecord,
    type Step,
    type TenantLookupResult,
} from '../_lib/create-lease-types'
import { useUser } from '@/components/providers/UserProvider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LeaseRulesConfigurator, type RentalRulesData } from '@/features/landlord/leases/components/LeaseRulesConfigurator'
import { LeaseClauseEditor, type LeaseClause } from '@/features/landlord/leases/components/LeaseClauseEditor'
import { MAINTENANCE_LABELS, PET_POLICY_LABELS } from '@/constants/lease'
import { cn } from '@/lib/utils'
import { OptimizedImage } from '@/components/ui/optimized-image'
/* ── Main component ─────────────────────────────────────── */

export function CreateLeaseWorkspace() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const convex = useConvex()

    // ── State ──
    const [currentStep, setCurrentStep] = useState<Step>('property')
    const [selectedProperty, setSelectedProperty] = useState<LandlordProperty | null>(null)
    const [selectedUnit, setSelectedUnit] = useState<LandlordPropertyUnit | null>(null)
    const [tenantEmail, setTenantEmail] = useState('')
    const [tenantFound, setTenantFound] = useState<TenantLookupResult | null>(null)
    const [tenantSearching, setTenantSearching] = useState(false)
    const [tenantError, setTenantError] = useState('')
    const [rules, setRules] = useState<RentalRulesData>(() => getDefaultRentalRules())
    const [clauses, setClauses] = useState<LeaseClause[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [selectedTemplateId, setSelectedTemplateId] = useState<Id<'leaseTemplates'> | null>(null)

    // ── Queries ──
    const { isLoading: isUserLoading } = useUser()
    const properties = useQuery(api.properties.getByLandlord, {}) as LandlordProperty[] | undefined
    const leases = useQuery(api.leases.getForLandlord, {}) as LandlordLeaseSummary[] | undefined
    const templates = useQuery(api.leaseTemplates.getForLandlord, {}) as LeaseTemplateRecord[] | undefined

    // ── Mutations ──
    const createLease = useMutation(api.leases.create)

    const stepIndex = STEPS.findIndex((s) => s.key === currentStep)
    const step = STEPS[stepIndex]
    const progress = ((stepIndex + 1) / STEPS.length) * 100

    const preselectedPropertyId = searchParams.get('propertyId')
    const blockingLeases = useMemo(
        () => leases?.filter((lease) => BLOCKING_LEASE_STATUSES.has(lease.status)) ?? [],
        [leases],
    )
    const blockedPropertyIds = useMemo(
        () => new Set(blockingLeases.map((lease) => lease.propertyId)),
        [blockingLeases],
    )
    const blockedUnitIds = useMemo(
        () => new Set(
            blockingLeases
                .map((lease) => lease.unitId)
                .filter((unitId): unitId is Id<'propertyUnits'> => Boolean(unitId))
        ),
        [blockingLeases],
    )

    // ── Property selection ──
    const handlePropertySelect = (property: LandlordProperty) => {
        const autoSelectedUnit = getAutoSelectedUnit(property, blockedPropertyIds, blockedUnitIds)

        setSelectedProperty(property)
        setSelectedUnit(autoSelectedUnit)
        setRules((prev) => ({
            ...prev,
            ...buildLeaseRulesPrefill(property, autoSelectedUnit),
        }))
    }

    const handleUnitSelect = (unit: LandlordPropertyUnit) => {
        setSelectedUnit(unit)
        if (!selectedProperty) return

        setRules((prev) => ({
            ...prev,
            ...buildLeaseRulesPrefill(selectedProperty, unit),
        }))
    }

    useEffect(() => {
        if (!preselectedPropertyId || !properties || selectedProperty) return
        const property = properties.find((p) => p._id === preselectedPropertyId)
        if (!property) return

        const autoSelectedUnit = getAutoSelectedUnit(property, blockedPropertyIds, blockedUnitIds)

        setSelectedProperty(property)
        setSelectedUnit(autoSelectedUnit)
        setRules((prev) => ({
            ...prev,
            ...buildLeaseRulesPrefill(property, autoSelectedUnit),
        }))
    }, [preselectedPropertyId, properties, selectedProperty, blockedPropertyIds, blockedUnitIds])

    // ── Template application ──
    const applyTemplate = (template: LeaseTemplateRecord) => {
        const nextRules = applyTemplateToRules(rules, template)
        setSelectedTemplateId(template._id)
        setRules(nextRules)
        setClauses(
            template.customClauses
                ? [
                    ...getDefaultClauses(nextRules).filter((c) => c.isMandatory),
                    ...template.customClauses.map((c: LeaseClause) => ({ ...c, isMandatory: false })),
                ]
                : getDefaultClauses(nextRules)
        )
        toast.success(`Applied "${template.name}"`)
    }

    // ── Tenant search ──
    const searchTenant = useCallback(async (email: string) => {
        if (!email || !email.includes('@')) {
            setTenantFound(null)
            setTenantError('')
            return
        }
        setTenantSearching(true)
        setTenantError('')
        try {
            const user = await convex.query(api.users.getByEmail, { email })
            if (user) {
                setTenantFound(user)
                setTenantError('')
            } else {
                setTenantFound(null)
                setTenantError('No account found. Ask the tenant to sign up first.')
            }
        } catch {
            setTenantFound(null)
            setTenantError('Could not search for tenant.')
        } finally {
            setTenantSearching(false)
        }
    }, [convex])

    useEffect(() => {
        const timer = setTimeout(() => {
            if (tenantEmail) searchTenant(tenantEmail)
        }, 500)
        return () => clearTimeout(timer)
    }, [tenantEmail, searchTenant])

    // ── Validation ──
    const canProceed = () => {
        switch (currentStep) {
            case 'property':
                return !!selectedProperty && (!requiresUnitSelection(selectedProperty, blockedPropertyIds, blockedUnitIds) || !!selectedUnit)
            case 'tenant': return !!tenantFound
            case 'rules': return rules.monthlyRent > 0 && rules.startDate && rules.endDate
            case 'clauses': return true
            case 'review': return true
            case 'send': return true
            default: return false
        }
    }

    // ── Submit ──
    const handleSubmit = async (sendImmediately: boolean) => {
        if (!selectedProperty) {
            toast.error('Choose a property first.')
            return
        }
        if (requiresUnitSelection(selectedProperty, blockedPropertyIds, blockedUnitIds) && !selectedUnit) {
            toast.error('Choose a specific unit before creating the lease.')
            return
        }
        if (sendImmediately) setIsSending(true)
        else setIsSaving(true)

        try {
            const customClauses = clauses.filter((c) => !c.isMandatory)
            await createLease({
                propertyId: selectedProperty._id,
                unitId: selectedUnit?._id ?? undefined,
                tenantEmail,
                startDate: rules.startDate,
                endDate: rules.endDate,
                monthlyRent: rules.monthlyRent,
                deposit: rules.deposit,
                templateId: selectedTemplateId ?? undefined,
                rentDueDay: rules.rentDueDay,
                gracePeriodDays: rules.gracePeriodDays,
                lateFeeType: rules.lateFeeType,
                lateFeeAmount: rules.lateFeeAmount,
                petPolicy: rules.petPolicy,
                utilitiesIncluded: rules.utilitiesIncluded,
                parkingIncluded: rules.parkingIncluded,
                maintenanceResponsibility: rules.maintenanceResponsibility,
                noticePeriodDays: rules.noticePeriodDays,
                maxOccupants: rules.maxOccupants,
                smokingAllowed: rules.smokingAllowed,
                sublettingAllowed: rules.sublettingAllowed,
                customClauses: customClauses.length > 0 ? customClauses.map((c) => ({
                    id: c.id,
                    title: c.title,
                    content: c.content,
                })) : undefined,
                sendImmediately,
            })
            toast.success(sendImmediately ? `Lease sent to ${tenantEmail}!` : 'Lease draft saved!')
            router.push('/landlord/leases')
        } catch (error: unknown) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : 'Something went wrong.')
        } finally {
            setIsSaving(false)
            setIsSending(false)
        }
    }

    // ── Loading ──
    if (isUserLoading || properties === undefined || leases === undefined) {
        return <CreateLeaseWizardSkeleton />
    }

    const availableProperties = properties.filter((p) => {
        if (p.approvalStatus !== 'approved') return false
        if (!p.units || p.units.length === 0) return !blockedPropertyIds.has(p._id)

        return getLeaseableUnits(p, blockedPropertyIds, blockedUnitIds).length > 0
    })
    const selectedPropertyLeaseableUnits = selectedProperty
        ? getLeaseableUnits(selectedProperty, blockedPropertyIds, blockedUnitIds)
        : []
    const selectedLeaseContext = selectedProperty
        ? getLeaseContextLabel(selectedProperty, selectedUnit ?? selectedPropertyLeaseableUnits[0] ?? null)
        : null
    const displayClauses = clauses.length > 0 ? clauses : getDefaultClauses(rules)
    const firstPayment = rules.monthlyRent + rules.deposit
    const selectedTemplate = templates?.find((t) => t._id === selectedTemplateId) ?? null

    const reviewPolicyBadges = [
        { icon: PawPrint, label: PET_POLICY_LABELS[rules.petPolicy] },
        { icon: Wrench, label: `${MAINTENANCE_LABELS[rules.maintenanceResponsibility]} maintenance` },
        { icon: Users, label: `Max ${rules.maxOccupants} occupants` },
        { icon: CalendarRange, label: `Due on the ${rules.rentDueDay}${getOrdinal(rules.rentDueDay)}` },
        { icon: Clock3, label: `${rules.noticePeriodDays} day notice` },
        { icon: CircleParking, label: rules.parkingIncluded ? 'Parking included' : 'No parking' },
        { icon: Cigarette, label: rules.smokingAllowed ? 'Smoking allowed' : 'No smoking' },
        { icon: Home, label: rules.sublettingAllowed ? 'Subletting allowed' : 'No subletting' },
        ...rules.utilitiesIncluded.map((u) => ({ icon: Zap, label: u })),
    ]

    return (
        <div className="mx-auto min-h-screen max-w-[760px] bg-white pb-32 font-sans">
            {/* ── Sticky header ── */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl">
                <div className="flex items-center gap-3 px-4 pb-2 pt-3 sm:px-5">
                    <Link
                        href="/landlord/leases"
                        className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition-colors active:scale-95 hover:bg-neutral-200/60 hover:text-neutral-950"
                        aria-label="Back to leases"
                    >
                        <ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
                    </Link>

                    <div className="min-w-0 flex-1">
                        <p className="text-[17px] font-semibold tracking-[-0.02em] text-neutral-950">
                            New lease
                        </p>
                        <p className="truncate text-[12px] text-neutral-500">
                            {step.title}
                        </p>
                    </div>

                    <div className="text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400">
                            {stepIndex + 1}/{STEPS.length}
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="h-[3px] bg-neutral-200/60">
                    <div
                        className="h-full rounded-full bg-neutral-950 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Step tabs — scrollable on mobile */}
                <div className="flex gap-0 overflow-x-auto no-scrollbar">
                    {STEPS.map((s, i) => {
                        const isDone = i < stepIndex
                        const isCurrent = currentStep === s.key
                        return (
                            <button
                                key={s.key}
                                type="button"
                                onClick={() => i <= stepIndex && setCurrentStep(s.key)}
                                disabled={i > stepIndex}
                                className={cn(
                                    'relative shrink-0 px-4 pb-3 pt-3 text-[13px] font-semibold transition-colors',
                                    isCurrent
                                        ? 'text-neutral-950'
                                        : isDone
                                            ? 'text-neutral-500 hover:text-neutral-950'
                                            : 'text-neutral-300'
                                )}
                            >
                                {s.label}
                                <span className={cn(
                                    'absolute inset-x-4 bottom-0 h-[2.5px] rounded-full transition-all',
                                    isCurrent ? 'bg-neutral-950' : 'bg-transparent'
                                )} />
                            </button>
                        )
                    })}
                </div>
            </header>

            {/* ── Step subtitle ── */}
            <div className="border-b border-neutral-200/40 px-5 py-4 sm:px-6">
                <p className="text-[14px] leading-6 text-neutral-500">{step.subtitle}</p>
            </div>

            {/* ── Step content ── */}
            <div className="min-h-[480px]">

                {/* ═══ Property step ═══ */}
                {currentStep === 'property' && (
                    <div className="animate-in fade-in slide-in-from-right-3 duration-300">
                        {/* Templates */}
                        {templates && templates.length > 0 && (
                            <div className="border-b border-neutral-200/40 px-5 py-4 sm:px-6">
                                <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-neutral-400">
                                    <Bookmark className="h-3.5 w-3.5" strokeWidth={2} />
                                    Templates
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {templates.map((t) => (
                                        <button
                                            key={t._id}
                                            type="button"
                                            onClick={() => applyTemplate(t)}
                                            className={cn(
                                                'rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-all active:scale-95',
                                                selectedTemplateId === t._id
                                                    ? 'border-neutral-950 bg-neutral-950 text-white'
                                                    : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                                            )}
                                        >
                                            {t.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Property list */}
                        {availableProperties.length === 0 ? (
                            <div className="px-5 py-12 sm:px-6">
                                <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-14 text-center">
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
                                        <Building2 className="h-6 w-6 text-neutral-400" strokeWidth={1.8} />
                                    </div>
                                    <h3 className="mt-5 text-lg font-semibold text-neutral-950">No properties available</h3>
                                    <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">
                                        Add and approve a property first, then come back to draft the lease.
                                    </p>
                                    <Link href="/landlord/properties/new" className="mt-5 inline-flex">
                                        <button className="inline-flex h-11 items-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white transition-all active:scale-95 hover:bg-neutral-800">
                                            Add property
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="px-4 pt-3 sm:px-5">
                                <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
                                    {availableProperties.map((property, index) => {
                                        const isSelected = selectedProperty?._id === property._id
                                        const leaseableUnits = getLeaseableUnits(property, blockedPropertyIds, blockedUnitIds)
                                        return (
                                            <div key={property._id}>
                                                <button
                                                    type="button"
                                                    onClick={() => handlePropertySelect(property)}
                                                    className={cn(
                                                        'group flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-all active:scale-[0.98] sm:px-5',
                                                        isSelected ? 'bg-neutral-50' : 'hover:bg-neutral-50/60'
                                                    )}
                                                >
                                                    {/* Thumbnail */}
                                                    <div className={cn(
                                                        'relative flex h-[56px] w-[56px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-neutral-100 ring-2 transition-all',
                                                        isSelected ? 'ring-neutral-950' : 'ring-transparent'
                                                    )}>
                                                    {property.imageUrls?.[0] ? (
                                                        <OptimizedImage
                                                            src={property.imageUrls[0]}
                                                            alt={property.title}
                                                            fill
                                                            sizes="56px"
                                                            qualityPreset="thumbnail"
                                                            showSkeleton={false}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <Building2 className="h-5 w-5 text-neutral-400" strokeWidth={1.8} />
                                                    )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-neutral-950">
                                                            {property.title}
                                                        </h3>
                                                        <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-neutral-500">
                                                            <MapPin className="h-3 w-3 shrink-0" strokeWidth={2} />
                                                            <span className="truncate">{property.address}, {property.city}</span>
                                                        </div>
                                                        <p className="mt-1 text-[12px] text-neutral-400">
                                                            {[
                                                                property.listingType === 'student_accommodation'
                                                                    ? 'Student accommodation'
                                                                    : getPropertyTypeLabel(property.propertyType),
                                                                property.unitCount && property.unitCount > 1 ? `${property.unitCount} units` : null,
                                                                property.availableUnitCount ? `${property.availableUnitCount} available` : null,
                                                                property.bedrooms ? `${property.bedrooms} bed` : null,
                                                                property.bathrooms ? `${property.bathrooms} bath` : null,
                                                            ].filter(Boolean).join(' · ')}
                                                        </p>
                                                    </div>

                                                    {/* Price + Radio */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-right">
                                                            <p className="text-[14px] font-semibold text-neutral-950">{formatCurrency(property.minPriceNad || property.priceNad || 0)}</p>
                                                            <p className="text-[11px] text-neutral-400">
                                                                {leaseableUnits.length > 1 ? 'from available stock' : 'per month'}
                                                            </p>
                                                        </div>
                                                        <div className={cn(
                                                            'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all',
                                                            isSelected ? 'border-neutral-950 bg-neutral-950' : 'border-neutral-300'
                                                        )}>
                                                            {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                                                        </div>
                                                    </div>
                                                </button>
                                                {index < availableProperties.length - 1 && (
                                                    <div className="ml-[76px] border-t border-neutral-100 sm:ml-[88px]" />
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>

                                {selectedProperty && (
                                    <div className="mt-4 rounded-2xl border border-neutral-200/80 bg-white p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-neutral-400">Lease context</p>
                                                <h3 className="text-[16px] font-semibold text-neutral-950">{selectedLeaseContext}</h3>
                                            </div>
                                            <p className="text-[12px] text-neutral-400">
                                                {getPropertyTypeLabel(selectedUnit?.unitType ?? selectedProperty.propertyType)}
                                            </p>
                                        </div>
                                        <p className="mt-2 text-[13px] leading-5 text-neutral-500">
                                            This selection now prefills rent, deposit, occupancy, utilities, pet policy, and parking terms from the listing before you refine the lease.
                                        </p>
                                    </div>
                                )}

                                {selectedProperty && requiresUnitSelection(selectedProperty, blockedPropertyIds, blockedUnitIds) && (
                                    <div className="mt-4 rounded-2xl border border-neutral-200/80 bg-white p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-neutral-400">Unit</p>
                                                <h3 className="text-[16px] font-semibold text-neutral-950">Choose the specific unit</h3>
                                            </div>
                                            <p className="text-[12px] text-neutral-400">
                                                {selectedPropertyLeaseableUnits.length} available
                                            </p>
                                        </div>
                                        <div className="mt-4 space-y-2">
                                            {selectedPropertyLeaseableUnits
                                                .map((unit) => {
                                                    const isSelected = isSameUnit(selectedUnit, unit)
                                                    return (
                                                        <button
                                                            key={getUnitSelectionKey(unit)}
                                                            type="button"
                                                            onClick={() => handleUnitSelect(unit)}
                                                            className={cn(
                                                                'flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all',
                                                                isSelected ? 'border-neutral-950 bg-neutral-50' : 'border-neutral-200 hover:bg-neutral-50'
                                                            )}
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="truncate text-[14px] font-semibold text-neutral-950">{unit.title}</p>
                                                                <p className="mt-0.5 text-[12px] text-neutral-500">
                                                                    {[
                                                                        unit.isSynthetic ? 'Entire property' : unit.unitCode,
                                                                        getPropertyTypeLabel(unit.unitType),
                                                                        unit.roomType,
                                                                        unit.bedrooms ? `${unit.bedrooms} bed` : null,
                                                                    ].filter(Boolean).join(' · ')}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[14px] font-semibold text-neutral-950">{formatCurrency(unit.priceNad || 0)}</p>
                                                                <p className="text-[11px] text-neutral-400">{unit.occupancyMode?.replace('_', ' ')}</p>
                                                            </div>
                                                        </button>
                                                    )
                                                })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ Tenant step ═══ */}
                {currentStep === 'tenant' && (
                    <div className="animate-in fade-in slide-in-from-right-3 duration-300">
                        <div className="px-5 py-5 sm:px-6">
                            <Label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-neutral-400">
                                Tenant email
                            </Label>
                            <div className="relative mt-3">
                                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" strokeWidth={2} />
                                <Input
                                    type="email"
                                    placeholder="tenant@example.com"
                                    value={tenantEmail}
                                    onChange={(e) => setTenantEmail(e.target.value)}
                                    className="h-13 rounded-2xl border-neutral-200 bg-white pl-11 text-[15px] font-medium text-neutral-900 shadow-none focus-visible:border-neutral-400 focus-visible:ring-4 focus-visible:ring-neutral-950/5"
                                />
                            </div>
                            <p className="mt-3 text-[13px] leading-5 text-neutral-400">
                                We search automatically once you pause typing. Only existing accounts can receive a lease.
                            </p>
                        </div>

                        <div className="px-5 sm:px-6">
                            {!tenantEmail && (
                                <CreateLeaseStatusCard
                                    icon={User}
                                    title="Enter the tenant&rsquo;s email"
                                    description="Use the email they signed up with so the lease connects to the right profile."
                                    tone="default"
                                />
                            )}
                            {tenantSearching && (
                                <CreateLeaseStatusCard
                                    icon={Loader2}
                                    title="Searching…"
                                    description="Looking for an account matching this email."
                                    tone="default"
                                    spinning
                                />
                            )}
                            {tenantFound && (
                                <CreateLeaseStatusCard
                                    icon={BadgeCheck}
                                    title={tenantFound.fullName || 'Tenant found'}
                                    description={tenantFound.email}
                                    tone="success"
                                />
                            )}
                            {tenantError && (
                                <CreateLeaseStatusCard
                                    icon={CircleAlert}
                                    title="Not found"
                                    description={tenantError}
                                    tone="danger"
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* ═══ Rules step ═══ */}
                {currentStep === 'rules' && (
                    <div className="animate-in fade-in slide-in-from-right-3 duration-300 px-5 py-5 sm:px-6">
                        <LeaseRulesConfigurator data={rules} onChange={setRules} />
                    </div>
                )}

                {/* ═══ Clauses step ═══ */}
                {currentStep === 'clauses' && (
                    <div className="animate-in fade-in slide-in-from-right-3 duration-300 px-5 py-5 sm:px-6">
                        <LeaseClauseEditor clauses={displayClauses} onChange={setClauses} />
                    </div>
                )}

                {/* ═══ Review step ═══ */}
                {currentStep === 'review' && (
                    <div className="animate-in fade-in slide-in-from-right-3 duration-300 divide-y divide-neutral-200/40">
                        <CreateLeaseReviewCard title="Property" icon={Building2} onEdit={() => setCurrentStep('property')}>
                            <div className="flex items-center gap-3.5">
                                <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-neutral-100">
                                    {selectedProperty?.imageUrls?.[0] ? (
                                        <OptimizedImage
                                            src={selectedProperty.imageUrls[0]}
                                            alt={selectedProperty.title}
                                            fill
                                            sizes="48px"
                                            qualityPreset="thumbnail"
                                            showSkeleton={false}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <Building2 className="h-5 w-5 text-neutral-400" strokeWidth={1.8} />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-[14px] font-semibold text-neutral-950">{selectedProperty?.title || 'Not selected'}</p>
                                    <p className="mt-0.5 text-[13px] text-neutral-500">
                                        {selectedProperty ? `${selectedProperty.address}, ${selectedProperty.city}` : 'Choose a property'}
                                    </p>
                                    {selectedProperty && (
                                        <p className="mt-1 text-[12px] text-neutral-400">
                                            {selectedUnit && !selectedUnit.isSynthetic
                                                ? `${selectedLeaseContext} · ${selectedUnit.title} · ${formatCurrency(selectedUnit.priceNad || rules.monthlyRent)}`
                                                : `${selectedLeaseContext} · ${formatCurrency(rules.monthlyRent)}`}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CreateLeaseReviewCard>

                        <CreateLeaseReviewCard title="Tenant" icon={User} onEdit={() => setCurrentStep('tenant')}>
                            <div className="flex items-center gap-3.5">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
                                    <User className="h-5 w-5" strokeWidth={1.8} />
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-[14px] font-semibold text-neutral-950">{tenantFound?.fullName || 'Tenant'}</p>
                                    <p className="mt-0.5 text-[13px] text-neutral-500">{tenantEmail || 'No email'}</p>
                                </div>
                            </div>
                        </CreateLeaseReviewCard>

                        <CreateLeaseReviewCard title="Financials" icon={Wallet2} onEdit={() => setCurrentStep('rules')}>
                            <div className="space-y-2.5">
                                <CreateLeaseSummaryRow label="Monthly rent" value={formatCurrency(rules.monthlyRent)} />
                                <CreateLeaseSummaryRow label="Deposit" value={formatCurrency(rules.deposit)} />
                                <CreateLeaseSummaryRow label="First payment" value={formatCurrency(firstPayment)} bold />
                            </div>
                            <div className="mt-4 flex flex-wrap gap-1.5">
                                <CreateLeaseMiniPill icon={CalendarRange} label={`Due on the ${rules.rentDueDay}${getOrdinal(rules.rentDueDay)}`} />
                                <CreateLeaseMiniPill icon={Clock3} label={`${rules.gracePeriodDays} day grace`} />
                                <CreateLeaseMiniPill icon={Wallet2} label={`${rules.lateFeeAmount}${rules.lateFeeType === 'percentage' ? '%' : ' N$'} late fee`} />
                            </div>
                        </CreateLeaseReviewCard>

                        <CreateLeaseReviewCard title="Policies" icon={Sparkles} onEdit={() => setCurrentStep('rules')}>
                            <div className="flex flex-wrap gap-1.5">
                                {reviewPolicyBadges.map((b) => (
                                    <CreateLeaseMiniPill key={b.label} icon={b.icon} label={b.label} />
                                ))}
                            </div>
                        </CreateLeaseReviewCard>

                        <CreateLeaseReviewCard title="Lease period" icon={CalendarRange} onEdit={() => setCurrentStep('rules')}>
                            <CreateLeaseSummaryRow label="Start" value={humanDate.format(new Date(rules.startDate))} />
                            <div className="mt-2.5">
                                <CreateLeaseSummaryRow label="End" value={humanDate.format(new Date(rules.endDate))} />
                            </div>
                            <p className="mt-3 text-[12px] text-neutral-400">
                                {rules.noticePeriodDays} day notice period · {displayClauses.length} clauses included
                            </p>
                        </CreateLeaseReviewCard>

                        <CreateLeaseReviewCard title="Clauses" icon={Layers3} onEdit={() => setCurrentStep('clauses')}>
                            <div className="flex flex-wrap gap-1.5">
                                <CreateLeaseMiniPill icon={FileText} label={`${displayClauses.filter((c) => c.isMandatory).length} required`} />
                                <CreateLeaseMiniPill icon={FileText} label={`${displayClauses.filter((c) => !c.isMandatory).length} custom`} />
                            </div>
                            <div className="mt-3 space-y-2">
                                {displayClauses.slice(0, 3).map((clause) => (
                                    <div key={clause.id} className="rounded-xl border border-neutral-100 bg-neutral-50/60 px-3.5 py-2.5">
                                        <p className="text-[13px] font-semibold text-neutral-950">{clause.title}</p>
                                        <p className="mt-0.5 line-clamp-1 text-[12px] text-neutral-500">{clause.content}</p>
                                    </div>
                                ))}
                                {displayClauses.length > 3 && (
                                    <p className="text-[12px] text-neutral-400">+{displayClauses.length - 3} more clauses</p>
                                )}
                            </div>
                        </CreateLeaseReviewCard>
                    </div>
                )}

                {/* ═══ Send step ═══ */}
                {currentStep === 'send' && (
                    <div className="animate-in fade-in slide-in-from-right-3 duration-300 px-5 py-10 sm:px-6">
                        <div className="mx-auto max-w-md text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-950 text-white">
                                <Send className="h-6 w-6" strokeWidth={1.8} />
                            </div>
                            <h2 className="mt-5 text-[1.5rem] font-bold tracking-[-0.04em] text-neutral-950">
                                Ready to send
                            </h2>
                            <p className="mx-auto mt-2 max-w-sm text-[14px] leading-6 text-neutral-500">
                                {tenantFound?.fullName || 'The tenant'} will receive the agreement at{' '}
                                <span className="font-medium text-neutral-700">{tenantEmail}</span>. They can review, sign, and send it back.
                            </p>

                            {/* Summary */}
                                <div className="mt-6 rounded-2xl border border-neutral-200/80 bg-white p-5 text-left">
                                <div className="space-y-2.5">
                                    <CreateLeaseSummaryRow label="Property" value={selectedProperty?.title || 'Not selected'} />
                                    {selectedLeaseContext && <CreateLeaseSummaryRow label="Lease type" value={selectedLeaseContext} />}
                                    {selectedUnit && !selectedUnit.isSynthetic && <CreateLeaseSummaryRow label="Unit" value={selectedUnit.title} />}
                                    <CreateLeaseSummaryRow label="First payment" value={formatCurrency(firstPayment)} />
                                    <CreateLeaseSummaryRow label="Lease ends" value={humanDate.format(new Date(rules.endDate))} />
                                    {selectedTemplate && <CreateLeaseSummaryRow label="Template" value={selectedTemplate.name} />}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-6 flex flex-col gap-3">
                                <button
                                    onClick={() => handleSubmit(true)}
                                    disabled={isSending}
                                    className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 text-[15px] font-semibold text-white shadow-lg shadow-neutral-950/15 transition-all active:scale-[0.98] hover:bg-neutral-800 disabled:opacity-50"
                                >
                                    {isSending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" strokeWidth={2} />
                                    )}
                                    Send to tenant
                                </button>
                                <button
                                    onClick={() => handleSubmit(false)}
                                    disabled={isSaving}
                                    className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white text-[15px] font-semibold text-neutral-700 transition-all active:scale-[0.98] hover:bg-neutral-50 disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" strokeWidth={2} />
                                    )}
                                    Save as draft
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Bottom action bar ── */}
            {currentStep !== 'send' && (
                <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-5">
                    <div className="mx-auto max-w-[760px]">
                        <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border border-neutral-200/80 bg-white/90 px-4 py-3 shadow-xl shadow-neutral-950/5 backdrop-blur-xl">
                            <div className="hidden min-w-0 sm:block">
                                <p className="text-[13px] font-semibold text-neutral-950">
                                    Step {stepIndex + 1} of {STEPS.length}
                                </p>
                                <p className="mt-0.5 truncate text-[12px] text-neutral-500">{step.subtitle}</p>
                            </div>

                            <div className="flex w-full items-center gap-2.5 sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(STEPS[stepIndex - 1]?.key)}
                                    disabled={stepIndex === 0}
                                    className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-neutral-100 text-[14px] font-semibold text-neutral-700 transition-all active:scale-[0.97] hover:bg-neutral-200/80 disabled:opacity-30 sm:flex-initial sm:px-5"
                                >
                                    <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (STEPS[stepIndex + 1]?.key === 'clauses' && clauses.length === 0) {
                                            setClauses(getDefaultClauses(rules))
                                        }
                                        setCurrentStep(STEPS[stepIndex + 1]?.key)
                                    }}
                                    disabled={!canProceed()}
                                    className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-neutral-950 text-[14px] font-semibold text-white transition-all active:scale-[0.97] hover:bg-neutral-800 disabled:opacity-30 sm:flex-initial sm:px-5"
                                >
                                    {stepIndex === STEPS.length - 2 ? 'Confirm' : 'Continue'}
                                    <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
