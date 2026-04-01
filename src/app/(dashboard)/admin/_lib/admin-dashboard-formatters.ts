import type { DashboardUser } from './admin-dashboard-types'

const numberFormatter = new Intl.NumberFormat('en-NA')
const compactNumberFormatter = new Intl.NumberFormat('en-NA', {
    notation: 'compact',
    maximumFractionDigits: 1,
})
const currencyFormatter = new Intl.NumberFormat('en-NA', {
    style: 'currency',
    currency: 'NAD',
    maximumFractionDigits: 0,
})

export const dateFormatter = new Intl.DateTimeFormat('en-NA', { dateStyle: 'medium' })
export const surfaceClassName =
    'overflow-hidden rounded-[30px] bg-[#ffffff] shadow-[0_12px_32px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.04]'
export const actionButtonClassName =
    'h-8 rounded-full bg-[#f2f2f7] px-3 text-[13px] font-semibold text-[#111827] hover:bg-[#e9e9ef]'
export const roleBadgeClass: Record<DashboardUser['role'], string> = {
    tenant: 'border-blue-200 bg-blue-50 text-blue-700',
    landlord: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    admin: 'border-violet-200 bg-violet-50 text-violet-700',
}

export function formatNumber(value: number) {
    return numberFormatter.format(value)
}

export function formatCompactNumber(value: number) {
    return compactNumberFormatter.format(value)
}

export function formatCurrency(value: number) {
    return currencyFormatter.format(value)
}

export function formatPercent(value: number) {
    return `${numberFormatter.format(value)}%`
}

export function formatRelativeTime(timestamp: number) {
    const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
    const minutes = Math.round((timestamp - Date.now()) / (1000 * 60))
    if (Math.abs(minutes) < 1) return 'Just now'
    if (Math.abs(minutes) < 60) return relativeTimeFormatter.format(minutes, 'minute')
    const hours = Math.round(minutes / 60)
    if (Math.abs(hours) < 24) return relativeTimeFormatter.format(hours, 'hour')
    return relativeTimeFormatter.format(Math.round(hours / 24), 'day')
}
