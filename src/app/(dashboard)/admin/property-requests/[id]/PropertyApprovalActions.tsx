'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { approveProperty, rejectProperty } from '../actions'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface PropertyApprovalActionsProps {
    propertyId: string
}

export function PropertyApprovalActions({ propertyId }: PropertyApprovalActionsProps) {
    const [isApproving, setIsApproving] = useState(false)
    const [isRejecting, setIsRejecting] = useState(false)
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [rejectionNotes, setRejectionNotes] = useState('')
    const router = useRouter()

    const handleApprove = async () => {
        setIsApproving(true)
        const result = await approveProperty(propertyId)

        if (result?.error) {
            toast.error(result.error)
            setIsApproving(false)
        } else {
            toast.success('Property approved successfully')
            router.refresh()
        }
    }

    const handleReject = async () => {
        if (!rejectionNotes.trim()) {
            toast.error('Please provide a rejection reason')
            return
        }

        setIsRejecting(true)
        const result = await rejectProperty(propertyId, rejectionNotes)

        if (result?.error) {
            toast.error(result.error)
            setIsRejecting(false)
        } else {
            toast.success('Property rejected')
            setRejectDialogOpen(false)
            router.refresh()
        }
    }

    return (
        <>
            <div className="flex gap-2">
                <Button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="bg-green-600 hover:bg-green-700"
                >
                    {isApproving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Approve
                </Button>
                <Button
                    variant="destructive"
                    onClick={() => setRejectDialogOpen(true)}
                    disabled={isApproving}
                >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                </Button>
            </div>

            {/* Rejection Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Property</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this property listing.
                            This will be visible to the landlord.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="rejection-notes" className="mb-2 block">
                            Rejection Reason
                        </Label>
                        <Textarea
                            id="rejection-notes"
                            placeholder="e.g., Unclear images, missing information, inappropriate content..."
                            value={rejectionNotes}
                            onChange={(e) => setRejectionNotes(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRejectDialogOpen(false)}
                            disabled={isRejecting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={isRejecting || !rejectionNotes.trim()}
                        >
                            {isRejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reject Property
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
