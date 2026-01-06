'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const verificationSchema = z.object({
    id_type: z.enum(['national_id', 'passport', 'drivers_license']),
    id_number: z.string().min(5),
    business_name: z.string().optional(),
    business_registration: z.string().optional(),
})

// Helper to upload a file to Supabase Storage
async function uploadDocument(supabase: any, bucket: string, path: string, file: File) {
    const { error } = await supabase.storage.from(bucket).upload(path, file)
    if (error) throw error
    return path
}

/**
 * Submit landlord verification request
 */
export async function submitVerificationRequest(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const rawData = {
        id_type: formData.get('id_type'),
        id_number: formData.get('id_number'),
        business_name: formData.get('business_name'),
        business_registration: formData.get('business_registration'),
    }

    const idFrontFile = formData.get('id_front') as File
    const idBackFile = formData.get('id_back') as File

    const result = verificationSchema.safeParse(rawData)

    if (!result.success) {
        return { error: result.error.issues[0].message }
    }

    // Validate files
    if (!idFrontFile || idFrontFile.size === 0 || !idBackFile || idBackFile.size === 0) {
        return { error: 'Both ID Front and ID Back images are required.' }
    }

    // Check file size (e.g., max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024
    if (idFrontFile.size > MAX_SIZE || idBackFile.size > MAX_SIZE) {
        return { error: 'Each file must be less than 5MB.' }
    }

    // Check if user already has a pending request
    const { data: existingRequest } = await supabase
        .from('landlord_requests')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single()

    if (existingRequest) {
        return { error: 'You already have a pending verification request.' }
    }

    try {
        const timestamp = Date.now()
        // Upload ID Front
        const idFrontPath = `${user.id}/${timestamp}_front_${idFrontFile.name.replace(/\s+/g, '_')}`
        await uploadDocument(supabase, 'verification_documents', idFrontPath, idFrontFile)

        // Upload ID Back
        const idBackPath = `${user.id}/${timestamp}_back_${idBackFile.name.replace(/\s+/g, '_')}`
        await uploadDocument(supabase, 'verification_documents', idBackPath, idBackFile)

        // Create verification request
        const { error } = await supabase.from('landlord_requests').insert({
            user_id: user.id,
            status: 'pending',
            documents: {
                id_type: result.data.id_type,
                id_number: result.data.id_number,
                business_name: result.data.business_name,
                business_registration: result.data.business_registration,
                id_front_path: idFrontPath,
                id_back_path: idBackPath,
                submitted_at: new Date().toISOString(),
            },
        })

        if (error) {
            console.error('Verification DB Error:', error)
            return { error: 'Failed to submit verification request record' }
        }

        revalidatePath('/become-landlord')
        return { success: true }
    } catch (error) {
        console.error('Verification Upload Error:', error)
        return { error: 'Failed to upload documents. Please try again.' }
    }
}

/**
 * Resubmit landlord verification request after rejection
 * This marks the old rejected request and creates a new pending one
 */
export async function resubmitVerificationRequest(formData: FormData, previousRequestId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const rawData = {
        id_type: formData.get('id_type'),
        id_number: formData.get('id_number'),
        business_name: formData.get('business_name'),
        business_registration: formData.get('business_registration'),
    }

    const idFrontFile = formData.get('id_front') as File
    const idBackFile = formData.get('id_back') as File

    const result = verificationSchema.safeParse(rawData)

    if (!result.success) {
        return { error: result.error.issues[0].message }
    }

    // Validate files
    if (!idFrontFile || idFrontFile.size === 0 || !idBackFile || idBackFile.size === 0) {
        return { error: 'Both ID Front and ID Back images are required.' }
    }

    // Check file size (e.g., max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024
    if (idFrontFile.size > MAX_SIZE || idBackFile.size > MAX_SIZE) {
        return { error: 'Each file must be less than 5MB.' }
    }

    // Verify user owns the previous request and it's rejected
    const { data: previousRequest } = await supabase
        .from('landlord_requests')
        .select('id, status, user_id')
        .eq('id', previousRequestId)
        .eq('user_id', user.id)
        .single()

    if (!previousRequest) {
        return { error: 'Previous request not found.' }
    }

    if (previousRequest.status !== 'rejected') {
        return { error: 'You can only resubmit a rejected application.' }
    }

    // Check if user already has another pending request
    const { data: existingPending } = await supabase
        .from('landlord_requests')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single()

    if (existingPending) {
        return { error: 'You already have a pending verification request.' }
    }

    try {
        const timestamp = Date.now()
        // Upload ID Front
        const idFrontPath = `${user.id}/${timestamp}_front_${idFrontFile.name.replace(/\s+/g, '_')}`
        await uploadDocument(supabase, 'verification_documents', idFrontPath, idFrontFile)

        // Upload ID Back
        const idBackPath = `${user.id}/${timestamp}_back_${idBackFile.name.replace(/\s+/g, '_')}`
        await uploadDocument(supabase, 'verification_documents', idBackPath, idBackFile)

        // Create new verification request with reference to previous
        const { error } = await supabase.from('landlord_requests').insert({
            user_id: user.id,
            status: 'pending',
            documents: {
                id_type: result.data.id_type,
                id_number: result.data.id_number,
                business_name: result.data.business_name,
                business_registration: result.data.business_registration,
                id_front_path: idFrontPath,
                id_back_path: idBackPath,
                submitted_at: new Date().toISOString(),
                previous_request_id: previousRequestId,
                is_resubmission: true,
            },
        })

        if (error) {
            console.error('Resubmit Verification DB Error:', error)
            return { error: 'Failed to submit verification request record' }
        }

        revalidatePath('/become-landlord')
        return { success: true }
    } catch (error) {
        console.error('Resubmit Verification Upload Error:', error)
        return { error: 'Failed to upload documents. Please try again.' }
    }
}

