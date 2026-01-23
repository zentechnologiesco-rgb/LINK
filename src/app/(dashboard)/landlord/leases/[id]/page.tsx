'use client'

import { notFound } from 'next/navigation'
import { LeaseDetailClient } from './LeaseDetailClient'
import { useQuery } from "convex/react"
import { api } from "../../../../../../convex/_generated/api"
import { Id } from "../../../../../../convex/_generated/dataModel"

import { use } from 'react'

interface Props {
    params: Promise<{ id: string }>
}

function LandlordLeaseDetailContent({ id }: { id: string }) {
    const lease = useQuery(api.leases.getById, { leaseId: id as Id<"leases"> })
    const currentUser = useQuery(api.users.currentUser)
    const payments = useQuery(api.payments.getByLease, { leaseId: id as Id<"leases"> })

    if (lease === undefined || currentUser === undefined || payments === undefined) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-lime-500/20 border-t-lime-500 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading lease...</p>
                </div>
            </div>
        )
    }

    if (!lease || !currentUser) {
        notFound()
    }

    // Authorization check
    if (lease.landlordId !== currentUser._id) {
        notFound()
    }

    return (
        <LeaseDetailClient
            lease={lease}
            payments={payments || []}
        />
    )
}

export default function LandlordLeaseDetailPage({ params }: Props) {
    const { id } = use(params)
    return <LandlordLeaseDetailContent id={id} />
}
