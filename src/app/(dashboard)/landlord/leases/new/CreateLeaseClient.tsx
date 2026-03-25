'use client'

import { useCallback, useEffect, useMemo, useState, type ElementType, type ReactNode } from 'react'
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
    ShieldCheck,
    Sparkles,
    User,
    Users,
    Wallet2,
    Wrench,
    Zap,
} from 'lucide-react'
import { useMutation, useQuery, useConvex } from 'convex/react'

import { api } from '../../../../../../convex/_generated/api'
import { Id } from '../../../../../../convex/_generated/dataModel'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RentalRulesConfigurator, type RentalRulesData } from '@/components/leases/RentalRulesConfigurator'
import { ClauseEditor, type LeaseClause } from '@/components/leases/ClauseEditor'
import { MAINTENANCE_LABELS, PET_POLICY_LABELS } from '@/constants/lease'
import { PROPERTY_TYPE_LABELS } from '@/constants/property'
import { cn } from '@/lib/utils'

/* ── Types ──────────────────────────────────────────────── */

type Step = 'property' | 'tenant' | 'rules' | 'clauses' | 'review' | 'send'

type StepDef = {
    key: Step
    label: string
    title: string
    subtitle: string
    icon: ElementType
}

type LandlordProperty = {
    _id: Id<'properties'>
    title: string
    address: string
    city: string
    priceNad?: number | null
    minPriceNad?: number | null
    imageUrls?: string[] | null
    propertyType?: string | null
    listingType?: string | null
    bedrooms?: number | null
    bathrooms?: number | null
    occupancyMode?: string | null
    furnishingStatus?: string | null
    genderPolicy?: string | null
    maxOccupants?: number | null
    amenityNames?: string[] | null
    utilitiesIncluded?: string[] | null
    petPolicy?: string | null
    approvalStatus?: string | null
    publicationStatus?: string | null
    unitCount?: number | null
    availableUnitCount?: number | null
    units?: LandlordPropertyUnit[] | null
}

type LandlordPropertyUnit = {
    _id: Id<'propertyUnits'> | null
    title: string
    unitCode?: string | null
    unitType?: string | null
    occupancyMode?: string | null
    roomType?: string | null
    priceNad?: number | null
    bedrooms?: number | null
    bathrooms?: number | null
    maxOccupants?: number | null
    furnishingStatus?: string | null
    genderPolicy?: string | null
    amenityNames?: string[] | null
    utilitiesIncluded?: string[] | null
    petPolicy?: string | null
    publicationStatus?: string | null
    occupancyStatus?: string | null
    imageUrls?: string[] | null
    isSynthetic?: boolean
}

type TenantLookupResult = {
    fullName?: string | null
    email: string
}

type LeaseTemplateRecord = {
    _id: Id<'leaseTemplates'>
    name: string
    isDefault?: boolean | null
    customClauses?: LeaseClause[]
    rentDueDay?: number | null
    gracePeriodDays?: number | null
    lateFeeType?: RentalRulesData['lateFeeType']
    lateFeeAmount?: number | null
    petPolicy?: RentalRulesData['petPolicy']
    utilitiesIncluded?: string[]
    parkingIncluded?: boolean | null
    maintenanceResponsibility?: RentalRulesData['maintenanceResponsibility']
    noticePeriodDays?: number | null
    maxOccupants?: number | null
    smokingAllowed?: boolean | null
    sublettingAllowed?: boolean | null
}

type LandlordLeaseSummary = {
    propertyId: Id<'properties'>
    unitId?: Id<'propertyUnits'>
    status: string
}

/* ── Constants ──────────────────────────────────────────── */

