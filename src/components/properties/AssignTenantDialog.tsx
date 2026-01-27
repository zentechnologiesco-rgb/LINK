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
            <DialogContent className="sm:max-w-[550px] rounded-3xl border-black/5 p-8 shadow-none border">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 font-[family-name:var(--font-anton)] uppercase tracking-wide text-2xl text-black">
                            <User className="h-6 w-6 text-black/20" />
                            Assign Tenant
                        </DialogTitle>
                        <DialogDescription className="text-black/60 font-medium">
                            Assign a tenant to <span className="text-black font-bold">{propertyTitle}</span> with custom lease terms.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-8">
                        {/* Tenant Email */}
                        <div className="space-y-2">
                            <Label htmlFor="tenantEmail" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black/40">
                                <User className="h-3 w-3" />
                                Tenant Email *
                            </Label>
                            <Input
                                id="tenantEmail"
                                type="email"
                                placeholder="tenant@example.com"
                                value={tenantEmail}
                                onChange={(e) => setTenantEmail(e.target.value)}
                                required
                                className="h-12 rounded-xl bg-white border-black/10 focus-visible:ring-black font-medium"
                            />
                            <p className="text-[10px] uppercase tracking-wider font-bold text-black/30">
                                Tenant must have an account on the platform
                            </p>
                        </div>

                        <Separator className="bg-black/5" />

                        {/* Lease Duration */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="startDate" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black/40">
                                    <Calendar className="h-3 w-3" />
                                    Start Date
                                </Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                    className="h-12 rounded-xl bg-white border-black/10 focus-visible:ring-black font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="leaseMonths" className="text-xs font-bold uppercase tracking-wider text-black/40 block">Lease Duration</Label>
                                <Select
                                    value={leaseMonths.toString()}
                                    onValueChange={(v) => setLeaseMonths(parseInt(v))}
                                >
                                    <SelectTrigger id="leaseMonths" className="h-12 rounded-xl bg-white border-black/10 focus:ring-black font-medium">
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

                        <div className="p-4 bg-black/[0.02] border border-black/[0.02] rounded-xl flex items-center gap-2">
                            <Clock className="h-4 w-4 text-black/40" />
                            <span className="text-xs font-bold uppercase tracking-wider text-black/60">Lease ends: </span>
                            <strong className="text-sm text-black">
                                {endDate.toLocaleDateString('en-ZA', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </strong>
                        </div>

                        <Separator className="bg-black/5" />

                        {/* Payment Terms */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="monthlyRent" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black/40">
                                    <DollarSign className="h-3 w-3" />
                                    Monthly Rent (N$)
                                </Label>
                                <Input
                                    id="monthlyRent"
                                    type="number"
                                    min={0}
                                    value={monthlyRent}
                                    onChange={(e) => setMonthlyRent(Number(e.target.value))}
                                    required
                                    className="h-12 rounded-xl bg-white border-black/10 focus-visible:ring-black font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paymentDay" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black/40">
                                    <Clock className="h-3 w-3" />
                                    Payment Due Day
                                </Label>
                                <Select
                                    value={paymentDay.toString()}
                                    onValueChange={(v) => setPaymentDay(parseInt(v))}
                                >
                                    <SelectTrigger id="paymentDay" className="h-12 rounded-xl bg-white border-black/10 focus:ring-black font-medium">
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
                            <Label htmlFor="deposit" className="text-xs font-bold uppercase tracking-wider text-black/40 block">Security Deposit (N$)</Label>
                            <Input
                                id="deposit"
                                type="number"
                                min={0}
                                value={deposit}
                                onChange={(e) => setDeposit(Number(e.target.value))}
                                className="h-12 rounded-xl bg-white border-black/10 focus-visible:ring-black font-medium"
                            />
                            <p className="text-[10px] uppercase tracking-wider font-bold text-black/30">
                                Held securely by LINK until lease ends
                            </p>
                        </div>

                        {/* Summary */}
                        <div className="p-6 bg-gray-50/50 border border-black/5 rounded-3xl space-y-4">
                            <h4 className="font-[family-name:var(--font-anton)] uppercase tracking-wide text-lg text-black">Summary</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-black/40 mb-1">Monthly Rent</p>
                                    <p className="font-bold text-black text-lg">N$ {monthlyRent.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-black/40 mb-1">Deposit</p>
                                    <p className="font-bold text-black text-lg">N$ {deposit.toLocaleString()}</p>
                                </div>
                                <div className="col-span-2 pt-2 border-t border-black/5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-black/40">Total Payments</span>
                                        <span className="font-bold text-black">{leaseMonths} months</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="rounded-full border-black/10 text-black font-bold uppercase tracking-wider text-xs h-11 hover:bg-black/5 shadow-none"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !tenantEmail}
                            className="rounded-full bg-black text-white font-bold uppercase tracking-wider text-xs h-11 hover:bg-black/90 shadow-none"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Assign Tenant
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