/**
 * Get user's verification status
 */
export async function getVerificationStatus() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: request } = await supabase
        .from('landlord_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    return request
}

/**
 * Admin: Approve verification request
 */
export async function approveVerification(requestId: string) {
    const supabase = await createClient()

    // Get request to find user_id
    const { data: request } = await supabase
        .from('landlord_requests')
        .select('user_id')
        .eq('id', requestId)
        .single()

    if (!request) {
        return { error: 'Request not found' }
    }

    // Update request status
    const { error: requestError } = await supabase
        .from('landlord_requests')
        .update({
            status: 'approved',
            reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId)

    if (requestError) {
        return { error: 'Failed to update request' }
    }

    // Upgrade user role to landlord
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            role: 'landlord',
            is_verified: true
        })
        .eq('id', request.user_id)

    if (profileError) {
        return { error: 'Failed to upgrade user role' }
    }

    revalidatePath('/admin')
    revalidatePath('/admin/landlord-requests')
    return { success: true }
}

/**
 * Admin: Reject verification request
 */
export async function rejectVerification(requestId: string, reason: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('landlord_requests')
        .update({
            status: 'rejected',
            admin_notes: reason,
            reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId)

    if (error) {
        return { error: 'Failed to reject request' }
    }

    revalidatePath('/admin')
    revalidatePath('/admin/landlord-requests')
    return { success: true }
}

/**
 * Admin: Get all pending verification requests
 */
export async function getPendingVerifications() {
    const supabase = await createClient()

    const { data: requests } = await supabase
        .from('landlord_requests')
        .select(`
      *,
      user:profiles!landlord_requests_user_id_fkey(full_name, email, phone)
    `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

    return requests || []
}

/**
 * Admin: Get single request with signed URLs
 */
export async function getAdminRequestById(id: string) {
    const supabase = await createClient()

    const { data: request, error } = await supabase
        .from('landlord_requests')
        .select(`
      *,
      user:profiles!landlord_requests_user_id_fkey(full_name, email, phone, avatar_url)
    `)
        .eq('id', id)
        .single()

    if (error || !request) return null

    // Generate signed URLs for documents
    // The documents column is JSON, we cast it to any to manipulate it safely here
    const documents = request.documents as any

    if (documents?.id_front_path) {
        const { data } = await supabase.storage
            .from('verification_documents')
            .createSignedUrl(documents.id_front_path, 60 * 60) // 1 hour expiry

        if (data?.signedUrl) {
            documents.id_front_url = data.signedUrl
        }
    }

    if (documents?.id_back_path) {
        const { data } = await supabase.storage
            .from('verification_documents')
            .createSignedUrl(documents.id_back_path, 60 * 60) // 1 hour expiry

        if (data?.signedUrl) {
            documents.id_back_url = data.signedUrl
        }
    }

    return { ...request, documents }
}

/**
 * Admin: Get all verification requests with filtering
 */
export async function getAllVerifications(
    status: 'all' | 'pending' | 'approved' | 'rejected' = 'all',
    search: string = ''
) {
    const supabase = await createClient()

    let query = supabase
        .from('landlord_requests')
        .select(`
            *,
            user:profiles!landlord_requests_user_id_fkey(full_name, email, phone)
        `)
        .order('created_at', { ascending: false })

    if (status !== 'all') {
        query = query.eq('status', status)
    }

    const { data: requests } = await query

    // Filter by search term (client-side for simplicity with joined data)
    if (search && requests) {
        const searchLower = search.toLowerCase()
        return requests.filter((req: any) => {
            const userName = req.user?.full_name?.toLowerCase() || ''
            const userEmail = req.user?.email?.toLowerCase() || ''
            const businessName = req.documents?.business_name?.toLowerCase() || ''
            return (
                userName.includes(searchLower) ||
                userEmail.includes(searchLower) ||
                businessName.includes(searchLower)
            )
        })
    }

    return requests || []
}

/**
 * Admin: Get verification statistics
 */
export async function getVerificationStats() {
    const supabase = await createClient()

    const { data: all } = await supabase
        .from('landlord_requests')
        .select('status')

    if (!all) {
        return { total: 0, pending: 0, approved: 0, rejected: 0 }
    }

    const stats = {
        total: all.length,
        pending: all.filter((r) => r.status === 'pending').length,
        approved: all.filter((r) => r.status === 'approved').length,
        rejected: all.filter((r) => r.status === 'rejected').length,
    }

    return stats
}
