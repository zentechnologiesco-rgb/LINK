const currency = new Intl.NumberFormat('en-NA', {
    style: 'currency',
    currency: 'NAD',
    maximumFractionDigits: 0,
})

export function formatCurrency(value: number | null | undefined) {
    return currency.format(value || 0)
}

export function getOrdinal(value: number) {
    if (value > 3 && value < 21) return 'th'

    switch (value % 10) {
        case 1:
            return 'st'
        case 2:
            return 'nd'
        case 3:
            return 'rd'
        default:
            return 'th'
    }
}
