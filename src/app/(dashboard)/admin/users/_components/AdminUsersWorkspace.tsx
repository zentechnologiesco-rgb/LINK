'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { UserAvatar } from '@/components/ui/user-avatar'
import { useUser } from '@/components/providers/UserProvider'
import { useCachedQuery } from '@/hooks/useOptimisticQuery'
import { getDisplayName } from '@/lib/user-name'
import { api } from '@convex/_generated/api'

import {
    AdminAccessDeniedState,
} from '../../_components/AdminPageStates'

type AdminUserRecord = {
    _id: string
    _creationTime: number
    email?: string | null
    role: string
    isVerified?: boolean | null
    fullName?: string | null
    avatarUrl?: string | null
}

export function AdminUsersWorkspace() {
    const { user: currentUser, isLoading } = useUser()
    const { data: users } = useCachedQuery(
        api.admin.getAllUsers,
        {
            queryName: 'admin_users_v1',
            cacheKeySuffix: currentUser?._id ?? 'anonymous',
            storage: 'session',
        }
    ) as { data: AdminUserRecord[] | undefined }

    if (isLoading || users === undefined) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-12 w-64 rounded bg-gray-200" />
                    <div className="h-96 rounded-xl bg-gray-100" />
                </div>
            </div>
        )
    }

    if (!currentUser || currentUser.role !== 'admin') {
        return <AdminAccessDeniedState />
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
                                        <UserAvatar className="h-8 w-8" user={user} />
                                        <div className="font-medium">{getDisplayName(user, 'No Name')}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                                            {user.role}
                                        </Badge>
                                        {user.isVerified ? (
                                            <Badge variant="outline" className="ml-2 border-green-200 bg-green-50 text-green-700">
                                                Verified
                                            </Badge>
                                        ) : null}
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
