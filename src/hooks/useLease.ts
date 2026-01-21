/**
 * Lease-related hooks for the LINK application
 */

import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

/**
 * Hook to get a single lease by ID
 */
export function useLease(leaseId: Id<'leases'> | undefined) {
    const lease = useQuery(
        api.leases.getById,
        leaseId ? { leaseId } : 'skip'
    )
    return lease
}

/**
 * Hook to get all leases for the current landlord
 */
export function useLandlordLeases() {
    const leases = useQuery(api.leases.getForLandlord, {})
    return leases
}

/**
 * Hook to get all leases for the current tenant
 */
export function useTenantLeases() {
    const leases = useQuery(api.leases.getForTenant, {})
    return leases
}

/**
 * Hook for lease mutations
 */
export function useLeaseActions() {
    const createLease = useMutation(api.leases.create)
    const sendToTenant = useMutation(api.leases.sendToTenant)
    const tenantSign = useMutation(api.leases.tenantSign)
    const landlordDecision = useMutation(api.leases.landlordDecision)
    const requestRevision = useMutation(api.leases.requestRevision)

    return {
        createLease,
        sendToTenant,
        tenantSign,
        landlordDecision,
        requestRevision,
    }
}
