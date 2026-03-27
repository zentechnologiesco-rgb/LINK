'use client'

import Link from 'next/link'
import type { ElementType, ReactNode } from 'react'
import { useMutation, useQuery } from 'convex/react'
import {
    ArrowRight,
    BadgeCheck,
    ClipboardCheck,
    Eye,
    LifeBuoy,
    Shield,
    Trash2,
    TrendingDown,
    TrendingUp,
    UserRoundCog,
} from 'lucide-react'
import { toast } from 'sonner'

import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { UserAvatar } from '@/components/ui/user-avatar'
import { getPropertyWorkflow } from '@/lib/property-workflow'
import { cn } from '@/lib/utils'

type Trend = {
    delta: number
    direction: 'up' | 'down' | 'flat'
}

type DashboardUser = {
    _id: Id<'users'>
    fullName?: string | null
    email: string
    role: 'tenant' | 'landlord' | 'admin'
    isVerified: boolean
    avatarUrl?: string | null
    createdAt: number
}

type DashboardProperty = {
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

type DashboardOverview = {
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

const numberFormatter = new Intl.NumberFormat('en-NA')
const compactNumberFormatter = new Intl.NumberFormat('en-NA', { notation: 'compact', maximumFractionDigits: 1 })
const currencyFormatter = new Intl.NumberFormat('en-NA', { style: 'currency', currency: 'NAD', maximumFractionDigits: 0 })
const dateFormatter = new Intl.DateTimeFormat('en-NA', { dateStyle: 'medium' })
const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

const surfaceClassName = 'overflow-hidden rounded-[30px] bg-[#ffffff] shadow-[0_12px_32px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.04]'
const actionButtonClassName = 'h-8 rounded-full bg-[#f2f2f7] px-3 text-[13px] font-semibold text-[#111827] hover:bg-[#e9e9ef]'

const roleBadgeClass = {
    tenant: 'border-blue-200 bg-blue-50 text-blue-700',
    landlord: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    admin: 'border-violet-200 bg-violet-50 text-violet-700',
} as const

function formatNumber(value: number) {
    return numberFormatter.format(value)
}

function formatCompactNumber(value: number) {
    return compactNumberFormatter.format(value)
}

function formatCurrency(value: number) {
    return currencyFormatter.format(value)
}

function formatPercent(value: number) {
    return `${numberFormatter.format(value)}%`
}

function formatRelativeTime(timestamp: number) {
    const minutes = Math.round((timestamp - Date.now()) / (1000 * 60))
    if (Math.abs(minutes) < 1) return 'Just now'
    if (Math.abs(minutes) < 60) return relativeTimeFormatter.format(minutes, 'minute')
    const hours = Math.round(minutes / 60)
    if (Math.abs(hours) < 24) return relativeTimeFormatter.format(hours, 'hour')
    return relativeTimeFormatter.format(Math.round(hours / 24), 'day')
}

function Surface({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn(surfaceClassName, className)}>{children}</div>
}

function SectionHeader({ label, title, trailing }: { label: string; title: string; trailing?: ReactNode }) {
    return (
        <div className="flex items-end justify-between gap-4">
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-400">{label}</p>
                <h2 className="mt-2 text-[30px] font-semibold tracking-[-0.05em] text-neutral-950">{title}</h2>
            </div>
            {trailing}
        </div>
    )
}

function TrendPill({ trend, label }: { trend: Trend; label: string }) {
    const Icon = trend.direction === 'down' ? TrendingDown : TrendingUp
    const tone =
        trend.direction === 'up'
            ? 'bg-emerald-50 text-emerald-700'
            : trend.direction === 'down'
                ? 'bg-red-50 text-red-700'
                : 'bg-[#f2f2f7] text-neutral-500'

    return (
        <span className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold', tone)}>
            {trend.direction === 'flat' ? null : <Icon className="h-3.5 w-3.5" />}
            {trend.delta === 0 ? `Flat ${label}` : `${trend.delta > 0 ? '+' : '−'}${formatNumber(Math.abs(trend.delta))} ${label}`}
        </span>
    )
}

function MetricCell({ label, value, meta }: { label: string; value: string; meta: string }) {
    return (
        <div className="px-5 py-5 sm:px-6">
            <p className="text-[12px] font-medium text-neutral-500">{label}</p>
            <p className="mt-2 text-[32px] font-semibold tracking-[-0.05em] text-neutral-950 tabular-nums">{value}</p>
            <p className="mt-1 text-[13px] text-neutral-500">{meta}</p>
        </div>
    )
}

function ActionRow({ href, icon: Icon, title, meta }: { href: string; icon: ElementType; title: string; meta: string }) {
    return (
        <Link href={href} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f2f7] text-neutral-700">
                <Icon className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="font-semibold text-neutral-950">{title}</p>
                <p className="text-[13px] text-neutral-500">{meta}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-neutral-300 transition-transform group-hover:translate-x-0.5" />
        </Link>
    )
}

function StatRow({
    label,
    value,
    meta,
    tone = 'default',
}: {
    label: string
    value: string
    meta?: string
    tone?: 'default' | 'warning' | 'danger'
}) {
    const valueTone = tone === 'danger' ? 'text-red-600' : tone === 'warning' ? 'text-amber-600' : 'text-neutral-950'

    return (
        <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
                <p className="font-medium text-neutral-900">{label}</p>
                {meta ? <p className="text-[13px] text-neutral-500">{meta}</p> : null}
            </div>
            <p className={cn('shrink-0 text-[17px] font-semibold tabular-nums', valueTone)}>{value}</p>
        </div>
    )
}

function InlineBar({ value, max }: { value: number; max: number }) {
    return (
        <div className="mt-2 h-1.5 rounded-full bg-[#eef0f4]">
            <div className="h-full rounded-full bg-neutral-900/80" style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }} />
        </div>
    )
}

