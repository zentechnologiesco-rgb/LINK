'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { MessageCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ContactLandlordButtonProps {
    propertyId: string
    landlordId?: string
    variant?: 'default' | 'mobile'
    className?: string
}

export function ContactLandlordButton({ propertyId, landlordId, variant = 'default', className }: ContactLandlordButtonProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [isLoading, setIsLoading] = useState(false)
    const getOrCreateInquiry = useMutation(api.inquiries.getOrCreateForProperty)
    const currentUser = useQuery(api.users.currentUser)

    // Don't show the button if the current user is the landlord
    if (landlordId && currentUser && currentUser._id === landlordId) {
        return null
    }

    const handleContact = async () => {
        setIsLoading(true)
        try {
            const inquiryId = await getOrCreateInquiry({
                propertyId: propertyId as Id<"properties">
            })
            router.push(`/chat?id=${inquiryId}`)
        } catch (error) {
            // Check for authentication error - Convex may format errors differently
            const errorMessage = error instanceof Error ? error.message : String(error)
            if (errorMessage.includes("Not authenticated")) {
                toast.error("Please sign in to contact the landlord")
                // Redirect to sign-in with the current page as the redirect destination
                const redirectUrl = encodeURIComponent(pathname)
                router.push(`/sign-in?redirect=${redirectUrl}`)
            } else if (errorMessage.includes("cannot contact yourself")) {
                // Landlord trying to contact themselves - silently ignore
                toast.error("You cannot message yourself on your own property")
            } else {
                console.error("Failed to contact landlord:", error)
                toast.error("Failed to start conversation")
            }
        } finally {
            setIsLoading(false)
        }
    }

    if (variant === 'mobile') {
        return (
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
                ) : (
                    <MessageCircle className="w-4 h-4 mr-2" />
                )}
                Contact
            </Button>
        )
    }

    return (
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
    )
}
