import {
    Bell,
    Building2,
    ChartColumn,
    ClipboardList,
    CreditCard,
    FileCheck2,
    Heart,
    House,
    LayoutDashboard,
    Search,
    ShieldCheck,
    Sparkles,
    UserRound,
    Wallet,
    type LucideIcon,
} from 'lucide-react'

import {
    getStartPageOption,
    normalizeUserPreferences,
    type UserPreferences,
    type UserRole,
} from '@/lib/user-preferences'

export type NotificationPreferenceKey = keyof UserPreferences['notifications']

export type SettingsUser = {
    _id: string
    email: string
    fullName?: string
    firstName?: string
    surname?: string
    phone?: string
    avatarUrl?: string | null
    role: UserRole
    isVerified: boolean
    preferences?: UserPreferences
}

export type SettingsFormState = {
    firstName: string
    surname: string
    phone: string
    preferences: UserPreferences
}

export type SummaryCardConfig = {
    label: string
    value: string
    helper: string
    icon: LucideIcon
    tone?: 'default' | 'accent' | 'warning' | 'danger'
}

export type NotificationItem = {
    key: NotificationPreferenceKey
    title: string
    description: string
    icon: LucideIcon
}

export type WorkspaceLink = {
    title: string
    description: string
    href: string
    meta: string
    icon: LucideIcon
    tone?: 'default' | 'accent' | 'warning' | 'danger'
}

export type RolePanel = {
    title: string
    description: string
    chips: string[]
    action?: {
        label: string
        href: string
    }
}

export type RoleOverview = {
    badge: string
    title: string
    description: string
    gradientClassName: string
    badgeClassName: string
    accentSurfaceClassName: string
    primaryAction: {
        label: string
        href: string
    }
    summary: SummaryCardConfig[]
    notifications: NotificationItem[]
    workspaceLinks: WorkspaceLink[]
    panel: RolePanel
}

export type VerificationStatus = {
    status?: string
    adminNotes?: string
} | null | undefined

type TenantPaymentStats = {
    totalPaid: number
    pending: number
    overdue: number
} | null | undefined

type LandlordPaymentStats = {
    totalCollected: number
    pending: number
    overdue: number
} | null | undefined

type AdminStats = {
    users: number
    properties: number
    leases: number
    inquiries: number
} | null | undefined

type ReviewStats = {
    total: number
    pending: number
    approved: number
    rejected: number
} | null | undefined

type LeaseStatusLike = {
    status: string
}

type PropertyStatusLike = {
    approvalStatus?: string
    isAvailable: boolean
}

export const CURRENCY_FORMATTER = new Intl.NumberFormat('en-NA', {
    style: 'currency',
    currency: 'NAD',
    maximumFractionDigits: 0,
})

export const EMPTY_TENANT_PAYMENT_STATS = {
    totalPaid: 0,
    pending: 0,
    overdue: 0,
}

export const EMPTY_LANDLORD_PAYMENT_STATS = {
    totalCollected: 0,
    pending: 0,
    overdue: 0,
}

export const EMPTY_ADMIN_STATS = {
    users: 0,
    properties: 0,
    leases: 0,
    inquiries: 0,
}

export const EMPTY_REVIEW_STATS = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
}

export const SECTION_LINKS = [
    { id: 'profile', label: 'Profile' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'experience', label: 'Experience' },
    { id: 'workspace', label: 'Workspace' },
    { id: 'account', label: 'Account' },
]

export function formatCurrency(value: number) {
    return CURRENCY_FORMATTER.format(value)
}

export function sanitizeText(value: string) {
    return value.trim().replace(/\s+/g, ' ')
}

export function buildFormState(user: SettingsUser): SettingsFormState {
    const fallbackNameParts = (user.fullName || '').split(' ').filter(Boolean)

    return {
        firstName: user.firstName || fallbackNameParts[0] || '',
        surname: user.surname || fallbackNameParts.slice(1).join(' ') || '',
        phone: user.phone || '',
        preferences: normalizeUserPreferences(user.role, user.preferences),
    }
}

export function serializeFormState(formState: SettingsFormState) {
    return JSON.stringify(formState)
}

export function getToneClasses(tone: SummaryCardConfig['tone']) {
    switch (tone) {
        case 'accent':
            return 'border-sky-200/80 bg-sky-50/80 text-sky-700'
        case 'warning':
            return 'border-amber-200/80 bg-amber-50/80 text-amber-700'
        case 'danger':
            return 'border-rose-200/80 bg-rose-50/80 text-rose-700'
        default:
            return 'border-neutral-200/80 bg-neutral-50/80 text-neutral-700'
    }
}

