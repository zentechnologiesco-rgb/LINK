"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { format, formatDistanceToNow, isPast, isFuture, differenceInDays } from "date-fns"
import {
    DollarSign,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Shield,
    Calendar,
    Building2,
    ArrowUpRight,
} from "lucide-react"

interface TenantPaymentsClientProps {
    payments: any[]
    stats: {
        totalPaid: number
        pending: number
        overdue: number
    }
    deposits: any[]
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
            return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">Pending Payment</Badge>
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

export function TenantPaymentsClient({ payments, stats, deposits }: TenantPaymentsClientProps) {
    // Get next upcoming payment
    const upcomingPayment = payments.find(p => p.status === 'pending' && isFuture(new Date(p.due_date)))
    const overduePayments = payments.filter(p => p.status === 'overdue')

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Payments</h1>
                    <p className="text-muted-foreground">Track your rent payments and security deposits</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-green-500/20 bg-green-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">{formatCurrency(stats.totalPaid)}</div>
                        <p className="text-xs text-muted-foreground">Lifetime payments</p>
                    </CardContent>
                </Card>

                <Card className="border-yellow-500/20 bg-yellow-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">{formatCurrency(stats.pending)}</div>
                        <p className="text-xs text-muted-foreground">Upcoming payments</p>
                    </CardContent>
                </Card>

                <Card className="border-red-500/20 bg-red-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{formatCurrency(stats.overdue)}</div>
                        <p className="text-xs text-muted-foreground">
                            {overduePayments.length} payment{overduePayments.length !== 1 ? 's' : ''} overdue
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Next Payment Due */}
            {upcomingPayment && (
                <Card className="border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Next Payment Due
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{upcomingPayment.lease?.property?.title}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{upcomingPayment.lease?.property?.address}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold">{formatCurrency(upcomingPayment.amount)}</div>
                                <p className="text-sm text-muted-foreground">
                                    Due {format(new Date(upcomingPayment.due_date), 'MMM d, yyyy')}
                                </p>
                                <p className="text-xs text-primary">
                                    {formatDistanceToNow(new Date(upcomingPayment.due_date), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Security Deposits */}
            {deposits.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Security Deposits
                        </CardTitle>
                        <CardDescription>Your deposits held securely by ZEN</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {deposits.map((deposit) => (
                                <div key={deposit.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{deposit.lease?.property?.title}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{deposit.lease?.property?.address}</p>
                                        {deposit.status === 'partial_release' && deposit.deduction_amount > 0 && (
                                            <p className="text-xs text-orange-500">
                                                Deduction: {formatCurrency(deposit.deduction_amount)} - {deposit.deduction_reason}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right space-y-1">
                                        <div className="text-xl font-bold">{formatCurrency(deposit.amount)}</div>
                                        {getDepositStatusBadge(deposit.status)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Payment History */}
            <Card>
                <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                    <CardDescription>All your rent payments</CardDescription>
                </CardHeader>
                <CardContent>
                    {payments.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No payments yet</p>
                            <p className="text-sm">Your payment history will appear here once you have an active lease.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Property</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Paid On</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell>
                                            <div className="font-medium">{payment.lease?.property?.title}</div>
                                            <div className="text-sm text-muted-foreground">{payment.lease?.property?.address}</div>
                                        </TableCell>
                                        <TableCell className="capitalize">{payment.type}</TableCell>
                                        <TableCell>{format(new Date(payment.due_date), 'MMM d, yyyy')}</TableCell>
                                        <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                        <TableCell>
                                            {payment.paid_at ? format(new Date(payment.paid_at), 'MMM d, yyyy') : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
