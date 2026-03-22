'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RentalRulesConfigurator, type RentalRulesData } from '@/components/leases/RentalRulesConfigurator'
import { ClauseEditor, type LeaseClause } from '@/components/leases/ClauseEditor'
import { toast } from 'sonner'
import {
    ChevronLeft,
    ChevronRight,
    Building2,
    Check,
    Loader2,
    Send,
    Save,
    Info,
    User,
    FileText,
    Search,
    Bookmark,
    Sparkles,
} from 'lucide-react'
import { useMutation, useQuery, useConvex } from "convex/react"
import { api } from "../../../../../../convex/_generated/api"
import { Id } from "../../../../../../convex/_generated/dataModel"
import { cn } from '@/lib/utils'

type Step = 'property' | 'tenant' | 'rules' | 'clauses' | 'review' | 'send'

const STEPS: { key: Step; label: string; icon: React.ElementType }[] = [
    { key: 'property', label: 'Property', icon: Building2 },
    { key: 'tenant', label: 'Tenant', icon: User },
    { key: 'rules', label: 'Rules', icon: Sparkles },
    { key: 'clauses', label: 'Clauses', icon: FileText },
    { key: 'review', label: 'Review', icon: Check },
    { key: 'send', label: 'Send', icon: Send },
]

export function CreateLeaseClient() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const convex = useConvex()

    // State
    const [currentStep, setCurrentStep] = useState<Step>('property')
    const [selectedProperty, setSelectedProperty] = useState<any>(null)
    const [tenantEmail, setTenantEmail] = useState('')
    const [tenantFound, setTenantFound] = useState<any>(null)
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
    const properties = useQuery(api.properties.getByLandlord, {})
    const leases = useQuery(api.leases.getForLandlord, {})
    const templates = useQuery(api.leaseTemplates.getForLandlord, {})

    // Mutations
    const createLease = useMutation(api.leases.create)

    const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep)

    const preselectedPropertyId = searchParams.get('propertyId')

    // Property selection handler
    const handlePropertySelect = (property: any) => {
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

        const property = properties.find((candidate: any) => candidate._id === preselectedPropertyId)
        if (property) {
            handlePropertySelect(property)
        }
    }, [preselectedPropertyId, properties, selectedProperty])

    // Template selection
    const applyTemplate = (template: any) => {
        setSelectedTemplateId(template._id)
        setRules((prev) => ({
            ...prev,
            rentDueDay: template.rentDueDay ?? prev.rentDueDay,
            gracePeriodDays: template.gracePeriodDays ?? prev.gracePeriodDays,
            lateFeeType: template.lateFeeType ?? prev.lateFeeType,
            lateFeeAmount: template.lateFeeAmount ?? prev.lateFeeAmount,
            petPolicy: template.petPolicy ?? prev.petPolicy,
            utilitiesIncluded: template.utilitiesIncluded ?? prev.utilitiesIncluded,
            parkingIncluded: template.parkingIncluded ?? prev.parkingIncluded,
            maintenanceResponsibility: template.maintenanceResponsibility ?? prev.maintenanceResponsibility,
            noticePeriodDays: template.noticePeriodDays ?? prev.noticePeriodDays,
            maxOccupants: template.maxOccupants ?? prev.maxOccupants,
            smokingAllowed: template.smokingAllowed ?? prev.smokingAllowed,
            sublettingAllowed: template.sublettingAllowed ?? prev.sublettingAllowed,
        }))
        if (template.customClauses) {
            setClauses(template.customClauses)
        }
        toast.success(`Template "${template.name}" applied`)
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
        if (sendImmediately) {
            setIsSending(true)
        } else {
            setIsSaving(true)
        }

        try {
            const customClauses = clauses.filter((c) => !c.isMandatory)

            const result = await createLease({
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
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Something went wrong.')
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
            .filter((lease: any) => ['draft', 'sent_to_tenant', 'tenant_signed', 'revision_requested', 'approved'].includes(lease.status))
            .map((lease: any) => lease.propertyId)
    )

    const availableProperties = properties.filter((property: any) =>
        property.approvalStatus === 'approved' && !blockedPropertyIds.has(property._id)
    )

    return (
        <div className="font-sans pb-28">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/landlord/leases"
                    className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-4"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Leases
                </Link>
                <h1 className="text-2xl font-semibold text-neutral-900">New Lease</h1>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    {STEPS.map((step, index) => {
                        const isDone = index < currentStepIndex
                        const isCurrent = currentStep === step.key
                        const StepIcon = step.icon
                        return (
                            <button
                                key={step.key}
                                onClick={() => index <= currentStepIndex && setCurrentStep(step.key)}
                                disabled={index > currentStepIndex}
                                className="flex flex-col items-center gap-1 flex-1"
                            >
                                <div
                                    className={cn(
                                        'h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-all',
                                        isCurrent
                                            ? 'bg-neutral-900 text-white scale-110'
                                            : isDone
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-neutral-100 text-neutral-400'
                                    )}
                                >
                                    {isDone ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                                </div>
                                <span
                                    className={cn(
                                        'text-[10px] font-medium',
                                        isCurrent ? 'text-neutral-900' : 'text-neutral-400'
                                    )}
                                >
                                    {step.label}
                                </span>
                            </button>
                        )
                    })}
                </div>
                <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-neutral-900 rounded-full transition-all duration-500"
                        style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">
                {/* ── Step 1: Property ── */}
                {currentStep === 'property' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Template Picker */}
                        {templates && templates.length > 0 && (
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <Bookmark className="h-4 w-4 text-neutral-500" />
                                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">
                                        Use a Template
                                    </span>
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                                    {templates.map((template: any) => (
                                        <button
                                            key={template._id}
                                            onClick={() => applyTemplate(template)}
                                            className={cn(
                                                'flex-shrink-0 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all whitespace-nowrap',
                                                selectedTemplateId === template._id
                                                    ? 'bg-neutral-900 text-white border-neutral-900'
                                                    : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
                                            )}
                                        >
                                            {template.isDefault && <span className="mr-1">⭐</span>}
                                            {template.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Property Selection */}
                        {availableProperties.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="h-14 w-14 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                                    <Building2 className="h-6 w-6 text-neutral-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                                    No available properties
                                </h3>
                                <p className="text-sm text-neutral-500 mb-6 max-w-xs mx-auto">
                                    Add a property first to create a lease.
                                </p>
                                <Link href="/landlord/properties/new">
                                    <Button className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl h-11 px-6">
                                        Add Property
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-neutral-500 mb-4">
                                    Select the property for this lease
                                </p>
                                {availableProperties.map((property: any) => {
                                    const isSelected = selectedProperty?._id === property._id
                                    return (
                                        <button
                                            key={property._id}
                                            onClick={() => handlePropertySelect(property)}
                                            className={cn(
                                                'w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all border',
                                                isSelected
                                                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-lg'
                                                    : 'bg-white hover:bg-neutral-50 border-neutral-200 hover:border-neutral-300'
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    'h-16 w-16 rounded-xl flex items-center justify-center shrink-0 overflow-hidden',
                                                    isSelected ? 'bg-neutral-800' : 'bg-neutral-100'
                                                )}
                                            >
                                                {property.imageUrls?.[0] ? (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img
                                                        src={property.imageUrls[0]}
                                                        alt={property.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Building2
                                                        className={cn(
                                                            'h-6 w-6',
                                                            isSelected ? 'text-neutral-500' : 'text-neutral-400'
                                                        )}
                                                    />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-sm truncate">
                                                    {property.title}
                                                </h3>
                                                <p
                                                    className={cn(
                                                        'text-xs truncate mt-0.5',
                                                        isSelected ? 'text-neutral-400' : 'text-neutral-500'
                                                    )}
                                                >
                                                    {property.address}, {property.city}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="font-bold text-sm">
                                                    N${property.priceNad?.toLocaleString()}
                                                </p>
                                                <p
                                                    className={cn(
                                                        'text-xs',
                                                        isSelected ? 'text-neutral-400' : 'text-neutral-500'
                                                    )}
                                                >
                                                    /mo
                                                </p>
                                            </div>
                                            {isSelected && (
                                                <div className="h-7 w-7 rounded-full bg-white flex items-center justify-center shrink-0">
                                                    <Check className="h-4 w-4 text-neutral-900" />
                                                </div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Step 2: Tenant ── */}
                {currentStep === 'tenant' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
                        <p className="text-sm text-neutral-500 mb-2">
                            Enter the tenant&apos;s email address. They need an account to receive the lease.
                        </p>
                        <div className="bg-white rounded-xl border border-neutral-200 p-5">
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                <Input
                                    type="email"
                                    placeholder="tenant@example.com"
                                    value={tenantEmail}
                                    onChange={(e) => setTenantEmail(e.target.value)}
                                    className="h-12 pl-10 rounded-xl bg-neutral-50 border-neutral-200 text-neutral-900 font-medium"
                                />
                            </div>

                            {/* Search Result */}
                            {tenantSearching && (
                                <div className="flex items-center gap-2 mt-4 text-neutral-400">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm">Searching...</span>
                                </div>
                            )}

                            {tenantFound && (
                                <div className="flex items-center gap-3 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                        <User className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-emerald-900">
                                            {tenantFound.fullName || 'User Found'}
                                        </p>
                                        <p className="text-xs text-emerald-600">{tenantFound.email}</p>
                                    </div>
                                    <Check className="h-5 w-5 text-emerald-500 ml-auto" />
                                </div>
                            )}

                            {tenantError && (
                                <div className="flex items-start gap-2 mt-4 p-3 rounded-xl bg-red-50 border border-red-100">
                                    <Info className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                    <p className="text-sm text-red-700">{tenantError}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Step 3: Rules ── */}
                {currentStep === 'rules' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <p className="text-sm text-neutral-500 mb-4">
                            Set the rental terms, payment rules, and property policies.
                        </p>
                        <RentalRulesConfigurator
                            data={rules}
                            onChange={setRules}
                        />
                    </div>
                )}

                {/* ── Step 4: Clauses ── */}
                {currentStep === 'clauses' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <p className="text-sm text-neutral-500 mb-4">
                            Review the lease clauses. Mandatory clauses are locked. You can add custom clauses.
                        </p>
                        <ClauseEditor
                            clauses={clauses.length > 0 ? clauses : getDefaultClauses(rules)}
                            onChange={setClauses}
                        />
                    </div>
                )}

                {/* ── Step 5: Review ── */}
                {currentStep === 'review' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
                        <p className="text-sm text-neutral-500 mb-2">
                            Review everything before sending.
                        </p>

                        {/* Property */}
                        <ReviewCard
                            title="Property"
                            editStep={() => setCurrentStep('property')}
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-neutral-100 overflow-hidden flex items-center justify-center">
                                    {selectedProperty?.imageUrls?.[0] ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            src={selectedProperty.imageUrls[0]}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Building2 className="h-5 w-5 text-neutral-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-neutral-900">{selectedProperty?.title}</p>
                                    <p className="text-xs text-neutral-500">
                                        {selectedProperty?.address}, {selectedProperty?.city}
                                    </p>
                                </div>
                            </div>
                        </ReviewCard>

                        {/* Tenant */}
                        <ReviewCard
                            title="Tenant"
                            editStep={() => setCurrentStep('tenant')}
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center">
                                    <User className="h-4 w-4 text-neutral-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-neutral-900">
                                        {tenantFound?.fullName || 'Tenant'}
                                    </p>
                                    <p className="text-xs text-neutral-500">{tenantEmail}</p>
                                </div>
                            </div>
                        </ReviewCard>

                        {/* Financial Summary */}
                        <ReviewCard
                            title="Financial Summary"
                            editStep={() => setCurrentStep('rules')}
                        >
                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-center p-3 bg-neutral-50 rounded-lg">
                                    <p className="text-xs text-neutral-500 mb-0.5">Monthly Rent</p>
                                    <p className="text-lg font-bold text-neutral-900">
                                        N${rules.monthlyRent.toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-center p-3 bg-neutral-50 rounded-lg">
                                    <p className="text-xs text-neutral-500 mb-0.5">Deposit</p>
                                    <p className="text-lg font-bold text-neutral-900">
                                        N${rules.deposit.toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-center p-3 bg-neutral-50 rounded-lg">
                                    <p className="text-xs text-neutral-500 mb-0.5">First Payment</p>
                                    <p className="text-lg font-bold text-neutral-900">
                                        N${(rules.monthlyRent + rules.deposit).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                <RuleBadge label={`Due: ${rules.rentDueDay}${getOrdinal(rules.rentDueDay)}`} />
                                <RuleBadge label={`${rules.gracePeriodDays} day grace`} />
                                <RuleBadge label={`${rules.lateFeeAmount}${rules.lateFeeType === 'percentage' ? '%' : ' N$'} late fee`} />
                                <RuleBadge label={`${rules.noticePeriodDays} day notice`} />
                            </div>
                        </ReviewCard>

                        {/* Rules */}
                        <ReviewCard
                            title="Property Rules"
                            editStep={() => setCurrentStep('rules')}
                        >
                            <div className="flex flex-wrap gap-1.5">
                                <RuleBadge label={`🐾 ${rules.petPolicy.replace(/_/g, ' ')}`} />
                                <RuleBadge label={`🔧 ${rules.maintenanceResponsibility} maintenance`} />
                                <RuleBadge label={`👥 Max ${rules.maxOccupants}`} />
                                {rules.parkingIncluded && <RuleBadge label="🅿️ Parking" />}
                                {rules.smokingAllowed && <RuleBadge label="🚬 Smoking OK" />}
                                {!rules.smokingAllowed && <RuleBadge label="🚭 No Smoking" />}
                                {rules.sublettingAllowed && <RuleBadge label="🏠 Subletting OK" />}
                                {rules.utilitiesIncluded.map((u) => (
                                    <RuleBadge key={u} label={`⚡ ${u}`} />
                                ))}
                            </div>
                        </ReviewCard>

                        {/* Lease Period */}
                        <ReviewCard
                            title="Lease Period"
                            editStep={() => setCurrentStep('rules')}
                        >
                            <p className="text-sm text-neutral-900 font-medium">
                                {new Date(rules.startDate).toLocaleDateString('en-ZA', { month: 'long', day: 'numeric', year: 'numeric' })}
                                {' — '}
                                {new Date(rules.endDate).toLocaleDateString('en-ZA', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                        </ReviewCard>
                    </div>
                )}

                {/* ── Step 6: Send ── */}
                {currentStep === 'send' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="text-center py-8">
                            <div className="h-16 w-16 rounded-2xl bg-neutral-900 flex items-center justify-center mx-auto mb-5">
                                <Send className="h-7 w-7 text-white" />
                            </div>
                            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                                Ready to send?
                            </h2>
                            <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-8">
                                {tenantFound?.fullName || 'The tenant'} will receive a notification to review and sign the lease.
                            </p>

                            <div className="space-y-3 max-w-sm mx-auto">
                                <Button
                                    onClick={() => handleSubmit(true)}
                                    disabled={isSending}
                                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl h-12 font-semibold text-sm"
                                >
                                    {isSending ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Send className="h-4 w-4 mr-2" />
                                    )}
                                    Send to Tenant
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => handleSubmit(false)}
                                    disabled={isSaving}
                                    className="w-full rounded-xl h-11 border-neutral-200 text-neutral-700"
                                >
                                    {isSaving ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                    )}
                                    Save as Draft
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Sticky Bottom Nav ── */}
            {currentStep !== 'send' && (
                <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-neutral-100 p-4 z-50">
                    <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setCurrentStep(STEPS[currentStepIndex - 1]?.key)}
                            disabled={currentStepIndex === 0}
                            className="rounded-xl h-11 text-neutral-500"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Back
                        </Button>
                        <Button
                            onClick={() => {
                                // Initialize clauses when entering clauses step
                                if (STEPS[currentStepIndex + 1]?.key === 'clauses' && clauses.length === 0) {
                                    setClauses(getDefaultClauses(rules))
                                }
                                setCurrentStep(STEPS[currentStepIndex + 1]?.key)
                            }}
                            disabled={!canProceed()}
                            className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl h-11 px-6 disabled:opacity-40"
                        >
                            {currentStepIndex === STEPS.length - 2 ? 'Confirm' : 'Next'}
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Helper Components ──

function ReviewCard({
    title,
    editStep,
    children,
}: {
    title: string
    editStep: () => void
    children: React.ReactNode
}) {
    return (
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wide">
                    {title}
                </h3>
                <button
                    onClick={editStep}
                    className="text-xs font-medium text-neutral-500 hover:text-neutral-900 underline underline-offset-2"
                >
                    Edit
                </button>
            </div>
            {children}
        </div>
    )
}

function RuleBadge({ label }: { label: string }) {
    return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-neutral-100 text-xs font-medium text-neutral-700 capitalize">
            {label}
        </span>
    )
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
