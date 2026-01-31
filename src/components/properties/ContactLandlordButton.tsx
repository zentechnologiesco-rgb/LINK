'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { MessageCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ContactLandlordButtonProps {
    propertyId: string
    variant?: 'default' | 'mobile'
    className?: string
}

export function ContactLandlordButton({ propertyId, variant = 'default', className }: ContactLandlordButtonProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const getOrCreateInquiry = useMutation(api.inquiries.getOrCreateForProperty)

    const handleContact = async () => {
        setIsLoading(true)
        try {
            const inquiryId = await getOrCreateInquiry({
                propertyId: propertyId as Id<"properties">
            })
            router.push(`/chat?id=${inquiryId}`)
        } catch (error) {
            if (error instanceof Error && error.message === "Not authenticated") {
                toast.error("Please sign in to contact the landlord")
                router.push('/sign-in')
            } else {
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
                    "bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-full px-5 sm:px-6 h-10 sm:h-11 shadow-lg shadow-neutral-900/10 text-sm sm:text-base",
                    className
                )}
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <MessageCircle className="w-4 h-4 mr-2" />
                )}
                Contact Landlord
            </Button>
        )
    }

    return (
        <Button
            onClick={handleContact}
            disabled={isLoading}
            className={cn(
                "w-full h-10 sm:h-12 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-lg sm:rounded-xl mb-2 sm:mb-3 shadow-lg shadow-neutral-900/10 text-sm sm:text-base",
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
