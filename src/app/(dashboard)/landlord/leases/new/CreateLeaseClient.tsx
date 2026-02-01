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
    FileText,
    Save,
    Info
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

    const steps: { key: Step; label: string; number: number }[] = [
        { key: 'select_property', label: 'Property', number: 1 },
        { key: 'lease_terms', label: 'Terms', number: 2 },
        { key: 'build_document', label: 'Document', number: 3 },
        { key: 'preview', label: 'Review', number: 4 },
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
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-6 w-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Loading...</p>
                </div>
            </div>
        )
    }

    const availableProperties = properties.filter(p => p.isAvailable || p.approvalStatus === 'approved')

    return (
        <div className="min-h-screen bg-[#fafafa] font-sans pb-24">
            <div className="px-4 py-8 md:px-6 md:py-12 max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <Link
                        href="/landlord/leases"
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-900 transition-colors group"
                    >
                        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back to leases
                    </Link>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-between mb-12">
                    {steps.map((step, index) => {
                        const isDone = index < currentStepIndex
                        const isCurrent = currentStep === step.key

                        return (
                            <div key={step.key} className="flex items-center flex-1">
                                <button
                                    onClick={() => index <= currentStepIndex && setCurrentStep(step.key)}
                                    disabled={index > currentStepIndex}
                                    className="flex flex-col items-center gap-3 relative z-10"
                                >
                                    <div className={cn(
                                        "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-all border",
                                        isCurrent
                                            ? "bg-neutral-900 text-white border-neutral-900 shadow-md shadow-neutral-900/20"
                                            : isDone
                                                ? "bg-white text-neutral-900 border-neutral-200"
                                                : "bg-white text-neutral-300 border-neutral-100"
                                    )}>
                                        {isDone ? <Check className="h-4 w-4" strokeWidth={3} /> : step.number}
                                    </div>
                                    <span className={cn(
                                        "text-[10px] uppercase font-bold tracking-wider",
                                        isCurrent ? "text-neutral-900" : "text-neutral-400"
                                    )}>
                                        {step.label}
                                    </span>
                                </button>
                                {index < steps.length - 1 && (
                                    <div className={cn(
                                        "flex-1 h-[2px] mx-3 rounded-full mb-6",
                                        index < currentStepIndex ? "bg-neutral-900" : "bg-neutral-100"
                                    )} />
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Step Content */}
                <div className="min-h-[400px]">
                    {/* Step 1: Select Property */}
                    {currentStep === 'select_property' && (
                        <div>
                            <h2 className="text-lg font-bold uppercase tracking-wider text-neutral-900 mb-6 font-mono">Select a Property</h2>
                            {availableProperties.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 px-8 text-center rounded-2xl bg-white border border-neutral-200 border-dashed">
                                    <div className="h-16 w-16 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-6">
                                        <Building2 className="h-7 w-7 text-neutral-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-neutral-900 mb-3">No available properties</h3>
                                    <p className="text-neutral-500 font-medium mb-8 max-w-sm">
                                        Add a property first, then come back to create a lease.
                                    </p>
                                    <Link href="/landlord/properties/new">
                                        <Button className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-full h-12 px-8 font-bold text-base shadow-lg shadow-neutral-900/10 transition-transform active:scale-95">
                                            Add a Property
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {availableProperties.map((property) => {
                                        const isSelected = selectedProperty?._id === property._id

                                        return (
                                            <button
                                                key={property._id}
                                                onClick={() => handlePropertySelect(property)}
                                                className={cn(
                                                    "flex items-start gap-4 p-4 rounded-xl text-left transition-all duration-300",
                                                    isSelected
                                                        ? "bg-neutral-900 text-white shadow-xl shadow-neutral-900/20 transform scale-[1.02]"
                                                        : "bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 shadow-sm hover:shadow-md"
                                                )}
                                            >
                                                <div className={cn(
                                                    "h-16 w-16 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border",
                                                    isSelected ? "border-neutral-700 bg-neutral-800" : "border-neutral-100 bg-neutral-100"
                                                )}>
                                                    {property.imageUrls?.[0] ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img
                                                            src={property.imageUrls[0]}
                                                            alt={property.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Building2 className={cn("h-6 w-6", isSelected ? "text-white/40" : "text-neutral-300")} />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className={cn("font-bold truncate text-sm", isSelected ? "text-white" : "text-neutral-900")}>
                                                        {property.title}
                                                    </h3>
                                                    <p className={cn("text-xs font-medium truncate mt-0.5", isSelected ? "text-neutral-400" : "text-neutral-500")}>
                                                        {property.address}, {property.city}
                                                    </p>
                                                    <p className={cn("text-sm font-bold mt-2 font-[family-name:var(--font-anton)] tracking-wide", isSelected ? "text-white" : "text-neutral-900")}>
                                                        N$ {property.priceNad?.toLocaleString()}
                                                        <span className={cn("font-normal font-sans text-xs ml-1 opacity-60")}>/mo</span>
                                                    </p>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Lease Terms */}
                    {currentStep === 'lease_terms' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-lg font-bold uppercase tracking-wider text-neutral-900 font-mono">Lease Terms</h2>

                            {/* Tenant Email */}
                            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm shadow-neutral-900/5">
                                <Label htmlFor="tenantEmail" className="text-neutral-900 font-bold text-xs uppercase tracking-wide">Tenant Email</Label>
                                <Input
                                    id="tenantEmail"
                                    type="email"
                                    placeholder="tenant@example.com"
                                    value={tenantEmail}
                                    onChange={(e) => setTenantEmail(e.target.value)}
                                    className="mt-3 h-12 rounded-xl bg-neutral-50 border-neutral-200 focus-visible:ring-neutral-900 shadow-none text-base"
                                />
                                <p className="text-[10px] uppercase font-bold text-neutral-400 mt-3 flex items-center gap-2">
                                    <Info className="w-3 h-3" />
                                    The tenant must have an account to receive this lease
                                </p>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm shadow-neutral-900/5">
                                    <Label htmlFor="startDate" className="text-neutral-900 font-bold text-xs uppercase tracking-wide">Start Date</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="mt-3 h-12 rounded-xl bg-neutral-50 border-neutral-200 focus-visible:ring-neutral-900 shadow-none"
                                    />
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm shadow-neutral-900/5">
                                    <Label htmlFor="endDate" className="text-neutral-900 font-bold text-xs uppercase tracking-wide">End Date</Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="mt-3 h-12 rounded-xl bg-neutral-50 border-neutral-200 focus-visible:ring-neutral-900 shadow-none"
                                    />
                                </div>
                            </div>

                            {/* Financial */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm shadow-neutral-900/5">
                                    <Label htmlFor="monthlyRent" className="text-neutral-900 font-bold text-xs uppercase tracking-wide">Monthly Rent (N$)</Label>
                                    <div className="relative mt-3">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">N$</span>
                                        <Input
                                            id="monthlyRent"
                                            type="number"
                                            min={0}
                                            value={monthlyRent}
                                            onChange={(e) => setMonthlyRent(Number(e.target.value))}
                                            className="h-12 pl-10 rounded-xl bg-neutral-50 border-neutral-200 focus-visible:ring-neutral-900 shadow-none font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm shadow-neutral-900/5">
                                    <Label htmlFor="deposit" className="text-neutral-900 font-bold text-xs uppercase tracking-wide">Security Deposit (N$)</Label>
                                    <div className="relative mt-3">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">N$</span>
                                        <Input
                                            id="deposit"
                                            type="number"
                                            min={0}
                                            value={deposit}
                                            onChange={(e) => setDeposit(Number(e.target.value))}
                                            className="h-12 pl-10 rounded-xl bg-neutral-50 border-neutral-200 focus-visible:ring-neutral-900 shadow-none font-medium"
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
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-start gap-4 p-6 rounded-2xl bg-neutral-100/50 border border-neutral-200">
                                <Info className="h-5 w-5 text-neutral-900 shrink-0 mt-0.5" />
                                <p className="text-sm font-medium text-neutral-600 leading-relaxed">
                                    Review the lease document below. If everything looks correct, you can send it directly to the tenant for signing. They will receive an email notification.
                                </p>
                            </div>

                            <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm shadow-neutral-900/5">
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

                {/* Navigation */}
                <div className="flex items-center justify-between pt-8 mt-12 border-t border-neutral-200">
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentStep(steps[currentStepIndex - 1]?.key)}
                        disabled={currentStepIndex === 0}
                        className="rounded-full h-12 px-6 font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>

                    {currentStep === 'preview' ? (
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={handleSaveDraft}
                                disabled={isSaving}
                                className="rounded-full h-12 px-8 font-bold border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:border-neutral-300 hover:bg-neutral-50 shadow-none"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                Save Draft
                            </Button>
                            <Button
                                onClick={handleSendToTenant}
                                disabled={isSending}
                                className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-full h-12 px-8 font-bold shadow-xl shadow-neutral-900/10 transition-transform active:scale-95"
                            >
                                {isSending ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Send className="h-4 w-4 mr-2" />
                                )}
                                Send to Tenant
                            </Button>
                        </div>
                    ) : (
                        <Button
                            onClick={() => setCurrentStep(steps[currentStepIndex + 1]?.key)}
                            disabled={!canProceed()}
                            className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-full h-12 px-8 font-bold shadow-xl shadow-neutral-900/10 transition-transform active:scale-95 disabled:opacity-50 disabled:shadow-none"
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
