import { getLandlordPayments, getLandlordPaymentStats } from "@/lib/payments"
import { getLandlordDeposits } from "@/lib/deposits"
import { LandlordPaymentsClient } from "./LandlordPaymentsClient"
import { createClient } from "@/lib/supabase/server"

export default async function LandlordPaymentsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Fetch basic data
    const [paymentsResult, stats, depositsResult] = await Promise.all([
        getLandlordPayments(),
        getLandlordPaymentStats(),
        getLandlordDeposits(),
    ])

    // Get vacant properties (approved & no active lease)
    // We check all approved properties, even if unlisted (is_available=false),
    // because a landlord might unlist a property to assign a specific tenant.
    const { data: allProperties } = await supabase
        .from('properties')
        .select(`
            id, title, address, city, price_nad,
            leases ( status, end_date, start_date, deposit, monthly_rent, tenant:profiles!leases_tenant_id_fkey(email, full_name) )
        `)
        .eq('landlord_id', user.id)
        .eq('approval_status', 'approved')

    // We pass all properties to the client wizard
    return (
        <LandlordPaymentsClient
            payments={paymentsResult.data || []}
            stats={stats}
            deposits={depositsResult.data || []}
            properties={(allProperties || []) as any}
        />
    )
}
