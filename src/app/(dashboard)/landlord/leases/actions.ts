'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Schema for creating a draft lease
const createLeaseSchema = z.object({
    property_id: z.string().uuid(),
    tenant_id: z.string().uuid().optional(),
    tenant_email: z.string().email().optional(),
    start_date: z.string(),
    end_date: z.string(),
    monthly_rent: z.number().min(0),
    deposit: z.number().min(0),
    lease_document: z.any().optional(),
})

// Get landlord's properties for lease creation
export async function getLandlordProperties() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return []

    const { data: properties } = await supabase
        .from('properties')
        .select('id, title, address, city, images, price_nad, is_available')
        .eq('landlord_id', user.id)
        .eq('is_available', true)
        .order('created_at', { ascending: false })

    return properties || []
}

// Create a draft lease
export async function createDraftLease(data: {
    property_id: string
    tenant_email?: string
    start_date: string
    end_date: string
    monthly_rent: number
    deposit: number
    lease_document?: any
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Find tenant by email if provided
    let tenantId = null
    if (data.tenant_email) {
        const { data: tenant } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', data.tenant_email)
            .single()

        if (tenant) {
            tenantId = tenant.id
        }
    }

    // Insert lease as draft
    const { data: lease, error } = await supabase
        .from('leases')
        .insert({
            property_id: data.property_id,
            tenant_id: tenantId,
            landlord_id: user.id,
            start_date: data.start_date,
            end_date: data.end_date,
            monthly_rent: data.monthly_rent,
            deposit: data.deposit,
            lease_document: data.lease_document || null,
            status: 'draft',
        })
        .select()
        .single()

    if (error) {
        console.error('Lease Error:', error)
        return { error: 'Failed to create lease. Please try again.' }
    }

    revalidatePath('/landlord/leases')
    return { success: true, leaseId: lease.id }
}

// Update lease document content
export async function updateLeaseDocument(leaseId: string, leaseDocument: any) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('leases')
        .update({
            lease_document: leaseDocument,
            updated_at: new Date().toISOString(),
        })
        .eq('id', leaseId)
        .eq('landlord_id', user.id)
        .eq('status', 'draft')

    if (error) {
        console.error('Update Error:', error)
        return { error: 'Failed to update lease document.' }
    }

    revalidatePath(`/landlord/leases/${leaseId}`)
    return { success: true }
}

