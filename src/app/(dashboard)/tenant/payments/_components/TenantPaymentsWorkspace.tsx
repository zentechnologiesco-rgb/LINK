'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
    AlertCircle,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    CreditCard,
    Search,
    Wallet,
} from 'lucide-react'
import {
    formatCurrency,
    formatDate,
    type TenantPaymentFilter,
} from '../_lib/tenant-payments-helpers'
import {
    FeaturePill,
    HeroCard,
    StatCard,
    TenantPaymentsLoadingState,
} from './TenantPaymentsPrimitives'

export function TenantPaymentsWorkspace() {
    const payments = useQuery(api.payments.getForTenant)
    const stats = useQuery(api.payments.getTenantStats)
    const activeLease = useQuery(api.leases.getActiveLease)

    const [filter, setFilter] = useState<TenantPaymentFilter>('all')
    const [search, setSearch] = useState('')

    if (payments === undefined || stats === undefined || activeLease === undefined) {
        return <TenantPaymentsLoadingState />
    }

    const filteredPayments = payments.filter((payment) => {
        const matchesFilter = filter === 'all' || payment.status === filter
        const searchValue = search.trim().toLowerCase()
        const haystack = [
            payment.lease?.property?.title,
            payment.lease?.property?.address,
            payment.lease?.landlord?.fullName,
        ].filter(Boolean).join(' ').toLowerCase()

        return matchesFilter && (!searchValue || haystack.includes(searchValue))
    })

    const openPayments = payments.filter((payment) => payment.status !== 'paid')
    const nextPayment = [...openPayments].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] ?? null

    return (
        <div className="space-y-6 pb-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Payment Center</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">Payments</h1>
                    <p className="mt-1 text-sm text-neutral-500">Track what is due, what has been recorded, and how your lease balance is moving over time.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/tenant/leases">
                        <Button variant="outline" className="h-10 rounded-xl border-neutral-200">Open Leases</Button>
                    </Link>
                    {activeLease && (
                        <Link href={`/tenant/leases/${activeLease._id}`}>
                            <Button className="h-10 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800">Current Lease</Button>
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
                <HeroCard
                    title={nextPayment ? `Next due ${formatDate(nextPayment.dueDate)}` : 'Nothing due right now'}
                    body={nextPayment ? `${nextPayment.lease?.property?.title || 'Your lease'} has ${formatCurrency(nextPayment.amount)} open.` : 'When the landlord records or schedules rent, it will appear here.'}
                    icon={Wallet}
                />
                <StatCard label="Paid" value={formatCurrency(stats.totalPaid)} tone="dark" icon={CheckCircle2} />
                <StatCard label="Pending" value={formatCurrency(stats.pending)} tone="default" icon={Clock} />
                <StatCard label="Overdue" value={formatCurrency(stats.overdue)} tone="danger" icon={AlertCircle} />
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.3fr_0.7fr]">
                <div className="rounded-3xl border border-neutral-200 bg-white p-5">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                            <Wallet className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Current Workflow</p>
                            <h2 className="mt-2 text-xl font-semibold tracking-tight text-neutral-950">Your payment record is already live</h2>
                            <p className="mt-1 text-sm leading-6 text-neutral-500">
                                Use this page to review move-in costs, rent, overdue items, and anything your landlord has already recorded against your lease.
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <FeaturePill label="Rent history" />
                        <FeaturePill label="Deposit visibility" />
                        <FeaturePill label="Balance tracking" />
                    </div>
                </div>

                <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-700 ring-1 ring-sky-200">
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Gateway Roadmap</p>
                            <p className="mt-2 text-sm font-semibold text-sky-950">Online pay and recurring gateway payments will be implemented later.</p>
                            <p className="mt-1 text-sm leading-6 text-sky-800">
                                For now, this center keeps the shared ledger clear while landlord confirmation and offline payment methods are still in use.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {activeLease?.nextPayment && (
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Current Lease</p>
                            <p className="mt-2 text-lg font-semibold tracking-tight text-neutral-900">
                                {activeLease.property?.title || 'Active lease'}
                            </p>
                            <p className="mt-1 text-sm text-neutral-500">
                                Next tracked payment is {formatCurrency(activeLease.nextPayment.amount)} due {formatDate(activeLease.nextPayment.dueDate)}.
                            </p>
                        </div>
                        <Link href={`/tenant/leases/${activeLease._id}`}>
                            <Button className="h-10 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800">
                                View Lease
                                <ArrowUpRight className="ml-1.5 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            )}

            <div className="rounded-3xl border border-neutral-200 bg-white p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-2">
                        {(['all', 'paid', 'pending', 'overdue'] as TenantPaymentFilter[]).map((value) => (
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
                        <Label htmlFor="tenant-payment-search" className="sr-only">Search payments</Label>
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            id="tenant-payment-search"
                            name="tenant_payment_search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search property or landlord…"
                            autoComplete="off"
                            className="h-11 rounded-xl border-neutral-200 pl-10"
                        />
                    </div>
                </div>

                <div className="mt-5 space-y-3">
                    {filteredPayments.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-500">
                            No payments match the current filter right now. Once lease charges are scheduled or recorded, they will show up here automatically.
                        </div>
                    ) : (
                        filteredPayments.map((payment) => (
                            <div key={payment._id} className="rounded-2xl border border-neutral-200 p-4">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-semibold text-neutral-900">
                                                {payment.lease?.property?.title || 'Property'}
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
                                            {payment.lease?.landlord?.fullName || 'Landlord'}
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
                                                {payment.status === 'paid' && payment.paidAt ? `Recorded ${formatDate(new Date(payment.paidAt).toISOString())}` : 'Waiting for landlord record'}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2 lg:justify-end">
                                            <Link href={`/tenant/leases/${payment.lease?.id}`}>
                                                <Button variant="outline" className="h-9 rounded-xl border-neutral-200">
                                                    View Lease
                                                </Button>
                                            </Link>
                                            <Link href="/chat">
                                                <Button className="h-9 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800">
                                                    Message Landlord
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
