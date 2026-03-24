'use client'

import { useCallback, useEffect, useState, type ElementType, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RentalRulesConfigurator, type RentalRulesData } from '@/components/leases/RentalRulesConfigurator'
import { ClauseEditor, type LeaseClause } from '@/components/leases/ClauseEditor'
import { toast } from 'sonner'
import {
    BadgeCheck,
    ChevronLeft,
    ChevronRight,
    Building2,
    CalendarRange,
    CircleAlert,
    CircleParking,
    Clock3,
    Layers3,
    Loader2,
    Send,
    Save,
    User,
    FileText,
    Search,
    Bookmark,
    Sparkles,
    MapPin,
    PawPrint,
    ShieldCheck,
    Wallet2,
    Wrench,
    Users,
    Cigarette,
    Home,
    Zap,
} from 'lucide-react'
import { useMutation, useQuery, useConvex } from "convex/react"
import { api } from "../../../../../../convex/_generated/api"
import { Id } from "../../../../../../convex/_generated/dataModel"
import { MAINTENANCE_LABELS, PET_POLICY_LABELS } from '@/constants/lease'
import { cn } from '@/lib/utils'

type Step = 'property' | 'tenant' | 'rules' | 'clauses' | 'review' | 'send'

type StepDefinition = {
    key: Step
    label: string
    title: string
    description: string
    icon: ElementType
}

type LandlordProperty = {
    _id: Id<'properties'>
    title: string
    address: string
    city: string
    priceNad?: number | null
    imageUrls?: string[] | null
    propertyType?: string | null
    bedrooms?: number | null
    bathrooms?: number | null
    approvalStatus?: string | null
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
    status: string
}

const STEPS: StepDefinition[] = [
    {
        key: 'property',
        label: 'Property',
        title: 'Choose the property',
        description: 'Pick the home for this lease and optionally apply a saved template before you continue.',
        icon: Building2,
    },
    {
        key: 'tenant',
        label: 'Tenant',
        title: 'Find the tenant',
        description: 'Search by email so the lease is attached to a real tenant account before it gets sent.',
        icon: User,
    },
    {
        key: 'rules',
        label: 'Terms',
        title: 'Set the lease terms',
        description: 'Define pricing, timing, utilities, and rules with a calmer structure that is easier to scan.',
        icon: Sparkles,
    },
    {
        key: 'clauses',
        label: 'Clauses',
        title: 'Refine the clauses',
        description: 'Keep required language intact, then tailor the flexible clauses for this property and tenant.',
        icon: FileText,
    },
    {
        key: 'review',
        label: 'Review',
        title: 'Review the draft',
        description: 'Check the summary, financials, and policy details before the tenant receives anything.',
        icon: ShieldCheck,
    },
    {
        key: 'send',
        label: 'Send',
        title: 'Send or save the draft',
        description: 'Send the agreement right away or keep a polished draft ready for later.',
        icon: Send,
    },
]

const currencyFormatter = new Intl.NumberFormat('en-US')
const humanDateFormatter = new Intl.DateTimeFormat('en-ZA', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
})

