'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    CreditCard,
    Wallet,
} from '@/components/ui/icons'

import { api } from '../../../../../convex/_generated/api'
import { Id } from '../../../../../convex/_generated/dataModel'
import { Button } from '@/components/ui/button'

import {
    DepositConfirmationDialog,
    PaymentRecordDialog,
} from './_components/PaymentDialogs'
import { DepositCollectionSection } from './_components/DepositCollectionSection'
import { PaymentLedgerSection } from './_components/PaymentLedgerSection'
import { PaymentHeroCard, PaymentQueueCard, PaymentStatCard } from './_components/PaymentCenterPrimitives'
import { buildPaymentCenterView } from './_lib/payment-helpers'
import { formatCurrency, formatDate } from './_lib/payment-formatters'
import {
    type DepositListItem,
    type Filter,
    type PaymentListItem,
    type PaymentMethodValue,
    type PaymentStats,
} from './_lib/payment-types'

export default function LandlordPaymentsPage() {
    const payments = useQuery(api.payments.getForLandlord) as PaymentListItem[] | undefined
    const deposits = useQuery(api.deposits.getForLandlord) as DepositListItem[] | undefined
    const stats = useQuery(api.payments.getLandlordStats) as PaymentStats | undefined
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

    const view = useMemo(
        () => payments && deposits
            ? buildPaymentCenterView({ payments, deposits, filter, search })
            : null,
        [deposits, filter, payments, search],
    )

    if (payments === undefined || deposits === undefined || stats === undefined || !view) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-black/10 border-t-black animate-spin" />
                    <p className="text-sm text-black/40 font-medium">Loading payments...</p>
                </div>
            </div>
        )
    }

    const selectedPayment = selectedPaymentId
        ? payments.find((payment) => payment._id === selectedPaymentId) ?? null
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
                <PaymentHeroCard
                    title={view.nextDue ? `Next due ${formatDate(view.nextDue.dueDate)}` : 'No open balance'}
                    body={view.nextDue ? `${view.nextDue.lease?.tenant?.fullName || 'Tenant'} owes ${formatCurrency(view.nextDue.amount)}` : 'All rent and fee items are up to date.'}
                    icon={Wallet}
                />
                <PaymentStatCard label="Collected" value={formatCurrency(stats.totalCollected)} tone="dark" icon={CheckCircle2} />
                <PaymentStatCard label="Pending" value={formatCurrency(stats.pending)} tone="default" icon={Clock} />
                <PaymentStatCard label="Overdue" value={formatCurrency(stats.overdue)} tone="danger" icon={AlertCircle} />
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

            {view.overdueItems.length > 0 ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                        <div>
                            <p className="text-sm font-semibold text-red-900">{view.overdueItems.length} rent or fee item{view.overdueItems.length === 1 ? '' : 's'} need attention</p>
                            <p className="mt-1 text-sm text-red-700">Record collections as they come in so overdue balances and late-fee history stay accurate for both landlord and tenant.</p>
                        </div>
                    </div>
                </div>
            ) : null}

            <div className="grid gap-3 lg:grid-cols-3">
                <PaymentQueueCard
                    title="Rent & fees to record"
                    value={formatCurrency(view.queueRentTotal)}
                    detail={`${view.openLedgerItems.length} open ledger item${view.openLedgerItems.length === 1 ? '' : 's'}`}
                    tone="default"
                    actionLabel={view.openLedgerItems[0] ? 'Record next' : undefined}
                    onAction={view.openLedgerItems[0] ? () => setSelectedPaymentId(view.openLedgerItems[0]._id) : undefined}
                />
                <PaymentQueueCard
                    title="Deposits waiting confirmation"
                    value={formatCurrency(view.queueDepositTotal)}
                    detail={`${view.pendingDeposits.length} deposit${view.pendingDeposits.length === 1 ? '' : 's'} pending`}
                    tone="warning"
                    actionLabel={view.pendingDeposits[0] ? 'Confirm next' : undefined}
                    onAction={view.pendingDeposits[0] ? () => setSelectedDepositId(view.pendingDeposits[0]._id) : undefined}
                />
                <PaymentQueueCard
                    title="Held deposits"
                    value={formatCurrency(view.heldDepositTotal)}
                    detail="Confirmed and currently held"
                    tone="success"
                />
            </div>

            <PaymentLedgerSection
                filter={filter}
                search={search}
                payments={view.filteredPayments}
                onFilterChange={setFilter}
                onSearchChange={setSearch}
                onRecordPayment={setSelectedPaymentId}
            />

            <DepositCollectionSection
                deposits={view.filteredDeposits}
                pendingCount={view.pendingDeposits.length}
                heldCount={view.heldDeposits.length}
                onConfirmDeposit={setSelectedDepositId}
            />

            <PaymentRecordDialog
                payment={selectedPayment}
                paymentMethod={paymentMethod}
                paymentReference={paymentReference}
                isSaving={isSavingPayment}
                onClose={() => setSelectedPaymentId(null)}
                onPaymentMethodChange={setPaymentMethod}
                onPaymentReferenceChange={setPaymentReference}
                onSubmit={handleRecordPayment}
            />

            <DepositConfirmationDialog
                deposit={selectedDeposit}
                depositMethod={depositMethod}
                depositReference={depositReference}
                isSaving={isSavingDeposit}
                onClose={() => setSelectedDepositId(null)}
                onDepositMethodChange={setDepositMethod}
                onDepositReferenceChange={setDepositReference}
                onSubmit={handleConfirmDeposit}
            />
        </div>
    )
}
