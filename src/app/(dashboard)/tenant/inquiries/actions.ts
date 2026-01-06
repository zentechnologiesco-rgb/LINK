'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getTenantInquiries() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return []
    }

    const { data: inquiries, error } = await supabase
        .from('inquiries')
        .select(`
            *,
            property:properties(id, title, images, address, price_nad),
            landlord:profiles!inquiries_landlord_id_fkey(first_name, surname, full_name, avatar_url)
        `)
        .eq('tenant_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching tenant inquiries:', error)
        return []
    }

    return inquiries
}
