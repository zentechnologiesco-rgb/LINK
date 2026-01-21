'use client'

import { PaymentsClient } from "./PaymentsClient"
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react"
import Link from 'next/link'
import { Button } from '@/components/ui/button'

function TenantPaymentsContent() {
    const payments = useQuery(api.payments.getForTenant)
    const stats = useQuery(api.payments.getTenantStats)
    const deposits = useQuery(api.deposits.getForTenant)

    if (payments === undefined || stats === undefined || deposits === undefined) {
        return (
            <div className="p-6 lg:p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-gray-200 rounded" />
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
                        ))}
                    </div>
                    <div className="h-96 bg-gray-100 rounded-xl" />
                </div>
            </div>
        )
    }

    return (
        <PaymentsClient
            payments={payments || []}
            stats={stats}
            deposits={deposits || []}
        />
    )
}

export default function TenantPaymentsPage() {
    return (
        <>
            <AuthLoading>
                <div className="p-6 lg:p-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 w-48 bg-gray-200 rounded" />
                        <div className="h-96 bg-gray-100 rounded-xl" />
                    </div>
                </div>
            </AuthLoading>

            <Unauthenticated>
                <div className="p-6 lg:p-8">
                    <div className="text-center py-16">
                        <p className="text-gray-500">Please sign in to view payments</p>
                        <Link href="/sign-in">
                            <Button className="mt-4 bg-gray-900 hover:bg-gray-800">Sign In</Button>
                        </Link>
                    </div>
                </div>
            </Unauthenticated>

            <Authenticated>
                <TenantPaymentsContent />
            </Authenticated>
        </>
    )
}
