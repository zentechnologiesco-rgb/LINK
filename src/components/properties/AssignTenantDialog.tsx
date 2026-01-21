"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { toast } from "sonner"
import { Loader2, User, Calendar, DollarSign, Clock } from "lucide-react"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"

interface AssignTenantDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    propertyId: string
    propertyTitle: string
    propertyPrice: number
}

export function AssignTenantDialog({
    open,
    onOpenChange,
    propertyId,
    propertyTitle,
    propertyPrice,
}: AssignTenantDialogProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    // Form state
    const [tenantEmail, setTenantEmail] = useState("")
    const [monthlyRent, setMonthlyRent] = useState(propertyPrice)
    const [paymentDay, setPaymentDay] = useState(1)
    const [leaseMonths, setLeaseMonths] = useState(12)
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [deposit, setDeposit] = useState(propertyPrice)

    const createLease = useMutation(api.leases.createByEmail)
    const generatePayments = useMutation(api.payments.generateRecurring) // Generate payments after lease

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!tenantEmail) {
            toast.error("Please enter tenant email")
            return
        }

        setIsLoading(true)
        try {
            // Calculate endDate
            const start = new Date(startDate)
            const end = new Date(start)
            end.setMonth(end.getMonth() + leaseMonths)
            const endDateString = end.toISOString().split('T')[0]

            const result = await createLease({
                propertyId: propertyId as Id<"properties">,
                tenantEmail,
                monthlyRent: monthlyRent,
                startDate: startDate,
                endDate: endDateString,
                deposit: deposit,
                terms: { paymentDay },
            })

            // Generate payments (optional but good for UX)
            if (result.leaseId) {
                await generatePayments({
                    leaseId: result.leaseId,
                    monthsAhead: leaseMonths
                })
            }

            toast.success(`Tenant ${result.tenantName || tenantEmail} assigned successfully!`)
            onOpenChange(false)
            // router.refresh() // Convex updates are realtime/fast
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to assign tenant")
        } finally {
            setIsLoading(false)
        }
    }

    // Calculate end date for display
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + leaseMonths)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Assign Tenant
                        </DialogTitle>
                        <DialogDescription>
                            Assign a tenant to <strong>{propertyTitle}</strong> with payment terms.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Tenant Email */}
                        <div className="space-y-2">
                            <Label htmlFor="tenantEmail" className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                Tenant Email *
                            </Label>
                            <Input
                                id="tenantEmail"
                                type="email"
                                placeholder="tenant@example.com"
                                value={tenantEmail}
                                onChange={(e) => setTenantEmail(e.target.value)}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Tenant must have an account on the platform
                            </p>
                        </div>

                        <Separator />

                        {/* Lease Duration */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate" className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    Start Date
                                </Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="leaseMonths">Lease Duration</Label>
                                <Select
                                    value={leaseMonths.toString()}
                                    onValueChange={(v) => setLeaseMonths(parseInt(v))}
                                >
                                    <SelectTrigger id="leaseMonths">
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

                        <div className="p-3 bg-muted/50 rounded-lg text-sm">
                            <span className="text-muted-foreground">Lease ends: </span>
                            <strong>{endDate.toLocaleDateString('en-ZA', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</strong>
                        </div>

                        <Separator />

                        {/* Payment Terms */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="monthlyRent" className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    Monthly Rent (N$)
                                </Label>
                                <Input
                                    id="monthlyRent"
                                    type="number"
                                    min={0}
                                    value={monthlyRent}
                                    onChange={(e) => setMonthlyRent(Number(e.target.value))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paymentDay" className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    Payment Due Day
                                </Label>
                                <Select
                                    value={paymentDay.toString()}
                                    onValueChange={(v) => setPaymentDay(parseInt(v))}
                                >
                                    <SelectTrigger id="paymentDay">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1st of month</SelectItem>
                                        <SelectItem value="5">5th of month</SelectItem>
                                        <SelectItem value="10">10th of month</SelectItem>
                                        <SelectItem value="15">15th of month</SelectItem>
                                        <SelectItem value="20">20th of month</SelectItem>
                                        <SelectItem value="25">25th of month</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
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
                            <p className="text-xs text-muted-foreground">
                                Held securely by LINK until lease ends
                            </p>
                        </div>

                        {/* Summary */}
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                            <h4 className="font-medium text-sm">Summary</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <span className="text-muted-foreground">Monthly Rent:</span>
                                <span className="font-medium">N$ {monthlyRent.toLocaleString()}</span>
                                <span className="text-muted-foreground">Deposit (Escrow):</span>
                                <span className="font-medium">N$ {deposit.toLocaleString()}</span>
                                <span className="text-muted-foreground">Payments Generated:</span>
                                <span className="font-medium">{leaseMonths} payments</span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || !tenantEmail}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Assign Tenant
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