// Send lease to tenant for review
export async function sendLeaseToTenant(leaseId: string, tenantEmail: string) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Find tenant by email
    const { data: tenant } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('email', tenantEmail)
        .single()

    if (!tenant) {
        return { error: 'Tenant not found. Please ensure they have an account.' }
    }

    // Update lease status and assign tenant
    const { error } = await supabase
        .from('leases')
        .update({
            tenant_id: tenant.id,
            status: 'sent_to_tenant',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', leaseId)
        .eq('landlord_id', user.id)
        .in('status', ['draft', 'revision_requested'])

    if (error) {
        console.error('Send Error:', error)
        return { error: 'Failed to send lease to tenant.' }
    }

    // TODO: Send email notification to tenant

    revalidatePath('/landlord/leases')
    revalidatePath(`/landlord/leases/${leaseId}`)
    return { success: true, tenantName: tenant.full_name }
}

// Approve lease and unlist property
export async function approveLease(leaseId: string, landlordSignature?: string, notes?: string) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Get lease details
    const { data: lease, error: leaseError } = await supabase
        .from('leases')
        .select('*, property_id, tenant_id')
        .eq('id', leaseId)
        .eq('landlord_id', user.id)
        .eq('status', 'tenant_signed')
        .single()

    if (leaseError || !lease) {
        return { error: 'Lease not found or cannot be approved.' }
    }

    // Update lease to approved
    const { error: updateError } = await supabase
        .from('leases')
        .update({
            status: 'approved',
            landlord_signature_data: landlordSignature || null,
            landlord_notes: notes || null,
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', leaseId)

    if (updateError) {
        console.error('Approve Error:', updateError)
        return { error: 'Failed to approve lease.' }
    }

    // Unlist the property
    const { error: propertyError } = await supabase
        .from('properties')
        .update({
            is_available: false,
            updated_at: new Date().toISOString(),
        })
        .eq('id', lease.property_id)

    if (propertyError) {
        console.error('Property Update Error:', propertyError)
        // Don't fail the lease approval, just log the error
    }

    // Generate payment records (first month rent)
    const payments = [
        {
            lease_id: leaseId,
            amount: lease.monthly_rent,
            type: 'rent',
            status: 'pending',
            due_date: lease.start_date,
        },
    ]

    await supabase.from('payments').insert(payments)

    // Create deposit escrow record (separate from payments - held by platform)
    if (lease.deposit && lease.deposit > 0 && lease.tenant_id) {
        const { error: depositError } = await supabase
            .from('deposits')
            .insert({
                lease_id: leaseId,
                tenant_id: lease.tenant_id,
                landlord_id: user.id,
                amount: lease.deposit,
                status: 'pending', // Awaiting payment confirmation
            })

        if (depositError) {
            console.error('Deposit Escrow Error:', depositError)
            // Don't fail lease approval, just log
        }
    }

    revalidatePath('/landlord/leases')
    revalidatePath('/landlord/properties')
    revalidatePath('/landlord/payments')
    revalidatePath('/tenant/payments')
    revalidatePath(`/landlord/leases/${leaseId}`)
    return { success: true }
}

// Reject lease
export async function rejectLease(leaseId: string, reason: string) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('leases')
        .update({
            status: 'rejected',
            landlord_notes: reason,
            updated_at: new Date().toISOString(),
        })
        .eq('id', leaseId)
        .eq('landlord_id', user.id)
        .eq('status', 'tenant_signed')

    if (error) {
        console.error('Reject Error:', error)
        return { error: 'Failed to reject lease.' }
    }

    revalidatePath('/landlord/leases')
    revalidatePath(`/landlord/leases/${leaseId}`)
    return { success: true }
}

// Request revision from tenant
export async function requestRevision(leaseId: string, notes: string) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('leases')
        .update({
            status: 'revision_requested',
            landlord_notes: notes,
            tenant_signature_data: null,
            tenant_documents: null,
            signed_at: null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', leaseId)
        .eq('landlord_id', user.id)
        .eq('status', 'tenant_signed')

    if (error) {
        console.error('Revision Request Error:', error)
        return { error: 'Failed to request revision.' }
    }

    revalidatePath('/landlord/leases')
    revalidatePath(`/landlord/leases/${leaseId}`)
    return { success: true }
}

// Get all landlord leases
export async function getLandlordLeases() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return []

    const { data: leases } = await supabase
        .from('leases')
        .select(`
            *,
            property:properties(id, title, address, city, images),
            tenant:profiles!leases_tenant_id_fkey(id, first_name, surname, full_name, email, avatar_url)
        `)
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false })

    return leases || []
}

