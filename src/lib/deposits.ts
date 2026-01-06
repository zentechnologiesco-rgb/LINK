'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type DepositStatus = 'pending' | 'held' | 'released' | 'forfeited' | 'partial_release'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'eft'

export interface Deposit {
    id: string
    lease_id: string
    tenant_id: string
    landlord_id: string
    amount: number
    status: DepositStatus
    paid_at: string | null
    payment_method: PaymentMethod | null
    payment_reference: string | null
    release_requested_at: string | null
    release_requested_by: string | null
    release_reason: string | null
    deduction_amount: number
    deduction_reason: string | null
    released_at: string | null
    created_at: string
    updated_at: string
}

/**
 * Create a deposit record when a lease is approved
 */
export async function createDepositForLease(
    leaseId: string,
    tenantId: string,
    landlordId: string,
    amount: number
) {
    const supabase = await createClient()

    // Check if deposit already exists for this lease
    const { data: existing } = await supabase
        .from('deposits')
        .select('id')
        .eq('lease_id', leaseId)
        .single()

    if (existing) {
        return { error: 'Deposit already exists for this lease' }
    }

    const { data, error } = await supabase
        .from('deposits')
        .insert({
            lease_id: leaseId,
            tenant_id: tenantId,
            landlord_id: landlordId,
            amount,
            status: 'pending',
        })
        .select()
        .single()

    if (error) {
        console.error('Create Deposit Error:', error)
        return { error: 'Failed to create deposit record' }
    }

    revalidatePath('/landlord/payments')
    revalidatePath('/tenant/payments')
    return { success: true, data }
}

/**
 * Landlord confirms deposit has been received - status changes to 'held' (escrow)
 */
export async function confirmDepositPayment(
    depositId: string,
    paymentMethod: PaymentMethod,
    paymentReference?: string
) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('deposits')
        .update({
            status: 'held',
            paid_at: new Date().toISOString(),
            payment_method: paymentMethod,
            payment_reference: paymentReference || null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', depositId)
        .eq('status', 'pending')

    if (error) {
        console.error('Confirm Deposit Error:', error)
        return { error: 'Failed to confirm deposit payment' }
    }

    revalidatePath('/landlord/payments')
    revalidatePath('/tenant/payments')
    return { success: true }
}

/**
 * Request deposit release at the end of a lease
 */
export async function requestDepositRelease(
    depositId: string,
    requestedBy: string,
    reason: string
) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('deposits')
        .update({
            release_requested_at: new Date().toISOString(),
            release_requested_by: requestedBy,
            release_reason: reason,
            updated_at: new Date().toISOString(),
        })
        .eq('id', depositId)
        .eq('status', 'held')

    if (error) {
        console.error('Request Release Error:', error)
        return { error: 'Failed to request deposit release' }
    }

    revalidatePath('/landlord/payments')
    revalidatePath('/tenant/payments')
    return { success: true }
}

/**
 * Release deposit back to tenant (full or partial with deductions)
 */
export async function releaseDeposit(
    depositId: string,
    deductionAmount: number = 0,
    deductionReason?: string
) {
    const supabase = await createClient()

    // Get current deposit
    const { data: deposit, error: fetchError } = await supabase
        .from('deposits')
        .select('amount')
        .eq('id', depositId)
        .single()

    if (fetchError || !deposit) {
        return { error: 'Deposit not found' }
    }

    const status = deductionAmount > 0 ? 'partial_release' : 'released'

    const { error } = await supabase
        .from('deposits')
        .update({
            status,
            deduction_amount: deductionAmount,
            deduction_reason: deductionReason || null,
            released_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', depositId)

    if (error) {
        console.error('Release Deposit Error:', error)
        return { error: 'Failed to release deposit' }
    }

    revalidatePath('/landlord/payments')
    revalidatePath('/tenant/payments')
    return {
        success: true,
        releasedAmount: deposit.amount - deductionAmount,
        deductedAmount: deductionAmount
    }
}

/**
 * Forfeit deposit to landlord (damage/breach of lease)
 */
export async function forfeitDeposit(depositId: string, reason: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('deposits')
        .update({
            status: 'forfeited',
            deduction_reason: reason,
            released_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', depositId)

    if (error) {
        console.error('Forfeit Deposit Error:', error)
        return { error: 'Failed to forfeit deposit' }
    }

    revalidatePath('/landlord/payments')
    revalidatePath('/tenant/payments')
    return { success: true }
}

/**
 * Get deposit status for a specific lease
 */
export async function getDepositForLease(leaseId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('deposits')
        .select(`
            *,
            tenant:profiles!deposits_tenant_id_fkey(full_name, email),
            landlord:profiles!deposits_landlord_id_fkey(full_name, email)
        `)
        .eq('lease_id', leaseId)
        .single()

    if (error) {
        return { error: 'Deposit not found', data: null }
    }

    return { data, error: null }
}

/**
 * Get all deposits for a landlord
 */
export async function getLandlordDeposits() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated', data: [] }

    const { data, error } = await supabase
        .from('deposits')
        .select(`
            *,
            tenant:profiles!deposits_tenant_id_fkey(full_name, email),
            lease:leases(
                id,
                property:properties(title, address)
            )
        `)
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Fetch Deposits Error:', error)
        return { error: 'Failed to fetch deposits', data: [] }
    }

    return { data, error: null }
}

/**
 * Get all deposits for a tenant
 */
export async function getTenantDeposits() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated', data: [] }

    const { data, error } = await supabase
        .from('deposits')
        .select(`
            *,
            landlord:profiles!deposits_landlord_id_fkey(full_name, email),
            lease:leases(
                id,
                property:properties(title, address)
            )
        `)
        .eq('tenant_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Fetch Deposits Error:', error)
        return { error: 'Failed to fetch deposits', data: [] }
    }

    return { data, error: null }
}