const STEPS: StepDef[] = [
    { key: 'property', label: 'Property', title: 'Choose property', subtitle: 'Select the home for this lease', icon: Building2 },
    { key: 'tenant', label: 'Tenant', title: 'Find tenant', subtitle: 'Search by email to link the account', icon: User },
    { key: 'rules', label: 'Terms', title: 'Set terms', subtitle: 'Pricing, dates, rules, and policies', icon: Sparkles },
    { key: 'clauses', label: 'Clauses', title: 'Refine clauses', subtitle: 'Review required and add custom terms', icon: FileText },
    { key: 'review', label: 'Review', title: 'Review draft', subtitle: 'Check everything before sending', icon: ShieldCheck },
    { key: 'send', label: 'Send', title: 'Send or save', subtitle: 'Deliver the agreement or keep as draft', icon: Send },
]

const currency = new Intl.NumberFormat('en-US')
const humanDate = new Intl.DateTimeFormat('en-ZA', { month: 'long', day: 'numeric', year: 'numeric' })
const formatCurrency = (amount: number) => `N$${currency.format(amount || 0)}`
const BLOCKING_LEASE_STATUSES = new Set(['draft', 'sent_to_tenant', 'tenant_signed', 'revision_requested', 'approved'])
const PARKING_AMENITY_KEYWORDS = ['parking', 'garage']
const LEASE_UTILITY_LABEL_MAP: Record<string, string> = {
    electricity: 'Electricity',
    water: 'Water',
    gas: 'Gas',
    internet: 'Internet',
    trash: 'Trash',
    'trash collection': 'Trash',
    sewage: 'Sewage',
}
const LEASE_PET_POLICY_MAP: Partial<Record<string, RentalRulesData['petPolicy']>> = {
    no_pets: 'no_pets',
    cats_only: 'cats_only',
    dogs_only: 'dogs_only',
    small_pets: 'small_pets',
    all_pets: 'all_pets',
    cats_and_dogs: 'all_pets',
    negotiable: 'negotiable',
}

function getOrdinal(n: number) {
    if (n > 3 && n < 21) return 'th'
    switch (n % 10) {
        case 1: return 'st'
        case 2: return 'nd'
        case 3: return 'rd'
        default: return 'th'
    }
}

function getPropertyTypeLabel(propertyType?: string | null) {
    if (!propertyType) return 'Residential'
    return PROPERTY_TYPE_LABELS[propertyType as keyof typeof PROPERTY_TYPE_LABELS] ?? propertyType
}

function getUnitSelectionKey(unit: LandlordPropertyUnit) {
    return unit._id ?? `synthetic:${unit.title}:${unit.unitCode ?? ''}:${unit.priceNad ?? 0}:${unit.occupancyMode ?? ''}`
}

function isSameUnit(left: LandlordPropertyUnit | null, right: LandlordPropertyUnit | null) {
    if (!left || !right) return false
    return getUnitSelectionKey(left) === getUnitSelectionKey(right)
}

function normalizeLeaseUtilities(utilities?: string[] | null): RentalRulesData['utilitiesIncluded'] {
    if (!utilities || utilities.length === 0) return []

    return Array.from(new Set(
        utilities
            .map((utility) => LEASE_UTILITY_LABEL_MAP[utility.trim().toLowerCase()] ?? utility)
            .filter((utility): utility is string => Boolean(utility)),
    ))
}

function normalizeLeasePetPolicy(petPolicy?: string | null) {
    if (!petPolicy) return undefined
    return LEASE_PET_POLICY_MAP[petPolicy.trim().toLowerCase()]
}

function hasParkingAmenity(amenities?: string[] | null) {
    if (!amenities || amenities.length === 0) return false
    return amenities.some((amenity) => {
        const normalizedAmenity = amenity.trim().toLowerCase()
        return PARKING_AMENITY_KEYWORDS.some((keyword) => normalizedAmenity.includes(keyword))
    })
}

