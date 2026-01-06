'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Toggle the saved status of a property for the current user.
 * If saved, removes it. If unique violation (already saved), ignores.
 */
export async function togglePropertySave(propertyId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'You must be logged in to save properties' }
    }

    // Check if propertyId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(propertyId)) {
        return { error: 'Cannot save demo properties. Please try with a real property.' }
    }

    try {
        // Check if already saved
        const { data: existing } = await supabase
            .from('saved_properties')
            .select('id')
            .eq('user_id', user.id)
            .eq('property_id', propertyId)
            .single()

        if (existing) {
            // Unsave
            const { error } = await supabase
                .from('saved_properties')
                .delete()
                .eq('id', existing.id)

            if (error) throw error

            revalidatePath('/properties')
            revalidatePath(`/properties/${propertyId}`)
            revalidatePath('/dashboard/tenant/saved')
            return { saved: false }
        } else {
            // Save
            const { error } = await supabase
                .from('saved_properties')
                .insert({
                    user_id: user.id,
                    property_id: propertyId
                })

            if (error) throw error

            revalidatePath('/properties')
            revalidatePath(`/properties/${propertyId}`)
            revalidatePath('/dashboard/tenant/saved')
            return { saved: true }
        }
    } catch (error) {
        console.error('Toggle Save Application Error:', error)
        return { error: 'Failed to update saved status' }
    }
}

/**
 * Check if a property is saved by the current user
 */
export async function getSavedStatus(propertyId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    // Check if propertyId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(propertyId)) {
        return false
    }

    const { data } = await supabase
        .from('saved_properties')
        .select('id')
        .eq('user_id', user.id)
        .eq('property_id', propertyId)
        .single()

    return !!data
}

/**
 * Get all saved properties for the current user
 */
export async function getSavedProperties() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated', data: [] }

    const { data, error } = await supabase
        .from('saved_properties')
        .select(`
            *,
            property:properties(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Fetch Saved Properties Error:', error)
        return { error: 'Failed to fetch saved properties', data: [] }
    }

    // Flatten the structure to return just the properties
    const properties = data.map(item => item.property)

    return { data: properties, error: null }
}