// Get single lease by ID
export async function getLeaseById(leaseId: string) {
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
            tenant:profiles!leases_tenant_id_fkey(id, first_name, surname, full_name, email, phone, avatar_url),
            landlord:profiles!leases_landlord_id_fkey(id, first_name, surname, full_name, email, phone)
        `)
        .eq('id', leaseId)
        .or(`landlord_id.eq.${user.id},tenant_id.eq.${user.id}`)
        .single()

    return lease
}

// Get lease payments
export async function getLeasePayments(leaseId: string) {
    const supabase = await createClient()

    const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('lease_id', leaseId)
        .order('due_date', { ascending: true })

    return payments || []
}

// Record a payment as paid
export async function recordPayment(paymentId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('payments')
        .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
        })
        .eq('id', paymentId)

    if (error) {
        console.error('Payment Error:', error)
        return { error: 'Failed to record payment.' }
    }

    revalidatePath('/landlord/leases')
    return { success: true }
}

// Legacy createLease function for backward compatibility
export async function createLease(formData: FormData) {
    const data = {
        property_id: formData.get('property_id') as string,
        tenant_email: formData.get('tenant_email') as string,
        start_date: formData.get('start_date') as string,
        end_date: formData.get('end_date') as string,
        monthly_rent: Number(formData.get('monthly_rent')),
        deposit: Number(formData.get('deposit')),
    }

    return createDraftLease(data)
}

// Generate signed URLs for viewing private documents
export async function getSignedDocumentUrls(documents: Array<{ type: string; url: string; name: string }>) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized', urls: [] }
    }

    const signedUrls = await Promise.all(
        documents.map(async (doc) => {
            // Check if it's already a full URL (legacy) or a path
            if (doc.url.startsWith('http')) {
                return { ...doc, signedUrl: doc.url }
            }

            const { data, error } = await supabase.storage
                .from('lease_documents')
                .createSignedUrl(doc.url, 3600) // 1 hour expiry

            if (error) {
                console.error('Signed URL error:', error)
                return { ...doc, signedUrl: null }
            }

            return { ...doc, signedUrl: data.signedUrl }
        })
    )

    return { urls: signedUrls }
}

/**
 * Quick assign tenant - simplified flow for existing tenants
 * Creates lease, deposit escrow, and payment schedule in one action
 */
export async function quickAssignTenant(data: {
    property_id: string
    tenant_email: string
    monthly_rent: number
    payment_day: number  // 1-28
    lease_months: number // 6, 12, 24, etc.
    start_date: string
    deposit: number
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Validate payment day
    if (data.payment_day < 1 || data.payment_day > 28) {
        return { error: 'Payment day must be between 1 and 28' }
    }

    // Find tenant by email
    const { data: tenant, error: tenantError } = await supabase
        .from('profiles')
        .select('id, first_name, surname, full_name, email')
        .eq('email', data.tenant_email)
        .single()

    if (tenantError || !tenant) {
        return { error: 'Tenant not found. Make sure they have an account on the platform.' }
    }

    // Verify property belongs to landlord and is available
    const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('id, title')
        .eq('id', data.property_id)
        .eq('landlord_id', user.id)
        .single()

    if (propertyError || !property) {
        return { error: 'Property not found or you do not own this property.' }
    }

    // Check for existing active lease
    const { data: activeLease } = await supabase
        .from('leases')
        .select('*')
        .eq('property_id', data.property_id)
        .eq('status', 'approved')
        .gt('end_date', new Date().toISOString())
        .maybeSingle()

    let leaseId: string

    if (activeLease) {
        // Verify tenant matches existing lease
        if (activeLease.tenant_id !== tenant.id) {
            return { error: 'Property is currently leased to a different tenant.' }
        }
        leaseId = activeLease.id
    } else {
        // Calculate end date for NEW lease
        const startDate = new Date(data.start_date)
        const endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + data.lease_months)
        const endDateStr = endDate.toISOString().split('T')[0]

        // Create new lease
        const { data: newLease, error: leaseError } = await supabase
            .from('leases')
            .insert({
                property_id: data.property_id,
                tenant_id: tenant.id,
                landlord_id: user.id,
                start_date: data.start_date,
                end_date: endDateStr,
                monthly_rent: data.monthly_rent,
                deposit: data.deposit,
                status: 'approved',
                approved_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (leaseError || !newLease) {
            console.error('Lease creation error:', leaseError)
            return { error: 'Failed to create lease.' }
        }

        leaseId = newLease.id

        // Create deposit escrow record (only for new leases)
        if (data.deposit > 0) {
            await supabase.from('deposits').insert({
                lease_id: leaseId,
                tenant_id: tenant.id,
                landlord_id: user.id,
                amount: data.deposit,
                status: 'pending',
            })
        }
    }

    // Generate payment schedule (works for both new and existing leases)
    const payments = []
    let currentDate = new Date(data.start_date)

    // Set to the payment day
    currentDate.setDate(data.payment_day)

    // If payment day already passed this month, start next month
    if (new Date(data.start_date).getDate() > data.payment_day) {
        currentDate.setMonth(currentDate.getMonth() + 1)
    }

    for (let i = 0; i < data.lease_months; i++) {
        const dueDate = currentDate.toISOString().split('T')[0]

        payments.push({
            lease_id: leaseId,
            amount: data.monthly_rent,
            type: 'rent',
            status: 'pending',
            due_date: dueDate,
        })

        currentDate.setMonth(currentDate.getMonth() + 1)
    }

    if (payments.length > 0) {
        await supabase.from('payments').insert(payments)
    }

    // Mark property as unavailable if not already
    await supabase
        .from('properties')
        .update({ is_available: false, updated_at: new Date().toISOString() })
        .eq('id', data.property_id)

    revalidatePath('/landlord/properties')
    revalidatePath('/landlord/leases')
    revalidatePath('/landlord/payments')
    revalidatePath('/tenant/payments')

    return {
        success: true,
        leaseId: leaseId,
        tenantName: tenant.full_name
    }
}
