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
    DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { approveVerification, rejectVerification } from '@/lib/verification'
import { Check, X, Loader2 } from 'lucide-react'

interface RequestActionsProps {
    requestId: string
}

export function RequestActions({ requestId }: RequestActionsProps) {
    const [isApproving, setIsApproving] = useState(false)
    const [isRejecting, setIsRejecting] = useState(false)
    const [rejectReason, setRejectReason] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const router = useRouter()

    const handleApprove = async () => {
        setIsApproving(true)
        const result = await approveVerification(requestId)

        if (result.error) {
            toast.error(result.error)
            setIsApproving(false)
        } else {
            toast.success('Application approved successfully')
            router.refresh()
            router.push('/admin/landlord-requests')
        }
    }

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            toast.error('Please provide a reason for rejection')
            return
        }

        setIsRejecting(true)
        const result = await rejectVerification(requestId, rejectReason)

        if (result.error) {
            toast.error(result.error)
            setIsRejecting(false)
        } else {
            toast.success('Application rejected')
            setDialogOpen(false)
            router.refresh()
            router.push('/admin/landlord-requests')
        }
    }

    return (
        <div className="flex items-center gap-3">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="destructive" disabled={isApproving}>
                        <X className="mr-2 h-4 w-4" /> Reject application
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Application</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this application. This will be visible to the user.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="reason" className="mb-2 block">Rejection Reason</Label>
                        <Textarea
                            id="reason"
                            placeholder="e.g., ID document is blurry, business registration invalid..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isRejecting}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={isRejecting}>
                            {isRejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reject Application
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleApprove}
                disabled={isApproving || isRejecting}
            >
                {isApproving ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Approving...
                    </>
                ) : (
                    <>
                        <Check className="mr-2 h-4 w-4" /> Approve Application
                    </>
                )}
            </Button>
        </div>
    )
}
