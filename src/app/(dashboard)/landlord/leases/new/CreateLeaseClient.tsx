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
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-black/10 border-t-black animate-spin" />
                    <p className="text-sm font-medium text-black/40 uppercase tracking-wider">Loading...</p>
                </div>
            </div>
        )
    }

    const availableProperties = properties.filter(p => p.isAvailable || p.approvalStatus === 'approved')

    return (
        <div className="px-6 py-6">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/landlord/leases"
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black/40 hover:text-black transition-colors mb-4 group"
                    >
                        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back to leases
                    </Link>
                    <h1 className="text-4xl font-[family-name:var(--font-anton)] uppercase tracking-wide text-black">Create New Lease</h1>
                    <p className="text-black/60 font-medium mt-1">Build a professional lease agreement</p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-between mb-8">
                    {steps.map((step, index) => {
                        const isDone = index < currentStepIndex
                        const isCurrent = currentStep === step.key

                        return (
                            <div key={step.key} className="flex items-center flex-1">
                                <button
                                    onClick={() => index <= currentStepIndex && setCurrentStep(step.key)}
                                    disabled={index > currentStepIndex}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${isCurrent
                                        ? 'bg-black text-white shadow-none'
                                        : isDone
                                            ? 'bg-black/10 text-black'
                                            : 'bg-gray-100 text-gray-400'
                                        }`}>
                                        {isDone ? <Check className="h-4 w-4" strokeWidth={3} /> : step.number}
                                    </div>
                                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isCurrent ? 'text-black' : 'text-black/40'
                                        }`}>
                                        {step.label}
                                    </span>
                                </button>
                                {index < steps.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-3 rounded-full ${index < currentStepIndex ? 'bg-black' : 'bg-gray-100'
                                        }`} />
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
                            <h2 className="text-lg font-bold uppercase tracking-wider text-black mb-4">Select a Property</h2>
                            {availableProperties.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 px-8 text-center rounded-2xl bg-gray-50 border border-black/5">
                                    <div className="h-16 w-16 rounded-full bg-white shadow-none border border-black/5 flex items-center justify-center mb-4">
                                        <Building2 className="h-7 w-7 text-black/40" />
                                    </div>
                                    <h3 className="text-lg font-bold text-black mb-2">No available properties</h3>
                                    <p className="text-black/60 font-medium mb-6 max-w-sm">
                                        Add a property first, then come back to create a lease.
                                    </p>
                                    <Link href="/landlord/properties/new">
                                        <Button className="bg-black hover:bg-black/80 text-white rounded-full h-11 px-6 font-bold">
                                            Add a Property
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {availableProperties.map((property) => {
                                        const isSelected = selectedProperty?._id === property._id

                                        return (
                                            <button
                                                key={property._id}
                                                onClick={() => handlePropertySelect(property)}
                                                className={`flex items-start gap-4 p-4 rounded-xl text-left transition-all ${isSelected
                                                    ? 'bg-black/5 border-2 border-black shadow-none'
                                                    : 'bg-white hover:bg-gray-50 border-2 border-transparent shadow-none border-black/5'
                                                    }`}
                                            >
                                                <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden border border-black/5">
                                                    {property.imageUrls?.[0] ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img
                                                            src={property.imageUrls[0]}
                                                            alt={property.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Building2 className="h-6 w-6 text-black/20" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-black truncate">{property.title}</h3>
                                                    <p className="text-xs text-black/60 font-medium truncate mt-0.5">
                                                        {property.address}, {property.city}
                                                    </p>
                                                    <p className="text-sm font-bold text-black mt-2 font-[family-name:var(--font-anton)]">
                                                        N$ {property.priceNad?.toLocaleString()}<span className="text-black/40 font-normal font-sans text-xs ml-1">/mo</span>
                                                    </p>
                                                </div>
                                                {isSelected && (
                                                    <div className="h-6 w-6 rounded-full bg-black flex items-center justify-center shrink-0">
                                                        <Check className="h-4 w-4 text-white" strokeWidth={3} />
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
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold uppercase tracking-wider text-black">Lease Terms</h2>

                            {/* Tenant Email */}
                            <div>
                                <Label htmlFor="tenantEmail" className="text-black font-bold text-xs uppercase tracking-wide">Tenant Email</Label>
                                <Input
                                    id="tenantEmail"
                                    type="email"
                                    placeholder="tenant@example.com"
                                    value={tenantEmail}
                                    onChange={(e) => setTenantEmail(e.target.value)}
                                    className="mt-2 h-12 rounded-xl bg-gray-50 border-black/5 focus-visible:ring-black/20 shadow-none"
                                />
                                <p className="text-[10px] uppercase font-bold text-black/40 mt-2">
                                    The tenant must have an account on the platform
                                </p>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="startDate" className="text-black font-bold text-xs uppercase tracking-wide">Start Date</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="mt-2 h-12 rounded-xl bg-gray-50 border-black/5 focus-visible:ring-black/20 shadow-none"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="endDate" className="text-black font-bold text-xs uppercase tracking-wide">End Date</Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="mt-2 h-12 rounded-xl bg-gray-50 border-black/5 focus-visible:ring-black/20 shadow-none"
                                    />
                                </div>
                            </div>

                            {/* Financial */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="monthlyRent" className="text-black font-bold text-xs uppercase tracking-wide">Monthly Rent (N$)</Label>
                                    <Input
                                        id="monthlyRent"
                                        type="number"
                                        min={0}
                                        value={monthlyRent}
                                        onChange={(e) => setMonthlyRent(Number(e.target.value))}
                                        className="mt-2 h-12 rounded-xl bg-gray-50 border-black/5 focus-visible:ring-black/20 shadow-none"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="deposit" className="text-black font-bold text-xs uppercase tracking-wide">Security Deposit (N$)</Label>
                                    <Input
                                        id="deposit"
                                        type="number"
                                        min={0}
                                        value={deposit}
                                        onChange={(e) => setDeposit(Number(e.target.value))}
                                        className="mt-2 h-12 rounded-xl bg-gray-50 border-black/5 focus-visible:ring-black/20 shadow-none"
                                    />
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
                        <div className="space-y-6">
                            <div className="flex items-start gap-4 p-5 rounded-2xl bg-black/5 border border-black/5">
                                <Info className="h-5 w-5 text-black shrink-0 mt-0.5" />
                                <p className="text-sm font-medium text-black/80">
                                    Review the lease document below. When you're ready, send it to the tenant for signing.
                                </p>
                            </div>

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
                    )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-8 mt-8 border-t border-black/5">
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentStep(steps[currentStepIndex - 1]?.key)}
                        disabled={currentStepIndex === 0}
                        className="rounded-full h-11 px-6 font-medium hover:bg-black/5"
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
                                className="rounded-full h-11 px-6 font-bold border-black/10 hover:border-black/20 hover:bg-black/5 shadow-none"
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
                                className="bg-black hover:bg-black/90 text-white rounded-full h-11 px-8 font-bold shadow-none"
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
                            className="bg-black hover:bg-black/90 text-white rounded-full h-11 px-8 font-bold shadow-none disabled:opacity-50"
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
