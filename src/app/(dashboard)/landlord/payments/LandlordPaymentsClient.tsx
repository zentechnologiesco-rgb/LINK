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
    Calendar,
    Building2,
    User,
    CreditCard,
    MoreHorizontal,
    Check,
    X,
} from "lucide-react"
import { Plus } from "lucide-react"
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
            return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Paid</Badge>
        case 'pending':
            return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">Pending</Badge>
        case 'overdue':
            return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Overdue</Badge>
        default:
            return <Badge variant="secondary">{status}</Badge>
    }
}

const getDepositStatusBadge = (status: string) => {
    switch (status) {
        case 'held':
            return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Held in Escrow</Badge>
        case 'pending':
            return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">Awaiting Payment</Badge>
        case 'released':
            return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Released</Badge>
        case 'partial_release':
            return <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20">Partial Release</Badge>
        case 'forfeited':
            return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Forfeited</Badge>
        default:
            return <Badge variant="secondary">{status}</Badge>
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
                    <p className="text-muted-foreground">Track rent payments and manage deposits</p>
                </div>
                <Button onClick={() => setWizardOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Payment Plan
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-green-500/20 bg-green-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">{formatCurrency(stats.totalCollected)}</div>
                        <p className="text-xs text-muted-foreground">Rent payments received</p>
                    </CardContent>
                </Card>

                <Card className="border-yellow-500/20 bg-yellow-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">{formatCurrency(stats.pending)}</div>
                        <p className="text-xs text-muted-foreground">Awaiting payment</p>
                    </CardContent>
                </Card>

                <Card className="border-red-500/20 bg-red-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{formatCurrency(stats.overdue)}</div>
                        <p className="text-xs text-muted-foreground">Past due date</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs for Payments and Deposits */}
            <Tabs defaultValue="payments" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="payments" className="gap-2">
                        <DollarSign className="h-4 w-4" />
                        Rent Payments
                    </TabsTrigger>
                    <TabsTrigger value="deposits" className="gap-2">
                        <Shield className="h-4 w-4" />
                        Deposits (Escrow)
                    </TabsTrigger>
                </TabsList>

                {/* Payments Tab */}
                <TabsContent value="payments" className="space-y-4">
                    {/* Pending Payments */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-yellow-500" />
                                Pending Payments
                            </CardTitle>
                            <CardDescription>Payments awaiting confirmation</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {pendingPayments.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                                    <p>All payments are up to date!</p>
                                </div>
                            ) : (
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
                                                        <User className="h-4 w-4 text-muted-foreground" />
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
                                                        <Check className="h-4 w-4" />
                                                        Record Payment
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment History */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                Payment History
                            </CardTitle>
                            <CardDescription>Completed payments</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {paidPayments.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No completed payments yet</p>
                                </div>
                            ) : (
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
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Deposits Tab */}
                <TabsContent value="deposits" className="space-y-4">
                    {/* Pending Deposits */}
                    {pendingDeposits.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-yellow-500" />
                                    Awaiting Deposit Payment
                                </CardTitle>
                                <CardDescription>Deposits that have not been paid yet</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {pendingDeposits.map((deposit) => (
                                        <div key={deposit.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{deposit.tenant?.full_name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-blue-500" />
                                Deposits Held in Escrow
                            </CardTitle>
                            <CardDescription>Security deposits held by ZEN on your behalf</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {heldDeposits.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No deposits currently held</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {heldDeposits.map((deposit) => (
                                        <div key={deposit.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{deposit.tenant?.full_name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
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
                                                        variant="destructive"
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
                        <Card>
                            <CardHeader>
                                <CardTitle>Deposit History</CardTitle>
                                <CardDescription>Previously released or forfeited deposits</CardDescription>
                            </CardHeader>
                            <CardContent>
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
                                                        <span className="text-red-500 text-sm block">
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
                            <div className="p-4 bg-muted rounded-lg">
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
                            <div className="p-4 bg-muted rounded-lg">
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
                                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                        <p className="text-sm text-green-600">
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
                                    <p className="text-xs text-red-500">
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
    )
}