export function CreateLeaseClient() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const convex = useConvex()

    // State
    const [currentStep, setCurrentStep] = useState<Step>('property')
    const [selectedProperty, setSelectedProperty] = useState<LandlordProperty | null>(null)
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
    const [selectedTemplateId, setSelectedTemplateId] = useState<Id<"leaseTemplates"> | null>(null)

    // Queries
    const currentUser = useQuery(api.users.currentUser)
    const properties = useQuery(api.properties.getByLandlord, {}) as LandlordProperty[] | undefined
    const leases = useQuery(api.leases.getForLandlord, {}) as LandlordLeaseSummary[] | undefined
    const templates = useQuery(api.leaseTemplates.getForLandlord, {}) as LeaseTemplateRecord[] | undefined

    // Mutations
    const createLease = useMutation(api.leases.create)

    const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep)
    const currentStepDefinition = STEPS[currentStepIndex]

    const preselectedPropertyId = searchParams.get('propertyId')

    // Property selection handler
    const handlePropertySelect = (property: LandlordProperty) => {
        setSelectedProperty(property)
        setRules((prev) => ({
            ...prev,
            monthlyRent: property.priceNad || 0,
            deposit: property.priceNad || 0,
        }))
    }

    useEffect(() => {
        if (!preselectedPropertyId || !properties || selectedProperty) {
            return
        }

        const property = properties.find((candidate) => candidate._id === preselectedPropertyId)
        if (property) {
            handlePropertySelect(property)
        }
    }, [preselectedPropertyId, properties, selectedProperty])

    // Template selection
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
                    ...getDefaultClauses(nextRules).filter((clause) => clause.isMandatory),
                    ...template.customClauses.map((clause: LeaseClause) => ({
                        ...clause,
                        isMandatory: false,
                    })),
                ]
                : getDefaultClauses(nextRules)
        )
        toast.success(`Applied ${template.name}`)
    }

    // Tenant email search (debounced)
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
                setTenantError('No account found. Ask them to sign up first.')
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

    // Validation
    const canProceed = () => {
        switch (currentStep) {
            case 'property':
                return !!selectedProperty
            case 'tenant':
                return !!tenantFound
            case 'rules':
                return rules.monthlyRent > 0 && rules.startDate && rules.endDate
            case 'clauses':
                return true // clauses are optional extras
            case 'review':
                return true
            case 'send':
                return true
            default:
                return false
        }
    }

    // Submit
    const handleSubmit = async (sendImmediately: boolean) => {
        if (!selectedProperty) {
            toast.error('Choose a property before saving or sending the lease.')
            return
        }

        if (sendImmediately) {
            setIsSending(true)
        } else {
            setIsSaving(true)
        }

        try {
            const customClauses = clauses.filter((c) => !c.isMandatory)

            await createLease({
                propertyId: selectedProperty._id,
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
                customClauses: customClauses.length > 0 ? customClauses.map(c => ({
                    id: c.id,
                    title: c.title,
                    content: c.content,
                })) : undefined,
                sendImmediately,
            })

            if (sendImmediately) {
                toast.success(`Lease sent to ${tenantEmail}!`)
            } else {
                toast.success('Lease draft saved!')
            }
            router.push('/landlord/leases')
        } catch (error: unknown) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : 'Something went wrong.')
        } finally {
            setIsSaving(false)
            setIsSending(false)
        }
    }

    // Loading
    if (currentUser === undefined || properties === undefined || leases === undefined) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
                    <p className="text-sm text-neutral-400 font-medium">Loading...</p>
                </div>
            </div>
        )
    }

    const blockedPropertyIds = new Set(
        leases
            .filter((lease) => ['draft', 'sent_to_tenant', 'tenant_signed', 'revision_requested', 'approved'].includes(lease.status))
            .map((lease) => lease.propertyId)
    )

    const availableProperties = properties.filter((property) =>
        property.approvalStatus === 'approved' && !blockedPropertyIds.has(property._id)
    )

    const displayClauses = clauses.length > 0 ? clauses : getDefaultClauses(rules)
    const firstPayment = rules.monthlyRent + rules.deposit
    const selectedTemplate = templates?.find((template) => template._id === selectedTemplateId) ?? null
    const stepActionHint =
        currentStep === 'property'
            ? 'Choose the home first, then the rest of the draft opens up naturally.'
            : currentStep === 'tenant'
                ? 'The tenant needs an account before the lease can be sent.'
                : currentStep === 'rules'
                    ? 'Rent, deposit, and dates need to be set before review.'
                    : currentStep === 'clauses'
                        ? 'Refine any optional language, then move into review.'
                        : 'Everything is lined up for the final draft.'
    const reviewRuleBadges = [
        { icon: PawPrint, label: PET_POLICY_LABELS[rules.petPolicy] },
        { icon: Wrench, label: `${MAINTENANCE_LABELS[rules.maintenanceResponsibility]} maintenance` },
        { icon: Users, label: `Max ${rules.maxOccupants} occupants` },
        { icon: CalendarRange, label: `Due on the ${rules.rentDueDay}${getOrdinal(rules.rentDueDay)}` },
        { icon: Clock3, label: `${rules.noticePeriodDays} day notice` },
        { icon: CircleParking, label: rules.parkingIncluded ? 'Parking included' : 'No parking' },
        { icon: Cigarette, label: rules.smokingAllowed ? 'Smoking allowed' : 'No smoking' },
        { icon: Home, label: rules.sublettingAllowed ? 'Subletting allowed' : 'No subletting' },
        ...rules.utilitiesIncluded.map((utility) => ({ icon: Zap, label: utility })),
    ]

    return (
        <div className="mx-auto max-w-[760px] font-sans pb-32">
            <div>
                <section className="min-w-0 bg-white">
                    <div className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/90 backdrop-blur-xl">
                        <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
                            <Link
                                href="/landlord/leases"
                                className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
                                aria-label="Back to leases"
                            >
                                <ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
                            </Link>

                            <div className="min-w-0">
                                <p className="text-[17px] font-semibold tracking-[-0.02em] text-neutral-950">
                                    New lease
                                </p>
                                <p className="truncate text-[13px] text-neutral-500">
                                    {currentStepDefinition.title}
                                </p>
                            </div>

                            <div className="ml-auto text-right">
                                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
                                    Step {currentStepIndex + 1}/{STEPS.length}
                                </p>
                                <p className="mt-1 text-[13px] font-medium text-neutral-500">
                                    {currentStepDefinition.label}
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto no-scrollbar">
                            <div className="flex min-w-max px-2 sm:px-4">
                                {STEPS.map((step, index) => {
                                    const isDone = index < currentStepIndex
                                    const isCurrent = currentStep === step.key

                                    return (
                                        <button
                                            key={step.key}
                                            type="button"
                                            onClick={() => index <= currentStepIndex && setCurrentStep(step.key)}
                                            disabled={index > currentStepIndex}
                                            className={cn(
                                                'relative px-4 pb-4 pt-3 text-[15px] font-medium transition-colors',
                                                isCurrent
                                                    ? 'text-neutral-950'
                                                    : isDone
                                                        ? 'text-neutral-600 hover:text-neutral-950'
                                                        : 'text-neutral-400'
                                            )}
                                        >
                                            {step.label}
                                            <span
                                                className={cn(
                                                    'absolute inset-x-4 bottom-0 h-[3px] rounded-full transition-colors',
                                                    isCurrent ? 'bg-[#1d9bf0]' : 'bg-transparent'
                                                )}
                                            />
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="border-b border-neutral-100 px-4 py-5 sm:px-6">
                        <p className="max-w-2xl text-[15px] leading-7 text-neutral-600">
                            {currentStepDefinition.description}
                        </p>
                    </div>

                    <div className="min-h-[540px]">
                        {currentStep === 'property' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                {templates && templates.length > 0 && (
                                    <div className="border-b border-neutral-100 px-4 py-5 sm:px-6">
                                        <div className="flex items-center gap-2 text-[13px] font-medium text-neutral-500">
                                            <Bookmark className="h-4 w-4" strokeWidth={2} />
                                            Saved templates
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {templates.map((template) => (
                                                <button
                                                    key={template._id}
                                                    type="button"
                                                    onClick={() => applyTemplate(template)}
                                                    className={cn(
                                                        'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                                                        selectedTemplateId === template._id
                                                            ? 'border-[#1d9bf0]/30 bg-[#1d9bf0]/10 text-[#1d9bf0]'
                                                            : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950'
                                                    )}
                                                >
                                                    {template.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {availableProperties.length === 0 ? (
                                    <div className="px-4 py-8 sm:px-6">
                                        <div className="rounded-[24px] border border-dashed border-neutral-200 bg-neutral-50/80 px-6 py-12 text-center">
                                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500">
                                                <Building2 className="h-6 w-6" strokeWidth={1.9} />
                                            </div>
                                            <h3 className="text-xl font-semibold tracking-[-0.03em] text-neutral-950">
                                                No approved properties are ready
                                            </h3>
                                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-600">
                                                Add or approve a property first, then come back here to draft the lease.
                                            </p>
                                            <Link href="/landlord/properties/new" className="mt-6 inline-flex">
                                                <Button className="h-11 rounded-full bg-neutral-950 px-5 text-sm font-medium text-white hover:bg-neutral-800">
                                                    Add property
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        {availableProperties.map((property, index) => {
                                            const isSelected = selectedProperty?._id === property._id

                                            return (
                                                <div key={property._id}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePropertySelect(property)}
                                                        className={cn(
                                                            'group flex w-full items-start gap-4 px-4 py-4 text-left transition-colors hover:bg-neutral-50 sm:px-6',
                                                            isSelected && 'bg-neutral-50'
                                                        )}
                                                    >
                                                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[18px] bg-neutral-100">
                                                            {property.imageUrls?.[0] ? (
                                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                                <img
                                                                    src={property.imageUrls[0]}
                                                                    alt={property.title}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="flex h-full items-center justify-center text-neutral-400">
                                                                    <Building2 className="h-6 w-6" strokeWidth={1.8} />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="min-w-0">
                                                                    <h3 className="truncate text-[16px] font-semibold tracking-[-0.02em] text-neutral-950">
                                                                        {property.title}
                                                                    </h3>
                                                                    <div className="mt-1 flex items-center gap-2 text-sm text-neutral-500">
                                                                        <MapPin className="h-4 w-4 shrink-0" strokeWidth={2} />
                                                                        <span className="truncate">
                                                                            {property.address}, {property.city}
                                                                        </span>
                                                                    </div>
                                                                    <p className="mt-2 text-sm text-neutral-500">
                                                                        {[
                                                                            property.propertyType,
                                                                            property.bedrooms ? `${property.bedrooms} bed` : null,
                                                                            property.bathrooms ? `${property.bathrooms} bath` : null,
                                                                        ].filter(Boolean).join(' · ') || 'Residential property'}
                                                                    </p>
                                                                </div>

                                                                <div className="flex items-start gap-3">
                                                                    <div className="text-right">
                                                                        <p className="text-sm font-semibold text-neutral-950">
                                                                            {formatCurrency(property.priceNad || 0)}
                                                                        </p>
                                                                        <p className="text-xs text-neutral-500">per month</p>
                                                                    </div>
                                                                    <div
                                                                        className={cn(
                                                                            'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                                                                            isSelected ? 'border-[#1d9bf0]' : 'border-neutral-300'
                                                                        )}
                                                                    >
                                                                        <span
                                                                            className={cn(
                                                                                'h-2.5 w-2.5 rounded-full transition-colors',
                                                                                isSelected ? 'bg-[#1d9bf0]' : 'bg-transparent'
                                                                            )}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </button>
                                                    {index < availableProperties.length - 1 && (
                                                        <div className="ml-[96px] border-t border-neutral-100" />
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {currentStep === 'tenant' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="border-b border-neutral-100 px-4 py-5 sm:px-6">
                                    <Label className="text-[13px] font-medium text-neutral-500">
                                        Tenant email
                                    </Label>
                                    <div className="relative mt-3">
                                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" strokeWidth={2.1} />
                                        <Input
                                            type="email"
                                            placeholder="tenant@example.com"
                                            value={tenantEmail}
                                            onChange={(e) => setTenantEmail(e.target.value)}
                                            className="h-14 rounded-full border-neutral-200 bg-white pl-11 text-[15px] font-medium text-neutral-900 shadow-none focus-visible:border-[#1d9bf0] focus-visible:ring-4 focus-visible:ring-[#1d9bf0]/10"
                                        />
                                    </div>
                                    <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">
                                        We look up the tenant automatically once you pause typing. Only existing accounts can receive a lease.
                                    </p>
                                </div>

                                <div className="px-4 sm:px-6">
                                    {!tenantEmail && (
                                        <StatusRow
                                            icon={User}
                                            title="Add the tenant email"
                                            description="Use the account email the tenant signs in with so the draft connects to the right profile."
                                            tone="default"
                                        />
                                    )}

                                    {tenantSearching && (
                                        <StatusRow
                                            icon={Loader2}
                                            title="Searching tenant records"
                                            description="Checking for an existing account that matches this email."
                                            tone="default"
                                            spinning
                                        />
                                    )}

                                    {tenantFound && (
                                        <StatusRow
                                            icon={BadgeCheck}
                                            title={tenantFound.fullName || 'Tenant found'}
                                            description={tenantFound.email}
                                            tone="success"
                                        />
                                    )}

                                    {tenantError && (
                                        <StatusRow
                                            icon={CircleAlert}
                                            title="Tenant not found"
                                            description={tenantError}
                                            tone="danger"
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {currentStep === 'rules' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300 px-4 py-5 sm:px-6">
                                <p className="mb-6 max-w-2xl text-[15px] leading-7 text-neutral-500">
                                    Set the rental terms, payment rules, and property policies in one clean pass.
                                </p>
                                <RentalRulesConfigurator
                                    data={rules}
                                    onChange={setRules}
                                />
                            </div>
                        )}

                        {currentStep === 'clauses' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300 px-4 py-5 sm:px-6">
                                <p className="mb-6 max-w-2xl text-[15px] leading-7 text-neutral-500">
                                    Mandatory clauses stay locked. Add or refine optional language where this lease needs extra detail.
                                </p>
                                <ClauseEditor
                                    clauses={displayClauses}
                                    onChange={setClauses}
                                />
                            </div>
                        )}

                        {currentStep === 'review' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300 divide-y divide-neutral-100">
                                <ReviewSection
                                    title="Property"
                                    icon={Building2}
                                    editStep={() => setCurrentStep('property')}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[18px] border border-neutral-200 bg-neutral-50">
                                            {selectedProperty?.imageUrls?.[0] ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img
                                                    src={selectedProperty.imageUrls[0]}
                                                    alt={selectedProperty.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <Building2 className="h-5 w-5 text-neutral-400" strokeWidth={1.9} />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-neutral-950">
                                                {selectedProperty?.title || 'No property selected'}
                                            </p>
                                            <p className="mt-1 text-sm text-neutral-500">
                                                {selectedProperty
                                                    ? `${selectedProperty.address}, ${selectedProperty.city}`
                                                    : 'Choose a property to continue.'}
                                            </p>
                                        </div>
                                    </div>
                                </ReviewSection>

                                <ReviewSection
                                    title="Tenant"
                                    icon={User}
                                    editStep={() => setCurrentStep('tenant')}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-neutral-200 bg-neutral-50 text-neutral-500">
                                            <User className="h-5 w-5" strokeWidth={2} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-neutral-950">
                                                {tenantFound?.fullName || 'Tenant'}
                                            </p>
                                            <p className="mt-1 text-sm text-neutral-500">
                                                {tenantEmail || 'No tenant email added yet.'}
                                            </p>
                                        </div>
                                    </div>
                                </ReviewSection>

                                <ReviewSection
                                    title="Financial summary"
                                    icon={Wallet2}
                                    editStep={() => setCurrentStep('rules')}
                                >
                                    <div className="space-y-3">
                                        <ValueRow label="Monthly rent" value={formatCurrency(rules.monthlyRent)} />
                                        <ValueRow label="Deposit" value={formatCurrency(rules.deposit)} />
                                        <ValueRow label="First payment" value={formatCurrency(firstPayment)} />
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <RuleBadge icon={CalendarRange} label={`Due on the ${rules.rentDueDay}${getOrdinal(rules.rentDueDay)}`} />
                                        <RuleBadge icon={Clock3} label={`${rules.gracePeriodDays} day grace`} />
                                        <RuleBadge icon={Wallet2} label={`${rules.lateFeeAmount}${rules.lateFeeType === 'percentage' ? '%' : ' N$'} late fee`} />
                                    </div>
                                </ReviewSection>

                                <ReviewSection
                                    title="Policy summary"
                                    icon={Sparkles}
                                    editStep={() => setCurrentStep('rules')}
                                >
                                    <div className="flex flex-wrap gap-2">
                                        {reviewRuleBadges.map((badge) => (
                                            <RuleBadge key={badge.label} icon={badge.icon} label={badge.label} />
                                        ))}
                                    </div>
                                </ReviewSection>

                                <ReviewSection
                                    title="Lease period"
                                    icon={CalendarRange}
                                    editStep={() => setCurrentStep('rules')}
                                >
                                    <ValueRow
                                        label="Start"
                                        value={humanDateFormatter.format(new Date(rules.startDate))}
                                    />
                                    <div className="mt-3">
                                        <ValueRow
                                            label="End"
                                            value={humanDateFormatter.format(new Date(rules.endDate))}
                                        />
                                    </div>
                                    <p className="mt-4 text-sm leading-6 text-neutral-500">
                                        Notice period is {rules.noticePeriodDays} days and the draft currently includes {displayClauses.length} clauses.
                                    </p>
                                </ReviewSection>

                                <ReviewSection
                                    title="Clause set"
                                    icon={Layers3}
                                    editStep={() => setCurrentStep('clauses')}
                                >
                                    <div className="flex flex-wrap gap-2">
                                        <InlineStat label="Required" value={displayClauses.filter((clause) => clause.isMandatory).length} />
                                        <InlineStat label="Flexible" value={displayClauses.filter((clause) => !clause.isMandatory).length} />
                                        <InlineStat label="Total" value={displayClauses.length} />
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        {displayClauses.slice(0, 3).map((clause) => (
                                            <div
                                                key={clause.id}
                                                className="rounded-[18px] border border-neutral-200 bg-neutral-50/70 px-4 py-3"
                                            >
                                                <p className="text-sm font-semibold text-neutral-950">{clause.title}</p>
                                                <p className="mt-1 line-clamp-2 text-sm leading-6 text-neutral-500">
                                                    {clause.content}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </ReviewSection>
                            </div>
                        )}

                        {currentStep === 'send' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300 px-4 py-8 sm:px-6 sm:py-10">
                                <div className="mx-auto max-w-xl text-center">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-900">
                                        <Send className="h-6 w-6" strokeWidth={2} />
                                    </div>
                                    <h2 className="mt-5 text-[1.8rem] font-semibold tracking-[-0.05em] text-neutral-950">
                                        Ready to send the lease
                                    </h2>
                                    <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-neutral-600 sm:text-[15px]">
                                        {tenantFound?.fullName || 'The tenant'} will receive the agreement at {tenantEmail}. They can review the details, sign digitally, and send it back for approval.
                                    </p>

                                    <div className="mt-8 rounded-[24px] border border-neutral-200 bg-neutral-50/70 p-5 text-left">
                                        <div className="space-y-3">
                                            <ValueRow label="Property" value={selectedProperty?.title || 'Not selected'} />
                                            <ValueRow label="First payment" value={formatCurrency(firstPayment)} />
                                            <ValueRow label="Lease end" value={humanDateFormatter.format(new Date(rules.endDate))} />
                                            {selectedTemplate && (
                                                <ValueRow label="Template" value={selectedTemplate.name} />
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                        <Button
                                            onClick={() => handleSubmit(true)}
                                            disabled={isSending}
                                            className="h-12 flex-1 rounded-full bg-neutral-950 text-sm font-medium text-white hover:bg-neutral-800"
                                        >
                                            {isSending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Send className="h-4 w-4" strokeWidth={2.1} />
                                            )}
                                            Send to tenant
                                        </Button>

                                        <Button
                                            variant="outline"
                                            onClick={() => handleSubmit(false)}
                                            disabled={isSaving}
                                            className="h-12 flex-1 rounded-full border-neutral-200 bg-white text-sm font-medium text-neutral-700 shadow-none hover:bg-neutral-50"
                                        >
                                            {isSaving ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Save className="h-4 w-4" strokeWidth={2.1} />
                                            )}
                                            Save draft
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <aside className="hidden">
                    <div className="sticky top-6 space-y-4 pt-6">
                        <RailPanel title="Draft summary">
                            <div className="space-y-3 px-4 py-4">
                                <ValueRow label="Property" value={selectedProperty?.title || 'Not selected'} />
                                <ValueRow label="Tenant" value={tenantEmail || 'Not added'} />
                                <ValueRow label="Rent" value={formatCurrency(rules.monthlyRent)} />
                                <ValueRow label="First payment" value={formatCurrency(firstPayment)} />
                                <ValueRow
                                    label="Lease period"
                                    value={`${humanDateFormatter.format(new Date(rules.startDate))} - ${humanDateFormatter.format(new Date(rules.endDate))}`}
                                />
                                {selectedTemplate && (
                                    <ValueRow label="Template" value={selectedTemplate.name} />
                                )}
                            </div>
                        </RailPanel>

                        <RailPanel title="Progress">
                            <div>
                                {STEPS.map((step, index) => {
                                    const StepIcon = step.icon
                                    const isDone = index < currentStepIndex
                                    const isCurrent = index === currentStepIndex

                                    return (
                                        <div
                                            key={step.key}
                                            className={cn(
                                                'flex items-center justify-between gap-3 px-4 py-3',
                                                index < STEPS.length - 1 && 'border-b border-neutral-100'
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={cn(
                                                        'flex h-9 w-9 items-center justify-center rounded-full border',
                                                        isCurrent
                                                            ? 'border-[#1d9bf0]/30 bg-[#1d9bf0]/10 text-[#1d9bf0]'
                                                            : isDone
                                                                ? 'border-neutral-200 bg-neutral-100 text-neutral-900'
                                                                : 'border-neutral-200 bg-white text-neutral-400'
                                                    )}
                                                >
                                                    <StepIcon className="h-4 w-4" strokeWidth={2} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-neutral-950">
                                                        {step.label}
                                                    </p>
                                                    <p className="text-xs text-neutral-500">
                                                        {step.title}
                                                    </p>
                                                </div>
                                            </div>
                                            <span
                                                className={cn(
                                                    'text-xs font-medium',
                                                    isCurrent
                                                        ? 'text-[#1d9bf0]'
                                                        : isDone
                                                            ? 'text-neutral-600'
                                                            : 'text-neutral-400'
                                                )}
                                            >
                                                {isCurrent ? 'Now' : isDone ? 'Done' : 'Next'}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </RailPanel>
                    </div>
                </aside>
            </div>

            {currentStep !== 'send' && (
                <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 px-4">
                    <div className="mx-auto flex max-w-[760px] justify-center">
                        <div className="pointer-events-auto flex w-full items-center justify-between gap-3 rounded-[28px] border border-neutral-200 bg-white/92 px-4 py-3 backdrop-blur-xl sm:px-5">
                            <div className="hidden sm:block">
                                <p className="text-sm font-semibold text-neutral-950">
                                    Step {currentStepIndex + 1} of {STEPS.length}
                                </p>
                                <p className="mt-1 text-sm text-neutral-500">{stepActionHint}</p>
                            </div>

                            <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                                <Button
                                    variant="ghost"
                                    onClick={() => setCurrentStep(STEPS[currentStepIndex - 1]?.key)}
                                    disabled={currentStepIndex === 0}
                                    className="h-11 rounded-full bg-neutral-100 px-5 text-sm font-medium text-neutral-700 shadow-none hover:bg-neutral-200"
                                >
                                    <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
                                    Back
                                </Button>
                                <Button
                                    onClick={() => {
                                        if (STEPS[currentStepIndex + 1]?.key === 'clauses' && clauses.length === 0) {
                                            setClauses(getDefaultClauses(rules))
                                        }
                                        setCurrentStep(STEPS[currentStepIndex + 1]?.key)
                                    }}
                                    disabled={!canProceed()}
                                    className="h-11 rounded-full bg-neutral-950 px-5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-40"
                                >
                                    {currentStepIndex === STEPS.length - 2 ? 'Confirm draft' : 'Continue'}
                                    <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Helper Components ──

function StatusRow({
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
        <div className="flex items-start gap-4 py-5">
            <div
                className={cn(
                    'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border',
                    tone === 'success'
                        ? 'border-[#1d9bf0]/20 bg-[#1d9bf0]/10 text-[#1d9bf0]'
                        : tone === 'danger'
                            ? 'border-red-200 bg-red-50 text-red-600'
                            : 'border-neutral-200 bg-neutral-50 text-neutral-600'
                )}
            >
                <Icon className={cn('h-4 w-4', spinning && 'animate-spin')} strokeWidth={2.1} />
            </div>
            <div>
                <p className="text-sm font-semibold text-neutral-950">{title}</p>
                <p className="mt-1 text-sm leading-6 text-neutral-600">{description}</p>
            </div>
        </div>
    )
}

function ReviewSection({
    title,
    icon: Icon,
    editStep,
    children,
}: {
    title: string
    icon: ElementType
    editStep: () => void
    children: ReactNode
}) {
    return (
        <section className="px-4 py-5 sm:px-6">
            <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-700">
                        <Icon className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <h3 className="text-sm font-semibold text-neutral-950">
                        {title}
                    </h3>
                </div>
                <button
                    type="button"
                    onClick={editStep}
                    className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
                >
                    Edit
                </button>
            </div>
            {children}
        </section>
    )
}

function RailPanel({
    title,
    children,
}: {
    title: string
    children: ReactNode
}) {
    return (
        <section className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white">
            <div className="border-b border-neutral-100 px-4 py-3">
                <h3 className="text-[15px] font-semibold text-neutral-950">{title}</h3>
            </div>
            {children}
        </section>
    )
}

function ValueRow({
    label,
    value,
}: {
    label: string
    value: string
}) {
    return (
        <div className="flex items-start justify-between gap-4">
            <p className="text-sm text-neutral-500">{label}</p>
            <p className="text-right text-sm font-semibold text-neutral-950">{value}</p>
        </div>
    )
}

function InlineStat({ label, value }: { label: string; value: number }) {
    return (
        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-700">
            <span className="font-semibold text-neutral-950">{value}</span>
            <span>{label}</span>
        </div>
    )
}

function RuleBadge({ icon: Icon, label }: { icon: ElementType; label: string }) {
    return (
        <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm font-medium text-neutral-700">
            <Icon className="h-4 w-4 text-neutral-500" strokeWidth={2} />
            {label}
        </span>
    )
}

function formatCurrency(amount: number) {
    return `N$${currencyFormatter.format(amount || 0)}`
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

// Generate default clauses including mandatory ones + auto-generated from rules
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

    // Auto-generated from rules
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
