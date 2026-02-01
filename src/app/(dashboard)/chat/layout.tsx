'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"

export default function ChatLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = useQuery(api.users.currentUser)

    return (
        <DashboardLayout title="Messages" user={user}>
            {children}
        </DashboardLayout>
    )
}
