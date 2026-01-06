'use server'

import { createClient } from '@/lib/supabase/server'

export async function getLandlordInquiries() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return []

    // Fetch inquiries for properties owned by this landlord
    const { data: inquiries } = await supabase
        .from('inquiries')
        .select(`
      *,
      property:properties(title, image_url:images),
      tenant:profiles!inquiries_tenant_id_fkey(first_name, surname, full_name, email, phone, avatar_url)
    `)
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false })

    return inquiries || []
}
