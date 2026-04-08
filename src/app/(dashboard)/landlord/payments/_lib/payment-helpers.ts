import { type DepositListItem, type Filter, type PaymentCenterView, type PaymentListItem } from './payment-types'

function buildSearchHaystack(parts: Array<string | null | undefined>) {
    return parts
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
}

export function buildPaymentCenterView({
    payments,
    deposits,
    filter,
    search,
}: {
    payments: PaymentListItem[]
    deposits: DepositListItem[]
    filter: Filter
    search: string
}): PaymentCenterView {
    const searchValue = search.trim().toLowerCase()
    const ledgerPayments = payments.filter((payment) => payment.type !== 'deposit')
    const openLedgerItems = ledgerPayments
        .filter((payment) => payment.status !== 'paid')
        .toSorted((left, right) => left.dueDate.localeCompare(right.dueDate))
    const overdueItems = openLedgerItems.filter((payment) => payment.status === 'overdue')
    const recordedLedgerItems = ledgerPayments
        .filter((payment) => payment.status === 'paid')
        .toSorted((left, right) => (right.paidAt ?? 0) - (left.paidAt ?? 0))
    const allLedgerItems = [...openLedgerItems, ...recordedLedgerItems]

    const pendingDeposits = deposits
        .filter((deposit) => deposit.status === 'pending')
        .toSorted((left, right) => left._creationTime - right._creationTime)
    const heldDeposits = deposits.filter((deposit) => deposit.status === 'held')
    const settledDeposits = deposits
        .filter((deposit) => deposit.status !== 'pending')
        .toSorted((left, right) => (right.paidAt ?? right._creationTime) - (left.paidAt ?? left._creationTime))
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

        return buildSearchHaystack([
            payment.lease?.tenant?.fullName,
            payment.lease?.tenant?.email,
            payment.lease?.property?.title,
            payment.lease?.property?.address,
        ]).includes(searchValue)
    })

    const filteredDeposits = allDeposits.filter((deposit) => {
        if (!searchValue) return true

        return buildSearchHaystack([
            deposit.tenant?.fullName,
            deposit.tenant?.email,
            deposit.lease?.property?.title,
            deposit.lease?.property?.address,
        ]).includes(searchValue)
    })

    return {
        nextDue: openLedgerItems[0] ?? null,
        openLedgerItems,
        overdueItems,
        recordedLedgerItems,
        filteredPayments,
        pendingDeposits,
        heldDeposits,
        filteredDeposits,
        queueRentTotal: openLedgerItems.reduce((sum, payment) => sum + payment.amount, 0),
        queueDepositTotal: pendingDeposits.reduce((sum, deposit) => sum + deposit.amount, 0),
        heldDepositTotal: heldDeposits.reduce((sum, deposit) => sum + deposit.amount, 0),
    }
}
