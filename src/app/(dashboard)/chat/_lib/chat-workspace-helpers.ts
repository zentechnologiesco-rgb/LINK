import { formatDistanceToNow } from 'date-fns'

import type {
    AnnouncementDraft,
    SupportDraft,
    SupportStatus,
} from './chat-workspace-types'

export const supportCategories = ['General', 'Payments', 'Verification', 'Properties', 'Urgent']

export const defaultSupportDraft: SupportDraft = {
    subject: '',
    category: 'General',
    priority: 'normal',
    content: '',
}

export const defaultAnnouncementDraft: AnnouncementDraft = {
    title: '',
    body: '',
    audience: 'all',
    priority: 'important',
    isPinned: true,
}

export function inquiryTone(status: string) {
    if (status === 'approved') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    if (status === 'rejected') return 'border-red-200 bg-red-50 text-red-700'
    if (status === 'completed') return 'border-neutral-200 bg-neutral-100 text-neutral-500'
    return 'border-amber-200 bg-amber-50 text-amber-700'
}

export function supportStatusTone(status: SupportStatus) {
    if (status === 'resolved') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    if (status === 'pending') return 'border-sky-200 bg-sky-50 text-sky-700'
    return 'border-amber-200 bg-amber-50 text-amber-700'
}

export function supportStatusLabel(status: SupportStatus) {
    if (status === 'resolved') return 'Resolved'
    if (status === 'pending') return 'Awaiting user'
    return 'Needs admin'
}

export function relativeTime(timestamp: number) {
    const distance = formatDistanceToNow(new Date(timestamp), { addSuffix: false })

    return distance
        .replace(' minutes', 'm')
        .replace(' minute', 'm')
        .replace(' hours', 'h')
        .replace(' hour', 'h')
        .replace(' days', 'd')
        .replace(' day', 'd')
        .replace('less than a', '<1')
        .replace('about ', '')
}
