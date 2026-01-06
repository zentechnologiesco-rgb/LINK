import { notFound } from 'next/navigation'
import { getLeaseById, getLeasePayments, getSignedDocumentUrls } from '../actions'
import { LandlordLeaseDetailClient } from './LandlordLeaseDetailClient'

export default async function LandlordLeaseDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const [lease, payments] = await Promise.all([
        getLeaseById(id),
        getLeasePayments(id)
    ])

    if (!lease) {
        notFound()
    }

    // Generate signed URLs for tenant documents
    let documentsWithUrls: any[] = []
    if (lease.tenant_documents && lease.tenant_documents.length > 0) {
        const { urls } = await getSignedDocumentUrls(lease.tenant_documents)
        documentsWithUrls = urls || []
    }

    return (
        <LandlordLeaseDetailClient
            lease={{ ...lease, tenant_documents: documentsWithUrls }}
            payments={payments}
        />
    )
}
