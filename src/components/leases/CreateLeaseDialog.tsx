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
import { createLease } from '@/app/(dashboard)/landlord/leases/actions'
import { toast } from 'sonner'
import { Loader2, FileText } from 'lucide-react'

interface CreateLeaseDialogProps {
    propertyId: string
    tenantId: string
    propertyTitle: string
    monthlyRent: number
}

export function CreateLeaseDialog({ propertyId, tenantId, propertyTitle, monthlyRent }: CreateLeaseDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Default dates: today + 1 year
    const today = new Date().toISOString().split('T')[0]
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        formData.append('property_id', propertyId)
        formData.append('tenant_id', tenantId)

        const result = await createLease(formData)

        if (result?.error) {
            toast.error(result.error)
            setIsLoading(false)
        } else {
            toast.success('Lease created successfully!')
            setOpen(false)
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full gap-2 bg-green-600 hover:bg-green-700">
                    <FileText className="h-4 w-4" />
                    Create Lease
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form action={handleSubmit}>
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
                                <Input id="start_date" name="start_date" type="date" defaultValue={today} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_date">End Date</Label>
                                <Input id="end_date" name="end_date" type="date" defaultValue={nextYear} required />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="monthly_rent">Monthly Rent (N$)</Label>
                                <Input id="monthly_rent" name="monthly_rent" type="number" defaultValue={monthlyRent} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="deposit">Deposit (N$)</Label>
                                <Input id="deposit" name="deposit" type="number" defaultValue={monthlyRent} required />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Creating...' : 'Create Lease'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
