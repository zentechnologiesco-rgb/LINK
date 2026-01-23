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
                    <div className="h-10 w-10 rounded-full border-2 border-lime-500/20 border-t-lime-500 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
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
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to leases
                    </Link>
                    <h1 className="text-2xl font-semibold text-foreground">Create New Lease</h1>
                    <p className="text-muted-foreground mt-1">Build a professional lease agreement</p>
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
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${isCurrent
                                            ? 'bg-lime-500 text-white'
                                            : isDone
                                                ? 'bg-lime-500/20 text-lime-600'
                                                : 'bg-sidebar-accent text-muted-foreground'
                                        }`}>
                                        {isDone ? <Check className="h-4 w-4" /> : step.number}
                                    </div>
                                    <span className={`text-xs font-medium ${isCurrent ? 'text-foreground' : 'text-muted-foreground'
                                        }`}>
                                        {step.label}
                                    </span>
                                </button>
                                {index < steps.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-3 ${index < currentStepIndex ? 'bg-lime-500/30' : 'bg-sidebar-accent'
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
                            <h2 className="text-lg font-medium text-foreground mb-4">Select a Property</h2>
                            {availableProperties.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 px-8 text-center rounded-xl bg-sidebar-accent/30">
                                    <div className="h-14 w-14 rounded-2xl bg-sidebar-accent flex items-center justify-center mb-4">
                                        <Building2 className="h-7 w-7 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-medium text-foreground mb-2">No available properties</h3>
                                    <p className="text-muted-foreground mb-6 max-w-sm">
                                        Add a property first, then come back to create a lease.
                                    </p>
                                    <Link href="/landlord/properties/new">
                                        <Button className="bg-lime-500 hover:bg-lime-600 text-white rounded-lg">
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
                                                        ? 'bg-lime-500/10 border-2 border-lime-500'
                                                        : 'bg-sidebar-accent/50 hover:bg-sidebar-accent border-2 border-transparent'
                                                    }`}
                                            >
                                                <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                                                    {property.imageUrls?.[0] ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img
                                                            src={property.imageUrls[0]}
                                                            alt={property.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Building2 className="h-6 w-6 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-foreground truncate">{property.title}</h3>
                                                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                                                        {property.address}, {property.city}
                                                    </p>
                                                    <p className="text-sm font-semibold text-foreground mt-2">
                                                        N$ {property.priceNad?.toLocaleString()}<span className="text-muted-foreground font-normal">/mo</span>
                                                    </p>
                                                </div>
                                                {isSelected && (
                                                    <div className="h-6 w-6 rounded-full bg-lime-500 flex items-center justify-center shrink-0">
                                                        <Check className="h-4 w-4 text-white" />
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
                            <h2 className="text-lg font-medium text-foreground">Lease Terms</h2>

                            {/* Tenant Email */}
                            <div>
                                <Label htmlFor="tenantEmail" className="text-foreground">Tenant Email</Label>
                                <Input
                                    id="tenantEmail"
                                    type="email"
                                    placeholder="tenant@example.com"
                                    value={tenantEmail}
                                    onChange={(e) => setTenantEmail(e.target.value)}
                                    className="mt-1.5 h-11 rounded-lg bg-sidebar-accent border-0 focus-visible:ring-2 focus-visible:ring-lime-500/50"
                                />
                                <p className="text-xs text-muted-foreground mt-1.5">
                                    The tenant must have an account on the platform
                                </p>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="startDate" className="text-foreground">Start Date</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="mt-1.5 h-11 rounded-lg bg-sidebar-accent border-0 focus-visible:ring-2 focus-visible:ring-lime-500/50"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="endDate" className="text-foreground">End Date</Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="mt-1.5 h-11 rounded-lg bg-sidebar-accent border-0 focus-visible:ring-2 focus-visible:ring-lime-500/50"
                                    />
                                </div>
                            </div>

                            {/* Financial */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="monthlyRent" className="text-foreground">Monthly Rent (N$)</Label>
                                    <Input
                                        id="monthlyRent"
                                        type="number"
                                        min={0}
                                        value={monthlyRent}
                                        onChange={(e) => setMonthlyRent(Number(e.target.value))}
                                        className="mt-1.5 h-11 rounded-lg bg-sidebar-accent border-0 focus-visible:ring-2 focus-visible:ring-lime-500/50"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="deposit" className="text-foreground">Security Deposit (N$)</Label>
                                    <Input
                                        id="deposit"
                                        type="number"
                                        min={0}
                                        value={deposit}
                                        onChange={(e) => setDeposit(Number(e.target.value))}
                                        className="mt-1.5 h-11 rounded-lg bg-sidebar-accent border-0 focus-visible:ring-2 focus-visible:ring-lime-500/50"
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
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-lime-500/10 border border-lime-500/20">
                                <Info className="h-5 w-5 text-lime-600 shrink-0 mt-0.5" />
                                <p className="text-sm text-foreground">
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
                <div className="flex items-center justify-between pt-6 mt-6 border-t border-border">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentStep(steps[currentStepIndex - 1]?.key)}
                        disabled={currentStepIndex === 0}
                        className="rounded-lg h-11"
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
                                className="rounded-lg h-11"
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
                                className="bg-lime-500 hover:bg-lime-600 text-white rounded-lg h-11 shadow-lg shadow-lime-500/20"
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
                            className="bg-lime-500 hover:bg-lime-600 text-white rounded-lg h-11 shadow-lg shadow-lime-500/20"
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
