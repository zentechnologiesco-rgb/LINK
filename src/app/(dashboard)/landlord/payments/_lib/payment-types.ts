import { type Id } from '../../../../../../convex/_generated/dataModel'

export const PAYMENT_METHOD_OPTIONS = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'eft', label: 'EFT' },
    { value: 'cash', label: 'Cash' },
] as const

export type Filter = 'action' | 'paid' | 'overdue' | 'all'

export type PaymentMethodValue = (typeof PAYMENT_METHOD_OPTIONS)[number]['value']

type PersonSummary = {
    fullName?: string | null
    email?: string | null
}

type PropertySummary = {
    title?: string | null
    address?: string | null
}

type LeaseSummary = {
    id?: Id<'leases'> | null
    tenant?: PersonSummary | null
    property?: PropertySummary | null
}

export type PaymentListItem = {
    _id: Id<'payments'>
    amount: number
    dueDate: string
    type: string
    status: string
    notes?: string | null
    paidAt?: number | null
    paymentMethod?: string | null
    paymentReference?: string | null
    lease?: LeaseSummary | null
}

export type DepositListItem = {
    _id: Id<'deposits'>
    _creationTime: number
    amount: number
    status: string
    paidAt?: number | null
    paymentMethod?: string | null
    paymentReference?: string | null
    tenant?: PersonSummary | null
    lease?: Pick<LeaseSummary, 'id' | 'property'> | null
}

export type PaymentStats = {
    totalCollected: number
    pending: number
    overdue: number
}

export type PaymentCenterView = {
    nextDue: PaymentListItem | null
    openLedgerItems: PaymentListItem[]
    overdueItems: PaymentListItem[]
    recordedLedgerItems: PaymentListItem[]
    filteredPayments: PaymentListItem[]
    pendingDeposits: DepositListItem[]
    heldDeposits: DepositListItem[]
    filteredDeposits: DepositListItem[]
    queueRentTotal: number
    queueDepositTotal: number
    heldDepositTotal: number
}
