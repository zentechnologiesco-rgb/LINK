const currency = new Intl.NumberFormat('en-NA', {
    style: 'currency',
    currency: 'NAD',
    maximumFractionDigits: 0,
})

export function formatCurrency(value: number) {
    return currency.format(value || 0)
}
