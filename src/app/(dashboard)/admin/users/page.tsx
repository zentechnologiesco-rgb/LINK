'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function UsersContent() {
    const currentUser = useQuery(api.users.currentUser)
    const users = useQuery(api.admin.getAllUsers)

    if (currentUser === undefined || users === undefined) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-12 w-64 bg-gray-200 rounded" />
                    <div className="h-96 bg-gray-100 rounded-xl" />
                </div>
            </div>
        )
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
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <Badge variant="outline">{users.length} Users</Badge>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Joined</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user._id}>
                                    <TableCell className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.avatarUrl} />
                                            <AvatarFallback>{user.fullName ? user.fullName[0] : '?'}</AvatarFallback>
                                        </Avatar>
                                        <div className="font-medium">{user.fullName || 'No Name'}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                                            {user.role}
                                        </Badge>
                                        {(user as any).isVerified && (
                                            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">Verified</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{new Date(user._creationTime).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

export default function UsersPage() {
    return (
        <>
            <AuthLoading>
                <div className="p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-12 w-64 bg-gray-200 rounded" />
                        <div className="h-96 bg-gray-100 rounded-xl" />
                    </div>
                </div>
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
                <UsersContent />
            </Authenticated>
        </>
    )
}