function getLeaseableUnits(
    property: LandlordProperty,
    blockedPropertyIds: Set<Id<'properties'>>,
    blockedUnitIds: Set<Id<'propertyUnits'>>,
) {
    return (property.units ?? []).filter((unit) => {
        if (unit.publicationStatus !== 'published' || unit.occupancyStatus !== 'vacant') {
            return false
        }

        if (unit._id) {
            return !blockedUnitIds.has(unit._id)
        }

        return !blockedPropertyIds.has(property._id)
    })
}

function requiresUnitSelection(
    property: LandlordProperty,
    blockedPropertyIds: Set<Id<'properties'>>,
    blockedUnitIds: Set<Id<'propertyUnits'>>,
) {
    if (property.listingType === 'single_home') {
        return false
    }

    return getLeaseableUnits(property, blockedPropertyIds, blockedUnitIds).length > 1
}

function deriveMaxOccupants(property: LandlordProperty, unit?: LandlordPropertyUnit | null) {
    const explicitMax = unit?.maxOccupants ?? property.maxOccupants
    if (explicitMax && explicitMax > 0) return explicitMax

    const bedrooms = unit?.bedrooms ?? property.bedrooms ?? 0
    const targetType = unit?.unitType ?? property.propertyType

    if (property.listingType === 'student_accommodation' || targetType === 'room') {
        return 1
    }

    if (targetType === 'studio') {
        return 2
    }

    if (bedrooms > 0) {
        return Math.max(2, bedrooms * 2)
    }

    if (targetType === 'house') {
        return 4
    }

    return 2
}

function buildLeaseRulesPrefill(property: LandlordProperty, unit?: LandlordPropertyUnit | null): Partial<RentalRulesData> {
    const monthlyRent = unit?.priceNad || property.minPriceNad || property.priceNad || 0
    const utilitiesIncluded = normalizeLeaseUtilities(unit?.utilitiesIncluded ?? property.utilitiesIncluded)
    const parkingIncluded = hasParkingAmenity(unit?.amenityNames) || hasParkingAmenity(property.amenityNames)
    const petPolicy = normalizeLeasePetPolicy(unit?.petPolicy ?? property.petPolicy)

    return {
        monthlyRent,
        deposit: monthlyRent,
        maxOccupants: deriveMaxOccupants(property, unit),
        utilitiesIncluded,
        parkingIncluded,
        ...(petPolicy ? { petPolicy } : {}),
    }
}

function getLeaseContextLabel(property: LandlordProperty, unit?: LandlordPropertyUnit | null) {
    if (property.listingType === 'student_accommodation') {
        if (unit?.occupancyMode === 'shared_room' || unit?.roomType === 'shared') {
            return 'Shared room stay'
        }
        return 'Private room stay'
    }

    const targetType = unit?.unitType ?? property.propertyType
    switch (targetType) {
        case 'house':
            return 'House lease'
        case 'room':
            return 'Room lease'
        case 'studio':
            return 'Studio lease'
        case 'townhouse':
            return 'Townhouse lease'
        case 'duplex':
            return 'Duplex lease'
        case 'penthouse':
            return 'Penthouse lease'
        case 'apartment':
            return 'Apartment lease'
        default:
            return `${getPropertyTypeLabel(targetType)} lease`
    }
}

/* ── Main component ─────────────────────────────────────── */

