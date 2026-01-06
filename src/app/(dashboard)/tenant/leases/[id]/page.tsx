import { notFound } from 'next/navigation'
import { getTenantLeaseById } from '../actions'
import { TenantLeaseDetailClient } from './TenantLeaseDetailClient'

export default async function TenantLeaseDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const lease = await getTenantLeaseById(id)

    if (!lease) {
        notFound()
    }

    return <TenantLeaseDetailClient lease={lease} />
}
