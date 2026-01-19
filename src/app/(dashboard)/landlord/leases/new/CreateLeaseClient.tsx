'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { LeaseBuilder, LeaseDocumentData } from '@/components/leases/LeaseBuilder'
import { LeasePreview } from '@/components/leases/LeasePreview'
import { createDraftLease, sendLeaseToTenant } from '../actions'
import { toast } from 'sonner'
import {
    ArrowLeft,
    ArrowRight,
    Building2,
    Check,
    Loader2,
    Send,
    Eye,
    FileText,
    Save
} from 'lucide-react'

interface CreateLeaseClientProps {
    properties: any[]
    currentUser: any
}

type Step = 'select_property' | 'lease_terms' | 'build_document' | 'preview'

export function CreateLeaseClient({ properties, currentUser }: CreateLeaseClientProps) {
    const router = useRouter()
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
    const [savedLeaseId, setSavedLeaseId] = useState<string | null>(null)

    const steps: { key: Step; label: string; icon: React.ElementType }[] = [
        { key: 'select_property', label: 'Select Property', icon: Building2 },
        { key: 'lease_terms', label: 'Lease Terms', icon: FileText },
        { key: 'build_document', label: 'Build Document', icon: FileText },
        { key: 'preview', label: 'Preview & Send', icon: Eye },
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
        setMonthlyRent(property.price_nad || 0)
        setDeposit(property.price_nad || 0)
    }

    const handleSaveDraft = async () => {
        if (!selectedProperty || !leaseDocument) return

        setIsSaving(true)
        try {
            const result = await createDraftLease({
                property_id: selectedProperty.id,
                tenant_email: tenantEmail,
                start_date: startDate,
                end_date: endDate,
                monthly_rent: monthlyRent,
                deposit: deposit,
                lease_document: leaseDocument,
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                setSavedLeaseId(result.leaseId!)
                toast.success('Lease draft saved!')
            }
        } catch (error) {
            toast.error('Failed to save draft.')
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
            // Save draft first if not saved
            let leaseId = savedLeaseId
            if (!leaseId) {
                const saveResult = await createDraftLease({
                    property_id: selectedProperty.id,
                    tenant_email: tenantEmail,
                    start_date: startDate,
                    end_date: endDate,
                    monthly_rent: monthlyRent,
                    deposit: deposit,
                    lease_document: leaseDocument,
                })

                if (saveResult.error) {
                    toast.error(saveResult.error)
                    setIsSending(false)
                    return
                }
                leaseId = saveResult.leaseId!
            }

            // Send to tenant
            const result = await sendLeaseToTenant(leaseId!, tenantEmail)

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(`Lease sent to ${result.tenantName || tenantEmail}!`)
                router.push('/landlord/leases')
            }
        } catch (error) {
            toast.error('Failed to send lease.')
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-background">
                            <FileText className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Create New Lease</h1>
                            <p className="text-sm text-muted-foreground">Build a professional lease agreement</p>
                        </div>
                    </div>

                    <Link href="/landlord/leases" className="w-full sm:w-auto">
                        <Button variant="outline" className="w-full sm:w-auto">
                            <ArrowLeft className="mr-2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                            Back to leases
                        </Button>
                    </Link>
                </div>

                {/* Step Indicator */}
                <div className="rounded-xl border bg-muted/30 p-2 sm:p-3">
                    <div className="flex items-center gap-2 overflow-x-auto">
                        {steps.map((step, index) => {
                            const isDone = index < currentStepIndex
                            const isCurrent = currentStep === step.key

                            return (
                                <div key={step.key} className="flex items-center">
                                    <button
                                        onClick={() => index <= currentStepIndex && setCurrentStep(step.key)}
                                        disabled={index > currentStepIndex}
                                        className={`flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-lg border transition-colors ${isCurrent
                                            ? 'bg-foreground text-background border-foreground'
                                            : isDone
                                                ? 'bg-background hover:bg-muted/40 text-foreground'
                                                : 'bg-transparent text-muted-foreground hover:bg-muted/40'
                                            } ${index > currentStepIndex ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    >
                                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-sm font-medium border ${isCurrent
                                            ? 'bg-background text-foreground border-background/20'
                                            : 'bg-muted/30 text-muted-foreground'
                                            }`}>
                                            {isDone ? <Check className="h-3 w-3" strokeWidth={1.5} /> : index + 1}
                                        </div>
                                        <span className="hidden sm:inline text-sm font-medium">{step.label}</span>
                                    </button>

                                    {index < steps.length - 1 && (
                                        <div className={`w-6 sm:w-10 h-px mx-2 ${isDone ? 'bg-border' : 'bg-border/60'}`} />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Step Content */}
                <div className="min-h-[500px]">
                    {/* Step 1: Select Property */}
                    {currentStep === 'select_property' && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold tracking-tight">Select a Property</h2>
                            {properties.length === 0 ? (
                                <Card className="gap-0 py-0">
                                    <CardContent className="py-10 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border bg-muted/40">
                                            <Building2 className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
                                        </div>
                                        <h3 className="mt-5 text-lg font-semibold tracking-tight">No available properties</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Add a property first, then come back to create a lease.
                                        </p>
                                        <Link href="/landlord/properties/new" className="mt-6 inline-flex">
                                            <Button>
                                                <Building2 className="mr-2 h-4 w-4" strokeWidth={1.5} />
                                                Add a Property
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {properties.map((property) => {
                                        const isSelected = selectedProperty?.id === property.id

                                        return (
                                            <Card
                                                key={property.id}
                                                className={`gap-0 py-0 overflow-hidden cursor-pointer transition-shadow hover:shadow-md ${isSelected ? 'ring-1 ring-foreground/10' : ''}`}
                                                onClick={() => handlePropertySelect(property)}
                                            >
                                                <div className="relative block aspect-[16/10] bg-muted/30">
                                                    {property.images?.[0] ? (
                                                        <Image
                                                            src={property.images[0]}
                                                            alt={property.title}
                                                            fill
                                                            className="object-cover"
                                                            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center">
                                                            <Building2 className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
                                                        </div>
                                                    )}

                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 rounded-full border bg-background/80 backdrop-blur p-1.5">
                                                            <Check className="h-4 w-4 text-foreground" strokeWidth={1.5} />
                                                        </div>
                                                    )}
                                                </div>

                                                <CardContent className="px-4 sm:px-5 py-5">
                                                    <p className="text-xs font-medium text-muted-foreground">Property</p>
                                                    <p className="mt-1 font-semibold tracking-tight line-clamp-1">{property.title}</p>
                                                    <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                                                        {property.address}, {property.city}
                                                    </p>
                                                    <p className="mt-3 text-sm text-muted-foreground">
                                                        <span className="font-semibold text-foreground">N$ {property.price_nad?.toLocaleString()}</span>
                                                        /mo
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                {/* Step 2: Lease Terms */}
                {currentStep === 'lease_terms' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <Card className="gap-0 py-0">
                            <CardHeader className="border-b px-4 sm:px-6 py-4">
                                <CardTitle className="text-base font-semibold tracking-tight">Lease Terms</CardTitle>
                                <CardDescription>Set the basic terms for this lease agreement</CardDescription>
                            </CardHeader>
                            <CardContent className="px-4 sm:px-6 py-6 space-y-6">
                                {/* Tenant Email */}
                                <div className="space-y-2">
                                    <Label htmlFor="tenantEmail">Tenant Email *</Label>
                                    <Input
                                        id="tenantEmail"
                                        type="email"
                                        placeholder="tenant@example.com"
                                        value={tenantEmail}
                                        onChange={(e) => setTenantEmail(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        The tenant must have an account on the platform
                                    </p>
                                </div>

                                <Separator />

                                {/* Dates */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate">Start Date</Label>
                                        <Input
                                            id="startDate"
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="endDate">End Date</Label>
                                        <Input
                                            id="endDate"
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <Separator />

                                {/* Financial */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="monthlyRent">Monthly Rent (N$)</Label>
                                        <Input
                                            id="monthlyRent"
                                            type="number"
                                            min={0}
                                            value={monthlyRent}
                                            onChange={(e) => setMonthlyRent(Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="deposit">Security Deposit (N$)</Label>
                                        <Input
                                            id="deposit"
                                            type="number"
                                            min={0}
                                            value={deposit}
                                            onChange={(e) => setDeposit(Number(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Step 3: Build Document */}
                {currentStep === 'build_document' && (
                    <div className="max-w-3xl mx-auto">
                        <LeaseBuilder
                            initialData={leaseDocument || undefined}
                            onDataChange={setLeaseDocument}
                        />
                    </div>
                )}

                {/* Step 4: Preview & Send */}
                {currentStep === 'preview' && leaseDocument && (
                    <div className="space-y-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-lg font-semibold tracking-tight">Preview Lease Document</h2>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleSaveDraft}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" strokeWidth={1.5} />
                                    ) : (
                                        <Save className="h-4 w-4 mr-2 text-muted-foreground" strokeWidth={1.5} />
                                    )}
                                    Save Draft
                                </Button>
                                <Button
                                    onClick={handleSendToTenant}
                                    disabled={isSending}
                                >
                                    {isSending ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" strokeWidth={1.5} />
                                    ) : (
                                        <Send className="h-4 w-4 mr-2" strokeWidth={1.5} />
                                    )}
                                    Send to Tenant
                                </Button>
                            </div>
                        </div>

                        <LeasePreview
                            leaseDocument={leaseDocument}
                            property={{
                                title: selectedProperty?.title || '',
                                address: selectedProperty?.address || '',
                                city: selectedProperty?.city || '',
                                images: selectedProperty?.images,
                            }}
                            landlord={{
                                full_name: currentUser?.full_name || '',
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
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t">
                <Button
                    variant="outline"
                    onClick={() => setCurrentStep(steps[currentStepIndex - 1]?.key)}
                    disabled={currentStepIndex === 0}
                >
                    <ArrowLeft className="h-4 w-4 mr-2 text-muted-foreground" strokeWidth={1.5} />
                    Back
                </Button>

                {currentStep !== 'preview' && (
                    <Button
                        onClick={() => setCurrentStep(steps[currentStepIndex + 1]?.key)}
                        disabled={!canProceed()}
                    >
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" strokeWidth={1.5} />
                    </Button>
                )}
            </div>
            </div>
        </div>
    )
}
