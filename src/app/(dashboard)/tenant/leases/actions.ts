'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Get all tenant leases
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
            property:properties(id, title, address, city, images, price_nad),
            landlord:profiles!leases_landlord_id_fkey(id, first_name, surname, full_name, email, phone, avatar_url)
        `)
        .eq('tenant_id', user.id)
        .order('created_at', { ascending: false })

    return leases || []
}

// Get single lease for tenant
export async function getTenantLeaseById(leaseId: string) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: lease } = await supabase
        .from('leases')
        .select(`
            *,
            property:properties(id, title, address, city, images, price_nad),
            landlord:profiles!leases_landlord_id_fkey(id, first_name, surname, full_name, email, phone, avatar_url),
            tenant:profiles!leases_tenant_id_fkey(id, first_name, surname, full_name, email, phone, avatar_url)
        `)
        .eq('id', leaseId)
        .eq('tenant_id', user.id)
        .single()

    return lease
}

// Submit signed lease with documents
export async function submitSignedLease(data: {
    leaseId: string
    signature: string
    documents: Array<{
        type: string
        url: string
        name: string
        uploaded_at: string
    }>
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Verify this lease belongs to the tenant
    const { data: lease } = await supabase
        .from('leases')
        .select('id, status')
        .eq('id', data.leaseId)
        .eq('tenant_id', user.id)
        .in('status', ['sent_to_tenant', 'revision_requested'])
        .single()

    if (!lease) {
        return { error: 'Lease not found or cannot be signed.' }
    }

    // Validate required documents (at least ID front and back)
    const hasIdFront = data.documents.some(d => d.type === 'id_front')
    const hasIdBack = data.documents.some(d => d.type === 'id_back')

    if (!hasIdFront || !hasIdBack) {
        return { error: 'Please upload ID front and back before signing.' }
    }

    if (!data.signature) {
        return { error: 'Please sign the lease before submitting.' }
    }

    // Update lease with signature and documents
    const { error } = await supabase
        .from('leases')
        .update({
            tenant_signature_data: data.signature,
            tenant_documents: data.documents,
            status: 'tenant_signed',
            signed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', data.leaseId)
        .eq('tenant_id', user.id)

    if (error) {
        console.error('Submit Error:', error)
        return { error: 'Failed to submit signed lease.' }
    }

    // TODO: Send email notification to landlord

    revalidatePath('/tenant/leases')
    revalidatePath(`/tenant/leases/${data.leaseId}`)
    return { success: true }
}

// Upload a document for a lease
export async function uploadLeaseDocument(
    leaseId: string,
    documentData: {
        type: string
        url: string
        name: string
        uploaded_at: string
    }
) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Get current documents
    const { data: lease } = await supabase
        .from('leases')
        .select('tenant_documents')
        .eq('id', leaseId)
        .eq('tenant_id', user.id)
        .single()

    if (!lease) {
        return { error: 'Lease not found.' }
    }

    const currentDocs = (lease.tenant_documents as any[]) || []

    // Remove existing document of same type
    const filteredDocs = currentDocs.filter(d => d.type !== documentData.type)
    filteredDocs.push(documentData)

    // Update lease with new documents
    const { error } = await supabase
        .from('leases')
        .update({
            tenant_documents: filteredDocs,
            updated_at: new Date().toISOString(),
        })
        .eq('id', leaseId)
        .eq('tenant_id', user.id)

    if (error) {
        console.error('Document Upload Error:', error)
        return { error: 'Failed to save document.' }
    }

    revalidatePath(`/tenant/leases/${leaseId}`)
    return { success: true, documents: filteredDocs }
}
