/**
 * Payment-related hooks for the LINK application
 */

import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

/**
 * Hook to get payments for the current landlord
 */
export function useLandlordPayments() {
    const payments = useQuery(api.payments.getForLandlord, {})
    const stats = useQuery(api.payments.getLandlordStats, {})

    return {
        payments,
        stats,
        isLoading: payments === undefined || stats === undefined,
    }
}

/**
 * Hook to get payments for the current tenant
 */
export function useTenantPayments() {
    const payments = useQuery(api.payments.getForTenant, {})
    const stats = useQuery(api.payments.getTenantStats, {})

    return {
        payments,
        stats,
        isLoading: payments === undefined || stats === undefined,
    }
}

/**
 * Hook to get payments for a specific lease
 */
export function useLeasePayments(leaseId: Id<'leases'> | undefined) {
    const payments = useQuery(
        api.payments.getByLease,
        leaseId ? { leaseId } : 'skip'
    )
    return payments
}

/**
 * Hook for payment mutations
 */
export function usePaymentActions() {
    const recordPayment = useMutation(api.payments.record)

    return {
        recordPayment,
    }
}

/**
 * Hook for deposit-related queries and mutations
 */
export function useDeposits() {
    const landlordDeposits = useQuery(api.deposits.getForLandlord, {})
    const tenantDeposits = useQuery(api.deposits.getForTenant, {})
    const confirmDeposit = useMutation(api.deposits.confirm)
    const releaseDeposit = useMutation(api.deposits.release)
    const forfeitDeposit = useMutation(api.deposits.forfeit)

    return {
        landlordDeposits,
        tenantDeposits,
        confirmDeposit,
        releaseDeposit,
        forfeitDeposit,
    }
}