function ActivityRow({ item }: { item: DashboardOverview['recentActivity'][number] }) {
    const row = (
        <div className="px-5 py-4 transition-colors hover:bg-black/[0.02]">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="font-medium text-neutral-950">{item.label}</p>
                    <p className="truncate text-[13px] text-neutral-500">{item.targetLabel}</p>
                </div>
                <span className="shrink-0 text-[12px] font-medium text-neutral-400">{formatRelativeTime(item.timestamp)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-[12px] text-neutral-400">
                <span className="truncate">{item.adminName}</span>
                <span>{dateFormatter.format(item.timestamp)}</span>
            </div>
            {item.detail ? <p className="mt-2 text-[13px] text-neutral-500">{item.detail}</p> : null}
        </div>
    )

    return item.href ? <Link href={item.href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{row}</Link> : row
}

function DeletePropertyButton({ title, onConfirm }: { title: string; onConfirm: () => Promise<void> }) {
    return (
        <ConfirmDialog
            title="Delete Property"
            description={`Delete "${title}" from the platform.`}
            confirmText="Delete"
            variant="destructive"
            onConfirm={onConfirm}
            trigger={
                <Button size="sm" variant="ghost" className="h-8 w-8 rounded-full bg-[#fff1f2] p-0 text-red-600 hover:bg-[#ffe4e6]" aria-label={`Delete ${title}`}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            }
        />
    )
}

function RoleSelector({
    user,
    onAssignRole,
}: {
    user: DashboardUser
    onAssignRole: (userId: Id<'users'>, nextRole: DashboardUser['role']) => Promise<void>
}) {
    const roles: DashboardUser['role'][] = ['tenant', 'landlord', 'admin']

    return (
        <div className="flex flex-wrap gap-1 rounded-full bg-[#f2f2f7] p-1">
            {roles.map((role) => {
                const isActive = user.role === role

                return (
                    <Button
                        key={role}
                        size="sm"
                        variant="ghost"
                        className={cn(
                            'h-7 rounded-full px-3 text-[12px] font-semibold capitalize',
                            isActive
                                ? 'bg-white text-neutral-950 shadow-[0_1px_2px_rgba(15,23,42,0.08)]'
                                : 'text-neutral-500 hover:bg-white/70 hover:text-neutral-900'
                        )}
                        disabled={isActive}
                        onClick={() => onAssignRole(user._id, role)}
                    >
                        {role}
                    </Button>
                )
            })}
        </div>
    )
}

function AdminDashboardContent() {
    const overview = useQuery(api.admin.getDashboardOverview) as DashboardOverview | null | undefined
    const updateUserRole = useMutation(api.admin.updateUserRole)
    const togglePropertyAvailability = useMutation(api.admin.togglePropertyAvailability)
    const deleteProperty = useMutation(api.admin.deleteProperty)

    if (overview === undefined) {
        return <div className="p-6 lg:p-8">Loading…</div>
    }

    if (!overview) {
        return (
            <div className="p-6 lg:p-8">
                <div className="mx-auto max-w-xl text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/[0.05]">
                        <Shield className="h-7 w-7 text-neutral-400" />
                    </div>
                    <h1 className="mt-6 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">Access denied</h1>
                    <p className="mt-2 text-neutral-500">Admin access is required.</p>
                    <Button asChild className="mt-6 rounded-full">
                        <Link href="/">Return home</Link>
                    </Button>
                </div>
            </div>
        )
    }

    const pendingLeaseWork = overview.leases.sent_to_tenant + overview.leases.tenant_signed + overview.leases.revision_requested
    const unresolvedSupport = overview.engagement.support.open + overview.engagement.support.pending

    const assignRole = async (userId: Id<'users'>, nextRole: DashboardUser['role']) => {
        try {
            await updateUserRole({ userId, role: nextRole })
            toast.success(`User updated to ${nextRole}`)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not update role')
        }
    }

    const toggleListing = async (propertyId: Id<'properties'>, isPublished: boolean) => {
        try {
            await togglePropertyAvailability({ propertyId, isAvailable: !isPublished })
            toast.success(isPublished ? 'Listing hidden' : 'Listing published')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not update listing')
        }
    }

    const removeProperty = async (propertyId: Id<'properties'>) => {
        try {
            await deleteProperty({ propertyId })
            toast.success('Property deleted')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not delete property')
        }
    }

    return (
        <div className="bg-[#ffffff] font-[var(--font-apple-ui)] text-[#111827]">
            <div className="mx-auto max-w-[1360px] space-y-10 px-4 pb-24 pt-6 sm:px-6 lg:px-8">
                <header className="space-y-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-400">Admin</p>
                            <h1 className="mt-2 text-[42px] font-semibold tracking-[-0.06em] text-neutral-950">Overview</h1>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Badge className="border-amber-200 bg-amber-50 text-amber-700">{formatNumber(overview.moderation.pendingPropertyRequests)} reviews</Badge>
                            <Badge className="border-blue-200 bg-blue-50 text-blue-700">{formatNumber(overview.moderation.pendingLandlordRequests)} verifications</Badge>
                            <Badge className="border-red-200 bg-red-50 text-red-700">{formatCurrency(overview.finances.amounts.overdue)} overdue</Badge>
                            <Badge className="border-neutral-200 bg-white text-neutral-700">{formatNumber(overview.engagement.support.urgent)} urgent</Badge>
                        </div>
                    </div>

                    <Surface>
                        <div className="grid divide-black/[0.06] sm:grid-cols-2 sm:divide-x xl:grid-cols-4">
                            <MetricCell label="Attention" value={formatNumber(overview.headline.queuesNeedingAttention)} meta="Reviews, support, overdue" />
                            <MetricCell label="Live" value={formatNumber(overview.headline.liveListings)} meta={`${formatNumber(overview.properties.published)} published`} />
                            <MetricCell label="Collection" value={formatPercent(overview.headline.collectionRate)} meta={`${formatCurrency(overview.finances.amounts.paid)} paid`} />
                            <MetricCell label="Occupancy" value={formatPercent(overview.headline.occupancyRate)} meta={`${formatNumber(overview.inventory.occupiedUnits)} of ${formatNumber(overview.inventory.totalUnits)} units`} />
                        </div>
                    </Surface>
                </header>

                <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                    <div className="space-y-4">
                        <SectionHeader label="Focus" title="Shortcuts" />
                        <Surface>
                            <div className="divide-y divide-black/[0.06]">
                                <ActionRow href="/admin/property-requests?status=pending" icon={ClipboardCheck} title="Property Requests" meta={`${formatNumber(overview.moderation.pendingPropertyRequests)} waiting`} />
                                <ActionRow href="/admin/landlord-requests?status=pending" icon={BadgeCheck} title="Landlord Requests" meta={`${formatNumber(overview.moderation.pendingLandlordRequests)} waiting`} />
                                <ActionRow href="/admin/users" icon={UserRoundCog} title="Users" meta={`${formatNumber(overview.users.total)} accounts`} />
                                <ActionRow href="/chat" icon={LifeBuoy} title="Support" meta={`${formatNumber(unresolvedSupport)} unresolved`} />
                            </div>
                        </Surface>
                    </div>

                    <div className="space-y-4">
                        <SectionHeader label="Focus" title="Queues" trailing={<TrendPill trend={overview.properties.trend} label="new listings" />} />
                        <Surface>
                            <div className="divide-y divide-black/[0.06]">
                                <StatRow label="Property review" value={formatNumber(overview.moderation.pendingPropertyRequests)} tone={overview.moderation.pendingPropertyRequests > 0 ? 'warning' : 'default'} />
                                <StatRow label="Landlord review" value={formatNumber(overview.moderation.pendingLandlordRequests)} tone={overview.moderation.pendingLandlordRequests > 0 ? 'warning' : 'default'} />
                                <StatRow label="Urgent support" value={formatNumber(overview.engagement.support.urgent)} tone={overview.engagement.support.urgent > 0 ? 'danger' : 'default'} />
                                <StatRow label="Overdue payments" value={formatCurrency(overview.finances.amounts.overdue)} meta={`${formatNumber(overview.finances.counts.overdue)} items`} tone={overview.finances.amounts.overdue > 0 ? 'danger' : 'default'} />
                                <StatRow label="Lease work" value={formatNumber(pendingLeaseWork)} />
                            </div>
                        </Surface>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-3">
                    <div className="space-y-4">
                        <SectionHeader label="System" title="Money" />
                        <Surface>
                            <div className="divide-y divide-black/[0.06]">
                                <StatRow label="Collected" value={formatCurrency(overview.finances.amounts.paid)} />
                                <StatRow label="Pending" value={formatCurrency(overview.finances.amounts.pending)} tone={overview.finances.amounts.pending > 0 ? 'warning' : 'default'} />
                                <StatRow label="Overdue" value={formatCurrency(overview.finances.amounts.overdue)} tone={overview.finances.amounts.overdue > 0 ? 'danger' : 'default'} />
                                <StatRow label="Deposits held" value={formatCurrency(overview.finances.deposits.amounts.held)} />
                                <StatRow label="Deposits pending" value={formatCurrency(overview.finances.deposits.amounts.pending)} />
                            </div>
                        </Surface>
                    </div>

                    <div className="space-y-4">
                        <SectionHeader label="System" title="Platform" trailing={<TrendPill trend={overview.users.trend} label="new users" />} />
                        <Surface>
                            <div className="divide-y divide-black/[0.06]">
                                <StatRow label="Users" value={formatNumber(overview.users.total)} meta={`${formatPercent(overview.users.verifiedRate)} verified`} />
                                <StatRow label="Live listings" value={formatNumber(overview.properties.live)} />
                                <StatRow label="Hidden listings" value={formatNumber(overview.properties.offMarket)} />
                                <StatRow label="Featured" value={formatNumber(overview.properties.featured)} />
                                <StatRow label="No vacancy" value={formatNumber(overview.properties.noVacancy)} />
                                <StatRow label="Open units" value={formatNumber(overview.inventory.availableUnits)} meta={`${formatPercent(overview.inventory.occupancyRate)} occupied`} />
                            </div>
                        </Surface>
                    </div>

                    <div className="space-y-4">
                        <SectionHeader label="System" title="Signals" />
                        <Surface>
                            <div className="divide-y divide-black/[0.06]">
                                <StatRow label="Inquiries" value={formatNumber(overview.engagement.inquiries.total)} meta={`${formatNumber(overview.engagement.inquiries.pending)} pending`} />
                                <StatRow label="Messages" value={formatCompactNumber(overview.engagement.messages.total)} />
                                <StatRow label="Unread support" value={formatNumber(overview.engagement.messages.unreadSupportMessages)} />
                                <StatRow label="Saved homes" value={formatNumber(overview.engagement.savedProperties)} />
                                <StatRow label="Recent views" value={formatCompactNumber(overview.engagement.recentlyViewed)} />
                                <StatRow label="Announcements" value={formatNumber(overview.engagement.announcements.active)} />
                            </div>
                        </Surface>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-4">
                        <SectionHeader label="Market" title="Demand" />
                        <Surface>
                            <div className="px-5 py-5">
                                <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-neutral-400">Top Listings</p>
                            </div>
                            <div className="divide-y divide-black/[0.06]">
                                {overview.properties.topProperties.map((property) => (
                                    <div key={property._id} className="px-5 py-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-neutral-950">{property.title}</p>
                                                <p className="text-[13px] text-neutral-500">{property.city}</p>
                                            </div>
                                            <span className="shrink-0 text-[13px] font-semibold text-neutral-900">{formatNumber(property.availableUnitCount)} open</span>
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2 text-[12px] text-neutral-500">
                                            <span>{formatNumber(property.viewCount)} views</span>
                                            <span>{formatNumber(property.saveCount)} saves</span>
                                            <span>{formatCurrency(property.priceNad ?? 0)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-black/[0.06] px-5 py-5">
                                <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-neutral-400">Top Cities</p>
                            </div>
                            <div className="divide-y divide-black/[0.06]">
                                {overview.topCities.map((city) => (
                                    <div key={city.city} className="px-5 py-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="font-medium text-neutral-950">{city.city}</p>
                                                <p className="text-[13px] text-neutral-500">{formatNumber(city.live)} live • {formatNumber(city.pending)} pending</p>
                                            </div>
                                            <span className="text-[17px] font-semibold tabular-nums text-neutral-950">{formatNumber(city.total)}</span>
                                        </div>
                                        <InlineBar value={city.total} max={overview.topCities[0]?.total ?? city.total} />
                                    </div>
                                ))}
                            </div>
                        </Surface>
                    </div>

                    <div className="space-y-4">
                        <SectionHeader label="Market" title="Activity" />
                        <Surface>
                            <div className="divide-y divide-black/[0.06]">
                                {overview.recentActivity.map((item) => (
                                    <ActivityRow key={item._id} item={item} />
                                ))}
                            </div>
                        </Surface>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                    <div className="space-y-4">
                        <SectionHeader label="Manage" title="Users" />
                        <Surface>
                            <div className="divide-y divide-black/[0.06]">
                                {overview.users.recent.map((user) => (
                                    <div key={user._id} className="flex items-center gap-4 px-5 py-4">
                                        <UserAvatar className="h-10 w-10 ring-1 ring-black/[0.06]" user={{ name: user.fullName || undefined, email: user.email, avatarUrl: user.avatarUrl || undefined }} />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium text-neutral-950">{user.fullName || 'Unnamed user'}</p>
                                            <p className="truncate text-[13px] text-neutral-500">{user.email}</p>
                                        </div>
                                        <div className="hidden flex-wrap gap-2 sm:flex">
                                            <Badge className={roleBadgeClass[user.role]}>{user.role}</Badge>
                                            {user.isVerified ? <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Verified</Badge> : null}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="hidden text-[12px] font-semibold text-neutral-400 lg:inline">{dateFormatter.format(user.createdAt)}</span>
                                            {user.role === 'admin' ? (
                                                <span className="rounded-full bg-[#f2f2f7] px-3 py-1.5 text-[12px] font-semibold text-neutral-500">Protected</span>
                                            ) : (
                                                <RoleSelector user={user} onAssignRole={assignRole} />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Surface>
                    </div>

                    <div className="space-y-4">
                        <SectionHeader label="Manage" title="Listings" trailing={<TrendPill trend={overview.properties.trend} label="new listings" />} />
                        <Surface>
                            <div className="divide-y divide-black/[0.06]">
                                {overview.properties.recent.map((property) => {
                                    const workflow = getPropertyWorkflow({
                                        approvalStatus: property.approvalStatus,
                                        publicationStatus: property.publicationStatus,
                                        availableUnitCount: property.availableUnitCount,
                                        isAvailable: property.isAvailable,
                                        activeLeaseCount: property.activeLeaseCount,
                                        reservedLeaseCount: property.reservedLeaseCount,
                                    })
                                    const isPublished = property.publicationStatus === 'published'

                                    return (
                                        <div key={property._id} className="px-5 py-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium text-neutral-950">{property.title}</p>
                                                    <p className="truncate text-[13px] text-neutral-500">{property.city} • {property.landlord?.fullName || property.landlord?.email || 'Unknown landlord'}</p>
                                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                                        <Badge className={workflow.badgeClassName}>{workflow.label}</Badge>
                                                        <span className="text-[12px] text-neutral-500">{formatNumber(property.viewCount)} views</span>
                                                        <span className="text-[12px] text-neutral-500">{formatNumber(property.saveCount)} saves</span>
                                                    </div>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-2">
                                                    {property.approvalStatus === 'approved' ? (
                                                        <Button size="sm" variant="ghost" className={actionButtonClassName} onClick={() => toggleListing(property._id, isPublished)}>
                                                            {isPublished ? 'Hide' : 'Publish'}
                                                        </Button>
                                                    ) : (
                                                        <Button asChild size="sm" variant="ghost" className={actionButtonClassName}>
                                                            <Link href={`/admin/property-requests/${property._id}`}>
                                                                <Eye className="h-4 w-4" />
                                                                {property.approvalStatus === 'pending' ? 'Review' : 'View'}
                                                            </Link>
                                                        </Button>
                                                    )}
                                                    <DeletePropertyButton title={property.title} onConfirm={() => removeProperty(property._id)} />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </Surface>
                    </div>
                </section>
            </div>
        </div>
    )
}

export default function AdminDashboard() {
    return <AdminDashboardContent />
}
