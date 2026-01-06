'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type PropertyApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface PropertyWithLandlord {
    id: string
    title: string
    property_type: string
    address: string
    city: string
    price_nad: number
    bedrooms: number
    bathrooms: number
    size_sqm: number
    images: string[]
    description: string
    approval_status: PropertyApprovalStatus
    approval_requested_at: string | null
    approved_at: string | null
    admin_notes: string | null
    created_at: string
    landlord: {
        id: string
        full_name: string | null
        email: string
        phone: string | null
        avatar_url: string | null
    }
}

/**
 * Get all property approval requests with optional status filter
 */
export async function getPropertyApprovalRequests(
    statusFilter: 'all' | PropertyApprovalStatus = 'all',
    searchQuery: string = ''
): Promise<PropertyWithLandlord[]> {
    const supabase = await createClient()

    let query = supabase
        .from('properties')
        .select(`
            *,
            landlord:profiles!landlord_id (
                id,
                full_name,
                email,
                phone,
                avatar_url
            )
        `)
        .order('approval_requested_at', { ascending: false, nullsFirst: false })

    if (statusFilter !== 'all') {
        query = query.eq('approval_status', statusFilter)
    }

    if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching property requests:', error)
        return []
    }

    return (data || []) as unknown as PropertyWithLandlord[]
}

/**
 * Get stats for property approval requests
 */
export async function getPropertyApprovalStats() {
    const supabase = await createClient()

    const { data: allProperties, error } = await supabase
        .from('properties')
        .select('approval_status')

    if (error) {
        console.error('Error fetching property stats:', error)
        return { total: 0, pending: 0, approved: 0, rejected: 0 }
    }

    const properties = allProperties || []

    return {
        total: properties.length,
        pending: properties.filter(p => p.approval_status === 'pending').length,
        approved: properties.filter(p => p.approval_status === 'approved').length,
        rejected: properties.filter(p => p.approval_status === 'rejected').length,
    }
}

/**
 * Get a single property by ID for admin review
 */
export async function getPropertyForReview(propertyId: string): Promise<PropertyWithLandlord | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('properties')
        .select(`
            *,
            landlord:profiles!landlord_id (
                id,
                full_name,
                email,
                phone,
                avatar_url
            )
        `)
        .eq('id', propertyId)
        .single()

    if (error) {
        console.error('Error fetching property for review:', error)
        return null
    }

    return data as unknown as PropertyWithLandlord
}

/**
 * Approve a property
 */
export async function approveProperty(propertyId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Verify admin role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'Unauthorized - Admin only' }
    }

    const { error } = await supabase
        .from('properties')
        .update({
            approval_status: 'approved',
            approved_at: new Date().toISOString(),
            admin_notes: null,
            updated_at: new Date().toISOString()
        })
        .eq('id', propertyId)

    if (error) {
        console.error('Error approving property:', error)
        return { error: 'Failed to approve property' }
    }

    revalidatePath('/admin/property-requests')
    revalidatePath('/landlord/properties')
    return { success: true }
}

/**
 * Reject a property with notes
 */
export async function rejectProperty(propertyId: string, notes: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Verify admin role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'Unauthorized - Admin only' }
    }

    if (!notes || notes.trim().length === 0) {
        return { error: 'Rejection reason is required' }
    }

    const { error } = await supabase
        .from('properties')
        .update({
            approval_status: 'rejected',
            admin_notes: notes.trim(),
            updated_at: new Date().toISOString()
        })
        .eq('id', propertyId)

    if (error) {
        console.error('Error rejecting property:', error)
        return { error: 'Failed to reject property' }
    }

    revalidatePath('/admin/property-requests')
    revalidatePath('/landlord/properties')
    return { success: true }
}
