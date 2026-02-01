'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LeaseBuilder, LeaseDocumentData } from '@/components/leases/LeaseBuilder'
import { LeasePreview } from '@/components/leases/LeasePreview'
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
    Calendar,
    User,
    FileText,
    DollarSign
} from 'lucide-react'
import { useMutation, useQuery, useConvex } from "convex/react"
import { api } from "../../../../../../convex/_generated/api"
import { Id } from "../../../../../../convex/_generated/dataModel"
import { cn } from '@/lib/utils'

type Step = 'select_property' | 'lease_terms' | 'build_document' | 'preview'

export function CreateLeaseClient() {
    const router = useRouter()
    const convex = useConvex()
    const [currentStep, setCurrentStep] = useState<Step>('select_property')
    const [selectedProperty, setSelectedProperty] = useState<any>(null)
    const [tenantEmail, setTenantEmail] = useState('')
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [endDate, setEndDate] = useState(
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    )
    const [monthlyRent, setMonthlyRent] = useState<number>(0)
    const [deposit, setDeposit] = useState<number>(0)
    const [leaseDocument, setLeaseDocument] = useState<LeaseDocumentData | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [savedLeaseId, setSavedLeaseId] = useState<Id<"leases"> | null>(null)

    const currentUser = useQuery(api.users.currentUser)
    const properties = useQuery(api.properties.getByLandlord, {})

    const createLease = useMutation(api.leases.create)
    const sendToTenant = useMutation(api.leases.sendToTenant)

    const steps: { key: Step; label: string; icon: any }[] = [
        { key: 'select_property', label: 'Property', icon: Building2 },
        { key: 'lease_terms', label: 'Terms', icon: Calendar },
        { key: 'build_document', label: 'Document', icon: FileText },
        { key: 'preview', label: 'Review', icon: Check },
    ]

    const currentStepIndex = steps.findIndex(s => s.key === currentStep)

    const canProceed = () => {
        switch (currentStep) {
            case 'select_property':
                return !!selectedProperty
            case 'lease_terms':
                return monthlyRent > 0 && deposit >= 0 && startDate && endDate && tenantEmail
            case 'build_document':
                return !!leaseDocument
            case 'preview':
                return true
            default:
                return false
        }
    }

    const handlePropertySelect = (property: any) => {
        setSelectedProperty(property)
        setMonthlyRent(property.priceNad || 0)
        setDeposit(property.priceNad || 0)
    }

    const handleSaveDraft = async () => {
        if (!selectedProperty || !leaseDocument) return

        setIsSaving(true)
        try {
            const tenant = await convex.query(api.users.getByEmail, { email: tenantEmail })
            if (!tenant) {
                toast.error('Tenant not found. They must have an account first.')
                setIsSaving(false)
                return
            }

            const leaseId = await createLease({
                propertyId: selectedProperty._id,
                tenantId: tenant._id,
                startDate,
                endDate,
                monthlyRent,
                deposit,
                leaseDocument: leaseDocument as any,
            })

            setSavedLeaseId(leaseId)
            toast.success('Lease draft saved!')
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Failed to save draft.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleSendToTenant = async () => {
        if (!tenantEmail) {
            toast.error('Please enter tenant email first.')
            return
        }

        setIsSending(true)
        try {
            let leaseId = savedLeaseId
            if (!leaseId) {
                const tenant = await convex.query(api.users.getByEmail, { email: tenantEmail })
                if (!tenant) {
                    toast.error('Tenant not found. They must have an account first.')
                    setIsSending(false)
                    return
                }

                leaseId = await createLease({
                    propertyId: selectedProperty._id,
                    tenantId: tenant._id,
                    startDate,
                    endDate,
                    monthlyRent,
                    deposit,
                    leaseDocument: leaseDocument as any,
                })
            }

            await sendToTenant({ leaseId })
            toast.success(`Lease sent to ${tenantEmail}!`)
            router.push('/landlord/leases')
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Failed to send lease.')
        } finally {
            setIsSending(false)
        }
    }

    if (currentUser === undefined || properties === undefined) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
                    <p className="text-sm text-neutral-400 font-medium">Loading...</p>
                </div>
            </div>
        )
    }

    const availableProperties = properties.filter(p => p.isAvailable || p.approvalStatus === 'approved')

    return (
        <div className="font-sans pb-24">
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

            {/* Step Indicator - Horizontal scroll on mobile */}
            <div className="overflow-x-auto -mx-4 px-4 mb-8">
                <div className="flex items-center min-w-max">
                    {steps.map((step, index) => {
                        const isDone = index < currentStepIndex
                        const isCurrent = currentStep === step.key
                        const StepIcon = step.icon

                        return (
                            <div key={step.key} className="flex items-center">
                                <button
                                    onClick={() => index <= currentStepIndex && setCurrentStep(step.key)}
                                    disabled={index > currentStepIndex}
                                    className="flex items-center gap-2"
                                >
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                                        isCurrent
                                            ? "bg-neutral-900 text-white"
                                            : isDone
                                                ? "bg-emerald-100 text-emerald-600"
                                                : "bg-neutral-100 text-neutral-400"
                                    )}>
                                        {isDone ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                                    </div>
                                    <span className={cn(
                                        "text-xs font-medium whitespace-nowrap",
                                        isCurrent ? "text-neutral-900" : "text-neutral-400"
                                    )}>
                                        {step.label}
                                    </span>
                                </button>
                                {index < steps.length - 1 && (
                                    <div className={cn(
                                        "w-8 h-px mx-2",
                                        index < currentStepIndex ? "bg-emerald-300" : "bg-neutral-200"
                                    )} />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">
                {/* Step 1: Select Property */}
                {currentStep === 'select_property' && (
                    <div>
                        {availableProperties.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="h-12 w-12 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                                    <Building2 className="h-6 w-6 text-neutral-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-neutral-900 mb-2">No available properties</h3>
                                <p className="text-sm text-neutral-500 mb-6 max-w-xs mx-auto">
                                    Add a property first to create a lease.
                                </p>
                                <Link href="/landlord/properties/new">
                                    <Button className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg h-10 px-6">
                                        Add Property
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {availableProperties.map((property) => {
                                    const isSelected = selectedProperty?._id === property._id

                                    return (
                                        <button
                                            key={property._id}
                                            onClick={() => handlePropertySelect(property)}
                                            className={cn(
                                                "w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all border",
                                                isSelected
                                                    ? "bg-neutral-900 text-white border-neutral-900"
                                                    : "bg-white hover:bg-neutral-50 border-neutral-200 hover:border-neutral-300"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-14 w-14 rounded-lg flex items-center justify-center shrink-0 overflow-hidden",
                                                isSelected ? "bg-neutral-800" : "bg-neutral-100"
                                            )}>
                                                {property.imageUrls?.[0] ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={property.imageUrls[0]}
                                                        alt={property.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Building2 className={cn("h-6 w-6", isSelected ? "text-neutral-500" : "text-neutral-400")} />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-sm truncate">
                                                    {property.title}
                                                </h3>
                                                <p className={cn(
                                                    "text-xs truncate mt-0.5",
                                                    isSelected ? "text-neutral-400" : "text-neutral-500"
                                                )}>
                                                    {property.address}, {property.city}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="font-bold text-sm">
                                                    N${property.priceNad?.toLocaleString()}
                                                </p>
                                                <p className={cn(
                                                    "text-xs",
                                                    isSelected ? "text-neutral-400" : "text-neutral-500"
                                                )}>/mo</p>
                                            </div>
                                            {isSelected && (
                                                <div className="h-6 w-6 rounded-full bg-white flex items-center justify-center shrink-0">
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

                {/* Step 2: Lease Terms */}
                {currentStep === 'lease_terms' && (
                    <div className="space-y-4">
                        {/* Tenant Email */}
                        <div className="bg-white rounded-xl border border-neutral-200 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <User className="h-4 w-4 text-neutral-500" />
                                <Label className="text-sm font-medium text-neutral-900">Tenant</Label>
                            </div>
                            <Input
                                type="email"
                                placeholder="tenant@example.com"
                                value={tenantEmail}
                                onChange={(e) => setTenantEmail(e.target.value)}
                                className="h-11 rounded-lg bg-neutral-50 border-neutral-200"
                            />
                            <p className="text-xs text-neutral-500 mt-2 flex items-center gap-1">
                                <Info className="h-3 w-3" />
                                Tenant must have an account to receive this lease.
                            </p>
                        </div>

                        {/* Dates */}
                        <div className="bg-white rounded-xl border border-neutral-200 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar className="h-4 w-4 text-neutral-500" />
                                <Label className="text-sm font-medium text-neutral-900">Lease Period</Label>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs text-neutral-500 mb-1.5 block">Start Date</Label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="h-11 rounded-lg bg-neutral-50 border-neutral-200"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-neutral-500 mb-1.5 block">End Date</Label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="h-11 rounded-lg bg-neutral-50 border-neutral-200"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Financial */}
                        <div className="bg-white rounded-xl border border-neutral-200 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <DollarSign className="h-4 w-4 text-neutral-500" />
                                <Label className="text-sm font-medium text-neutral-900">Financials</Label>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs text-neutral-500 mb-1.5 block">Monthly Rent (N$)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={monthlyRent}
                                        onChange={(e) => setMonthlyRent(Number(e.target.value))}
                                        className="h-11 rounded-lg bg-neutral-50 border-neutral-200 font-semibold"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-neutral-500 mb-1.5 block">Deposit (N$)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={deposit}
                                        onChange={(e) => setDeposit(Number(e.target.value))}
                                        className="h-11 rounded-lg bg-neutral-50 border-neutral-200 font-semibold"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Build Document */}
                {currentStep === 'build_document' && (
                    <div>
                        <LeaseBuilder
                            initialData={leaseDocument || undefined}
                            onDataChange={setLeaseDocument}
                        />
                    </div>
                )}

                {/* Step 4: Preview & Send */}
                {currentStep === 'preview' && leaseDocument && (
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                            <Info className="h-5 w-5 text-neutral-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-neutral-600">
                                Review the lease below. Once sent, the tenant will receive a notification to sign.
                            </p>
                        </div>

                        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                            <LeasePreview
                                leaseDocument={leaseDocument}
                                property={{
                                    title: selectedProperty?.title || '',
                                    address: selectedProperty?.address || '',
                                    city: selectedProperty?.city || '',
                                    images: selectedProperty?.imageUrls,
                                }}
                                landlord={{
                                    fullName: currentUser?.fullName || '',
                                    email: currentUser?.email || '',
                                    phone: currentUser?.phone,
                                }}
                                leaseTerms={{
                                    startDate,
                                    endDate,
                                    monthlyRent,
                                    deposit,
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation - Sticky bottom */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-neutral-100 p-4 z-50">
                <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentStep(steps[currentStepIndex - 1]?.key)}
                        disabled={currentStepIndex === 0}
                        className="rounded-lg h-10 text-neutral-500"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back
                    </Button>

                    {currentStep === 'preview' ? (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleSaveDraft}
                                disabled={isSaving}
                                className="rounded-lg h-10 border-neutral-200"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                                ) : (
                                    <Save className="h-4 w-4 mr-1.5" />
                                )}
                                <span className="hidden sm:inline">Save Draft</span>
                            </Button>
                            <Button
                                onClick={handleSendToTenant}
                                disabled={isSending}
                                className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg h-10"
                            >
                                {isSending ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                                ) : (
                                    <Send className="h-4 w-4 mr-1.5" />
                                )}
                                Send to Tenant
                            </Button>
                        </div>
                    ) : (
                        <Button
                            onClick={() => setCurrentStep(steps[currentStepIndex + 1]?.key)}
                            disabled={!canProceed()}
                            className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg h-10 disabled:opacity-50"
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
