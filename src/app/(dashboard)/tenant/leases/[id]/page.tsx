'use client'

import { notFound } from 'next/navigation'
import { LeaseDetailClient } from './LeaseDetailClient'
import { useQuery } from "convex/react"
import { api } from "../../../../../../convex/_generated/api"
import { Id } from "../../../../../../convex/_generated/dataModel"

import { use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Props {
    params: Promise<{ id: string }>
}

function TenantLeaseDetailContent({ id }: { id: string }) {
    const lease = useQuery(api.leases.getById, { leaseId: id as Id<"leases"> })
    const currentUser = useQuery(api.users.currentUser)

    if (lease === undefined || currentUser === undefined) {
        return (
            <div className="p-6 lg:p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-gray-200 rounded" />
                    <div className="h-96 bg-gray-100 rounded-xl" />
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

    return <LeaseDetailClient lease={lease} />
}

export default function TenantLeaseDetailPage({ params }: Props) {
    const { id } = use(params)
    return <TenantLeaseDetailContent id={id} />
}
