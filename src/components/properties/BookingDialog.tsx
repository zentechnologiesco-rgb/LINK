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
import { createInquiry } from '@/app/properties/actions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface BookingDialogProps {
    propertyId: string
    propertyTitle: string
}

export function BookingDialog({ propertyId, propertyTitle }: BookingDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        // Append property_id to formData
        formData.append('property_id', propertyId)

        const result = await createInquiry(formData)

        if (result?.error) {
            toast.error(result.error)
            setIsLoading(false)
        } else {
            toast.success('Inquiry sent successfully!')
            setOpen(false)
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full h-11 bg-black hover:bg-zinc-800 text-lg font-medium">
                    Book Viewing
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form action={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Book a Viewing</DialogTitle>
                        <DialogDescription>
                            Send a message to the landlord to request a viewing for <span className="font-semibold">{propertyTitle}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                                id="message"
                                name="message"
                                defaultValue="Hi, I'm interested in this property. Is it available for a viewing?"
                                required
                                minLength={10}
                                className="h-32"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number (Optional)</Label>
                            <Input
                                id="phone"
                                name="phone"
                                placeholder="+264 81 123 4567"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Sending...' : 'Send Request'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
