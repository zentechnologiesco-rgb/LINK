'use server'

import { createClient } from '@/lib/supabase/server'

export async function getUserInquiries() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return []
    }

    // Determine user role or just fetch where they are either tenant or landlord
    // But we probably want to fetch the "other party" details correctly.

    // Let's fetch all inquiries where user is tenant OR landlord
    const { data: inquiries, error } = await supabase
        .from('inquiries')
        .select(`
            *,
            property:properties(id, title, images, address, price_nad),
            tenant:profiles!inquiries_tenant_id_fkey(id, first_name, surname, full_name, avatar_url, email),
            landlord:profiles!inquiries_landlord_id_fkey(id, first_name, surname, full_name, avatar_url)
        `)
        .or(`tenant_id.eq.${user.id},landlord_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching user inquiries:', error)
        return []
    }

    return inquiries.map((inquiry: any) => {
        // Helper to identify the "other person"
        const isTenant = inquiry.tenant_id === user.id
        const otherParty = isTenant ? inquiry.landlord : inquiry.tenant
        return {
            ...inquiry,
            otherParty,
            isTenant // useful for UI to show "Landlord: ..." or "Tenant: ..."
        }
    })
}
