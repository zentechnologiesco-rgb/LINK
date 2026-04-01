import { getPropertyWorkflow } from '@/lib/property-workflow'

import {
    type FilterTab,
    type LandlordLease,
    type PropertiesPageStats,
    type Property,
    type PropertyCardData,
} from './properties-page-types'

export const RESERVED_LEASE_STATUSES = new Set([
    'draft',
    'sent_to_tenant',
    'tenant_signed',
    'revision_requested',
])

const currency = new Intl.NumberFormat('en-NA', {
    style: 'currency',
    currency: 'NAD',
    maximumFractionDigits: 0,
})

export function formatCurrency(value: number) {
    return currency.format(value || 0)
}

export function buildPropertiesDashboardView({
    properties,
    leases,
    activeTab,
}: {
    properties: Property[] | undefined
    leases: LandlordLease[] | undefined
    activeTab: FilterTab
}) {
    if (!properties) {
        return {
            stats: {
                total: 0,
                live: 0,
                review: 0,
                changes: 0,
                reserved: 0,
                leased: 0,
                offMarket: 0,
            } satisfies PropertiesPageStats,
            filteredProperties: [] as PropertyCardData[],
        }
    }

    const activeLeases = leases?.filter((lease) => lease.status === 'approved') || []
    const reservedLeases = leases?.filter((lease) => RESERVED_LEASE_STATUSES.has(lease.status)) || []

    const activeCounts = new Map<string, number>()
    const reservedCounts = new Map<string, number>()

    activeLeases.forEach((lease) => {
        activeCounts.set(String(lease.propertyId), (activeCounts.get(String(lease.propertyId)) ?? 0) + 1)
    })
    reservedLeases.forEach((lease) => {
        reservedCounts.set(String(lease.propertyId), (reservedCounts.get(String(lease.propertyId)) ?? 0) + 1)
    })

    const propertiesWithWorkflow: PropertyCardData[] = properties.map((property) => {
        const activeLeaseCount = activeCounts.get(String(property._id)) ?? 0
        const reservedLeaseCount = reservedCounts.get(String(property._id)) ?? 0
        return {
            ...property,
            activeLeaseCount,
            reservedLeaseCount,
            workflow: getPropertyWorkflow({
                approvalStatus: property.approvalStatus,
                publicationStatus: property.publicationStatus,
                availableUnitCount: property.availableUnitCount,
                isAvailable: property.isAvailable,
                activeLeaseCount,
                reservedLeaseCount,
            }),
        }
    })

    const stats = {
        total: propertiesWithWorkflow.length,
        live: propertiesWithWorkflow.filter((property) => property.workflow.group === 'live').length,
        review: propertiesWithWorkflow.filter((property) => property.workflow.group === 'review').length,
        changes: propertiesWithWorkflow.filter((property) => property.workflow.group === 'changes').length,
        reserved: propertiesWithWorkflow.filter((property) => property.workflow.group === 'reserved').length,
        leased: propertiesWithWorkflow.filter((property) => property.workflow.group === 'leased').length,
        offMarket: propertiesWithWorkflow.filter((property) => property.workflow.group === 'off_market').length,
    } satisfies PropertiesPageStats

    const filteredProperties =
        activeTab === 'all'
            ? propertiesWithWorkflow
            : propertiesWithWorkflow.filter((property) => property.workflow.group === activeTab)

    return { stats, filteredProperties }
}
