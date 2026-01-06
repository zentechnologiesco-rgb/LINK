'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createInquiry } from '@/app/properties/actions'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, LogIn } from 'lucide-react'

interface InquiryDialogProps {
    propertyId: string
    propertyTitle: string
    mode: 'viewing' | 'message'
    trigger: React.ReactNode
    defaultMessage?: string
    onSuccess?: (inquiryId: string) => void
}

export function InquiryDialog({
    propertyId,
    propertyTitle,
    mode,
    trigger,
    defaultMessage = '',
    onSuccess
}: InquiryDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
    const router = useRouter()
    const supabase = createClient()

    // Check authentication status when dialog opens
    useEffect(() => {
        if (open) {
            supabase.auth.getUser().then(({ data: { user } }) => {
                setIsAuthenticated(!!user)
            })
        }
    }, [open, supabase.auth])

    const title = mode === 'viewing' ? 'Request a Viewing' : 'Send a Message'
    const description = mode === 'viewing'
        ? `Interested in ${propertyTitle}? Send a request to the landlord.`
        : `Have a question about ${propertyTitle}? Send a message to the landlord.`

    // Default messages
    const initialMessage = defaultMessage || (mode === 'viewing'
        ? `Hi, I'm interested in viewing ${propertyTitle}. When are you available?`
        : `Hi, I have a question about ${propertyTitle}.`)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)

        // Append property_id if not present (though we pass it to action handling)
        // Actually the action expects formData with property_id
        formData.append('property_id', propertyId)

        const result = await createInquiry(formData)

        setIsLoading(false)

        if (result?.error) {
            toast.error(result.error)
            // If user needs to login, we might want to redirect them
            if (result.error.includes('logged in')) {
                router.push('/sign-in')
            }
            return
        }

        if (result?.success) {
            setOpen(false)
            toast.success(mode === 'viewing' ? 'Viewing request sent!' : 'Message sent!')

            if (onSuccess && result.inquiryId) {
                onSuccess(result.inquiryId)
            }

            // Redirect to the unified chat page
            if (result.inquiryId) {
                router.push(`/chat?id=${result.inquiryId}`)
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>

                {/* Loading state while checking auth */}
                {isAuthenticated === null && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                )}

                {/* Not authenticated - show login prompt */}
                {isAuthenticated === false && (
                    <div className="py-6 space-y-4">
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                <LogIn className="h-6 w-6 text-gray-500" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Sign in required</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    You need to be signed in to {mode === 'viewing' ? 'request a viewing' : 'send a message'}.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 pt-2">
                            <Link href="/sign-in" className="w-full">
                                <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                                    Sign in
                                </Button>
                            </Link>
                            <Link href="/sign-up" className="w-full">
                                <Button variant="outline" className="w-full">
                                    Create an account
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}

                {/* Authenticated - show form */}
                {isAuthenticated === true && (
                    <form action={handleSubmit} className="space-y-4 py-4">
                        {mode === 'viewing' && (
                            <div className="grid gap-2">
                                <Label htmlFor="viewing_date">Preferred Viewing Date</Label>
                                <Input
                                    id="viewing_date"
                                    name="viewing_date"
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                                id="message"
                                name="message"
                                defaultValue={initialMessage}
                                rows={4}
                                required
                            />
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {mode === 'viewing' ? 'Send Request' : 'Send Message'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
