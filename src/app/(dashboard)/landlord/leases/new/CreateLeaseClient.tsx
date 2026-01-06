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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/landlord/leases">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Create New Lease</h1>
                    <p className="text-muted-foreground">
                        Build a professional lease agreement
                    </p>
                </div>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                {steps.map((step, index) => (
                    <div key={step.key} className="flex items-center">
                        <button
                            onClick={() => index <= currentStepIndex && setCurrentStep(step.key)}
                            disabled={index > currentStepIndex}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${currentStep === step.key
                                ? 'bg-primary text-primary-foreground'
                                : index < currentStepIndex
                                    ? 'text-primary hover:bg-primary/10'
                                    : 'text-muted-foreground'
                                }`}
                        >
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === step.key
                                ? 'bg-primary-foreground text-primary'
                                : index < currentStepIndex
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                {index < currentStepIndex ? <Check className="h-3 w-3" /> : index + 1}
                            </div>
                            <span className="hidden md:inline text-sm font-medium">{step.label}</span>
                        </button>
                        {index < steps.length - 1 && (
                            <div className={`w-8 md:w-16 h-0.5 mx-2 ${index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                                }`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Step Content */}
            <div className="min-h-[500px]">
                {/* Step 1: Select Property */}
                {currentStep === 'select_property' && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Select a Property</h2>
                        {properties.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center p-12">
                                    <Building2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                    <p className="text-muted-foreground">No available properties found.</p>
                                    <Link href="/landlord/properties/new">
                                        <Button className="mt-4">Add a Property</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {properties.map((property) => (
                                    <Card
                                        key={property.id}
                                        className={`cursor-pointer transition-all hover:shadow-md ${selectedProperty?.id === property.id
                                            ? 'ring-2 ring-primary'
                                            : ''
                                            }`}
                                        onClick={() => handlePropertySelect(property)}
                                    >
                                        <div className="relative h-32 bg-gray-100">
                                            {property.images?.[0] ? (
                                                <Image
                                                    src={property.images[0]}
                                                    alt={property.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="h-full flex items-center justify-center">
                                                    <Building2 className="h-8 w-8 text-gray-300" />
                                                </div>
                                            )}
                                            {selectedProperty?.id === property.id && (
                                                <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                                    <Check className="h-4 w-4 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <CardContent className="p-4">
                                            <h3 className="font-semibold truncate">{property.title}</h3>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {property.address}, {property.city}
                                            </p>
                                            <p className="text-lg font-bold text-green-600 mt-2">
                                                N$ {property.price_nad?.toLocaleString()}/mo
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Lease Terms */}
                {currentStep === 'lease_terms' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Lease Terms</CardTitle>
                                <CardDescription>
                                    Set the basic terms for this lease agreement
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
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
                                <div className="grid grid-cols-2 gap-4">
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
                                <div className="grid grid-cols-2 gap-4">
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
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Preview Lease Document</h2>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleSaveDraft}
                                    disabled={isSaving}
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
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {isSending ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Send className="h-4 w-4 mr-2" />
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
            <div className="flex items-center justify-between pt-4 border-t">
                <Button
                    variant="outline"
                    onClick={() => setCurrentStep(steps[currentStepIndex - 1]?.key)}
                    disabled={currentStepIndex === 0}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>

                {currentStep !== 'preview' && (
                    <Button
                        onClick={() => setCurrentStep(steps[currentStepIndex + 1]?.key)}
                        disabled={!canProceed()}
                    >
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                )}
            </div>
        </div>
    )
}
