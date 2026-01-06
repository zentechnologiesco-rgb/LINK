'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAdminStats() {
    const supabase = await createClient()

    const [
        { count: userCount },
        { count: propertyCount },
        { count: leaseCount },
        { count: inquiryCount },
    ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('leases').select('*', { count: 'exact', head: true }),
        supabase.from('inquiries').select('*', { count: 'exact', head: true }),
    ])

    return {
        users: userCount || 0,
        properties: propertyCount || 0,
        leases: leaseCount || 0,
        inquiries: inquiryCount || 0,
    }
}

export async function getAllUsers() {
    const supabase = await createClient()

    const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

    return users || []
}

export async function getAllProperties() {
    const supabase = await createClient()

    const { data: properties } = await supabase
        .from('properties')
        .select(`
      *,
      landlord:profiles!properties_landlord_id_fkey(full_name, email)
    `)
        .order('created_at', { ascending: false })
        .limit(50)

    return properties || []
}

export async function updateUserRole(userId: string, newRole: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

    if (error) {
        return { error: 'Failed to update user role' }
    }

    revalidatePath('/dashboard/admin')
    return { success: true }
}

export async function togglePropertyAvailability(propertyId: string, isAvailable: boolean) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('properties')
        .update({ is_available: isAvailable })
        .eq('id', propertyId)

    if (error) {
        return { error: 'Failed to update property' }
    }

    revalidatePath('/dashboard/admin')
    return { success: true }
}

export async function deleteProperty(propertyId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId)

    if (error) {
        return { error: 'Failed to delete property' }
    }

    revalidatePath('/dashboard/admin')
    return { success: true }
}
