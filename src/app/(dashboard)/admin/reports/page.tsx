'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

function ReportsContent() {
    const currentUser = useQuery(api.users.currentUser)

    if (currentUser === undefined) {
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
    return (
        <>
            <AuthLoading>
                <div className="p-6">Loading...</div>
            </AuthLoading>
            <Unauthenticated>
                <div className="p-6">
                    <div className="text-center py-16">
                        <p className="text-gray-500">Please sign in to access admin panel</p>
                        <Link href="/sign-in">
                            <Button className="mt-4 bg-gray-900 hover:bg-gray-800">Sign In</Button>
                        </Link>
                    </div>
                </div>
            </Unauthenticated>
            <Authenticated>
                <ReportsContent />
            </Authenticated>
        </>
    )
}
