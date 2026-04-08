'use client'

import { AlertCircle, Loader2 } from 'lucide-react'
import { type Id } from '../../../../../../convex/_generated/dataModel'

import { AssignTenantDialog } from '@/features/landlord/properties/components/AssignTenantDialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface PropertyActionDialogsProps {
    propertyId: Id<'properties'>
    propertyTitle: string
    propertyPrice: number
    adminNotes: string | null
    assignTenantDialogOpen: boolean
    deleteDialogOpen: boolean
    rejectionDialogOpen: boolean
    isDeleting: boolean
    isRequestingApproval: boolean
    onAssignTenantDialogOpenChange: (open: boolean) => void
    onDeleteDialogOpenChange: (open: boolean) => void
    onRejectionDialogOpenChange: (open: boolean) => void
    onDelete: () => void
    onRequestApproval: () => void
}

export function PropertyActionDialogs({
    propertyId,
    propertyTitle,
    propertyPrice,
    adminNotes,
    assignTenantDialogOpen,
    deleteDialogOpen,
    rejectionDialogOpen,
    isDeleting,
    isRequestingApproval,
    onAssignTenantDialogOpenChange,
    onDeleteDialogOpenChange,
    onRejectionDialogOpenChange,
    onDelete,
    onRequestApproval,
}: PropertyActionDialogsProps) {
    return (
        <>
            <AssignTenantDialog
                open={assignTenantDialogOpen}
                onOpenChange={onAssignTenantDialogOpenChange}
                propertyId={propertyId}
                propertyTitle={propertyTitle}
                propertyPrice={propertyPrice}
            />

            <Dialog open={rejectionDialogOpen} onOpenChange={onRejectionDialogOpenChange}>
                <DialogContent className='sm:max-w-md rounded-3xl border border-black/5 shadow-none'>
                    <DialogHeader>
                        <DialogTitle className='font-[family-name:var(--font-anton)] text-xl uppercase tracking-wide'>Property Rejected</DialogTitle>
                        <DialogDescription>
                            Your property was not approved. Review the feedback, update the listing if needed, and then resubmit it for review.
                        </DialogDescription>
                    </DialogHeader>
                    <Alert variant='destructive' className='rounded-xl shadow-none'>
                        <AlertCircle className='h-4 w-4' />
                        <AlertDescription>
                            {adminNotes || 'No specific reason provided.'}
                        </AlertDescription>
                    </Alert>
                    <DialogFooter>
                        <Button
                            variant='outline'
                            onClick={() => onRejectionDialogOpenChange(false)}
                            className='rounded-full border-black/10 text-xs font-bold uppercase tracking-wider shadow-none'
                        >
                            Close
                        </Button>
                        <Button
                            variant='default'
                            onClick={onRequestApproval}
                            disabled={isRequestingApproval}
                            className='rounded-full bg-black text-xs font-bold uppercase tracking-wider text-white shadow-none hover:bg-black/90'
                        >
                            {isRequestingApproval ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                            Resubmit for Review
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={onDeleteDialogOpenChange}>
                <DialogContent className='sm:max-w-md rounded-3xl border border-black/5 shadow-none'>
                    <DialogHeader>
                        <DialogTitle className='font-[family-name:var(--font-anton)] text-xl uppercase tracking-wide'>Delete Property</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this property? This action cannot be undone.
                            All associated inquiries and data will also be removed.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant='outline'
                            onClick={() => onDeleteDialogOpenChange(false)}
                            disabled={isDeleting}
                            className='rounded-full border-black/10 text-xs font-bold uppercase tracking-wider shadow-none'
                        >
                            Cancel
                        </Button>
                        <Button
                            variant='destructive'
                            onClick={onDelete}
                            disabled={isDeleting}
                            className='rounded-full bg-red-600 text-xs font-bold uppercase tracking-wider shadow-none hover:bg-red-700'
                        >
                            {isDeleting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                            Delete Property
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
