const money = new Intl.NumberFormat('en-NA', {
    style: 'currency',
    currency: 'NAD',
    maximumFractionDigits: 0,
})

const dates = new Intl.DateTimeFormat('en-NA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
})

export function formatCurrency(value: number) {
    return money.format(value || 0)
}

export function formatDate(value: string) {
    return dates.format(new Date(value))
}

export function ordinal(value: number) {
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