export function CreateLeaseClient() {
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
    const [rules, setRules] = useState<RentalRulesData>({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        monthlyRent: 0,
        deposit: 0,
        rentDueDay: 1,
        gracePeriodDays: 5,
        lateFeeType: 'percentage',
        lateFeeAmount: 5,
        petPolicy: 'no_pets',
        utilitiesIncluded: [],
        parkingIncluded: false,
        maintenanceResponsibility: 'shared',
        noticePeriodDays: 30,
        maxOccupants: 2,
        smokingAllowed: false,
        sublettingAllowed: false,
    })
    const [clauses, setClauses] = useState<LeaseClause[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [selectedTemplateId, setSelectedTemplateId] = useState<Id<'leaseTemplates'> | null>(null)

    // ── Queries ──
    const currentUser = useQuery(api.users.currentUser)
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
        const leaseableUnits = getLeaseableUnits(property, blockedPropertyIds, blockedUnitIds)
        const autoSelectedUnit =
            property.listingType === 'single_home'
                ? null
                : leaseableUnits.length === 1
                    ? leaseableUnits[0]
                    : null

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

        const leaseableUnits = getLeaseableUnits(property, blockedPropertyIds, blockedUnitIds)
        const autoSelectedUnit =
            property.listingType === 'single_home'
                ? null
                : leaseableUnits.length === 1
                    ? leaseableUnits[0]
                    : null

        setSelectedProperty(property)
        setSelectedUnit(autoSelectedUnit)
        setRules((prev) => ({
            ...prev,
            ...buildLeaseRulesPrefill(property, autoSelectedUnit),
        }))
    }, [preselectedPropertyId, properties, selectedProperty, blockedPropertyIds, blockedUnitIds])

    // ── Template application ──
    const applyTemplate = (template: LeaseTemplateRecord) => {
        const nextRules: RentalRulesData = {
            ...rules,
            rentDueDay: template.rentDueDay ?? rules.rentDueDay,
            gracePeriodDays: template.gracePeriodDays ?? rules.gracePeriodDays,
            lateFeeType: template.lateFeeType ?? rules.lateFeeType,
            lateFeeAmount: template.lateFeeAmount ?? rules.lateFeeAmount,
            petPolicy: template.petPolicy ?? rules.petPolicy,
            utilitiesIncluded: template.utilitiesIncluded ?? rules.utilitiesIncluded,
            parkingIncluded: template.parkingIncluded ?? rules.parkingIncluded,
            maintenanceResponsibility: template.maintenanceResponsibility ?? rules.maintenanceResponsibility,
            noticePeriodDays: template.noticePeriodDays ?? rules.noticePeriodDays,
            maxOccupants: template.maxOccupants ?? rules.maxOccupants,
            smokingAllowed: template.smokingAllowed ?? rules.smokingAllowed,
            sublettingAllowed: template.sublettingAllowed ?? rules.sublettingAllowed,
        }
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
    if (currentUser === undefined || properties === undefined || leases === undefined) {
        return <WizardSkeleton />
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
                                                        'flex h-[56px] w-[56px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-neutral-100 ring-2 transition-all',
                                                        isSelected ? 'ring-neutral-950' : 'ring-transparent'
                                                    )}>
                                                        {property.imageUrls?.[0] ? (
                                                            /* eslint-disable-next-line @next/next/no-img-element */
                                                            <img src={property.imageUrls[0]} alt={property.title} className="h-full w-full object-cover" />
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
                                <StatusCard
                                    icon={User}
                                    title="Enter the tenant&rsquo;s email"
                                    description="Use the email they signed up with so the lease connects to the right profile."
                                    tone="default"
                                />
                            )}
                            {tenantSearching && (
                                <StatusCard
                                    icon={Loader2}
                                    title="Searching…"
                                    description="Looking for an account matching this email."
                                    tone="default"
                                    spinning
                                />
                            )}
                            {tenantFound && (
                                <StatusCard
                                    icon={BadgeCheck}
                                    title={tenantFound.fullName || 'Tenant found'}
                                    description={tenantFound.email}
                                    tone="success"
                                />
                            )}
                            {tenantError && (
                                <StatusCard
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
                        <RentalRulesConfigurator data={rules} onChange={setRules} />
                    </div>
                )}

                {/* ═══ Clauses step ═══ */}
                {currentStep === 'clauses' && (
                    <div className="animate-in fade-in slide-in-from-right-3 duration-300 px-5 py-5 sm:px-6">
                        <ClauseEditor clauses={displayClauses} onChange={setClauses} />
                    </div>
                )}

                {/* ═══ Review step ═══ */}
                {currentStep === 'review' && (
                    <div className="animate-in fade-in slide-in-from-right-3 duration-300 divide-y divide-neutral-200/40">
                        <ReviewCard title="Property" icon={Building2} onEdit={() => setCurrentStep('property')}>
                            <div className="flex items-center gap-3.5">
                                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-neutral-100">
                                    {selectedProperty?.imageUrls?.[0] ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img src={selectedProperty.imageUrls[0]} alt={selectedProperty.title} className="h-full w-full object-cover" />
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
                        </ReviewCard>

                        <ReviewCard title="Tenant" icon={User} onEdit={() => setCurrentStep('tenant')}>
                            <div className="flex items-center gap-3.5">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
                                    <User className="h-5 w-5" strokeWidth={1.8} />
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-[14px] font-semibold text-neutral-950">{tenantFound?.fullName || 'Tenant'}</p>
                                    <p className="mt-0.5 text-[13px] text-neutral-500">{tenantEmail || 'No email'}</p>
                                </div>
                            </div>
                        </ReviewCard>

                        <ReviewCard title="Financials" icon={Wallet2} onEdit={() => setCurrentStep('rules')}>
                            <div className="space-y-2.5">
                                <SummaryRow label="Monthly rent" value={formatCurrency(rules.monthlyRent)} />
                                <SummaryRow label="Deposit" value={formatCurrency(rules.deposit)} />
                                <SummaryRow label="First payment" value={formatCurrency(firstPayment)} bold />
                            </div>
                            <div className="mt-4 flex flex-wrap gap-1.5">
                                <MiniPill icon={CalendarRange} label={`Due on the ${rules.rentDueDay}${getOrdinal(rules.rentDueDay)}`} />
                                <MiniPill icon={Clock3} label={`${rules.gracePeriodDays} day grace`} />
                                <MiniPill icon={Wallet2} label={`${rules.lateFeeAmount}${rules.lateFeeType === 'percentage' ? '%' : ' N$'} late fee`} />
                            </div>
                        </ReviewCard>

                        <ReviewCard title="Policies" icon={Sparkles} onEdit={() => setCurrentStep('rules')}>
                            <div className="flex flex-wrap gap-1.5">
                                {reviewPolicyBadges.map((b) => (
                                    <MiniPill key={b.label} icon={b.icon} label={b.label} />
                                ))}
                            </div>
                        </ReviewCard>

                        <ReviewCard title="Lease period" icon={CalendarRange} onEdit={() => setCurrentStep('rules')}>
                            <SummaryRow label="Start" value={humanDate.format(new Date(rules.startDate))} />
                            <div className="mt-2.5">
                                <SummaryRow label="End" value={humanDate.format(new Date(rules.endDate))} />
                            </div>
                            <p className="mt-3 text-[12px] text-neutral-400">
                                {rules.noticePeriodDays} day notice period · {displayClauses.length} clauses included
                            </p>
                        </ReviewCard>

                        <ReviewCard title="Clauses" icon={Layers3} onEdit={() => setCurrentStep('clauses')}>
                            <div className="flex flex-wrap gap-1.5">
                                <MiniPill icon={FileText} label={`${displayClauses.filter((c) => c.isMandatory).length} required`} />
                                <MiniPill icon={FileText} label={`${displayClauses.filter((c) => !c.isMandatory).length} custom`} />
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
                        </ReviewCard>
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
                                    <SummaryRow label="Property" value={selectedProperty?.title || 'Not selected'} />
                                    {selectedLeaseContext && <SummaryRow label="Lease type" value={selectedLeaseContext} />}
                                    {selectedUnit && !selectedUnit.isSynthetic && <SummaryRow label="Unit" value={selectedUnit.title} />}
                                    <SummaryRow label="First payment" value={formatCurrency(firstPayment)} />
                                    <SummaryRow label="Lease ends" value={humanDate.format(new Date(rules.endDate))} />
                                    {selectedTemplate && <SummaryRow label="Template" value={selectedTemplate.name} />}
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

/* ── Helper components ──────────────────────────────────── */

function StatusCard({
    icon: Icon,
    title,
    description,
    tone,
    spinning = false,
}: {
    icon: ElementType
    title: string
    description: string
    tone: 'default' | 'success' | 'danger'
    spinning?: boolean
}) {
    return (
        <div className="flex items-start gap-3.5 rounded-2xl border border-neutral-200/80 bg-white p-4">
            <div className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                tone === 'success' ? 'bg-emerald-50 text-emerald-600'
                    : tone === 'danger' ? 'bg-red-50 text-red-600'
                        : 'bg-neutral-100 text-neutral-500'
            )}>
                <Icon className={cn('h-4 w-4', spinning && 'animate-spin')} strokeWidth={2} />
            </div>
            <div className="min-w-0 pt-0.5">
                <p className="text-[14px] font-semibold text-neutral-950">{title}</p>
                <p className="mt-0.5 text-[13px] text-neutral-500">{description}</p>
            </div>
        </div>
    )
}

function ReviewCard({
    title,
    icon: Icon,
    onEdit,
    children,
}: {
    title: string
    icon: ElementType
    onEdit: () => void
    children: ReactNode
}) {
    return (
        <section className="px-5 py-5 sm:px-6">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    </div>
                    <h3 className="text-[14px] font-semibold text-neutral-950">{title}</h3>
                </div>
                <button
                    type="button"
                    onClick={onEdit}
                    className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-[12px] font-semibold text-neutral-500 transition-colors active:scale-95 hover:bg-neutral-50 hover:text-neutral-900"
                >
                    Edit
                </button>
            </div>
            {children}
        </section>
    )
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <p className="text-[13px] text-neutral-500">{label}</p>
            <p className={cn('text-right text-[13px] text-neutral-950', bold ? 'font-bold' : 'font-semibold')}>{value}</p>
        </div>
    )
}

