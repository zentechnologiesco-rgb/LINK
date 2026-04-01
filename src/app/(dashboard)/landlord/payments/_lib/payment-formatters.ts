import { PAYMENT_METHOD_OPTIONS } from './payment-types'

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

export function formatCurrency(amount: number) {
    return currencyFormatter.format(amount)
}

export function formatDate(value: string) {
    return dateFormatter.format(new Date(value))
}

export function getPaymentMethodLabel(method?: string | null) {
    return PAYMENT_METHOD_OPTIONS.find((option) => option.value === method)?.label || 'Recorded'
}

export function getDepositStatusLabel(status: string) {
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

export function getDepositStatusClasses(status: string) {
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

export function getLedgerStatusClasses(status: string) {
    switch (status) {
        case 'paid':
            return 'bg-emerald-100 text-emerald-800'
        case 'overdue':
            return 'bg-red-100 text-red-800'
        default:
            return 'bg-neutral-100 text-neutral-700'
    }
}

export function getLedgerActionLabel(type: string) {
    return type === 'late_fee' ? 'Record Fee' : 'Record Rent'
}
