'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"

export default function TenantLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = useQuery(api.users.currentUser)

    return (
        <DashboardLayout title="My Dashboard" user={user}>
            {children}
        </DashboardLayout>
    )
}
