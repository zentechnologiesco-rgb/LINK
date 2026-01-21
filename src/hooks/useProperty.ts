/**
 * Property-related hooks for the LINK application
 */

import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

/**
 * Hook to get a single property by ID
 */
export function useProperty(propertyId: Id<'properties'> | undefined) {
    const property = useQuery(
        api.properties.getById,
        propertyId ? { propertyId } : 'skip'
    )
    return property
}

/**
 * Hook to get all properties for the current landlord
 */
export function useLandlordProperties() {
    const properties = useQuery(api.properties.getByLandlord, {})
    return properties
}

/**
 * Hook to check if a property is saved by the current user
 */
/**
 * Hook to check if a property is saved by the current user
 */
export function useIsPropertySaved(propertyId: Id<'properties'>) {
    const isSaved = useQuery(api.savedProperties.isSaved, { propertyId }) ?? false

    return {
        isLoading: false,
        isSaved,
    }
}

/**
 * Hook to get saved properties for the current user
 */
export function useSavedProperties() {
    const savedProperties = useQuery(api.savedProperties.list, {})
    return savedProperties
}

/**
 * Hook for property actions (save/unsave)
 */
export function usePropertyActions() {
    const toggleSave = useMutation(api.savedProperties.toggle)

    return {
        toggleSave,
    }
}
