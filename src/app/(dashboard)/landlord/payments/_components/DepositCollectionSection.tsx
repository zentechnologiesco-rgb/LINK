'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'

import { formatCurrency, formatDate, getDepositStatusLabel, getPaymentMethodLabel } from '../_lib/payment-formatters'
import { type DepositListItem } from '../_lib/payment-types'
import { PaymentDepositStatusPill, PaymentSectionTitle } from './PaymentCenterPrimitives'

export function DepositCollectionSection({
    deposits,
    pendingCount,
    heldCount,
    onConfirmDeposit,
}: {
    deposits: DepositListItem[]
    pendingCount: number
    heldCount: number
    onConfirmDeposit: (depositId: DepositListItem['_id']) => void
}) {
    return (
        <div className="rounded-3xl border border-neutral-200 bg-white p-5">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                <PaymentSectionTitle
                    title="Deposit Collection"
                    description="Confirm security deposits here so the deposit hold status and lease ledger stay aligned."
                />
                <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    <span>{pendingCount} pending</span>
                    <span>{heldCount} held</span>
                </div>
            </div>

            <div className="mt-5 space-y-3">
                {deposits.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-500">
                        No deposits match the current search yet.
                    </div>
                ) : (
                    deposits.map((deposit) => {
                        const leaseHref = deposit.lease?.id ? `/landlord/leases/${deposit.lease.id}` : null
                        const confirmedAtLabel = deposit.paidAt ? formatDate(new Date(deposit.paidAt).toISOString()) : null

                        return (
                            <div key={deposit._id} className="rounded-2xl border border-neutral-200 p-4">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-semibold text-neutral-900">
                                                {deposit.tenant?.fullName || 'Unknown tenant'}
                                            </p>
                                            <PaymentDepositStatusPill status={deposit.status} />
                                            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                                                Security deposit
                                            </span>
                                        </div>
                                        <p className="mt-1 text-sm text-neutral-500">
                                            {deposit.lease?.property?.title || 'Unknown property'}
                                            {deposit.lease?.property?.address ? ` - ${deposit.lease.property.address}` : ''}
                                        </p>
                                        <p className="mt-1 text-xs text-neutral-400">
                                            {deposit.status === 'pending'
                                                ? 'Awaiting landlord confirmation'
                                                : confirmedAtLabel
                                                    ? `Confirmed ${confirmedAtLabel}${deposit.paymentReference ? ` - Ref ${deposit.paymentReference}` : ''}`
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
                                            {leaseHref ? (
                                                <Link href={leaseHref}>
                                                    <Button variant="outline" className="h-9 rounded-xl border-neutral-200">
                                                        View Lease
                                                    </Button>
                                                </Link>
                                            ) : null}
                                            {deposit.status === 'pending' ? (
                                                <Button
                                                    className="h-9 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800"
                                                    onClick={() => onConfirmDeposit(deposit._id)}
                                                >
                                                    Confirm Deposit
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