export function getVerificationStatusCopy(user: SettingsUser, verificationStatus: VerificationStatus) {
    if (user.role === 'landlord' && user.isVerified) {
        return {
            label: 'Verified',
            className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
            description: 'Your landlord account is verified and ready for listings and leases.',
        }
    }

    if (verificationStatus?.status === 'pending') {
        return {
            label: 'Pending Review',
            className: 'border-amber-200 bg-amber-50 text-amber-700',
            description: 'Your documents are with the admin team right now.',
        }
    }

    if (verificationStatus?.status === 'rejected') {
        return {
            label: 'Needs Resubmission',
            className: 'border-rose-200 bg-rose-50 text-rose-700',
            description: verificationStatus.adminNotes || 'A few details need to be corrected before approval.',
        }
    }

    return {
        label: user.role === 'tenant' ? 'Tenant Account' : 'Standard Access',
        className: 'border-neutral-200 bg-neutral-50 text-neutral-700',
        description: user.role === 'tenant'
            ? 'You can keep renting as normal and apply for landlord verification any time.'
            : 'Your account is active.',
    }
}

export function getRoleOverview({
    user,
    form,
    tenantSaved,
    tenantLeases,
    tenantPaymentStats,
    recentlyViewed,
    landlordProperties,
    landlordLeases,
    landlordPaymentStats,
    leaseTemplates,
    verificationStatus,
    adminStats,
    adminPropertyStats,
    adminVerificationStats,
}: {
    user: SettingsUser
    form: SettingsFormState
    tenantSaved: Array<unknown> | undefined
    tenantLeases: LeaseStatusLike[] | undefined
    tenantPaymentStats: TenantPaymentStats
    recentlyViewed: Array<unknown> | undefined
    landlordProperties: PropertyStatusLike[] | undefined
    landlordLeases: LeaseStatusLike[] | undefined
    landlordPaymentStats: LandlordPaymentStats
    leaseTemplates: Array<unknown> | undefined
    verificationStatus: VerificationStatus
    adminStats: AdminStats
    adminPropertyStats: ReviewStats
    adminVerificationStats: ReviewStats
}): RoleOverview {
    const preferredStartPage = getStartPageOption(user.role, form.preferences.experience.startPage)

    if (user.role === 'tenant') {
        const savedCount = tenantSaved?.length ?? 0
        const activeLeases = tenantLeases?.filter((lease) => lease.status === 'approved').length ?? 0
        const pendingLeaseActions = tenantLeases?.filter(
            (lease) => lease.status === 'sent_to_tenant' || lease.status === 'revision_requested',
        ).length ?? 0
        const pendingPayments = tenantPaymentStats?.pending ?? EMPTY_TENANT_PAYMENT_STATS.pending
        const totalPaid = tenantPaymentStats?.totalPaid ?? EMPTY_TENANT_PAYMENT_STATS.totalPaid
        const viewedCount = recentlyViewed?.length ?? 0
        const verificationCopy = getVerificationStatusCopy(user, verificationStatus)

        const panel: RolePanel = verificationStatus?.status === 'pending'
            ? {
                title: 'Landlord verification is in motion',
                description: 'Your documents are under review. You can keep renting while the admin team checks the submission.',
                chips: [`${savedCount} saved homes`, `${viewedCount} recent views`, `${pendingLeaseActions} lease actions`],
                action: { label: 'Review application', href: '/become-landlord' },
            }
            : verificationStatus?.status === 'rejected'
                ? {
                    title: 'Your landlord application needs one more pass',
                    description: verificationCopy.description,
                    chips: [`${savedCount} saved homes`, `${activeLeases} active leases`, `${viewedCount} recent views`],
                    action: { label: 'Resubmit documents', href: '/become-landlord' },
                }
                : {
                    title: 'Built for renters first',
                    description: 'Keep your saved homes, lease steps, and payments tidy, then upgrade to landlord verification when you are ready.',
                    chips: [`${savedCount} saved homes`, `${activeLeases} active leases`, `${viewedCount} recent views`],
                    action: { label: 'Become a landlord', href: '/become-landlord' },
                }

        return {
            badge: 'Tenant settings',
            title: 'Everything about your search, lease, and payments in one calm place.',
            description: 'Tune the way LINK works for you without losing sight of the homes, documents, and money matters that move your rental journey forward.',
            gradientClassName: 'from-sky-50 via-white to-emerald-50',
            badgeClassName: 'border-sky-200 bg-sky-50 text-sky-700',
            accentSurfaceClassName: 'bg-sky-500/10 text-sky-700',
            primaryAction: { label: `Open ${preferredStartPage.label}`, href: preferredStartPage.href },
            summary: [
                {
                    label: 'Saved homes',
                    value: String(savedCount),
                    helper: savedCount > 0 ? 'Shortlisted places ready when you return.' : 'Start collecting places you want to compare.',
                    icon: Heart,
                    tone: 'accent',
                },
                {
                    label: 'Payments due',
                    value: pendingPayments > 0 ? formatCurrency(pendingPayments) : 'Clear',
                    helper: pendingPayments > 0 ? 'Outstanding rent or deposit items to settle.' : 'Nothing pending right now.',
                    icon: Wallet,
                    tone: pendingPayments > 0 ? 'warning' : 'default',
                },
                {
                    label: 'Lease actions',
                    value: String(pendingLeaseActions),
                    helper: pendingLeaseActions > 0
                        ? 'Contracts waiting for your review or response.'
                        : activeLeases > 0
                            ? `${activeLeases} active ${activeLeases === 1 ? 'lease' : 'leases'} moving smoothly.`
                            : 'No paperwork waiting on you.',
                    icon: FileCheck2,
                    tone: pendingLeaseActions > 0 ? 'warning' : 'default',
                },
            ],
            notifications: [
                { key: 'messages', title: 'Conversation updates', description: 'Stay on top of new replies from landlords and lease-related chats.', icon: Bell },
                { key: 'leases', title: 'Lease reminders', description: 'Surface agreement reviews, signatures, and revision requests.', icon: FileCheck2 },
                { key: 'payments', title: 'Payment reminders', description: 'Keep upcoming rent, deposits, and overdue balances visible.', icon: Wallet },
                { key: 'savedSearch', title: 'Listing follow-ups', description: 'Track the properties you are actively circling back to.', icon: Search },
            ],
            workspaceLinks: [
                { title: 'Saved Properties', description: 'Revisit the homes you bookmarked and narrow down your shortlist faster.', href: '/tenant/saved', meta: `${savedCount} saved`, icon: Heart, tone: 'accent' },
                { title: 'My Leases', description: 'See current agreements, next steps, and anything waiting for your approval.', href: '/tenant/leases', meta: pendingLeaseActions > 0 ? `${pendingLeaseActions} need attention` : `${activeLeases} active`, icon: FileCheck2, tone: pendingLeaseActions > 0 ? 'warning' : 'default' },
                { title: 'Payments', description: 'Track what is still due and keep a clear record of what you already paid.', href: '/tenant/payments', meta: pendingPayments > 0 ? `${formatCurrency(pendingPayments)} pending` : `${formatCurrency(totalPaid)} paid`, icon: CreditCard },
                { title: 'Messages', description: 'Keep property conversations and rental coordination in one thread.', href: '/chat', meta: activeLeases > 0 ? 'Connected to your current rentals' : 'Reach out when you find the right fit', icon: Bell },
                { title: 'Become a Landlord', description: verificationCopy.description, href: '/become-landlord', meta: verificationCopy.label, icon: Building2, tone: verificationStatus?.status === 'rejected' ? 'danger' : verificationStatus?.status === 'pending' ? 'warning' : 'default' },
            ],
            panel,
        }
    }

    if (user.role === 'landlord') {
        const propertyCount = landlordProperties?.length ?? 0
        const liveListings = landlordProperties?.filter(
            (property) => property.isAvailable && property.approvalStatus !== 'pending' && property.approvalStatus !== 'rejected',
        ).length ?? 0
        const pendingListings = landlordProperties?.filter((property) => property.approvalStatus === 'pending').length ?? 0
        const rejectedListings = landlordProperties?.filter((property) => property.approvalStatus === 'rejected').length ?? 0
        const activeLeases = landlordLeases?.filter((lease) => lease.status === 'approved').length ?? 0
        const leaseActions = landlordLeases?.filter((lease) => lease.status === 'tenant_signed').length ?? 0
        const pendingPayments = landlordPaymentStats?.pending ?? EMPTY_LANDLORD_PAYMENT_STATS.pending
        const overduePayments = landlordPaymentStats?.overdue ?? EMPTY_LANDLORD_PAYMENT_STATS.overdue
        const collectedPayments = landlordPaymentStats?.totalCollected ?? EMPTY_LANDLORD_PAYMENT_STATS.totalCollected
        const templateCount = leaseTemplates?.length ?? 0
        const attentionCount = pendingListings + rejectedListings + leaseActions

        return {
            badge: 'Landlord settings',
            title: 'Manage listings, leases, approvals, and rent flow without leaving context.',
            description: 'This workspace is shaped around the things landlords actually need every day: portfolio health, agreement movement, review queues, and payment visibility.',
            gradientClassName: 'from-amber-50 via-white to-emerald-50',
            badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700',
            accentSurfaceClassName: 'bg-amber-500/10 text-amber-700',
            primaryAction: attentionCount > 0
                ? { label: 'Open attention queue', href: rejectedListings > 0 || pendingListings > 0 ? '/landlord/properties' : '/landlord/leases' }
                : { label: `Open ${preferredStartPage.label}`, href: preferredStartPage.href },
            summary: [
                { label: 'Portfolio', value: String(propertyCount), helper: liveListings > 0 ? `${liveListings} live ${liveListings === 1 ? 'listing' : 'listings'} ready for renters.` : 'No live listings yet.', icon: Building2, tone: 'accent' },
                { label: 'Pending rent', value: pendingPayments > 0 ? formatCurrency(pendingPayments) : 'Clear', helper: overduePayments > 0 ? `${formatCurrency(overduePayments)} is already overdue.` : 'No urgent rent issues at the moment.', icon: Wallet, tone: pendingPayments > 0 || overduePayments > 0 ? 'warning' : 'default' },
                { label: 'Needs attention', value: String(attentionCount), helper: attentionCount > 0 ? 'Listing approvals or lease approvals are waiting for you.' : `${activeLeases} active ${activeLeases === 1 ? 'lease' : 'leases'} running smoothly.`, icon: ClipboardList, tone: attentionCount > 0 ? 'warning' : 'default' },
            ],
            notifications: [
                { key: 'messages', title: 'Tenant conversations', description: 'Keep responses quick when a renter reaches out or follows up.', icon: Bell },
                { key: 'inquiries', title: 'Inquiry alerts', description: 'Notice new property interest as soon as it comes in.', icon: Search },
                { key: 'leases', title: 'Lease actions', description: 'Surface agreements that are signed by tenants or need the next step.', icon: FileCheck2 },
                { key: 'payments', title: 'Payment tracking', description: 'Highlight pending and overdue rent as your portfolio grows.', icon: Wallet },
                { key: 'approvals', title: 'Approval updates', description: 'Stay aware of property review outcomes and listing changes.', icon: ShieldCheck },
            ],
            workspaceLinks: [
                { title: 'My Properties', description: 'See listing status, approval notes, and portfolio coverage at a glance.', href: '/landlord/properties', meta: `${liveListings} live / ${propertyCount} total`, icon: Building2, tone: 'accent' },
                { title: 'Leases', description: 'Move agreements forward, approve signed contracts, and keep occupancy tidy.', href: '/landlord/leases', meta: leaseActions > 0 ? `${leaseActions} waiting on you` : `${activeLeases} active`, icon: FileCheck2, tone: leaseActions > 0 ? 'warning' : 'default' },
                { title: 'Payments', description: 'Watch collections, pending rent, and anything slipping overdue.', href: '/landlord/payments', meta: overduePayments > 0 ? `${formatCurrency(overduePayments)} overdue` : pendingPayments > 0 ? `${formatCurrency(pendingPayments)} pending` : `${formatCurrency(collectedPayments)} collected`, icon: CreditCard, tone: overduePayments > 0 ? 'danger' : pendingPayments > 0 ? 'warning' : 'default' },
                { title: 'Create Lease', description: 'Start a new agreement quickly when a property is ready to move.', href: '/landlord/leases/new', meta: templateCount > 0 ? `${templateCount} saved template${templateCount === 1 ? '' : 's'}` : 'Start from scratch', icon: FileCheck2 },
                { title: 'Add Property', description: 'Grow your portfolio and keep the listing pipeline moving.', href: '/landlord/properties/new', meta: pendingListings > 0 ? `${pendingListings} in review` : 'Expand your portfolio', icon: House },
            ],
            panel: attentionCount > 0
                ? {
                    title: 'A few landlord operations need attention',
                    description: 'There are leases or listings waiting for a quick review so nothing stalls for tenants.',
                    chips: [`${pendingListings} listings in review`, `${rejectedListings} rejected listings`, `${leaseActions} signed leases waiting`],
                    action: { label: rejectedListings > 0 || pendingListings > 0 ? 'Review properties' : 'Open leases', href: rejectedListings > 0 || pendingListings > 0 ? '/landlord/properties' : '/landlord/leases' },
                }
                : {
                    title: 'Your landlord workspace looks healthy',
                    description: 'Listings, leases, and payments are all in a strong place. Use this page to keep your communication preferences and launch points polished.',
                    chips: [`${liveListings} live listings`, `${activeLeases} active leases`, `${templateCount} templates ready`],
                    action: { label: `Open ${preferredStartPage.label}`, href: preferredStartPage.href },
                },
        }
    }

    const stats = adminStats ?? EMPTY_ADMIN_STATS
    const propertyReviewStats = adminPropertyStats ?? EMPTY_REVIEW_STATS
    const landlordReviewStats = adminVerificationStats ?? EMPTY_REVIEW_STATS
    const reviewQueue = propertyReviewStats.pending + landlordReviewStats.pending

    return {
        badge: 'Admin settings',
        title: 'Keep platform oversight sharp while staying close to the queues that matter most.',
        description: 'Admin tools should reduce scanning and context switching. This layout keeps user management, approval queues, and reporting routes within one focused control room.',
        gradientClassName: 'from-slate-100 via-white to-blue-50',
        badgeClassName: 'border-slate-200 bg-slate-100 text-slate-700',
        accentSurfaceClassName: 'bg-slate-900/5 text-slate-700',
        primaryAction: reviewQueue > 0
            ? { label: 'Review pending queue', href: propertyReviewStats.pending > 0 ? '/admin/property-requests' : '/admin/landlord-requests' }
            : { label: `Open ${preferredStartPage.label}`, href: preferredStartPage.href },
        summary: [
            { label: 'Review queue', value: String(reviewQueue), helper: reviewQueue > 0 ? 'Pending approvals waiting for admin action.' : 'All queues are currently clear.', icon: ClipboardList, tone: reviewQueue > 0 ? 'warning' : 'accent' },
            { label: 'Platform users', value: String(stats.users), helper: `${stats.inquiries} inquiry threads are flowing across the platform.`, icon: UserRound },
            { label: 'Live inventory', value: String(stats.properties), helper: `${stats.leases} approved ${stats.leases === 1 ? 'lease' : 'leases'} are active right now.`, icon: Building2 },
        ],
        notifications: [
            { key: 'reviews', title: 'Review queue alerts', description: 'Surface new property and landlord approvals as soon as they arrive.', icon: ClipboardList },
            { key: 'security', title: 'Security updates', description: 'Keep sensitive admin activity and account-level issues visible.', icon: ShieldCheck },
            { key: 'messages', title: 'Message visibility', description: 'Stay aware of conversations that may need platform intervention.', icon: Bell },
            { key: 'digest', title: 'Operational digest', description: 'Use a summary stream to review the day without living in the dashboard.', icon: Sparkles },
        ],
        workspaceLinks: [
            { title: 'Dashboard', description: 'See the broad health of users, properties, leases, and engagement.', href: '/admin', meta: `${stats.inquiries} inquiries tracked`, icon: LayoutDashboard, tone: 'accent' },
            { title: 'Users', description: 'Manage account access, roles, and verification state from one place.', href: '/admin/users', meta: `${stats.users} total accounts`, icon: UserRound },
            { title: 'Property Requests', description: 'Work through listing approvals before inventory gets stuck.', href: '/admin/property-requests', meta: propertyReviewStats.pending > 0 ? `${propertyReviewStats.pending} pending` : 'Queue is clear', icon: Building2, tone: propertyReviewStats.pending > 0 ? 'warning' : 'default' },
            { title: 'Landlord Requests', description: 'Handle verification queues without losing the application trail.', href: '/admin/landlord-requests', meta: landlordReviewStats.pending > 0 ? `${landlordReviewStats.pending} pending` : 'Queue is clear', icon: ShieldCheck, tone: landlordReviewStats.pending > 0 ? 'warning' : 'default' },
            { title: 'Reports', description: 'Move from raw activity into trends and system-level oversight.', href: '/admin/reports', meta: `${stats.leases} active ${stats.leases === 1 ? 'lease' : 'leases'}`, icon: ChartColumn },
        ],
        panel: reviewQueue > 0
            ? {
                title: 'The admin queue needs a pass',
                description: 'There are outstanding approvals that could block listings or new landlords from moving forward.',
                chips: [`${propertyReviewStats.pending} property approvals`, `${landlordReviewStats.pending} landlord reviews`, `${stats.users} platform users`],
                action: { label: propertyReviewStats.pending > 0 ? 'Open property requests' : 'Open landlord requests', href: propertyReviewStats.pending > 0 ? '/admin/property-requests' : '/admin/landlord-requests' },
            }
            : {
                title: 'Admin queues are in a good place',
                description: 'Use this page to fine-tune how you monitor the platform while your operational queues stay calm.',
                chips: [`${stats.users} platform users`, `${stats.properties} properties`, `${stats.leases} active leases`],
                action: { label: `Open ${preferredStartPage.label}`, href: preferredStartPage.href },
            },
    }
}
