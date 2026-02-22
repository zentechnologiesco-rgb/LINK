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
                    <Button variant="outline" size="sm" className="gap-2 rounded-full border-black/10 hover:bg-black/5 hover:text-black hover:border-black/20 font-bold transition-all">
                        <Banknote className="h-4 w-4" /> Release
                    </Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl border border-black/5 shadow-none p-0 overflow-hidden bg-white max-w-md">
                    <form action={handleRelease}>
                        <DialogHeader className="p-8 pb-4 bg-gray-50/50 border-b border-black/5">
                            <DialogTitle className="font-[family-name:var(--font-anton)] text-3xl uppercase tracking-wide text-black">Release Deposit</DialogTitle>
                            <DialogDescription className="text-black/60 font-medium mt-2">
                                Release the N$ {depositAmount.toLocaleString()} deposit back to the tenant.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 p-8">
                            <div className="space-y-2">
                                <Label htmlFor="deductions" className="text-xs font-bold uppercase tracking-wide text-black/60">Deductions (N$)</Label>
                                <Input
                                    id="deductions"
                                    name="deductions"
                                    type="number"
                                    defaultValue={0}
                                    min={0}
                                    max={depositAmount}
                                    className="h-12 bg-gray-50 border-black/5 focus-visible:ring-black/20 rounded-xl font-bold text-lg shadow-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reason" className="text-xs font-bold uppercase tracking-wide text-black/60">Reason for Deductions</Label>
                                <Textarea
                                    id="reason"
                                    name="reason"
                                    placeholder="e.g. Cleaning fees, damage repairs..."
                                    className="bg-gray-50 border-black/5 focus-visible:ring-black/20 rounded-xl resize-none shadow-none"
                                />
                            </div>
                        </div>
                        <DialogFooter className="p-8 pt-4 bg-gray-50/50 border-t border-black/5">
                            <Button
                                type="submit"
                                disabled={isReleasing || !depositId}
                                className="w-full bg-black text-white hover:bg-black/90 rounded-full h-12 font-bold shadow-none transition-transform active:scale-95"
                            >
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
                    <Button variant="outline" size="sm" className="gap-2 rounded-full border-transparent hover:bg-red-50 text-black/40 hover:text-red-600 font-bold transition-all">
                        <AlertTriangle className="h-4 w-4" /> Forfeit
                    </Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl border border-black/5 shadow-none p-0 overflow-hidden bg-white max-w-md">
                    <form action={handleForfeit}>
                        <DialogHeader className="p-8 pb-4 bg-red-50/30 border-b border-black/5">
                            <DialogTitle className="font-[family-name:var(--font-anton)] text-3xl uppercase tracking-wide text-black flex items-center gap-2">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                                Forfeit Deposit
                            </DialogTitle>
                            <DialogDescription className="text-black/60 font-medium mt-2">
                                Permanently forfeit the tenant's N$ {depositAmount.toLocaleString()} deposit. This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 p-8">
                            <div className="space-y-2">
                                <Label htmlFor="reason" className="text-xs font-bold uppercase tracking-wide text-black/60">Reason for Forfeiture *</Label>
                                <Textarea
                                    id="reason"
                                    name="reason"
                                    placeholder="e.g. Lease violation, property damage beyond repair..."
                                    required
                                    className="bg-gray-50 border-black/5 focus-visible:ring-red-500/20 rounded-xl resize-none shadow-none"
                                />
                            </div>
                        </div>
                        <DialogFooter className="p-8 pt-4 bg-gray-50/50 border-t border-black/5">
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={isForfeiting || !depositId}
                                className="w-full bg-red-600 hover:bg-red-700 text-white rounded-full h-12 font-bold shadow-none transition-transform active:scale-95"
                            >
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
