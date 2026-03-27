'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { MessageCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useUser } from '@/components/providers/UserProvider'

interface ContactLandlordButtonProps {
    propertyId: string
    unitId?: string
    landlordId?: string
    variant?: 'default' | 'mobile'
    className?: string
}

export function ContactLandlordButton({ propertyId, unitId, landlordId, variant = 'default', className }: ContactLandlordButtonProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [isLoading, setIsLoading] = useState(false)
    const [showLoginDialog, setShowLoginDialog] = useState(false)

    const getExistingInquiry = useMutation(api.inquiries.getExistingForProperty)
    const { user: currentUser } = useUser()

    // Don't show the button if the current user is the landlord
    if (landlordId && currentUser && currentUser._id === landlordId) {
        return null
    }

    const handleContact = async () => {
        if (!currentUser) {
            setShowLoginDialog(true)
            return
        }

        setIsLoading(true)
        try {
            const inquiryId = await getExistingInquiry({
                propertyId: propertyId as Id<"properties">,
                unitId: unitId ? unitId as Id<"propertyUnits"> : undefined,
            })

            if (inquiryId) {
                const params = new URLSearchParams({
                    kind: 'inquiry',
                    id: inquiryId,
                })

                router.push(`/chat?${params.toString()}`)
                return
            }

            const params = new URLSearchParams({
                propertyId,
            })

            if (unitId) {
                params.set('unitId', unitId)
            }

            router.push(`/chat?${params.toString()}`)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            if (errorMessage.includes("Not authenticated")) {
                setShowLoginDialog(true)
            } else if (errorMessage.includes("cannot contact yourself")) {
                toast.error("You cannot message yourself on your own property")
            } else {
                console.error("Failed to contact landlord:", error)
                toast.error("Failed to start conversation")
            }
        } finally {
            setIsLoading(false)
        }
    }

    const AuthRequiredDialog = (
        <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
            <DialogContent 
                showCloseButton={false}
                className="top-auto bottom-8 left-1/2 right-auto -translate-x-1/2 translate-y-0 w-[calc(100%-32px)] max-w-[380px] gap-0 overflow-hidden rounded-[32px] border border-neutral-200/60 bg-white/95 backdrop-blur-2xl p-0 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.2)]"
            >
                <div className="p-7">
                    {/* Centered Copy */}
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="h-14 w-14 mb-4 rounded-full bg-neutral-100 flex items-center justify-center border border-neutral-200/50">
                            <MessageCircle className="h-6 w-6 text-neutral-900" />
                        </div>
                        <DialogTitle className="text-[22px] font-bold tracking-tight text-neutral-900 leading-tight">
                            Message the host
                        </DialogTitle>
                        <DialogDescription className="text-[15px] font-medium text-neutral-500 mt-2 leading-snug px-2">
                            Log in or sign up to directly contact the property owner and ask questions.
                        </DialogDescription>
                    </div>

                    {/* Thick Apple Actions Stack */}
                    <div className="flex flex-col gap-3">
                        <Link href={`/sign-up?redirect=${encodeURIComponent(pathname)}`} className="outline-none" onClick={() => setShowLoginDialog(false)}>
                            <button className="w-full h-[52px] rounded-[16px] bg-black text-[17px] font-bold tracking-tight text-white hover:bg-neutral-800 active:scale-[0.98] transition-all flex items-center justify-center outline-none select-none shadow-sm">
                                Create an account
                            </button>
                        </Link>
                        <Link href={`/sign-in?redirect=${encodeURIComponent(pathname)}`} className="outline-none" onClick={() => setShowLoginDialog(false)}>
                            <button className="w-full h-[52px] rounded-[16px] bg-neutral-100/80 text-[17px] font-bold tracking-tight text-neutral-900 hover:bg-neutral-200 active:scale-[0.98] transition-all flex items-center justify-center outline-none select-none">
                                Log in
                            </button>
                        </Link>
                        <button
                            onClick={() => setShowLoginDialog(false)}
                            className="text-[15px] font-semibold text-neutral-400 hover:text-neutral-600 mt-2 active:scale-95 transition-all outline-none"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )

    if (variant === 'mobile') {
        return (
            <>
                <Button
                    onClick={handleContact}
                    disabled={isLoading}
                    className={cn(
                        "bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-lg px-6 h-11",
                        className
                    )}
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Book
                </Button>
                {AuthRequiredDialog}
            </>
        )
    }

    return (
        <>
            <Button
                onClick={handleContact}
                disabled={isLoading}
                className={cn(
                    "w-full h-12 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-lg",
                    className
                )}
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <MessageCircle className="w-4 h-4 mr-2" />
                )}
                Send Message
            </Button>
            {AuthRequiredDialog}
        </>
    )
}
