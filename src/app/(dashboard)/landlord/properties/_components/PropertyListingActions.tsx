'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"
import { getPropertyWorkflow } from '@/lib/property-workflow'

import { PropertyActionDialogs } from './PropertyActionDialogs'
import { PropertyActionsMenu } from './PropertyActionsMenu'
import {
    getVisibilityBlockedLabel,
    getVisibilityBlockedMessage,
    getVisibilityLabel,
} from '../_lib/property-actions-helpers'

interface PropertyListingActionsProps {
    propertyId: Id<"properties">
    propertyTitle: string
    propertyPrice: number
    approvalStatus: 'pending' | 'approved' | 'rejected'
    publicationStatus: 'published' | 'unpublished'
    adminNotes: string | null
    availableUnitCount: number
    hasDiscoveryClip?: boolean
    hasActiveLease?: boolean
    hasReservedLease?: boolean
    activeLeaseId?: string
}

export function PropertyListingActions({
    propertyId,
    propertyTitle,
    propertyPrice,
    approvalStatus,
    publicationStatus,
    adminNotes,
    availableUnitCount,
    hasDiscoveryClip = false,
    hasActiveLease = false,
    hasReservedLease = false,
    activeLeaseId
}: PropertyListingActionsProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [isToggling, setIsToggling] = useState(false)
    const [isRequestingApproval, setIsRequestingApproval] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false)
    const [assignTenantDialogOpen, setAssignTenantDialogOpen] = useState(false)
    const router = useRouter()

    const workflow = getPropertyWorkflow({
        approvalStatus,
        publicationStatus,
        availableUnitCount,
        activeLeaseCount: hasActiveLease ? 1 : 0,
        reservedLeaseCount: hasReservedLease ? 1 : 0,
    })
    const canToggleVisibility = workflow.canPublish || workflow.canUnpublish
    const canAssignTenant = workflow.canAssignTenant
    const isListed = workflow.isListed

    const updateProperty = useMutation(api.properties.update)
    const deleteProperty = useMutation(api.properties.remove)
    const requestApproval = useMutation(api.properties.requestApproval)

    const visibilityLabel = getVisibilityLabel(isListed)
    const visibilityBlockedLabel = getVisibilityBlockedLabel(workflow.key)

    const handleToggleVisibility = async () => {
        if (!canToggleVisibility) {
            toast.error(getVisibilityBlockedMessage(workflow.key))
            return
        }

        setIsToggling(true)
        try {
            await updateProperty({
                propertyId,
                publicationStatus: isListed ? 'unpublished' : 'published',
            })
            toast.success(isListed ? 'Listing taken off market' : 'Listing is now live')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update property status')
        } finally {
            setIsToggling(false)
        }
    }

    const handleRequestApproval = async () => {
        if (approvalStatus !== 'rejected') {
            toast.error('Only rejected listings can be resubmitted from here')
            return
        }

        setIsRequestingApproval(true)
        try {
            await requestApproval({ propertyId })
            toast.success('Listing resubmitted for review')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to request approval')
        } finally {
            setIsRequestingApproval(false)
        }
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await deleteProperty({ propertyId })
            toast.success('Property deleted successfully')
            setDeleteDialogOpen(false)
            router.refresh()
        } catch {
            toast.error('Failed to delete property')
            setIsDeleting(false)
        }
    }

    return (
        <>
            <PropertyActionsMenu
                propertyId={propertyId}
                activeLeaseId={activeLeaseId}
                approvalStatus={approvalStatus}
                adminNotes={adminNotes}
                hasDiscoveryClip={hasDiscoveryClip}
                canAssignTenant={canAssignTenant}
                canToggleVisibility={canToggleVisibility}
                isListed={isListed}
                isToggling={isToggling}
                isRequestingApproval={isRequestingApproval}
                visibilityLabel={visibilityLabel}
                visibilityBlockedLabel={visibilityBlockedLabel}
                onAssignTenant={() => setAssignTenantDialogOpen(true)}
                onOpenRejection={() => setRejectionDialogOpen(true)}
                onRequestApproval={handleRequestApproval}
                onToggleVisibility={handleToggleVisibility}
                onDelete={() => setDeleteDialogOpen(true)}
            />

            <PropertyActionDialogs
                propertyId={propertyId}
                propertyTitle={propertyTitle}
                propertyPrice={propertyPrice}
                adminNotes={adminNotes}
                assignTenantDialogOpen={assignTenantDialogOpen}
                deleteDialogOpen={deleteDialogOpen}
                rejectionDialogOpen={rejectionDialogOpen}
                isDeleting={isDeleting}
                isRequestingApproval={isRequestingApproval}
                onAssignTenantDialogOpenChange={setAssignTenantDialogOpen}
                onDeleteDialogOpenChange={setDeleteDialogOpen}
                onRejectionDialogOpenChange={setRejectionDialogOpen}
                onDelete={handleDelete}
                onRequestApproval={async () => {
                    setRejectionDialogOpen(false)
                    await handleRequestApproval()
                }}
            />
        </>
    )
}
