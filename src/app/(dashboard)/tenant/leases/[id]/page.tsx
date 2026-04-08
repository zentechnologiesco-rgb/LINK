'use client'

import { notFound } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { type Id } from '@convex/_generated/dataModel'
import { TenantLeaseDetailWorkspace } from './_components/TenantLeaseDetailWorkspace'
import { useUser } from '@/components/providers/UserProvider'

import { use } from 'react'

interface Props {
    params: Promise<{ id: string }>
}

function TenantLeaseDetailContent({ id }: { id: string }) {
    const lease = useQuery(api.leases.getById, { leaseId: id as Id<'leases'> })
    const { user: currentUser, isLoading } = useUser()

    if (lease === undefined || isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-black/10 border-t-black animate-spin" />
                    <p className="text-sm text-black/40 font-medium">Loading lease...</p>
                </div>
            </div>
        )
    }

    if (!lease || !currentUser) {
        notFound()
    }

    // Authorization check
    if (lease.tenantId !== currentUser._id) {
        notFound()
    }

    return <TenantLeaseDetailWorkspace leaseId={lease._id} />
}

export default function TenantLeaseDetailPage({ params }: Props) {
    const { id } = use(params)
    return <TenantLeaseDetailContent id={id} />
}
