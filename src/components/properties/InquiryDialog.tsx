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
import { Loader2, Send, Calendar } from 'lucide-react'
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"

interface InquiryDialogProps {
    propertyId: string
    propertyTitle: string
    mode: 'viewing' | 'message'
    trigger: React.ReactNode
}

export function InquiryDialog({ propertyId, propertyTitle, mode, trigger }: InquiryDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState(
        mode === 'viewing'
            ? "I'm interested in viewing this property. Please let me know when it's available."
            : ""
    )
    const [moveInDate, setMoveInDate] = useState('')
    const [phone, setPhone] = useState('')

    const createInquiry = useMutation(api.inquiries.create)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!message) return

        setIsLoading(true)
        try {
            await createInquiry({
                propertyId: propertyId as Id<"properties">,
                message,
                moveInDate: moveInDate || undefined,
                phone: phone || undefined,
            })

            toast.success(mode === 'viewing' ? 'Viewing request sent!' : 'Message sent!')
            setOpen(false)
            // Reset form?
            if (mode === 'message') setMessage('')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to send inquiry")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            {mode === 'viewing' ? 'Request a Viewing' : 'Contact Landlord'}
                        </DialogTitle>
                        <DialogDescription>
                            {mode === 'viewing'
                                ? `Send a request to view ${propertyTitle}.`
                                : `Send a message about ${propertyTitle}.`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Hi, I am interested in this property..."
                                rows={4}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number (Optional)</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+264..."
                            />
                        </div>

                        {mode === 'viewing' && (
                            <div className="space-y-2">
                                <Label htmlFor="move-in">Desired Move-in Date (Optional)</Label>
                                <div className="relative">
                                    <Input
                                        id="move-in"
                                        type="date"
                                        value={moveInDate}
                                        onChange={(e) => setMoveInDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Sending...' : 'Send Message'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
