'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useUser } from "@/components/providers/UserProvider"

function ReportsContent() {
    const { user: currentUser, isLoading } = useUser()

    if (isLoading) {
        return <div className="p-6">Loading...</div>
    }

    if (!currentUser || currentUser.role !== 'admin') {
        return (
            <div className="p-6">
                <div className="text-center py-16">
                    <p className="text-gray-500">Access denied. Admin privileges required.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">System Reports</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Coming Soon</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">View system-wide reports and analytics.</p>
                </CardContent>
            </Card>
        </div>
    )
}

export default function ReportsPage() {
    return <ReportsContent />
}
