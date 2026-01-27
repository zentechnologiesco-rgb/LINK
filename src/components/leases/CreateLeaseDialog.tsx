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
import { toast } from 'sonner'
import { Loader2, FileText } from 'lucide-react'
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"

interface CreateLeaseDialogProps {
    propertyId: string
    tenantId: string
    propertyTitle: string
    monthlyRent: number
}

export function CreateLeaseDialog({ propertyId, tenantId, propertyTitle, monthlyRent }: CreateLeaseDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Form state
    const today = new Date().toISOString().split('T')[0]
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const [startDate, setStartDate] = useState(today)
    const [endDate, setEndDate] = useState(nextYear)
    const [rent, setRent] = useState(monthlyRent)
    const [deposit, setDeposit] = useState(monthlyRent)

    const createLease = useMutation(api.leases.create)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)

        try {
            await createLease({
                propertyId: propertyId as Id<"properties">,
                tenantId: tenantId as Id<"users">,
                startDate,
                endDate,
                monthlyRent: Number(rent),
                deposit: Number(deposit),
            })

            toast.success('Lease created successfully!')
            setOpen(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create lease")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full gap-2 bg-black hover:bg-black/90 text-white font-bold rounded-full shadow-none">
                    <FileText className="h-4 w-4" />
                    Create Lease
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create Lease Agreement</DialogTitle>
                        <DialogDescription>
                            Generate a lease for <span className="font-semibold">{propertyTitle}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start_date">Start Date</Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_date">End Date</Label>
                                <Input
                                    id="end_date"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="monthly_rent">Monthly Rent (N$)</Label>
                                <Input
                                    id="monthly_rent"
                                    type="number"
                                    value={rent}
                                    onChange={(e) => setRent(Number(e.target.value))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="deposit">Deposit (N$)</Label>
                                <Input
                                    id="deposit"
                                    type="number"
                                    value={deposit}
                                    onChange={(e) => setDeposit(Number(e.target.value))}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="bg-black hover:bg-black/90 text-white font-bold rounded-full shadow-none">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Creating...' : 'Create Lease'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
