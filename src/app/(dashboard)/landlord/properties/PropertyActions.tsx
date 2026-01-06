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
import { togglePropertyAvailability, deleteProperty, requestPropertyApproval } from '../actions'
import { AssignTenantDialog } from '@/components/properties/AssignTenantDialog'
import { MoreHorizontal, Eye, Edit, Trash2, ToggleLeft, ToggleRight, Loader2, Send, AlertCircle, UserPlus } from 'lucide-react'

interface PropertyActionsProps {
    propertyId: string
    propertyTitle: string
    propertyPrice: number
    isAvailable: boolean
    approvalStatus: 'pending' | 'approved' | 'rejected'
    adminNotes: string | null
    hasActiveLease?: boolean
    activeLeaseId?: string
}

export function PropertyActions({
    propertyId,
    propertyTitle,
    propertyPrice,
    isAvailable,
    approvalStatus,
    adminNotes,
    hasActiveLease = false,
    activeLeaseId
}: PropertyActionsProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [isToggling, setIsToggling] = useState(false)
    const [isRequestingApproval, setIsRequestingApproval] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false)
    const [assignTenantDialogOpen, setAssignTenantDialogOpen] = useState(false)
    const router = useRouter()

    const canToggleAvailability = approvalStatus === 'approved' && !hasActiveLease
    const canAssignTenant = approvalStatus === 'approved' && !hasActiveLease

    const handleToggleAvailability = async () => {
        if (!canToggleAvailability) {
            if (hasActiveLease) {
                toast.error('Cannot relist property while there is an active lease')
            } else {
                toast.error('Property must be approved before it can be listed')
            }
            return
        }

        setIsToggling(true)
        const result = await togglePropertyAvailability(propertyId, !isAvailable)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success(isAvailable ? 'Property unlisted' : 'Property listed')
            router.refresh()
        }
        setIsToggling(false)
    }

    const handleRequestApproval = async () => {
        setIsRequestingApproval(true)
        const result = await requestPropertyApproval(propertyId)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Approval request submitted successfully')
            router.refresh()
        }
        setIsRequestingApproval(false)
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        const result = await deleteProperty(propertyId)

        if (result?.error) {
            toast.error(result.error)
            setIsDeleting(false)
        } else {
            toast.success('Property deleted successfully')
            setDeleteDialogOpen(false)
            router.refresh()
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                        <Link href={`/properties/${propertyId}`} className="flex items-center cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" />
                            View Listing
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/landlord/properties/${propertyId}/edit`} className="flex items-center cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Property
                        </Link>
                    </DropdownMenuItem>

                    {/* View Active Lease */}
                    {activeLeaseId && (
                        <DropdownMenuItem asChild>
                            <Link href={`/landlord/leases/${activeLeaseId}`} className="flex items-center cursor-pointer text-blue-600">
                                <Eye className="mr-2 h-4 w-4" />
                                View Lease
                            </Link>
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    {/* Assign Tenant - for approved properties without active lease */}
                    {canAssignTenant && (
                        <>
                            <DropdownMenuItem
                                onClick={() => setAssignTenantDialogOpen(true)}
                                className="text-green-600 cursor-pointer font-medium"
                            >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Assign Tenant
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    )}

                    {/* Show rejection reason if rejected */}
                    {approvalStatus === 'rejected' && adminNotes && (
                        <>
                            <DropdownMenuItem
                                onClick={() => setRejectionDialogOpen(true)}
                                className="text-red-600 cursor-pointer"
                            >
                                <AlertCircle className="mr-2 h-4 w-4" />
                                View Rejection Reason
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    )}

                    {/* Request Approval - only for rejected properties */}
                    {approvalStatus === 'rejected' && (
                        <DropdownMenuItem
                            onClick={handleRequestApproval}
                            disabled={isRequestingApproval}
                            className="text-blue-600 cursor-pointer"
                        >
                            {isRequestingApproval ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="mr-2 h-4 w-4" />
                            )}
                            Request Re-approval
                        </DropdownMenuItem>
                    )}

                    {/* Toggle Availability - only for approved properties */}
                    <DropdownMenuItem
                        onClick={handleToggleAvailability}
                        disabled={isToggling || !canToggleAvailability}
                        className={`cursor-pointer ${!canToggleAvailability ? 'opacity-50' : ''}`}
                    >
                        {isToggling ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : isAvailable ? (
                            <ToggleLeft className="mr-2 h-4 w-4" />
                        ) : (
                            <ToggleRight className="mr-2 h-4 w-4" />
                        )}
                        {isAvailable ? 'Unlist Property' : 'List Property'}
                        {!canToggleAvailability && approvalStatus === 'pending' && ' (Pending)'}
                        {!canToggleAvailability && approvalStatus === 'rejected' && ' (Rejected)'}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setDeleteDialogOpen(true)}
                        className="text-red-600 focus:text-red-600 cursor-pointer"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Property Rejected</DialogTitle>
                        <DialogDescription>
                            Your property was not approved. Please review the reason below and make necessary changes before resubmitting.
                        </DialogDescription>
                    </DialogHeader>
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {adminNotes || 'No specific reason provided.'}
                        </AlertDescription>
                    </Alert>
                    <DialogFooter>
                        <Button onClick={() => setRejectionDialogOpen(false)}>
                            Close
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRejectionDialogOpen(false)
                                handleRequestApproval()
                            }}
                            disabled={isRequestingApproval}
                        >
                            {isRequestingApproval && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Request Re-approval
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Property</DialogTitle>
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
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
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
