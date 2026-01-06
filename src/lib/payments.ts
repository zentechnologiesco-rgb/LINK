'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { addMonths, format, isBefore, startOfMonth } from 'date-fns'

/**
 * Generate recurring monthly rent payments for a lease.
 * Called when a lease is activated or when generating future payments.
 */
export async function generateRecurringPayments(leaseId: string, monthsAhead: number = 12) {
    const supabase = await createClient()

    // Get lease details
    const { data: lease, error: leaseError } = await supabase
        .from('leases')
        .select('*')
        .eq('id', leaseId)
        .single()

    if (leaseError || !lease) {
        return { error: 'Lease not found' }
    }

    // Get existing payments to avoid duplicates
    const { data: existingPayments } = await supabase
        .from('payments')
        .select('due_date')
        .eq('lease_id', leaseId)
        .eq('type', 'rent')

    const existingDates = new Set(existingPayments?.map(p => p.due_date) || [])

    // Generate payments from start_date to end_date (or monthsAhead, whichever is less)
    const startDate = new Date(lease.start_date)
    const endDate = new Date(lease.end_date)
    const payments = []

    let currentDate = startOfMonth(addMonths(startDate, 1)) // Start from 2nd month (1st is already created)

    for (let i = 0; i < monthsAhead; i++) {
        if (isBefore(endDate, currentDate)) break

        const dueDate = format(currentDate, 'yyyy-MM-dd')

        // Skip if payment already exists
        if (!existingDates.has(dueDate)) {
            payments.push({
                lease_id: leaseId,
                amount: lease.monthly_rent,
                type: 'rent',
                status: 'pending',
                due_date: dueDate,
            })
        }

        currentDate = addMonths(currentDate, 1)
    }

    if (payments.length > 0) {
        const { error } = await supabase.from('payments').insert(payments)
        if (error) {
            console.error('Payment Generation Error:', error)
            return { error: 'Failed to generate payments' }
        }
    }

    revalidatePath(`/dashboard/landlord/leases/${leaseId}`)
    return { success: true, paymentsGenerated: payments.length }
}

/**
 * Mark overdue payments based on current date.
 * This would typically run as a cron job.
 */
export async function markOverduePayments() {
    const supabase = await createClient()
    const today = format(new Date(), 'yyyy-MM-dd')

    const { error } = await supabase
        .from('payments')
        .update({ status: 'overdue' })
        .eq('status', 'pending')
        .lt('due_date', today)

    if (error) {
        console.error('Overdue Update Error:', error)
        return { error: 'Failed to update overdue payments' }
    }

    return { success: true }
}

/**
 * Get payment summary for a lease (total paid, pending, overdue)
 */
export async function getPaymentSummary(leaseId: string) {
    const supabase = await createClient()

    const { data: payments } = await supabase
        .from('payments')
        .select('amount, status')
        .eq('lease_id', leaseId)

    if (!payments) return { paid: 0, pending: 0, overdue: 0 }

    return payments.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + Number(p.amount)
        return acc
    }, { paid: 0, pending: 0, overdue: 0 } as Record<string, number>)
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'eft'

export interface Payment {
    id: string
    lease_id: string
    amount: number
    type: 'rent' | 'deposit' | 'late_fee'
    status: 'pending' | 'paid' | 'overdue'
    due_date: string
    paid_at: string | null
    payment_method: string | null
    notes: string | null
    created_at: string
}

/**
 * Record a payment as paid (landlord confirms receipt)
 */
export async function recordPayment(
    paymentId: string,
    paymentMethod: PaymentMethod,
    paymentDate?: string,
    notes?: string
) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('payments')
        .update({
            status: 'paid',
            paid_at: paymentDate || new Date().toISOString(),
            payment_method: paymentMethod,
            notes: notes || null,
        })
        .eq('id', paymentId)

    if (error) {
        console.error('Record Payment Error:', error)
        return { error: 'Failed to record payment' }
    }

    revalidatePath('/landlord/payments')
    revalidatePath('/tenant/payments')
    return { success: true }
}

/**
 * Get all payments for a landlord across all their leases
 */
export async function getLandlordPayments() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated', data: [] }

    const { data, error } = await supabase
        .from('payments')
        .select(`
            *,
            lease:leases!inner(
                id,
                tenant_id,
                landlord_id,
                tenant:profiles!leases_tenant_id_fkey(full_name, email),
                property:properties(title, address)
            )
        `)
        .eq('lease.landlord_id', user.id)
        .order('due_date', { ascending: false })

    if (error) {
        console.error('Fetch Payments Error:', error)
        return { error: 'Failed to fetch payments', data: [] }
    }

    return { data, error: null }
}

/**
 * Get all payments for a tenant
 */
export async function getTenantPayments() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated', data: [] }

    const { data, error } = await supabase
        .from('payments')
        .select(`
            *,
            lease:leases!inner(
                id,
                landlord_id,
                landlord:profiles!leases_landlord_id_fkey(full_name, email),
                property:properties(title, address)
            )
        `)
        .eq('lease.tenant_id', user.id)
        .order('due_date', { ascending: false })

    if (error) {
        console.error('Fetch Payments Error:', error)
        return { error: 'Failed to fetch payments', data: [] }
    }

    return { data, error: null }
}

/**
 * Get upcoming payments (due within N days)
 */
export async function getUpcomingPayments(daysAhead: number = 30) {
    const supabase = await createClient()
    const today = format(new Date(), 'yyyy-MM-dd')
    const futureDate = format(addMonths(new Date(), 1), 'yyyy-MM-dd')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated', data: [] }

    const { data, error } = await supabase
        .from('payments')
        .select(`
            *,
            lease:leases!inner(
                id,
                tenant_id,
                property:properties(title, address)
            )
        `)
        .eq('lease.tenant_id', user.id)
        .eq('status', 'pending')
        .gte('due_date', today)
        .lte('due_date', futureDate)
        .order('due_date', { ascending: true })

    if (error) {
        console.error('Fetch Upcoming Payments Error:', error)
        return { error: 'Failed to fetch upcoming payments', data: [] }
    }

    return { data, error: null }
}

/**
 * Get payment statistics for a landlord
 */
export async function getLandlordPaymentStats() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { totalCollected: 0, pending: 0, overdue: 0 }

    const { data: payments } = await supabase
        .from('payments')
        .select(`
            amount,
            status,
            lease:leases!inner(landlord_id)
        `)
        .eq('lease.landlord_id', user.id)

    if (!payments) return { totalCollected: 0, pending: 0, overdue: 0 }

    return payments.reduce((acc, p) => {
        const amount = Number(p.amount)
        if (p.status === 'paid') acc.totalCollected += amount
        else if (p.status === 'pending') acc.pending += amount
        else if (p.status === 'overdue') acc.overdue += amount
        return acc
    }, { totalCollected: 0, pending: 0, overdue: 0 })
}

/**
 * Get payment statistics for a tenant
 */
export async function getTenantPaymentStats() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { totalPaid: 0, pending: 0, overdue: 0 }

    const { data: payments } = await supabase
        .from('payments')
        .select(`
            amount,
            status,
            lease:leases!inner(tenant_id)
        `)
        .eq('lease.tenant_id', user.id)

    if (!payments) return { totalPaid: 0, pending: 0, overdue: 0 }

    return payments.reduce((acc, p) => {
        const amount = Number(p.amount)
        if (p.status === 'paid') acc.totalPaid += amount
        else if (p.status === 'pending') acc.pending += amount
        else if (p.status === 'overdue') acc.overdue += amount
        return acc
    }, { totalPaid: 0, pending: 0, overdue: 0 })
}
