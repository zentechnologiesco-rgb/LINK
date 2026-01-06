import { getTenantPayments, getTenantPaymentStats } from "@/lib/payments"
import { getTenantDeposits } from "@/lib/deposits"
import { TenantPaymentsClient } from "./TenantPaymentsClient"

export default async function TenantPaymentsPage() {
    const [paymentsResult, stats, depositsResult] = await Promise.all([
        getTenantPayments(),
        getTenantPaymentStats(),
        getTenantDeposits(),
    ])

    return (
        <TenantPaymentsClient
            payments={paymentsResult.data || []}
            stats={stats}
            deposits={depositsResult.data || []}
        />
    )
}
