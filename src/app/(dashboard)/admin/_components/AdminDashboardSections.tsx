'use client'

import Link from 'next/link'
import { BadgeCheck, ClipboardCheck, Eye, LifeBuoy, UserRoundCog } from '@/components/ui/icons'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/user-avatar'
import { getPropertyWorkflow } from '@/lib/property-workflow'

import {
    actionButtonClassName,
    dateFormatter,
    formatCompactNumber,
    formatCurrency,
    formatNumber,
    formatPercent,
    roleBadgeClass,
} from '../_lib/admin-dashboard-formatters'
import type { DashboardOverview, DashboardProperty, DashboardUser } from '../_lib/admin-dashboard-types'
import {
    ActionRow,
    ActivityRow,
    DeletePropertyButton,
    InlineBar,
    MetricCell,
    RoleSelector,
    SectionHeader,
    StatRow,
    Surface,
    TrendPill,
} from './AdminDashboardPrimitives'

export function AdminDashboardHero({ overview }: { overview: DashboardOverview }) {
    return (
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
    )
}

export function AdminDashboardFocusPanels({
    overview,
    unresolvedSupport,
    pendingLeaseWork,
}: {
    overview: DashboardOverview
    unresolvedSupport: number
    pendingLeaseWork: number
}) {
    return (
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
    )
}

export function AdminDashboardSystemPanels({ overview }: { overview: DashboardOverview }) {
    return (
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
    )
}

export function AdminDashboardMarketPanels({ overview }: { overview: DashboardOverview }) {
    const topCityMax = overview.topCities[0]?.total ?? 0

    return (
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
                                <InlineBar value={city.total} max={topCityMax || city.total} />
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
    )
}

export function AdminDashboardManagementPanels({
    overview,
    onAssignRole,
    onToggleListing,
    onRemoveProperty,
}: {
    overview: DashboardOverview
    onAssignRole: (userId: DashboardUser['_id'], nextRole: DashboardUser['role']) => Promise<void>
    onToggleListing: (propertyId: DashboardProperty['_id'], isPublished: boolean) => Promise<void>
    onRemoveProperty: (propertyId: DashboardProperty['_id']) => Promise<void>
}) {
    return (
        <section className="grid gap-6 xl:grid-cols-2">
            <div className="space-y-4">
                <SectionHeader label="Manage" title="Users" />
                <Surface>
                    <div className="divide-y divide-black/[0.06]">
                        {overview.users.recent.map((user) => (
                            <div key={user._id} className="flex items-center gap-4 px-5 py-4">
                                <UserAvatar
                                    className="h-10 w-10 ring-1 ring-black/[0.06]"
                                    user={{ name: user.fullName || undefined, email: user.email, avatarUrl: user.avatarUrl || undefined }}
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium text-neutral-950">{user.fullName || 'Unnamed user'}</p>
                                    <p className="truncate text-[13px] text-neutral-500">{user.email}</p>
                                </div>
                                <div className="hidden flex-wrap gap-2 sm:flex">
                                    <Badge className={roleBadgeClass[user.role]}>{user.role}</Badge>
                                    {user.isVerified ? <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Verified</Badge> : null}
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="hidden text-[12px] font-semibold text-neutral-400 lg:inline">
                                        {dateFormatter.format(user.createdAt)}
                                    </span>
                                    {user.role === 'admin' ? (
                                        <span className="rounded-full bg-[#f2f2f7] px-3 py-1.5 text-[12px] font-semibold text-neutral-500">Protected</span>
                                    ) : (
                                        <RoleSelector user={user} onAssignRole={onAssignRole} />
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
                                                <Button size="sm" variant="ghost" className={actionButtonClassName} onClick={() => onToggleListing(property._id, isPublished)}>
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
                                            <DeletePropertyButton title={property.title} onConfirm={() => onRemoveProperty(property._id)} />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </Surface>
            </div>
        </section>
    )
}
