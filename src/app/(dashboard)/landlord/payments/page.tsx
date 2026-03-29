'use client'

import Link from 'next/link'
import { useState, type ElementType } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { Id } from '../../../../../convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    CreditCard,
    FileText,
    Search,
    ShieldCheck,
    Wallet,
} from 'lucide-react'

const currencyFormatter = new Intl.NumberFormat('en-NA', {
    style: 'currency',
    currency: 'NAD',
    maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('en-NA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
})

const PAYMENT_METHOD_OPTIONS = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'eft', label: 'EFT' },
    { value: 'cash', label: 'Cash' },
] as const

type Filter = 'action' | 'paid' | 'overdue' | 'all'
type PaymentMethodValue = (typeof PAYMENT_METHOD_OPTIONS)[number]['value']

const formatCurrency = (amount: number) => currencyFormatter.format(amount)
const formatDate = (value: string) => dateFormatter.format(new Date(value))

export default function LandlordPaymentsPage() {
    const payments = useQuery(api.payments.getForLandlord)
    const deposits = useQuery(api.deposits.getForLandlord)
    const stats = useQuery(api.payments.getLandlordStats)
    const recordPayment = useMutation(api.payments.record)
    const confirmDeposit = useMutation(api.deposits.confirm)

    const [filter, setFilter] = useState<Filter>('action')
    const [search, setSearch] = useState('')
    const [selectedPaymentId, setSelectedPaymentId] = useState<Id<'payments'> | null>(null)
    const [selectedDepositId, setSelectedDepositId] = useState<Id<'deposits'> | null>(null)
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodValue>('bank_transfer')
    const [depositMethod, setDepositMethod] = useState<PaymentMethodValue>('bank_transfer')
    const [paymentReference, setPaymentReference] = useState('')
    const [depositReference, setDepositReference] = useState('')
    const [isSavingPayment, setIsSavingPayment] = useState(false)
    const [isSavingDeposit, setIsSavingDeposit] = useState(false)

    if (payments === undefined || deposits === undefined || stats === undefined) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-black/10 border-t-black animate-spin" />
                    <p className="text-sm text-black/40 font-medium">Loading payments…</p>
                </div>
            </div>
        )
    }

    const searchValue = search.trim().toLowerCase()
    const ledgerPayments = payments.filter((payment) => payment.type !== 'deposit')
    const openLedgerItems = ledgerPayments
        .filter((payment) => payment.status !== 'paid')
        .toSorted((a, b) => a.dueDate.localeCompare(b.dueDate))
    const nextDue = openLedgerItems[0] ?? null
    const overdueItems = openLedgerItems.filter((payment) => payment.status === 'overdue')
    const recordedLedgerItems = ledgerPayments
        .filter((payment) => payment.status === 'paid')
        .toSorted((a, b) => (b.paidAt ?? 0) - (a.paidAt ?? 0))
    const allLedgerItems = [...openLedgerItems, ...recordedLedgerItems]

    const pendingDeposits = deposits
        .filter((deposit) => deposit.status === 'pending')
        .toSorted((a, b) => a._creationTime - b._creationTime)
    const settledDeposits = deposits
        .filter((deposit) => deposit.status !== 'pending')
        .toSorted((a, b) => (b.paidAt ?? b._creationTime) - (a.paidAt ?? a._creationTime))
    const allDeposits = [...pendingDeposits, ...settledDeposits]

    const ledgerBase =
        filter === 'action'
            ? openLedgerItems
            : filter === 'paid'
                ? recordedLedgerItems
                : filter === 'overdue'
                    ? overdueItems
                    : allLedgerItems

    const filteredPayments = ledgerBase.filter((payment) => {
        if (!searchValue) return true

        const haystack = [
            payment.lease?.tenant?.fullName,
            payment.lease?.tenant?.email,
            payment.lease?.property?.title,
            payment.lease?.property?.address,
        ].filter(Boolean).join(' ').toLowerCase()

        return haystack.includes(searchValue)
    })

    const filteredDeposits = allDeposits.filter((deposit) => {
        if (!searchValue) return true

        const haystack = [
            deposit.tenant?.fullName,
            deposit.tenant?.email,
            deposit.lease?.property?.title,
            deposit.lease?.property?.address,
        ].filter(Boolean).join(' ').toLowerCase()

        return haystack.includes(searchValue)
    })

    const queueRentTotal = openLedgerItems.reduce((sum, payment) => sum + payment.amount, 0)
    const queueDepositTotal = pendingDeposits.reduce((sum, deposit) => sum + deposit.amount, 0)
    const heldDepositTotal = deposits
        .filter((deposit) => deposit.status === 'held')
        .reduce((sum, deposit) => sum + deposit.amount, 0)

    const selectedPayment = selectedPaymentId
        ? ledgerPayments.find((payment) => payment._id === selectedPaymentId) ?? null
        : null
    const selectedDeposit = selectedDepositId
        ? deposits.find((deposit) => deposit._id === selectedDepositId) ?? null
        : null

    const handleRecordPayment = async () => {
        if (!selectedPayment) return

        setIsSavingPayment(true)
        try {
            await recordPayment({
                paymentId: selectedPayment._id,
                paymentMethod,
                paymentReference: paymentReference || undefined,
            })
            toast.success(selectedPayment.type === 'late_fee' ? 'Fee recorded.' : 'Rent recorded.')
            setSelectedPaymentId(null)
            setPaymentReference('')
            setPaymentMethod('bank_transfer')
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Could not record collection')
        } finally {
            setIsSavingPayment(false)
        }
    }

    const handleConfirmDeposit = async () => {
        if (!selectedDeposit) return

        setIsSavingDeposit(true)
        try {
            await confirmDeposit({
                depositId: selectedDeposit._id,
                paymentMethod: depositMethod,
                paymentReference: depositReference || undefined,
            })
            toast.success('Deposit collection confirmed.')
            setSelectedDepositId(null)
            setDepositReference('')
            setDepositMethod('bank_transfer')
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Could not confirm deposit collection')
        } finally {
            setIsSavingDeposit(false)
        }
    }

    return (
        <div className="space-y-6 pb-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Payment Center</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">Payments</h1>
                    <p className="mt-1 text-sm text-neutral-500">Record rent and fee collections clearly, then confirm security deposits in their own workflow.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/landlord/leases">
                        <Button variant="outline" className="h-10 rounded-xl border-neutral-200">Open Leases</Button>
                    </Link>
                    <Link href="/landlord/leases/new">
                        <Button className="h-10 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800">New Lease</Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
                <HeroCard
                    title={nextDue ? `Next due ${formatDate(nextDue.dueDate)}` : 'No open balance'}
                    body={nextDue ? `${nextDue.lease?.tenant?.fullName || 'Tenant'} owes ${formatCurrency(nextDue.amount)}` : 'All rent and fee items are up to date.'}
                    icon={Wallet}
                />
                <StatCard label="Collected" value={formatCurrency(stats.totalCollected)} tone="dark" icon={CheckCircle2} />
                <StatCard label="Pending" value={formatCurrency(stats.pending)} tone="default" icon={Clock} />
                <StatCard label="Overdue" value={formatCurrency(stats.overdue)} tone="danger" icon={AlertCircle} />
            </div>

            <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5">
                <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-700 ring-1 ring-sky-200">
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="max-w-3xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Gateway Roadmap</p>
                        <h2 className="mt-2 text-xl font-semibold tracking-tight text-sky-950">
                            Online checkout and recurring collections will be added in a later release.
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-sky-800">
                            For now, this is the landlord payment center for recording rent, tracking fees, and confirming deposits. That keeps the ledger clean today and lets the payment gateway plug in later without changing how your records work.
                        </p>
                    </div>
                </div>
            </div>

            {overdueItems.length > 0 && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                        <div>
                            <p className="text-sm font-semibold text-red-900">{overdueItems.length} rent or fee item{overdueItems.length === 1 ? '' : 's'} need attention</p>
                            <p className="mt-1 text-sm text-red-700">Record collections as they come in so overdue balances and late-fee history stay accurate for both landlord and tenant.</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid gap-3 lg:grid-cols-3">
                <QueueCard
                    title="Rent & fees to record"
                    value={formatCurrency(queueRentTotal)}
                    detail={`${openLedgerItems.length} open ledger item${openLedgerItems.length === 1 ? '' : 's'}`}
                    tone="default"
                    actionLabel={openLedgerItems[0] ? 'Record next' : undefined}
                    onAction={openLedgerItems[0] ? () => setSelectedPaymentId(openLedgerItems[0]._id) : undefined}
                />
                <QueueCard
                    title="Deposits waiting confirmation"
                    value={formatCurrency(queueDepositTotal)}
                    detail={`${pendingDeposits.length} deposit${pendingDeposits.length === 1 ? '' : 's'} pending`}
                    tone="warning"
                    actionLabel={pendingDeposits[0] ? 'Confirm next' : undefined}
                    onAction={pendingDeposits[0] ? () => setSelectedDepositId(pendingDeposits[0]._id) : undefined}
                />
                <QueueCard
                    title="Held deposits"
                    value={formatCurrency(heldDepositTotal)}
                    detail="Confirmed and currently held"
                    tone="success"
                />
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <SectionTitle
                            title="Rent & Fee Ledger"
                            description="Use this section for rent and late-fee collection. Security deposits are handled below."
                        />
                        <div className="mt-3 flex flex-wrap gap-2">
                            {([
                                { value: 'action', label: 'To record' },
                                { value: 'paid', label: 'Recorded' },
                                { value: 'overdue', label: 'Overdue' },
                                { value: 'all', label: 'All' },
                            ] as const).map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setFilter(option.value)}
                                    className={cn(
                                        'h-10 rounded-xl px-4 text-sm font-medium transition-colors',
                                        filter === option.value
                                            ? 'bg-neutral-900 text-white'
                                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative w-full lg:w-[360px]">
                        <Label htmlFor="payment-search" className="sr-only">Search payments</Label>
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            id="payment-search"
                            name="payment_search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search tenant or property…"
                            autoComplete="off"
                            className="h-11 rounded-xl border-neutral-200 pl-10"
                        />
                    </div>
                </div>

                <div className="mt-5 space-y-3">
                    {filteredPayments.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-500">
                            No rent or fee items match the current view yet.
                        </div>
                    ) : (
                        filteredPayments.map((payment) => (
                            <div key={payment._id} className="rounded-2xl border border-neutral-200 p-4">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-semibold text-neutral-900">
                                                {payment.lease?.tenant?.fullName || 'Unknown tenant'}
                                            </p>
                                            <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', getLedgerStatusClasses(payment.status))}>
                                                {payment.status}
                                            </span>
                                            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium capitalize text-neutral-600">
                                                {payment.type.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-sm text-neutral-500">
                                            {payment.lease?.property?.title || 'Unknown property'}
                                            {payment.lease?.property?.address ? ` • ${payment.lease.property.address}` : ''}
                                        </p>
                                        <p className="mt-1 text-xs text-neutral-400">
                                            Due {formatDate(payment.dueDate)}
                                            {payment.notes ? ` • ${payment.notes}` : ''}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3 lg:items-end">
                                        <div className="text-right">
                                            <p className="text-lg font-semibold text-neutral-900">{formatCurrency(payment.amount)}</p>
                                            <p className="text-xs text-neutral-500">
                                                {payment.status === 'paid' && payment.paidAt
                                                    ? `${getPaymentMethodLabel(payment.paymentMethod)} on ${formatDate(new Date(payment.paidAt).toISOString())}${payment.paymentReference ? ` • Ref ${payment.paymentReference}` : ''}`
                                                    : 'Awaiting collection record'}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2 lg:justify-end">
                                            <Link href={`/landlord/leases/${payment.lease?.id}`}>
                                                <Button variant="outline" className="h-9 rounded-xl border-neutral-200">
                                                    View Lease
                                                </Button>
                                            </Link>
                                            {payment.status !== 'paid' && (
                                                <Button className="h-9 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800" onClick={() => setSelectedPaymentId(payment._id)}>
                                                    {getLedgerActionLabel(payment.type)}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-5">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                    <SectionTitle
                        title="Deposit Collection"
                        description="Confirm security deposits here so the deposit hold status and lease ledger stay aligned."
                    />
                    <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                        <span>{pendingDeposits.length} pending</span>
                        <span>{deposits.filter((deposit) => deposit.status === 'held').length} held</span>
                    </div>
                </div>

                <div className="mt-5 space-y-3">
                    {filteredDeposits.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-500">
                            No deposits match the current search yet.
                        </div>
                    ) : (
                        filteredDeposits.map((deposit) => (
                            <div key={deposit._id} className="rounded-2xl border border-neutral-200 p-4">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-semibold text-neutral-900">
                                                {deposit.tenant?.fullName || 'Unknown tenant'}
                                            </p>
                                            <DepositStatusPill status={deposit.status} />
                                            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                                                Security deposit
                                            </span>
                                        </div>
                                        <p className="mt-1 text-sm text-neutral-500">
                                            {deposit.lease?.property?.title || 'Unknown property'}
                                            {deposit.lease?.property?.address ? ` • ${deposit.lease.property.address}` : ''}
                                        </p>
                                        <p className="mt-1 text-xs text-neutral-400">
                                            {deposit.status === 'pending'
                                                ? 'Awaiting landlord confirmation'
                                                : deposit.paidAt
                                                    ? `Confirmed ${formatDate(new Date(deposit.paidAt).toISOString())}${deposit.paymentReference ? ` • Ref ${deposit.paymentReference}` : ''}`
                                                    : getDepositStatusLabel(deposit.status)}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3 lg:items-end">
                                        <div className="text-right">
                                            <p className="text-lg font-semibold text-neutral-900">{formatCurrency(deposit.amount)}</p>
                                            <p className="text-xs text-neutral-500">
                                                {deposit.paymentMethod ? getPaymentMethodLabel(deposit.paymentMethod) : 'No payment method recorded'}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2 lg:justify-end">
                                            <Link href={`/landlord/leases/${deposit.lease?.id}`}>
                                                <Button variant="outline" className="h-9 rounded-xl border-neutral-200">
                                                    View Lease
                                                </Button>
                                            </Link>
                                            {deposit.status === 'pending' && (
                                                <Button className="h-9 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800" onClick={() => setSelectedDepositId(deposit._id)}>
                                                    Confirm Deposit
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <Dialog open={Boolean(selectedPayment)} onOpenChange={(open) => !open && setSelectedPaymentId(null)}>
                <DialogContent className="rounded-3xl sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">
                            {selectedPayment?.type === 'late_fee' ? 'Record Fee Collection' : 'Record Rent Collection'}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedPayment && (
                        <div className="space-y-5">
                            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                                <p className="text-sm font-semibold text-neutral-900">{selectedPayment.lease?.tenant?.fullName || 'Tenant'}</p>
                                <p className="mt-1 text-sm text-neutral-500">
                                    {selectedPayment.lease?.property?.title || 'Property'} • {formatCurrency(selectedPayment.amount)}
                                </p>
                                <p className="mt-1 text-xs text-neutral-400">
                                    Due {formatDate(selectedPayment.dueDate)}
                                    {selectedPayment.notes ? ` • ${selectedPayment.notes}` : ''}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
                                Use this flow for rent and late fees. Security deposits are confirmed from the deposit collection section so the held-deposit status is updated correctly.
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="payment-method">Payment method</Label>
                                <select
                                    id="payment-method"
                                    name="payment_method"
                                    value={paymentMethod}
                                    onChange={(event) => setPaymentMethod(event.target.value as PaymentMethodValue)}
                                    className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm"
                                >
                                    {PAYMENT_METHOD_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="payment-reference">Reference / receipt</Label>
                                <Input
                                    id="payment-reference"
                                    name="payment_reference"
                                    value={paymentReference}
                                    onChange={(event) => setPaymentReference(event.target.value)}
                                    placeholder="Optional reference number or receipt code…"
                                    autoComplete="off"
                                    className="h-11 rounded-xl border-neutral-200"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2">
                                <Button variant="outline" className="h-10 rounded-xl border-neutral-200" onClick={() => setSelectedPaymentId(null)}>
                                    Cancel
                                </Button>
                                <Button className="h-10 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800" onClick={handleRecordPayment} disabled={isSavingPayment}>
                                    {isSavingPayment ? <Clock className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                                    Save Record
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(selectedDeposit)} onOpenChange={(open) => !open && setSelectedDepositId(null)}>
                <DialogContent className="rounded-3xl sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">Confirm Deposit Collection</DialogTitle>
                    </DialogHeader>

                    {selectedDeposit && (
                        <div className="space-y-5">
                            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                                <p className="text-sm font-semibold text-neutral-900">{selectedDeposit.tenant?.fullName || 'Tenant'}</p>
                                <p className="mt-1 text-sm text-neutral-500">
                                    {selectedDeposit.lease?.property?.title || 'Property'} • {formatCurrency(selectedDeposit.amount)}
                                </p>
                                <p className="mt-1 text-xs text-neutral-400">
                                    Confirming this marks the security deposit as held and updates the linked lease ledger item.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="deposit-method">Payment method</Label>
                                <select
                                    id="deposit-method"
                                    name="deposit_method"
                                    value={depositMethod}
                                    onChange={(event) => setDepositMethod(event.target.value as PaymentMethodValue)}
                                    className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm"
                                >
                                    {PAYMENT_METHOD_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="deposit-reference">Reference / receipt</Label>
                                <Input
                                    id="deposit-reference"
                                    name="deposit_reference"
                                    value={depositReference}
                                    onChange={(event) => setDepositReference(event.target.value)}
                                    placeholder="Optional deposit reference number…"
                                    autoComplete="off"
                                    className="h-11 rounded-xl border-neutral-200"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2">
                                <Button variant="outline" className="h-10 rounded-xl border-neutral-200" onClick={() => setSelectedDepositId(null)}>
                                    Cancel
                                </Button>
                                <Button className="h-10 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800" onClick={handleConfirmDeposit} disabled={isSavingDeposit}>
                                    {isSavingDeposit ? <Clock className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                                    Confirm Deposit
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

function getPaymentMethodLabel(method?: string) {
    return PAYMENT_METHOD_OPTIONS.find((option) => option.value === method)?.label || 'Recorded'
}

function getDepositStatusLabel(status: string) {
    switch (status) {
        case 'pending':
            return 'Awaiting confirmation'
        case 'held':
            return 'Held'
        case 'released':
            return 'Released'
        case 'partial_release':
            return 'Partial release'
        case 'forfeited':
            return 'Forfeited'
        default:
            return status.replace(/_/g, ' ')
    }
}

function getDepositStatusClasses(status: string) {
    switch (status) {
        case 'pending':
            return 'bg-amber-100 text-amber-800'
        case 'held':
            return 'bg-emerald-100 text-emerald-800'
        case 'released':
            return 'bg-sky-100 text-sky-800'
        case 'partial_release':
            return 'bg-blue-100 text-blue-800'
        case 'forfeited':
            return 'bg-red-100 text-red-800'
        default:
            return 'bg-neutral-100 text-neutral-700'
    }
}

function getLedgerStatusClasses(status: string) {
    switch (status) {
        case 'paid':
            return 'bg-emerald-100 text-emerald-800'
        case 'overdue':
            return 'bg-red-100 text-red-800'
        default:
            return 'bg-neutral-100 text-neutral-700'
    }
}

function getLedgerActionLabel(type: string) {
    return type === 'late_fee' ? 'Record Fee' : 'Record Rent'
}

function SectionTitle({ title, description }: { title: string; description: string }) {
    return (
        <div>
            <h2 className="text-xl font-semibold tracking-tight text-neutral-950">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-neutral-500">{description}</p>
        </div>
    )
}

function QueueCard({
    title,
    value,
    detail,
    tone,
    actionLabel,
    onAction,
}: {
    title: string
    value: string
    detail: string
    tone: 'default' | 'warning' | 'success'
    actionLabel?: string
    onAction?: () => void
}) {
    return (
        <div
            className={cn(
                'rounded-3xl border p-5',
                tone === 'default' && 'border-neutral-200 bg-white',
                tone === 'warning' && 'border-amber-200 bg-amber-50',
                tone === 'success' && 'border-emerald-200 bg-emerald-50'
            )}
        >
            <p
                className={cn(
                    'text-xs font-semibold uppercase tracking-[0.18em]',
                    tone === 'default' && 'text-neutral-500',
                    tone === 'warning' && 'text-amber-700',
                    tone === 'success' && 'text-emerald-700'
                )}
            >
                {title}
            </p>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-neutral-950">{value}</p>
            <p
                className={cn(
                    'mt-1 text-sm',
                    tone === 'default' && 'text-neutral-500',
                    tone === 'warning' && 'text-amber-800',
                    tone === 'success' && 'text-emerald-800'
                )}
            >
                {detail}
            </p>
            {actionLabel && onAction && (
                <Button
                    type="button"
                    variant="outline"
                    className="mt-4 h-10 rounded-xl border-neutral-200 bg-white"
                    onClick={onAction}
                >
                    {actionLabel}
                </Button>
            )}
        </div>
    )
}

function DepositStatusPill({ status }: { status: string }) {
    return (
        <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', getDepositStatusClasses(status))}>
            {getDepositStatusLabel(status)}
        </span>
    )
}

function HeroCard({ title, body, icon: Icon }: { title: string; body: string; icon: ElementType }) {
    return (
        <div className="rounded-3xl bg-neutral-950 p-5 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                <Icon className="h-5 w-5" />
            </div>
            <p className="mt-5 text-lg font-semibold tracking-tight">{title}</p>
            <p className="mt-1 text-sm text-white/65">{body}</p>
        </div>
    )
}

function StatCard({
    label,
    value,
    tone,
    icon: Icon,
}: {
    label: string
    value: string
    tone: 'dark' | 'default' | 'danger'
    icon: ElementType
}) {
    return (
        <div
            className={cn(
                'rounded-3xl border p-5',
                tone === 'dark' && 'border-neutral-950 bg-neutral-950 text-white',
                tone === 'default' && 'border-neutral-200 bg-white text-neutral-900',
                tone === 'danger' && 'border-red-200 bg-red-50 text-red-800'
            )}
        >
            <div className="flex items-center justify-between gap-3">
                <p className={cn('text-xs font-semibold uppercase tracking-[0.18em]', tone === 'dark' ? 'text-white/60' : 'text-current/70')}>
                    {label}
                </p>
                <Icon className="h-4 w-4" />
            </div>
            <p className="mt-5 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
    )
}
