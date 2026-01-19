"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import {
    DollarSign,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Shield,
    Building2,
    User,
    Check,
    Plus,
} from "lucide-react"
import { recordPayment, type PaymentMethod } from "@/lib/payments"
import { confirmDepositPayment, releaseDeposit, forfeitDeposit } from "@/lib/deposits"
import { AssignTenantWizard, type PropertyWithLease } from "@/components/properties/AssignTenantWizard"

interface LandlordPaymentsClientProps {
    payments: any[]
    stats: {
        totalCollected: number
        pending: number
        overdue: number
    }
    deposits: any[]
    properties: PropertyWithLease[]
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NA', {
        style: 'currency',
        currency: 'NAD',
        minimumFractionDigits: 0,
    }).format(amount)
}

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'paid':
            return <Badge variant="secondary" className="text-muted-foreground">Paid</Badge>
        case 'pending':
            return <Badge variant="secondary" className="text-muted-foreground">Pending</Badge>
        case 'overdue':
            return <Badge variant="secondary" className="text-muted-foreground">Overdue</Badge>
        default:
            return <Badge variant="secondary" className="capitalize text-muted-foreground">{status}</Badge>
    }
}

const getDepositStatusBadge = (status: string) => {
    switch (status) {
        case 'held':
            return <Badge variant="secondary" className="text-muted-foreground">Held in Escrow</Badge>
        case 'pending':
            return <Badge variant="secondary" className="text-muted-foreground">Awaiting Payment</Badge>
        case 'released':
            return <Badge variant="secondary" className="text-muted-foreground">Released</Badge>
        case 'partial_release':
            return <Badge variant="secondary" className="text-muted-foreground">Partial Release</Badge>
        case 'forfeited':
            return <Badge variant="secondary" className="text-muted-foreground">Forfeited</Badge>
        default:
            return <Badge variant="secondary" className="capitalize text-muted-foreground">{status}</Badge>
    }
}

