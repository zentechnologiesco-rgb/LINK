export type TenantPaymentFilter = 'all' | 'paid' | 'pending' | 'overdue'

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
