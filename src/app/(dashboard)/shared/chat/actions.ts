'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const messageSchema = z.object({
    inquiry_id: z.string().uuid(),
    content: z.string().min(1, 'Message cannot be empty'),
})

export async function sendMessage(formData: FormData) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'You must be logged in to send a message.' }
    }

    const rawData = {
        inquiry_id: formData.get('inquiry_id'),
        content: formData.get('content'),
    }

    const result = messageSchema.safeParse(rawData)

    if (!result.success) {
        return { error: result.error.issues[0].message }
    }

    const { error } = await supabase.from('messages').insert({
        inquiry_id: result.data.inquiry_id,
        sender_id: user.id,
        content: result.data.content,
    })

    if (error) {
        console.error('Message Error:', error)
        return { error: 'Failed to send message. Please try again.' }
    }

    revalidatePath(`/chat`)
    revalidatePath(`/chat?id=${result.data.inquiry_id}`) // Optional, might not work with query params but worth trying
    // revalidatePath(`/dashboard/landlord/inquiries/${result.data.inquiry_id}`) // Removed
    // revalidatePath(`/dashboard/tenant/inquiries/${result.data.inquiry_id}`) // Removed
    return { success: true }
}

export async function getInquiryMessages(inquiryId: string) {
    const supabase = await createClient()

    const { data: messages } = await supabase
        .from('messages')
        .select(`
      *,
      sender:profiles!messages_sender_id_fkey(full_name, avatar_url)
    `)
        .eq('inquiry_id', inquiryId)
        .order('created_at', { ascending: true })

    return messages || []
}

export async function getInquiryDetails(inquiryId: string) {
    const supabase = await createClient()

    const { data: inquiry } = await supabase
        .from('inquiries')
        .select(`
      *,
      property:properties(id, title, images, price_nad, address),
      tenant:profiles!inquiries_tenant_id_fkey(id, full_name, avatar_url, email),
      landlord:profiles!inquiries_landlord_id_fkey(id, full_name, avatar_url)
    `)
        .eq('id', inquiryId)
        .single()

    return inquiry
}
