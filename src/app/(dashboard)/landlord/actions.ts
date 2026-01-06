'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const propertySchema = z.object({
    title: z.string().min(5),
    description: z.string().min(20),
    property_type: z.enum(['apartment', 'house', 'room', 'commercial', 'studio', 'penthouse']),
    price_nad: z.number().min(0),
    address: z.string().min(5),
    city: z.string().min(2),
    bedrooms: z.number().min(0),
    bathrooms: z.number().min(0),
    size_sqm: z.number().min(0),
    amenities: z.array(z.string()),
    // images: z.array(z.string()).min(1), // TODO: Handle image upload
})

export async function createProperty(formData: FormData) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Parse and validate
    const rawData = {
        title: formData.get('title'),
        description: formData.get('description'),
        property_type: formData.get('property_type'),
        price_nad: Number(formData.get('price_nad')),
        address: formData.get('address'),
        city: formData.get('city'),
        bedrooms: Number(formData.get('bedrooms')),
        bathrooms: Number(formData.get('bathrooms')),
        size_sqm: Number(formData.get('size_sqm')),
        amenities: String(formData.get('amenities')).split(',').filter(Boolean),
    }

    const result = propertySchema.safeParse(rawData)

    if (!result.success) {
        return { error: result.error.message }
    }

    // Parse images from form data (uploaded to Supabase storage)
    let images: string[] = []
    try {
        const imagesJson = formData.get('images')
        if (imagesJson && typeof imagesJson === 'string') {
            images = JSON.parse(imagesJson)
        }
    } catch (e) {
        console.error('Error parsing images:', e)
    }

    if (images.length === 0) {
        return { error: 'Please upload at least one property image' }
    }

    // Parse coordinates from form data (from location picker)
    let coordinates = null
    try {
        const coordsJson = formData.get('coordinates')
        if (coordsJson && typeof coordsJson === 'string' && coordsJson !== 'null') {
            coordinates = JSON.parse(coordsJson)
        }
    } catch (e) {
        console.error('Error parsing coordinates:', e)
        // Default to Windhoek if parsing fails
        coordinates = { lat: -22.5609, lng: 17.0658 }
    }

    const { error } = await supabase.from('properties').insert({
        landlord_id: user.id,
        ...result.data,
        coordinates: coordinates || { lat: -22.5609, lng: 17.0658 },
        images: images,
        utilities_included: [],
        // New properties start as unlisted and pending approval
        is_available: false,
        approval_status: 'pending',
        approval_requested_at: new Date().toISOString(),
    })

    if (error) {
        console.error('Database Error:', error)
        return { error: 'Failed to create property listing' }
    }

    revalidatePath('/landlord/properties')
    redirect('/landlord/properties')
}

/**
 * Toggle property availability status (list/unlist)
 * Only approved properties can be listed
 */
export async function togglePropertyAvailability(propertyId: string, isAvailable: boolean) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Verify ownership and get approval status
    const { data: property } = await supabase
        .from('properties')
        .select('landlord_id, approval_status')
        .eq('id', propertyId)
        .single()

    if (!property || property.landlord_id !== user.id) {
        return { error: 'Property not found or unauthorized' }
    }

    // Only approved properties can be listed
    if (isAvailable && property.approval_status !== 'approved') {
        return { error: 'Property must be approved before it can be listed' }
    }

    const { error } = await supabase
        .from('properties')
        .update({
            is_available: isAvailable,
            updated_at: new Date().toISOString()
        })
        .eq('id', propertyId)

    if (error) {
        return { error: 'Failed to update property availability' }
    }

    revalidatePath('/landlord/properties')
    return { success: true }
}

/**
 * Request property approval from admin
 * For properties that were previously rejected or need re-submission
 */
export async function requestPropertyApproval(propertyId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Verify ownership and current status
    const { data: property } = await supabase
        .from('properties')
        .select('landlord_id, approval_status')
        .eq('id', propertyId)
        .single()

    if (!property || property.landlord_id !== user.id) {
        return { error: 'Property not found or unauthorized' }
    }

    // Only rejected properties can request re-approval
    if (property.approval_status === 'approved') {
        return { error: 'Property is already approved' }
    }

    if (property.approval_status === 'pending') {
        return { error: 'Property is already pending approval' }
    }

    const { error } = await supabase
        .from('properties')
        .update({
            approval_status: 'pending',
            approval_requested_at: new Date().toISOString(),
            admin_notes: null, // Clear previous rejection notes
            updated_at: new Date().toISOString()
        })
        .eq('id', propertyId)

    if (error) {
        return { error: 'Failed to request property approval' }
    }

    revalidatePath('/landlord/properties')
    return { success: true }
}

/**
 * Delete a property
 */
export async function deleteProperty(propertyId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Verify ownership
    const { data: property } = await supabase
        .from('properties')
        .select('landlord_id')
        .eq('id', propertyId)
        .single()

    if (!property || property.landlord_id !== user.id) {
        return { error: 'Property not found or unauthorized' }
    }

    const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId)

    if (error) {
        return { error: 'Failed to delete property' }
    }

    revalidatePath('/landlord/properties')
    return { success: true }
}

/**
 * Get a single property for editing
 */
export async function getPropertyById(propertyId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    const { data: property } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .eq('landlord_id', user.id)
        .single()

    return property
}

/**
 * Update an existing property
 */
export async function updateProperty(propertyId: string, formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Verify ownership
    const { data: existingProperty } = await supabase
        .from('properties')
        .select('landlord_id')
        .eq('id', propertyId)
        .single()

    if (!existingProperty || existingProperty.landlord_id !== user.id) {
        return { error: 'Property not found or unauthorized' }
    }

    // Parse and validate
    const rawData = {
        title: formData.get('title'),
        description: formData.get('description'),
        property_type: formData.get('property_type'),
        price_nad: Number(formData.get('price_nad')),
        address: formData.get('address'),
        city: formData.get('city'),
        bedrooms: Number(formData.get('bedrooms')),
        bathrooms: Number(formData.get('bathrooms')),
        size_sqm: Number(formData.get('size_sqm')),
        amenities: String(formData.get('amenities')).split(',').filter(Boolean),
    }

    const result = propertySchema.safeParse(rawData)

    if (!result.success) {
        return { error: result.error.message }
    }

    // Parse images from form data
    let images: string[] | undefined
    try {
        const imagesJson = formData.get('images')
        if (imagesJson && typeof imagesJson === 'string') {
            images = JSON.parse(imagesJson)
        }
    } catch (e) {
        console.error('Error parsing images:', e)
    }

    // Parse coordinates from form data
    let coordinates: { lat: number; lng: number } | undefined
    try {
        const coordsJson = formData.get('coordinates')
        if (coordsJson && typeof coordsJson === 'string' && coordsJson !== 'null') {
            coordinates = JSON.parse(coordsJson)
        }
    } catch (e) {
        console.error('Error parsing coordinates:', e)
    }

    const updateData: any = {
        ...result.data,
        updated_at: new Date().toISOString()
    }

    // Only update images if provided
    if (images && images.length > 0) {
        updateData.images = images
    }

    // Only update coordinates if provided
    if (coordinates) {
        updateData.coordinates = coordinates
    }

    const { error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', propertyId)

    if (error) {
        console.error('Database Error:', error)
        return { error: 'Failed to update property listing' }
    }

    revalidatePath('/landlord/properties')
    revalidatePath(`/properties/${propertyId}`)
    redirect('/landlord/properties')
}

