import type { Id } from '@convex/_generated/dataModel'

export type Trend = {
    delta: number
    direction: 'up' | 'down' | 'flat'
}

export type DashboardUser = {
    _id: Id<'users'>
    fullName?: string | null
    email: string
    role: 'tenant' | 'landlord' | 'admin'
    isVerified: boolean
    avatarUrl?: string | null
    createdAt: number
}

export type DashboardProperty = {
    _id: Id<'properties'>
    title: string
    city: string
    priceNad?: number
    approvalStatus?: 'pending' | 'approved' | 'rejected'
    publicationStatus?: 'published' | 'unpublished'
    isAvailable: boolean
    availableUnitCount: number
    activeLeaseCount: number
    reservedLeaseCount: number
    viewCount: number
    saveCount: number
    landlord?: {
        fullName?: string | null
        email?: string | null
    } | null
}

export type DashboardOverview = {
    headline: {
        queuesNeedingAttention: number
        liveListings: number
        occupancyRate: number
        collectionRate: number
    }
    users: {
        total: number
        verifiedRate: number
        roles: { tenant: number; landlord: number; admin: number }
        trend: Trend
        recent: DashboardUser[]
    }
    properties: {
        published: number
        offMarket: number
        live: number
        pending: number
        featured: number
        noVacancy: number
        trend: Trend
        recent: DashboardProperty[]
        topProperties: DashboardProperty[]
    }
    inventory: {
        totalUnits: number
        availableUnits: number
        reservedUnits: number
        occupiedUnits: number
        occupancyRate: number
    }
    leases: {
        sent_to_tenant: number
        tenant_signed: number
        revision_requested: number
        approved: number
    }
    moderation: {
        pendingPropertyRequests: number
        pendingLandlordRequests: number
    }
    finances: {
        amounts: { paid: number; pending: number; overdue: number }
        counts: { overdue: number }
        deposits: { amounts: { held: number; pending: number } }
    }
    engagement: {
        inquiries: { total: number; pending: number }
        messages: { total: number; unreadSupportMessages: number }
        savedProperties: number
        recentlyViewed: number
        announcements: { active: number }
        support: { open: number; pending: number; urgent: number }
    }
    topCities: Array<{ city: string; total: number; live: number; pending: number }>
    recentActivity: Array<{
        _id: string
        timestamp: number
        label: string
        targetLabel: string
        adminName: string
        detail?: string
        href?: string
    }>
}
