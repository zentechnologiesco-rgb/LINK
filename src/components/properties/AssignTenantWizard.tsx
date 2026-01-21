"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { toast } from "sonner"
import { Loader2, User, Calendar, DollarSign, Clock, Building2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react"

// ... (Interface unchanged)
export interface PropertyWithLease {
    id: Id<"properties">
    title: string
    city: string
    price_nad: number
    leases?: {
        status: string
        end_date: string
        start_date: string
        monthly_rent: number
        deposit: number
        tenant?: {
            email: string
        }
    }[]
}

interface AssignTenantWizardProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    properties: PropertyWithLease[]
}

type WizardStep = 'select-property' | 'lease-details'


export function AssignTenantWizard({
    open,
    onOpenChange,
    properties,
}: AssignTenantWizardProps) {
    const router = useRouter()
    const [step, setStep] = useState<WizardStep>('select-property')
    const [selectedProperty, setSelectedProperty] = useState<PropertyWithLease | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Form state (initialized when property selected)
    const [tenantEmail, setTenantEmail] = useState("")
    const [monthlyRent, setMonthlyRent] = useState(0)
    const [paymentDay, setPaymentDay] = useState(1)
    const [leaseMonths, setLeaseMonths] = useState(12)
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [deposit, setDeposit] = useState(0)
    const [isExistingLease, setIsExistingLease] = useState(false)

    const createLease = useMutation(api.leases.createByEmail)
    const generatePayments = useMutation(api.payments.generateRecurring)

    // Reset flow when closed
    const handleOpenChange = (newOpen: boolean) => {
        // ... (unchanged)
        if (!newOpen) {
            setTimeout(() => {
                setStep('select-property')
                setSelectedProperty(null)
                setTenantEmail("")
            }, 300)
        }
        onOpenChange(newOpen)
    }

    const handleSelectProperty = (property: PropertyWithLease) => {
        // ... (unchanged logic)
        const activeLease = property.leases?.find(l =>
            l.status === 'approved' && new Date(l.end_date) > new Date()
        )

        setSelectedProperty(property)

        if (activeLease) {
            setIsExistingLease(true)
            setTenantEmail(activeLease.tenant?.email || "")
            setMonthlyRent(activeLease.monthly_rent || property.price_nad)
            setDeposit(activeLease.deposit || 0)

            // Calculate duration and start date from lease
            setStartDate(activeLease.start_date)

            const start = new Date(activeLease.start_date)
            const end = new Date(activeLease.end_date)
            // Rough calculation of months
            const diffTime = Math.abs(end.getTime() - start.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            const diffMonths = Math.round(diffDays / 30.44)
            setLeaseMonths(diffMonths)

        } else {
            setIsExistingLease(false)
            setTenantEmail("")
            setMonthlyRent(property.price_nad)
            setDeposit(property.price_nad)
            setStartDate(new Date().toISOString().split('T')[0])
            setLeaseMonths(12)
        }

        setStep('lease-details')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedProperty || !tenantEmail) return

        setIsLoading(true)
        try {
            // Calculate endDate
            const start = new Date(startDate)
            const end = new Date(start)
            end.setMonth(end.getMonth() + leaseMonths)
            const endDateString = end.toISOString().split('T')[0]

            const result = await createLease({
                propertyId: selectedProperty.id as Id<"properties">,
                tenantEmail,
                monthlyRent: monthlyRent,
                startDate: startDate,
                endDate: endDateString,
                deposit: deposit,
                terms: { paymentDay },
            })

            if (result.leaseId) {
                await generatePayments({
                    leaseId: result.leaseId,
                    monthsAhead: leaseMonths
                })
            }

            toast.success(`Lease created for ${result.tenantName || tenantEmail}!`)
            handleOpenChange(false)
            // router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to assign tenant")
        } finally {
            setIsLoading(false)
        }
    }

    // Helper to check availability
    const isOccupied = (property: PropertyWithLease) => {
        return property.leases?.some(l =>
            l.status === 'approved' && new Date(l.end_date) > new Date()
        )
    }

    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + leaseMonths)

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {step === 'select-property' ? 'Create Payment Plan' : 'Plan Details'}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'select-property'
                            ? 'Select a property to create a schedule for.'
                            : `Creating payment plan for ${selectedProperty?.title}`
                        }
                    </DialogDescription>
                </DialogHeader>

                {step === 'select-property' && (
                    <div className="space-y-4 py-4">
                        {properties.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                No properties found. Add a property first.
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {properties.map((prop) => {
                                    const occupied = isOccupied(prop)
                                    return (
                                        <div
                                            key={prop.id}
                                            onClick={() => handleSelectProperty(prop)}
                                            className={`
                                                flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all
                                                hover:border-primary hover:bg-primary/5 active:bg-primary/10
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${occupied ? 'bg-orange-100' : 'bg-primary/10'}`}>
                                                    <Building2 className={`h-5 w-5 ${occupied ? 'text-orange-600' : 'text-primary'}`} />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{prop.title}</p>
                                                    <p className="text-xs text-muted-foreground">{prop.city}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {occupied ? (
                                                    <span className="flex items-center gap-1 text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded border border-orange-200">
                                                        <AlertCircle className="h-3 w-3" />
                                                        Occupied (Active Lease)
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Available
                                                    </span>
                                                )}
                                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground text-center pt-2">
                            Only approved properties without active leases are shown as Available.
                        </p>
                    </div>
                )}

                {step === 'lease-details' && selectedProperty && (
                    <form onSubmit={handleSubmit} className="space-y-6 py-4">
                        {/* Reuse form fields from AssignTenantDialog layout */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="tenantEmail">Tenant Email *</Label>
                                <Input
                                    id="tenantEmail"
                                    type="email"
                                    placeholder="tenant@example.com"
                                    value={tenantEmail}
                                    onChange={(e) => setTenantEmail(e.target.value)}
                                    required
                                    autoFocus={!isExistingLease}
                                    disabled={isExistingLease}
                                    className={isExistingLease ? "bg-muted" : ""}
                                />
                                {isExistingLease && <p className="text-xs text-blue-600 font-medium">Linked to active lease</p>}
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        required
                                        disabled={isExistingLease}
                                        className={isExistingLease ? "bg-muted" : ""}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Duration</Label>
                                    <Select
                                        value={leaseMonths.toString()}
                                        onValueChange={(v) => setLeaseMonths(parseInt(v))}
                                        disabled={isExistingLease}
                                    >
                                        <SelectTrigger className={isExistingLease ? "bg-muted" : ""}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="6">6 Months</SelectItem>
                                            <SelectItem value="12">12 Months</SelectItem>
                                            <SelectItem value="24">24 Months</SelectItem>
                                            <SelectItem value="36">36 Months</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="p-3 bg-muted/50 rounded-lg text-sm flex justify-between items-center">
                                <span className="text-muted-foreground">Lease End Date:</span>
                                <span className="font-medium">{endDate.toLocaleDateString()}</span>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Monthly Rent (N$)</Label>
                                    <Input
                                        type="number"
                                        value={monthlyRent}
                                        onChange={(e) => setMonthlyRent(Number(e.target.value))}
                                        required
                                        disabled={isExistingLease}
                                        className={isExistingLease ? "bg-muted" : ""}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Due Day</Label>
                                    <Select value={paymentDay.toString()} onValueChange={(v) => setPaymentDay(parseInt(v))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1st</SelectItem>
                                            <SelectItem value="5">5th</SelectItem>
                                            <SelectItem value="10">10th</SelectItem>
                                            <SelectItem value="15">15th</SelectItem>
                                            <SelectItem value="20">20th</SelectItem>
                                            <SelectItem value="25">25th</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Security Deposit (N$)</Label>
                                <Input
                                    type="number"
                                    value={deposit}
                                    onChange={(e) => setDeposit(Number(e.target.value))}
                                    disabled={isExistingLease}
                                    className={isExistingLease ? "bg-muted" : ""}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between pt-2">
                            <Button type="button" variant="ghost" onClick={() => setStep('select-property')}>
                                Back
                            </Button>
                            <Button type="submit" disabled={isLoading || !tenantEmail}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Payment Plan
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
