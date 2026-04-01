import { differenceInDays, format } from 'date-fns'

import type { LeaseStatus } from '@/constants/lease'

import type {
    FilterTab,
    LandlordLease,
    LeasesDashboardView,
} from './leases-page-types'

export function formatCurrency(value?: number) {
    return `N$${(value ?? 0).toLocaleString()}`
}

function pluralize(word: string, count: number) {
    return count === 1 ? word : `${word}s`
}

export function getStatusBadgeClasses(status: LeaseStatus) {
    switch (status) {
        case 'draft':
            return 'bg-neutral-100 text-neutral-600 border-neutral-200'
        case 'sent_to_tenant':
            return 'bg-blue-50 text-blue-700 border-blue-200'
        case 'tenant_signed':
            return 'bg-amber-50 text-amber-700 border-amber-200'
        case 'approved':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200'
        case 'rejected':
            return 'bg-red-50 text-red-700 border-red-200'
        case 'revision_requested':
            return 'bg-orange-50 text-orange-700 border-orange-200'
        case 'expired':
            return 'bg-neutral-100 text-neutral-500 border-neutral-200'
        case 'terminated':
            return 'bg-red-50 text-red-600 border-red-200'
    }
}

export function getLeaseSubtitle(lease: LandlordLease) {
    switch (lease.status) {
        case 'draft':
            return 'Draft - ready to send'
        case 'sent_to_tenant':
            return lease.sentAt
                ? `Sent ${format(new Date(lease.sentAt), 'MMM d')}`
                : 'Waiting for tenant'
        case 'tenant_signed':
            return lease.signedAt
                ? `Signed ${format(new Date(lease.signedAt), 'MMM d')}`
                : 'Ready for your review'
        case 'approved': {
            const days = differenceInDays(new Date(lease.endDate), new Date())
            return days >= 0
                ? `${days} ${pluralize('day', days)} remaining`
                : 'Term ended'
        }
        case 'revision_requested':
            return 'Waiting for tenant updates'
        case 'rejected':
            return 'Rejected'
        case 'expired':
            return `Expired ${format(new Date(lease.endDate), 'MMM d, yyyy')}`
        case 'terminated':
            return 'Terminated'
    }
}

export function getFilterEmptyMessage(filter: FilterTab) {
    const messages: Record<
        FilterTab,
        { title: string; description: string }
    > = {
        all: {
            title: 'No leases',
            description: 'Create your first lease to get started.',
        },
        action: {
            title: 'Nothing needs your action',
            description:
                "You're all caught up. Leases waiting for your review will show here.",
        },
        progress: {
            title: 'No leases in progress',
            description:
                'Drafts and leases awaiting signatures will appear here.',
        },
        active: {
            title: 'No active leases',
            description:
                'Once a lease is approved, it will appear here.',
        },
        archive: {
            title: 'No archived leases',
            description:
                'Expired, rejected, and terminated leases appear here for reference.',
        },
    }

    return messages[filter]
}

export function buildLeasesDashboardView({
    leases,
    activeFilter,
}: {
    leases: LandlordLease[]
    activeFilter: FilterTab
}): LeasesDashboardView {
    const actionRequiredLeases = leases.filter(
        (lease) => lease.status === 'tenant_signed'
    )
    const inProgressLeases = leases.filter((lease) =>
        ['draft', 'sent_to_tenant', 'revision_requested'].includes(lease.status)
    )
    const activeLeases = leases.filter((lease) => lease.status === 'approved')
    const archivedLeases = leases.filter((lease) =>
        ['rejected', 'expired', 'terminated'].includes(lease.status)
    )

    const filteredLeases = (() => {
        switch (activeFilter) {
            case 'action':
                return actionRequiredLeases
            case 'progress':
                return inProgressLeases
            case 'active':
                return activeLeases
            case 'archive':
                return archivedLeases
            default:
                return leases
        }
    })()

    const totalMonthlyBooked = activeLeases.reduce(
        (sum, lease) => sum + (lease.monthlyRent ?? 0),
        0,
    )
    const renewalsSoonCount = activeLeases.filter((lease) => {
        const daysRemaining = differenceInDays(
            new Date(lease.endDate),
            new Date(),
        )
        return daysRemaining >= 0 && daysRemaining <= 45
    }).length

    return {
        totalCount: leases.length,
        filteredLeases,
        tabCounts: {
            all: leases.length,
            action: actionRequiredLeases.length,
            progress: inProgressLeases.length,
            active: activeLeases.length,
            archive: archivedLeases.length,
        },
        actionRequiredCount: actionRequiredLeases.length,
        activeCount: activeLeases.length,
        totalMonthlyBooked,
        renewalsSoonCount,
    }
}

