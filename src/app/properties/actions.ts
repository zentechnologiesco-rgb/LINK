'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const inquirySchema = z.object({
    property_id: z.string().uuid(),
    message: z.string().min(1, 'Message cannot be empty'),
    phone: z.string().optional(),
    // move_in_date is removed/optional, we'll handle viewing_date manually or append to message
})

export async function createInquiry(formData: FormData) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'You must be logged in to contact the landlord.' }
    }

    let message = formData.get('message') as string;
    const viewingDate = formData.get('viewing_date');

    if (viewingDate && typeof viewingDate === 'string' && viewingDate.trim() !== '') {
        message += `\n\nPreferred Viewing Date: ${viewingDate}`;
    }

    const rawData = {
        property_id: formData.get('property_id'),
        message: message,
        phone: formData.get('phone') || undefined, // Handle null
    }

    const result = inquirySchema.safeParse(rawData)

    if (!result.success) {
        return { error: result.error.issues[0].message }
    }

    // Fetch the property to get the landlord_id
    const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('landlord_id')
        .eq('id', result.data.property_id)
        .single()

    if (propertyError || !property) {
        return { error: 'Property not found.' }
    }

    // Check if an inquiry already exists for this property and tenant
    const { data: existingInquiry } = await supabase
        .from('inquiries')
        .select('id')
        .eq('property_id', result.data.property_id)
        .eq('tenant_id', user.id)
        .single()

    let inquiryId = existingInquiry?.id

    if (!inquiryId) {
        // Create new inquiry
        const { data: newInquiry, error: insertError } = await supabase
            .from('inquiries')
            .insert({
                tenant_id: user.id,
                landlord_id: property.landlord_id,
                property_id: result.data.property_id,
                message: result.data.message, // Initial message context
                status: 'pending',
                // move_in_date: null, // We aren't setting this for viewing requests necessarily
            })
            .select('id')
            .single()

        if (insertError) {
            console.error('Inquiry Error:', insertError)
            return { error: 'Failed to create inquiry. Please try again.' }
        }
        inquiryId = newInquiry.id
    }

    // Insert the message into the messages table
    const { error: messageError } = await supabase.from('messages').insert({
        inquiry_id: inquiryId,
        sender_id: user.id,
        content: result.data.message,
    })

    if (messageError) {
        console.error('Message Error:', messageError)
        return { error: 'Failed to send message. Please try again.' }
    }

    revalidatePath(`/properties/${result.data.property_id}`)
    // Also revalidate chat page
    revalidatePath('/chat')

    return { success: true, inquiryId }
}
