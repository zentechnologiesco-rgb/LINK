'use client'

import { use } from 'react'
import { notFound } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import { Id } from '../../../../../../convex/_generated/dataModel'
import { LeaseDetailClient } from './LeaseDetailClient'
import { useUser } from '@/components/providers/UserProvider'

interface Props {
    params: Promise<{ id: string }>
}

function LandlordLeaseDetailContent({ id }: { id: string }) {
    const lease = useQuery(api.leases.getById, { leaseId: id as Id<"leases"> })
    const { user: currentUser, isLoading } = useUser()

    if (lease === undefined || isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-black/10 border-t-black animate-spin" />
                    <p className="text-sm font-medium text-black/40 uppercase tracking-wider">Loading lease…</p>
                </div>
            </div>
        )
    }

    if (!lease || !currentUser || lease.landlordId !== currentUser._id) {
        notFound()
    }

    return <LeaseDetailClient leaseId={id} />
}

export default function LandlordLeaseDetailPage({ params }: Props) {
    const { id } = use(params)
    return <LandlordLeaseDetailContent id={id} />
}
