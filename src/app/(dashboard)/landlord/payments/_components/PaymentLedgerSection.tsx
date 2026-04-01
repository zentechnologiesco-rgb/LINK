'use client'

import Link from 'next/link'

import { Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

import {
    formatCurrency,
    formatDate,
    getLedgerActionLabel,
    getLedgerStatusClasses,
    getPaymentMethodLabel,
} from '../_lib/payment-formatters'
import { type Filter, type PaymentListItem } from '../_lib/payment-types'
import { PaymentSectionTitle } from './PaymentCenterPrimitives'

const FILTER_OPTIONS: Array<{ value: Filter; label: string }> = [
    { value: 'action', label: 'To record' },
    { value: 'paid', label: 'Recorded' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'all', label: 'All' },
]

export function PaymentLedgerSection({
    filter,
    search,
    payments,
    onFilterChange,
    onSearchChange,
    onRecordPayment,
}: {
    filter: Filter
    search: string
    payments: PaymentListItem[]
    onFilterChange: (filter: Filter) => void
    onSearchChange: (value: string) => void
    onRecordPayment: (paymentId: PaymentListItem['_id']) => void
}) {
    return (
        <div className="rounded-3xl border border-neutral-200 bg-white p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <PaymentSectionTitle
                        title="Rent & Fee Ledger"
                        description="Use this section for rent and late-fee collection. Security deposits are handled below."
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                        {FILTER_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => onFilterChange(option.value)}
                                className={cn(
                                    'h-10 rounded-xl px-4 text-sm font-medium transition-colors',
                                    filter === option.value
                                        ? 'bg-neutral-900 text-white'
                                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative w-full lg:w-[360px]">
                    <Label htmlFor="payment-search" className="sr-only">
                        Search payments
                    </Label>
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                        id="payment-search"
                        name="payment_search"
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="Search tenant or property..."
                        autoComplete="off"
                        className="h-11 rounded-xl border-neutral-200 pl-10"
                    />
                </div>
            </div>

            <div className="mt-5 space-y-3">
                {payments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-500">
                        No rent or fee items match the current view yet.
                    </div>
                ) : (
                    payments.map((payment) => {
                        const paidAtLabel = payment.paidAt
                            ? formatDate(new Date(payment.paidAt).toISOString())
                            : null
                        const leaseHref = payment.lease?.id ? `/landlord/leases/${payment.lease.id}` : null

                        return (
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
                                            {payment.lease?.property?.address ? ` - ${payment.lease.property.address}` : ''}
                                        </p>
                                        <p className="mt-1 text-xs text-neutral-400">
                                            Due {formatDate(payment.dueDate)}
                                            {payment.notes ? ` - ${payment.notes}` : ''}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3 lg:items-end">
                                        <div className="text-right">
                                            <p className="text-lg font-semibold text-neutral-900">{formatCurrency(payment.amount)}</p>
                                            <p className="text-xs text-neutral-500">
                                                {payment.status === 'paid' && paidAtLabel
                                                    ? `${getPaymentMethodLabel(payment.paymentMethod)} on ${paidAtLabel}${payment.paymentReference ? ` - Ref ${payment.paymentReference}` : ''}`
                                                    : 'Awaiting collection record'}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2 lg:justify-end">
                                            {leaseHref ? (
                                                <Link href={leaseHref}>
                                                    <Button variant="outline" className="h-9 rounded-xl border-neutral-200">
                                                        View Lease
                                                    </Button>
                                                </Link>
                                            ) : null}
                                            {payment.status !== 'paid' ? (
                                                <Button
                                                    className="h-9 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800"
                                                    onClick={() => onRecordPayment(payment._id)}
                                                >
                                                    {getLedgerActionLabel(payment.type)}
                                                </Button>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