export function LandlordPaymentsClient({ payments, stats, deposits, properties }: LandlordPaymentsClientProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [wizardOpen, setWizardOpen] = useState(false)

    // Record Payment Dialog
    const [recordPaymentOpen, setRecordPaymentOpen] = useState(false)
    const [selectedPayment, setSelectedPayment] = useState<any>(null)
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer")
    const [paymentNotes, setPaymentNotes] = useState("")

    // Deposit Dialog
    const [depositDialogOpen, setDepositDialogOpen] = useState(false)
    const [selectedDeposit, setSelectedDeposit] = useState<any>(null)
    const [depositAction, setDepositAction] = useState<"confirm" | "release" | "forfeit">("confirm")
    const [depositMethod, setDepositMethod] = useState<PaymentMethod>("bank_transfer")
    const [depositReference, setDepositReference] = useState("")
    const [deductionAmount, setDeductionAmount] = useState("")
    const [deductionReason, setDeductionReason] = useState("")
    const [forfeitReason, setForfeitReason] = useState("")

    const handleRecordPayment = async () => {
        if (!selectedPayment) return
        setIsLoading(true)
        try {
            await recordPayment(selectedPayment.id, paymentMethod, undefined, paymentNotes)
            setRecordPaymentOpen(false)
            setSelectedPayment(null)
            setPaymentNotes("")
            router.refresh()
        } catch (error) {
            console.error("Error recording payment:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDepositAction = async () => {
        if (!selectedDeposit) return
        setIsLoading(true)
        try {
            if (depositAction === "confirm") {
                await confirmDepositPayment(selectedDeposit.id, depositMethod, depositReference)
            } else if (depositAction === "release") {
                await releaseDeposit(
                    selectedDeposit.id,
                    deductionAmount ? parseFloat(deductionAmount) : 0,
                    deductionReason || undefined
                )
            } else if (depositAction === "forfeit") {
                await forfeitDeposit(selectedDeposit.id, forfeitReason)
            }
            setDepositDialogOpen(false)
            setSelectedDeposit(null)
            setDeductionAmount("")
            setDeductionReason("")
            setForfeitReason("")
            router.refresh()
        } catch (error) {
            console.error("Error with deposit action:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const openRecordPayment = (payment: any) => {
        setSelectedPayment(payment)
        setRecordPaymentOpen(true)
    }

    const openDepositDialog = (deposit: any, action: "confirm" | "release" | "forfeit") => {
        setSelectedDeposit(deposit)
        setDepositAction(action)
        setDepositDialogOpen(true)
    }

    const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'overdue')
    const paidPayments = payments.filter(p => p.status === 'paid')
    const pendingDeposits = deposits.filter(d => d.status === 'pending')
    const heldDeposits = deposits.filter(d => d.status === 'held')
    const completedDeposits = deposits.filter(d => ['released', 'partial_release', 'forfeited'].includes(d.status))

    return (
        <div className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-background">
                            <DollarSign className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Payments</h1>
                            <p className="text-sm text-muted-foreground">Track rent payments and manage deposits</p>
                        </div>
                    </div>

                    <Button onClick={() => setWizardOpen(true)} className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
                        Create Payment Plan
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <Card className="gap-0 py-4">
                        <CardContent className="px-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Total Collected</p>
                                    <p className="mt-1 text-2xl font-semibold tracking-tight">{formatCurrency(stats.totalCollected)}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">Rent payments received</p>
                                </div>
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/40">
                                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="gap-0 py-4">
                        <CardContent className="px-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Pending</p>
                                    <p className="mt-1 text-2xl font-semibold tracking-tight">{formatCurrency(stats.pending)}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">Awaiting payment</p>
                                </div>
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/40">
                                    <Clock className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="gap-0 py-4">
                        <CardContent className="px-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Overdue</p>
                                    <p className="mt-1 text-2xl font-semibold tracking-tight">{formatCurrency(stats.overdue)}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">Past due date</p>
                                </div>
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/40">
                                    <AlertTriangle className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs for Payments and Deposits */}
                <Tabs defaultValue="payments" className="space-y-4">
                    <TabsList className="rounded-xl border bg-muted/30 p-1">
                        <TabsTrigger value="payments" className="gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                            Rent Payments
                        </TabsTrigger>
                        <TabsTrigger value="deposits" className="gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                            Deposits (Escrow)
                        </TabsTrigger>
                    </TabsList>

                {/* Payments Tab */}
                <TabsContent value="payments" className="space-y-4">
                    {/* Pending Payments */}
                    <Card className="gap-0 py-0">
                        <CardHeader className="border-b px-4 sm:px-6 py-4">
                            <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                                Pending Payments
                            </CardTitle>
                            <CardDescription>Payments awaiting confirmation</CardDescription>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 py-6">
                            {pendingPayments.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" strokeWidth={1.5} />
                                    <p>All payments are up to date!</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tenant</TableHead>
                                                <TableHead>Property</TableHead>
                                                <TableHead>Due Date</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pendingPayments.map((payment) => (
                                                <TableRow key={payment.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                                                            <div>
                                                                <div className="font-medium">{payment.lease?.tenant?.full_name || 'Unknown'}</div>
                                                                <div className="text-sm text-muted-foreground">{payment.lease?.tenant?.email}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{payment.lease?.property?.title}</div>
                                                        <div className="text-sm text-muted-foreground">{payment.lease?.property?.address}</div>
                                                    </TableCell>
                                                    <TableCell>{format(new Date(payment.due_date), 'MMM d, yyyy')}</TableCell>
                                                    <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                                                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                                    <TableCell>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => openRecordPayment(payment)}
                                                            className="gap-2"
                                                        >
                                                            <Check className="h-4 w-4" strokeWidth={1.5} />
                                                            Record Payment
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment History */}
                    <Card className="gap-0 py-0">
                        <CardHeader className="border-b px-4 sm:px-6 py-4">
                            <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                                Payment History
                            </CardTitle>
                            <CardDescription>Completed payments</CardDescription>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 py-6">
                            {paidPayments.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" strokeWidth={1.5} />
                                    <p>No completed payments yet</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tenant</TableHead>
                                                <TableHead>Property</TableHead>
                                                <TableHead>Due Date</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Paid On</TableHead>
                                                <TableHead>Method</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paidPayments.map((payment) => (
                                                <TableRow key={payment.id}>
                                                    <TableCell>
                                                        <div className="font-medium">{payment.lease?.tenant?.full_name || 'Unknown'}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{payment.lease?.property?.title}</div>
                                                    </TableCell>
                                                    <TableCell>{format(new Date(payment.due_date), 'MMM d, yyyy')}</TableCell>
                                                    <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                                                    <TableCell>
                                                        {payment.paid_at ? format(new Date(payment.paid_at), 'MMM d, yyyy') : '-'}
                                                    </TableCell>
                                                    <TableCell className="capitalize">
                                                        {payment.payment_method?.replace('_', ' ') || '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Deposits Tab */}
                <TabsContent value="deposits" className="space-y-4">
                    {/* Pending Deposits */}
                    {pendingDeposits.length > 0 && (
                        <Card className="gap-0 py-0">
                            <CardHeader className="border-b px-4 sm:px-6 py-4">
                                <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                                    Awaiting Deposit Payment
                                </CardTitle>
                                <CardDescription>Deposits that have not been paid yet</CardDescription>
                            </CardHeader>
                            <CardContent className="px-4 sm:px-6 py-6">
                                <div className="space-y-4">
                                    {pendingDeposits.map((deposit) => (
                                        <div key={deposit.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border rounded-xl">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                                                    <span className="font-medium">{deposit.tenant?.full_name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                                                    <span className="text-sm text-muted-foreground">{deposit.lease?.property?.title}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="text-xl font-bold">{formatCurrency(deposit.amount)}</div>
                                                    {getDepositStatusBadge(deposit.status)}
                                                </div>
                                                <Button size="sm" onClick={() => openDepositDialog(deposit, "confirm")}>
                                                    Confirm Received
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Held Deposits */}
                    <Card className="gap-0 py-0">
                        <CardHeader className="border-b px-4 sm:px-6 py-4">
                            <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
                                <Shield className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                                Deposits Held in Escrow
                            </CardTitle>
                            <CardDescription>Security deposits held by ZEN on your behalf</CardDescription>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 py-6">
                            {heldDeposits.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" strokeWidth={1.5} />
                                    <p>No deposits currently held</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {heldDeposits.map((deposit) => (
                                        <div key={deposit.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border rounded-xl">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                                                    <span className="font-medium">{deposit.tenant?.full_name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                                                    <span className="text-sm text-muted-foreground">{deposit.lease?.property?.title}</span>
                                                </div>
                                                {deposit.paid_at && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Received: {format(new Date(deposit.paid_at), 'MMM d, yyyy')} via {deposit.payment_method?.replace('_', ' ')}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="text-xl font-bold">{formatCurrency(deposit.amount)}</div>
                                                    {getDepositStatusBadge(deposit.status)}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openDepositDialog(deposit, "release")}
                                                    >
                                                        Release
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openDepositDialog(deposit, "forfeit")}
                                                    >
                                                        Forfeit
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Completed Deposits */}
                    {completedDeposits.length > 0 && (
                        <Card className="gap-0 py-0">
                            <CardHeader className="border-b px-4 sm:px-6 py-4">
                                <CardTitle className="text-base font-semibold tracking-tight">Deposit History</CardTitle>
                                <CardDescription>Previously released or forfeited deposits</CardDescription>
                            </CardHeader>
                            <CardContent className="px-4 sm:px-6 py-6">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tenant</TableHead>
                                                <TableHead>Property</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Released On</TableHead>
                                                <TableHead>Notes</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {completedDeposits.map((deposit) => (
                                                <TableRow key={deposit.id}>
                                                    <TableCell>{deposit.tenant?.full_name}</TableCell>
                                                    <TableCell>{deposit.lease?.property?.title}</TableCell>
                                                    <TableCell className="font-medium">
                                                        {formatCurrency(deposit.amount)}
                                                        {deposit.deduction_amount > 0 && (
                                                            <span className="text-muted-foreground text-sm block">
                                                                -{formatCurrency(deposit.deduction_amount)}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{getDepositStatusBadge(deposit.status)}</TableCell>
                                                    <TableCell>
                                                        {deposit.released_at ? format(new Date(deposit.released_at), 'MMM d, yyyy') : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                                                        {deposit.deduction_reason || deposit.release_reason || '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            {/* Record Payment Dialog */}
            <Dialog open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                        <DialogDescription>
                            Confirm that you have received this payment from the tenant.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedPayment && (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/30 border rounded-xl">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">{selectedPayment.lease?.tenant?.full_name}</p>
                                        <p className="text-sm text-muted-foreground">{selectedPayment.lease?.property?.title}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold">{formatCurrency(selectedPayment.amount)}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Due: {format(new Date(selectedPayment.due_date), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Payment Method</Label>
                                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="eft">EFT</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Notes (Optional)</Label>
                                <Textarea
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                    placeholder="Add any notes about this payment..."
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRecordPaymentOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleRecordPayment} disabled={isLoading}>
                            {isLoading ? "Recording..." : "Confirm Payment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Deposit Action Dialog */}
            <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {depositAction === "confirm" && "Confirm Deposit Received"}
                            {depositAction === "release" && "Release Deposit"}
                            {depositAction === "forfeit" && "Forfeit Deposit"}
                        </DialogTitle>
                        <DialogDescription>
                            {depositAction === "confirm" && "Confirm that you have received this security deposit."}
                            {depositAction === "release" && "Release this deposit back to the tenant."}
                            {depositAction === "forfeit" && "Forfeit this deposit due to damage or breach."}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedDeposit && (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/30 border rounded-xl">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">{selectedDeposit.tenant?.full_name}</p>
                                        <p className="text-sm text-muted-foreground">{selectedDeposit.lease?.property?.title}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold">{formatCurrency(selectedDeposit.amount)}</p>
                                    </div>
                                </div>
                            </div>

                            {depositAction === "confirm" && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Payment Method</Label>
                                        <Select value={depositMethod} onValueChange={(v) => setDepositMethod(v as PaymentMethod)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cash">Cash</SelectItem>
                                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                                <SelectItem value="eft">EFT</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Reference Number (Optional)</Label>
                                        <Input
                                            value={depositReference}
                                            onChange={(e) => setDepositReference(e.target.value)}
                                            placeholder="Bank reference or receipt number..."
                                        />
                                    </div>
                                </>
                            )}

                            {depositAction === "release" && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Deduction Amount (Optional)</Label>
                                        <Input
                                            type="number"
                                            value={deductionAmount}
                                            onChange={(e) => setDeductionAmount(e.target.value)}
                                            placeholder="0"
                                            min="0"
                                            max={selectedDeposit.amount}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Leave at 0 for full refund. Max: {formatCurrency(selectedDeposit.amount)}
                                        </p>
                                    </div>
                                    {parseFloat(deductionAmount) > 0 && (
                                        <div className="space-y-2">
                                            <Label>Reason for Deduction</Label>
                                            <Textarea
                                                value={deductionReason}
                                                onChange={(e) => setDeductionReason(e.target.value)}
                                                placeholder="Describe damages or repairs..."
                                                required
                                            />
                                        </div>
                                    )}
                                    <div className="p-3 bg-muted/30 border rounded-xl">
                                        <p className="text-sm text-muted-foreground">
                                            Amount to refund: {formatCurrency(selectedDeposit.amount - (parseFloat(deductionAmount) || 0))}
                                        </p>
                                    </div>
                                </>
                            )}

                            {depositAction === "forfeit" && (
                                <div className="space-y-2">
                                    <Label>Reason for Forfeiture</Label>
                                    <Textarea
                                        value={forfeitReason}
                                        onChange={(e) => setForfeitReason(e.target.value)}
                                        placeholder="Describe the reason for forfeiting the deposit..."
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        This will forfeit the entire deposit of {formatCurrency(selectedDeposit.amount)} to you.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDepositDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDepositAction}
                            disabled={isLoading || (depositAction === "forfeit" && !forfeitReason)}
                            variant={depositAction === "forfeit" ? "destructive" : "default"}
                        >
                            {isLoading ? "Processing..." : (
                                depositAction === "confirm" ? "Confirm Received" :
                                    depositAction === "release" ? "Release Deposit" :
                                        "Forfeit Deposit"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AssignTenantWizard
                open={wizardOpen}
                onOpenChange={setWizardOpen}
                properties={properties}
            />
            </div>
        </div>
    )
}
