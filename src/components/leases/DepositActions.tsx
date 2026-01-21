'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, Banknote, AlertTriangle } from 'lucide-react'
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"

interface DepositActionsProps {
    leaseId: string
    depositAmount: number
    depositStatus: string
}

export function DepositActions({ leaseId, depositAmount, depositStatus }: DepositActionsProps) {
    const [isReleasing, setIsReleasing] = useState(false)
    const [isForfeiting, setIsForfeiting] = useState(false)
    const [releaseOpen, setReleaseOpen] = useState(false)
    const [forfeitOpen, setForfeitOpen] = useState(false)

    // Fetch deposit using Convex Query
    const deposit = useQuery(api.deposits.getForLease, {
        leaseId: leaseId as Id<"leases">
    })
    const depositId = deposit?._id

    // Mutations
    const releaseDeposit = useMutation(api.deposits.release)
    const forfeitDeposit = useMutation(api.deposits.forfeit)

    async function handleRelease(formData: FormData) {
        if (!depositId) {
            toast.error('Deposit not found')
            return
        }

        setIsReleasing(true)
        const deductions = Number(formData.get('deductions')) || 0
        const reason = formData.get('reason') as string

        try {
            const result = await releaseDeposit({
                depositId,
                deductionAmount: deductions,
                deductionReason: reason || undefined
            })

            const refund = result.releasedAmount ?? (depositAmount - deductions)
            toast.success(`Deposit released! Refund: N$ ${refund.toLocaleString()}`)
            setReleaseOpen(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to release deposit')
        } finally {
            setIsReleasing(false)
        }
    }

    async function handleForfeit(formData: FormData) {
        if (!depositId) {
            toast.error('Deposit not found')
            return
        }

        setIsForfeiting(true)
        const reason = formData.get('reason') as string

        try {
            await forfeitDeposit({
                depositId,
                reason
            })
            toast.success('Deposit forfeited.')
            setForfeitOpen(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to forfeit deposit')
        } finally {
            setIsForfeiting(false)
        }
    }

    if (depositStatus !== 'held' && depositStatus !== 'pending') {
        return null
    }

    return (
        <div className="flex gap-2">
            {/* Release Dialog */}
            <Dialog open={releaseOpen} onOpenChange={setReleaseOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                        <Banknote className="h-4 w-4" /> Release
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <form action={handleRelease}>
                        <DialogHeader>
                            <DialogTitle>Release Deposit</DialogTitle>
                            <DialogDescription>
                                Release the N$ {depositAmount.toLocaleString()} deposit back to the tenant.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="deductions">Deductions (N$)</Label>
                                <Input id="deductions" name="deductions" type="number" defaultValue={0} min={0} max={depositAmount} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reason">Reason for Deductions (if any)</Label>
                                <Textarea id="reason" name="reason" placeholder="e.g. Cleaning fees, damage repairs..." />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isReleasing || !depositId}>
                                {isReleasing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Release Deposit
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Forfeit Dialog */}
            <Dialog open={forfeitOpen} onOpenChange={setForfeitOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1 text-red-600 hover:text-red-700">
                        <AlertTriangle className="h-4 w-4" /> Forfeit
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <form action={handleForfeit}>
                        <DialogHeader>
                            <DialogTitle className="text-red-600">Forfeit Deposit</DialogTitle>
                            <DialogDescription>
                                Permanently forfeit the tenant's N$ {depositAmount.toLocaleString()} deposit. This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="reason">Reason for Forfeiture *</Label>
                                <Textarea id="reason" name="reason" placeholder="e.g. Lease violation, property damage beyond repair..." required />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" variant="destructive" disabled={isForfeiting || !depositId}>
                                {isForfeiting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Forfeit Deposit
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
