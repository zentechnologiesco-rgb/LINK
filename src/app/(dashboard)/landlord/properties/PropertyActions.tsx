'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { AssignTenantDialog } from '@/components/properties/AssignTenantDialog'
import { MoreHorizontal, Eye, Edit, Trash2, ToggleLeft, ToggleRight, Loader2, Send, AlertCircle, UserPlus } from 'lucide-react'
import { useMutation } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { Id } from "../../../../../convex/_generated/dataModel"
import { getPropertyWorkflow } from '@/lib/property-workflow'

interface PropertyActionsProps {
    propertyId: Id<"properties">
    propertyTitle: string
    propertyPrice: number
    approvalStatus: 'pending' | 'approved' | 'rejected'
    publicationStatus: 'published' | 'unpublished'
    adminNotes: string | null
    availableUnitCount: number
    hasActiveLease?: boolean
    hasReservedLease?: boolean
    activeLeaseId?: string
}

export function PropertyActions({
    propertyId,
    propertyTitle,
    propertyPrice,
    approvalStatus,
    publicationStatus,
    adminNotes,
    availableUnitCount,
    hasActiveLease = false,
    hasReservedLease = false,
    activeLeaseId
}: PropertyActionsProps) {
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

    const visibilityLabel = isListed ? 'Take Listing Off Market' : 'Publish Listing'
    const visibilityBlockedLabel = (() => {
        switch (workflow.key) {
            case 'in_review':
                return 'Waiting for Review'
            case 'changes_requested':
                return 'Fix and Resubmit First'
            case 'reserved':
                return 'Lease Flow in Progress'
            case 'leased':
                return 'Active Lease Locked'
            case 'no_vacancies':
                return 'No Vacancies to Publish'
            default:
                return 'Cannot Change Visibility'
        }
    })()

    const handleToggleVisibility = async () => {
        if (!canToggleVisibility) {
            if (workflow.key === 'leased') {
                toast.error('This listing is locked while an active lease is in place')
            } else if (workflow.key === 'reserved') {
                toast.error('This listing is locked while a lease is already in progress')
            } else if (workflow.key === 'no_vacancies') {
                toast.error('Add at least one vacant public unit before publishing this listing')
            } else if (workflow.key === 'changes_requested') {
                toast.error('Fix the admin feedback and resubmit the listing first')
            } else {
                toast.error('The listing must be approved before it can go live')
            }
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
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-black/60 hover:text-black hover:bg-black/5 rounded-full shadow-none">
                        <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl border-black/5 shadow-none border p-1.5 min-w-[200px]">
                    <DropdownMenuItem asChild className="rounded-lg focus:bg-black/5 cursor-pointer py-2">
                        <Link href={`/properties/${propertyId}`} className="flex items-center font-medium">
                            <Eye className="mr-2 h-4 w-4 text-black/60" strokeWidth={1.5} />
                            View Listing
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg focus:bg-black/5 cursor-pointer py-2">
                        <Link href={`/landlord/properties/${propertyId}/edit`} className="flex items-center font-medium">
                            <Edit className="mr-2 h-4 w-4 text-black/60" strokeWidth={1.5} />
                            Edit Property
                        </Link>
                    </DropdownMenuItem>

                    {/* View Active Lease */}
                    {activeLeaseId && (
                        <DropdownMenuItem asChild className="rounded-lg focus:bg-black/5 cursor-pointer py-2">
                            <Link href={`/landlord/leases/${activeLeaseId}`} className="flex items-center font-medium">
                                <Eye className="mr-2 h-4 w-4 text-black/60" strokeWidth={1.5} />
                                View Lease
                            </Link>
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator className="bg-black/5" />

                    {/* Assign Tenant - for approved properties without active lease */}
                    {canAssignTenant && (
                        <>
                            <DropdownMenuItem
                                onClick={() => setAssignTenantDialogOpen(true)}
                                className="rounded-lg focus:bg-black/5 cursor-pointer py-2 font-medium"
                            >
                                <UserPlus className="mr-2 h-4 w-4 text-black/60" strokeWidth={1.5} />
                                Assign Tenant
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-black/5" />
                        </>
                    )}

                    {/* Show rejection reason if rejected */}
                    {approvalStatus === 'rejected' && adminNotes && (
                        <>
                            <DropdownMenuItem
                                onClick={() => setRejectionDialogOpen(true)}
                                className="rounded-lg focus:bg-black/5 cursor-pointer py-2 font-medium"
                            >
                                <AlertCircle className="mr-2 h-4 w-4 text-black/60" strokeWidth={1.5} />
                                View Rejection Reason
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-black/5" />
                        </>
                    )}

                    {/* Request Approval - only for rejected properties */}
                    {approvalStatus === 'rejected' && (
                        <DropdownMenuItem
                            onClick={handleRequestApproval}
                            disabled={isRequestingApproval}
                            className="rounded-lg focus:bg-black/5 cursor-pointer py-2 font-medium"
                        >
                            {isRequestingApproval ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin text-black/60" strokeWidth={1.5} />
                            ) : (
                                <Send className="mr-2 h-4 w-4 text-black/60" strokeWidth={1.5} />
                            )}
                            Resubmit for Review
                        </DropdownMenuItem>
                    )}

                    {/* Toggle Visibility */}
                    <DropdownMenuItem
                        onClick={handleToggleVisibility}
                        disabled={isToggling || !canToggleVisibility}
                        className={`rounded-lg focus:bg-black/5 cursor-pointer py-2 font-medium ${!canToggleVisibility ? 'opacity-50' : ''}`}
                    >
                        {isToggling ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin text-black/60" strokeWidth={1.5} />
                        ) : isListed ? (
                            <ToggleLeft className="mr-2 h-4 w-4 text-black/60" strokeWidth={1.5} />
                        ) : (
                            <ToggleRight className="mr-2 h-4 w-4 text-black/60" strokeWidth={1.5} />
                        )}
                        {canToggleVisibility ? visibilityLabel : visibilityBlockedLabel}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-black/5" />
                    <DropdownMenuItem
                        onClick={() => setDeleteDialogOpen(true)}
                        className="rounded-lg focus:bg-red-50 text-red-600 focus:text-red-700 cursor-pointer py-2 font-medium"
                    >
                        <Trash2 className="mr-2 h-4 w-4" strokeWidth={1.5} />
                        Delete Property
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Assign Tenant Dialog */}
            <AssignTenantDialog
                open={assignTenantDialogOpen}
                onOpenChange={setAssignTenantDialogOpen}
                propertyId={propertyId}
                propertyTitle={propertyTitle}
                propertyPrice={propertyPrice}
            />

            {/* Rejection Reason Dialog */}
            <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl border-black/5 shadow-none border">
                    <DialogHeader>
                        <DialogTitle className="font-[family-name:var(--font-anton)] uppercase tracking-wide text-xl">Property Rejected</DialogTitle>
                        <DialogDescription>
                            Your property was not approved. Review the feedback, update the listing if needed, and then resubmit it for review.
                        </DialogDescription>
                    </DialogHeader>
                    <Alert variant="destructive" className="rounded-xl shadow-none">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {adminNotes || 'No specific reason provided.'}
                        </AlertDescription>
                    </Alert>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRejectionDialogOpen(false)}
                            className="rounded-full border-black/10 font-bold uppercase tracking-wider text-xs shadow-none"
                        >
                            Close
                        </Button>
                        <Button
                            variant="default"
                            onClick={() => {
                                setRejectionDialogOpen(false)
                                handleRequestApproval()
                            }}
                            disabled={isRequestingApproval}
                            className="bg-black hover:bg-black/90 text-white rounded-full font-bold uppercase tracking-wider text-xs shadow-none"
                        >
                            {isRequestingApproval && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Resubmit for Review
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl border-black/5 shadow-none border">
                    <DialogHeader>
                        <DialogTitle className="font-[family-name:var(--font-anton)] uppercase tracking-wide text-xl">Delete Property</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this property? This action cannot be undone.
                            All associated inquiries and data will also be removed.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={isDeleting}
                            className="rounded-full border-black/10 font-bold uppercase tracking-wider text-xs shadow-none"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="rounded-full font-bold uppercase tracking-wider text-xs bg-red-600 hover:bg-red-700 shadow-none"
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete Property
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