function MiniPill({ icon: Icon, label }: { icon: ElementType; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-100 bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold text-neutral-600">
            <Icon className="h-3 w-3 text-neutral-400" strokeWidth={2} />
            {label}
        </span>
    )
}

function WizardSkeleton() {
    return (
        <div className="mx-auto min-h-screen max-w-[760px] bg-white pb-16 font-sans">
            <div className="px-4 pt-3 sm:px-5">
                <div className="flex items-center gap-3 pb-2">
                    <div className="h-9 w-9 rounded-full bg-neutral-200/60" />
                    <div className="flex-1">
                        <div className="h-5 w-24 rounded-lg bg-neutral-200/60" />
                        <div className="mt-1.5 h-3 w-16 rounded-lg bg-neutral-200/40" />
                    </div>
                    <div className="h-4 w-8 rounded-lg bg-neutral-200/40" />
                </div>
                <div className="mt-1 h-[3px] rounded-full bg-neutral-200/40" />
                <div className="mt-3 flex gap-4">
                    {[48, 50, 44, 56, 52, 40].map((w, i) => (
                        <div key={i} className="h-4 rounded-full bg-neutral-200/40" style={{ width: w }} />
                    ))}
                </div>
            </div>
            <div className="mt-6 px-4 sm:px-5">
                <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
                    {[1, 2, 3].map((i) => (
                        <div key={i}>
                            <div className="flex items-center gap-3.5 px-4 py-3.5">
                                <div className="h-[56px] w-[56px] rounded-2xl bg-neutral-100" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-32 rounded-lg bg-neutral-100" />
                                    <div className="h-3 w-44 rounded-lg bg-neutral-100" />
                                    <div className="h-3 w-20 rounded-lg bg-neutral-50" />
                                </div>
                                <div className="h-5 w-5 rounded-full bg-neutral-100" />
                            </div>
                            {i < 3 && <div className="ml-[76px] border-t border-neutral-100" />}
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-8 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-neutral-300" />
            </div>
        </div>
    )
}

/* ── Default clauses generator ──────────────────────────── */

function getDefaultClauses(rules: RentalRulesData): LeaseClause[] {
    const clauses: LeaseClause[] = [
        {
            id: 'mandatory_rent',
            title: 'Rent Payment',
            content: `The Tenant agrees to pay the monthly rent amount specified in this agreement on or before the ${rules.rentDueDay}${getOrdinal(rules.rentDueDay)} of each month. Late payments will incur a ${rules.lateFeeType === 'percentage' ? `${rules.lateFeeAmount}% of monthly rent` : `N$${rules.lateFeeAmount}`} fee after a ${rules.gracePeriodDays}-day grace period.`,
            isMandatory: true,
        },
        {
            id: 'mandatory_deposit',
            title: 'Security Deposit',
            content: 'The Tenant shall pay a security deposit as specified in this agreement. The deposit will be held by the Landlord for the duration of the lease and returned within 14 days of lease termination, subject to deductions for damages beyond normal wear and tear, outstanding rent, or other legitimate charges.',
            isMandatory: true,
        },
        {
            id: 'mandatory_condition',
            title: 'Property Condition & Maintenance',
            content: `The Tenant agrees to maintain the property in good, habitable condition. Maintenance responsibility: ${rules.maintenanceResponsibility}. The Tenant shall not make structural modifications without written consent.`,
            isMandatory: true,
        },
        {
            id: 'mandatory_occupancy',
            title: 'Occupancy & Use',
            content: `The property shall be used solely as a residential dwelling. Maximum occupants: ${rules.maxOccupants}. ${rules.sublettingAllowed ? 'Subletting is permitted with written landlord consent.' : 'Subletting is not permitted without written consent.'}`,
            isMandatory: true,
        },
        {
            id: 'mandatory_entry',
            title: 'Entry by Landlord',
            content: 'The Landlord may enter the property with 24-hour notice for inspections, repairs, or showings. Immediate entry is permitted in emergencies.',
            isMandatory: true,
        },
        {
            id: 'mandatory_termination',
            title: 'Termination & Notice',
            content: `Either party may terminate this lease by providing ${rules.noticePeriodDays} days written notice. Early termination by the Tenant may result in forfeiture of the security deposit unless otherwise agreed.`,
            isMandatory: true,
        },
        {
            id: 'mandatory_dispute',
            title: 'Dispute Resolution',
            content: 'Disputes shall first be resolved through negotiation. If negotiation fails, parties agree to seek mediation through the Namibian Rental Tribunal before pursuing legal action. This agreement is governed by the laws of the Republic of Namibia.',
            isMandatory: true,
        },
    ]

    if (rules.petPolicy !== 'no_pets') {
        clauses.push({
            id: 'auto_pets',
            title: 'Pet Policy',
            content: `Pets are permitted: ${rules.petPolicy.replace(/_/g, ' ')}. The Tenant is responsible for any pet-related damage.`,
            isMandatory: false,
        })
    } else {
        clauses.push({
            id: 'auto_pets',
            title: 'Pet Policy',
            content: 'No pets are permitted without prior written consent from the Landlord.',
            isMandatory: false,
        })
    }

    if (rules.utilitiesIncluded.length > 0) {
        clauses.push({
            id: 'auto_utilities',
            title: 'Utilities',
            content: `Included in rent: ${rules.utilitiesIncluded.join(', ')}. All other utilities are the Tenant\'s responsibility.`,
            isMandatory: false,
        })
    }

    if (!rules.smokingAllowed) {
        clauses.push({
            id: 'auto_smoking',
            title: 'Smoking Policy',
            content: 'Smoking is strictly prohibited inside the property. Violation may result in lease termination.',
            isMandatory: false,
        })
    }

    return clauses
}
