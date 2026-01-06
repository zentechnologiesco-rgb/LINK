'use server'

import { createClient } from '@/lib/supabase/server'

export async function getTenantLeases() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return []

    const { data: leases } = await supabase
        .from('leases')
        .select(`
      *,
      property:properties(id, title, address, images),
      landlord:profiles!leases_landlord_id_fkey(id, full_name, email, phone)
    `)
        .eq('tenant_id', user.id)
        .order('created_at', { ascending: false })

    return leases || []
}

export async function getTenantInquiries() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return []

    const { data: inquiries } = await supabase
        .from('inquiries')
        .select(`
      *,
      property:properties(id, title, images, price_nad, address)
    `)
        .eq('tenant_id', user.id)
        .order('created_at', { ascending: false })

    return inquiries || []
}
