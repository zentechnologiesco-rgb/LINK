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
import { Loader2, User, Calendar, DollarSign, Clock, Check } from "lucide-react"
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
            <DialogContent className="sm:max-w-[550px] rounded-2xl border-transparent p-0 overflow-hidden shadow-2xl">
                <form onSubmit={handleSubmit}>
                    <div className="p-8 pb-0">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-3 font-[family-name:var(--font-anton)] uppercase tracking-wide text-2xl text-neutral-900">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-900 text-white text-sm">
                                    <User className="h-4 w-4" />
                                </span>
                                Assign Tenant
                            </DialogTitle>
                            <DialogDescription className="text-neutral-500 font-medium pt-2">
                                Assign a tenant to <span className="text-neutral-900 font-bold">{propertyTitle}</span>. They will receive an email invitation.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-6">
                            {/* Tenant Email */}
                            <div className="space-y-1.5">
                                <Label htmlFor="tenantEmail" className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 ml-1">
                                    Tenant Email
                                </Label>
                                <Input
                                    id="tenantEmail"
                                    type="email"
                                    placeholder="tenant@example.com"
                                    value={tenantEmail}
                                    onChange={(e) => setTenantEmail(e.target.value)}
                                    required
                                    className="h-12 rounded-xl bg-neutral-50 border-neutral-100 focus:bg-white focus:border-neutral-300 focus:ring-0 font-medium transition-all"
                                />
                            </div>

                            {/* Lease Duration */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="startDate" className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 ml-1">
                                        Start Date
                                    </Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        required
                                        className="h-12 rounded-xl bg-neutral-50 border-neutral-100 focus:bg-white focus:border-neutral-300 focus:ring-0 font-medium transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="leaseMonths" className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 ml-1">
                                        Duration
                                    </Label>
                                    <Select
                                        value={leaseMonths.toString()}
                                        onValueChange={(v) => setLeaseMonths(parseInt(v))}
                                    >
                                        <SelectTrigger id="leaseMonths" className="h-12 rounded-xl bg-neutral-50 border-neutral-100 focus:bg-white focus:border-neutral-300 focus:ring-0 font-medium transition-all">
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

                            {/* Payment Terms */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="monthlyRent" className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 ml-1">
                                        Monthly Rent (N$)
                                    </Label>
                                    <Input
                                        id="monthlyRent"
                                        type="number"
                                        min={0}
                                        value={monthlyRent}
                                        onChange={(e) => setMonthlyRent(Number(e.target.value))}
                                        required
                                        className="h-12 rounded-xl bg-neutral-50 border-neutral-100 focus:bg-white focus:border-neutral-300 focus:ring-0 font-medium transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="paymentDay" className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 ml-1">
                                        Due Day
                                    </Label>
                                    <Select
                                        value={paymentDay.toString()}
                                        onValueChange={(v) => setPaymentDay(parseInt(v))}
                                    >
                                        <SelectTrigger id="paymentDay" className="h-12 rounded-xl bg-neutral-50 border-neutral-100 focus:bg-white focus:border-neutral-300 focus:ring-0 font-medium transition-all">
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

                            <div className="space-y-1.5">
                                <Label htmlFor="deposit" className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 ml-1">
                                    Security Deposit (N$)
                                </Label>
                                <Input
                                    id="deposit"
                                    type="number"
                                    min={0}
                                    value={deposit}
                                    onChange={(e) => setDeposit(Number(e.target.value))}
                                    className="h-12 rounded-xl bg-neutral-50 border-neutral-100 focus:bg-white focus:border-neutral-300 focus:ring-0 font-medium transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-neutral-50 border-t border-neutral-100">
                        <DialogFooter className="gap-3 sm:gap-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                className="rounded-xl text-neutral-500 font-bold uppercase tracking-wider text-xs h-12 hover:bg-neutral-200 hover:text-neutral-900"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading || !tenantEmail}
                                className="rounded-xl bg-neutral-900 text-white font-bold uppercase tracking-wider text-xs h-12 px-8 hover:bg-neutral-800 shadow-xl shadow-neutral-900/10 transition-all hover:translate-y-[-1px]"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Assigning...
                                    </>
                                ) : (
                                    <>
                                        Confirm Assignment
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
