'use client'

import { useState } from 'react'
import Link from 'next/link'
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
    FileText,
    Search,
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

const formatCurrency = (amount: number) => currencyFormatter.format(amount)
const formatDate = (value: string) => dateFormatter.format(new Date(value))

type Filter = 'all' | 'paid' | 'pending' | 'overdue'

export default function LandlordPaymentsPage() {
    const payments = useQuery(api.payments.getForLandlord)
    const stats = useQuery(api.payments.getLandlordStats)
    const recordPayment = useMutation(api.payments.record)

    const [filter, setFilter] = useState<Filter>('all')
    const [search, setSearch] = useState('')
    const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)
    const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
    const [paymentNotes, setPaymentNotes] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    if (payments === undefined || stats === undefined) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-black/10 border-t-black animate-spin" />
                    <p className="text-sm text-black/40 font-medium">Loading payments…</p>
                </div>
            </div>
        )
    }

    const filteredPayments = payments.filter((payment) => {
        const matchesFilter = filter === 'all' || payment.status === filter
        const searchValue = search.trim().toLowerCase()
        const haystack = [
            payment.lease?.tenant?.fullName,
            payment.lease?.tenant?.email,
            payment.lease?.property?.title,
            payment.lease?.property?.address,
        ].filter(Boolean).join(' ').toLowerCase()

        return matchesFilter && (!searchValue || haystack.includes(searchValue))
    })

    const selectedPayment = selectedPaymentId
        ? payments.find((payment) => payment._id === selectedPaymentId) ?? null
        : null

    const openItems = payments.filter((payment) => payment.status !== 'paid')
    const overdueItems = openItems.filter((payment) => payment.status === 'overdue')
    const nextDue = [...openItems].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] ?? null

    const handleRecordPayment = async () => {
        if (!selectedPayment) return

        setIsSaving(true)
        try {
            await recordPayment({
                paymentId: selectedPayment._id as Id<"payments">,
                paymentMethod,
                notes: paymentNotes || undefined,
            })
            toast.success('Payment recorded.')
            setSelectedPaymentId(null)
            setPaymentNotes('')
            setPaymentMethod('bank_transfer')
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Could not record payment')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6 pb-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Rent Ledger</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">Payments</h1>
                    <p className="mt-1 text-sm text-neutral-500">Track what has been collected, what is due next, and what needs follow-up.</p>
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
                    body={nextDue ? `${nextDue.lease?.tenant?.fullName || 'Tenant'} owes ${formatCurrency(nextDue.amount)}` : 'All tracked payments are up to date.'}
                    icon={Wallet}
                />
                <StatCard label="Collected" value={formatCurrency(stats.totalCollected)} tone="dark" icon={CheckCircle2} />
                <StatCard label="Pending" value={formatCurrency(stats.pending)} tone="default" icon={Clock} />
                <StatCard label="Overdue" value={formatCurrency(stats.overdue)} tone="danger" icon={AlertCircle} />
            </div>

            {overdueItems.length > 0 && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                        <div>
                            <p className="text-sm font-semibold text-red-900">{overdueItems.length} payment{overdueItems.length === 1 ? '' : 's'} need attention</p>
                            <p className="mt-1 text-sm text-red-700">Late fees are now auto-created when rent goes overdue. Record incoming payments here to keep tenant balances accurate.</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="rounded-3xl border border-neutral-200 bg-white p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-2">
                        {(['all', 'paid', 'pending', 'overdue'] as Filter[]).map((value) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setFilter(value)}
                                className={cn(
                                    'h-10 rounded-xl px-4 text-sm font-medium capitalize transition-colors',
                                    filter === value
                                        ? 'bg-neutral-900 text-white'
                                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                )}
                            >
                                {value}
                            </button>
                        ))}
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
                            No payments match the current filter.
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
                                            <span className={cn(
                                                'rounded-full px-2.5 py-1 text-xs font-semibold capitalize',
                                                payment.status === 'paid' && 'bg-emerald-100 text-emerald-700',
                                                payment.status === 'pending' && 'bg-neutral-100 text-neutral-600',
                                                payment.status === 'overdue' && 'bg-red-100 text-red-700',
                                            )}>
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
                                                    ? `Paid ${formatDate(new Date(payment.paidAt).toISOString())}`
                                                    : 'Awaiting receipt'}
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
                                                    Record Payment
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
                        <DialogTitle className="text-xl font-semibold">Record Payment</DialogTitle>
                    </DialogHeader>

                    {selectedPayment && (
                        <div className="space-y-5">
                            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                                <p className="text-sm font-semibold text-neutral-900">
                                    {selectedPayment.lease?.tenant?.fullName || 'Tenant'}
                                </p>
                                <p className="mt-1 text-sm text-neutral-500">
                                    {selectedPayment.lease?.property?.title || 'Property'} • {formatCurrency(selectedPayment.amount)}
                                </p>
                                <p className="mt-1 text-xs text-neutral-400">
                                    Due {formatDate(selectedPayment.dueDate)}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="payment-method">Payment method</Label>
                                <select
                                    id="payment-method"
                                    name="payment_method"
                                    value={paymentMethod}
                                    onChange={(event) => setPaymentMethod(event.target.value)}
                                    className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm"
                                >
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="eft">EFT</option>
                                    <option value="cash">Cash</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="payment-notes">Notes</Label>
                                <Input
                                    id="payment-notes"
                                    name="payment_notes"
                                    value={paymentNotes}
                                    onChange={(event) => setPaymentNotes(event.target.value)}
                                    placeholder="Optional receipt or reference…"
                                    autoComplete="off"
                                    className="h-11 rounded-xl border-neutral-200"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2">
                                <Button variant="outline" className="h-10 rounded-xl border-neutral-200" onClick={() => setSelectedPaymentId(null)}>
                                    Cancel
                                </Button>
                                <Button className="h-10 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800" onClick={handleRecordPayment} disabled={isSaving}>
                                    {isSaving ? <Clock className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                                    Save Payment
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

function HeroCard({ title, body, icon: Icon }: { title: string; body: string; icon: React.ElementType }) {
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
    icon: React.ElementType
}) {
    return (
        <div className={cn(
            'rounded-3xl border p-5',
            tone === 'dark' && 'border-neutral-950 bg-neutral-950 text-white',
            tone === 'default' && 'border-neutral-200 bg-white text-neutral-900',
            tone === 'danger' && 'border-red-200 bg-red-50 text-red-800',
        )}>
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
