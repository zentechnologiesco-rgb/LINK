/**
 * Authentication hooks for the LINK application
 */

import { useUser } from '@/components/providers/UserProvider'

/**
 * Hook to get the current authenticated user
 * @returns The current user object or undefined if loading/not authenticated
 */
export function useCurrentUser() {
    const { user } = useUser()
    return user
}

/**
 * Hook to check if the current user has a specific role
 * @param role - The role to check for ('tenant' | 'landlord' | 'admin')
 * @returns Object with loading state and authorization status
 */
export function useHasRole(role: 'tenant' | 'landlord' | 'admin') {
    const { user, isLoading } = useUser()

    return {
        isLoading,
        hasRole: user?.role === role,
        user,
    }
}

/**
 * Hook to check if the user is a landlord
 */
export function useIsLandlord() {
    return useHasRole('landlord')
}

/**
 * Hook to check if the user is a tenant
 */
export function useIsTenant() {
    return useHasRole('tenant')
}

/**
 * Hook to check if the user is an admin
 */
export function useIsAdmin() {
    return useHasRole('admin')
}

/**
 * Hook to check if the user is verified
 */
export function useIsVerified() {
    const { user, isLoading } = useUser()

    return {
        isLoading,
        isVerified: user?.isVerified ?? false,
        user,
    }
}
