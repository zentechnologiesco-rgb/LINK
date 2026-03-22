'use client'

import { useState } from 'react'
import { Heart, LogIn } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"

interface SavePropertyButtonProps {
    propertyId: string
    landlordId?: string
    initialSaved?: boolean
    className?: string
    variant?: 'default' | 'icon'
}

export function SavePropertyButton({
    propertyId,
    landlordId,
    initialSaved = false,
    className,
    variant = 'icon'
}: SavePropertyButtonProps) {
    const user = useQuery(api.users.currentUser)
    const serverIsSaved = useQuery(api.savedProperties.isSaved, { propertyId: propertyId as Id<"properties"> })
    const [localIsSaved, setLocalIsSaved] = useState<boolean | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [showLoginDialog, setShowLoginDialog] = useState(false)

    // Hide the heart if the user is the landlord of this exact property.
    if (user && landlordId && user._id === landlordId) {
        return null;
    }

    // Sync the derived real state
    const isSaved = localIsSaved !== null ? localIsSaved : (serverIsSaved ?? initialSaved)

    const toggleSave = useMutation(api.savedProperties.toggle)

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault() // Prevent link navigation if inside a card link
        e.stopPropagation()

        if (isLoading || serverIsSaved === undefined) return

        // Optimistic update
        const newState = !isSaved
        setLocalIsSaved(newState)
        setIsLoading(true)

        try {
            const result = await toggleSave({ propertyId: propertyId as Id<"properties"> })
            setLocalIsSaved(result)
            toast.success(result ? 'Property saved to favorites' : 'Property removed from favorites')
        } catch (error) {
            // Revert if error
            setLocalIsSaved(serverIsSaved)

            if (error instanceof Error) {
                if (error.message.includes('Authentication') || error.message.includes('Unauthenticated')) {
                    setShowLoginDialog(true)
                } else if (error.message.includes('OwnerCannotSave')) {
                    toast.error('You cannot save your own property')
                } else {
                    toast.error('Something went wrong. Please try again.')
                }
            } else {
                toast.error('An unexpected error occurred.')
            }
        } finally {
            // Once the mutation finishes, we could clear localIsSaved and rely purely on serverIsSaved.
            // But preserving it until the next server change is safer (Convex usually updates immediately).
            setIsLoading(false)
            setLocalIsSaved(null)
        }
    }

    const LoginDialog = (
        <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Save Property</DialogTitle>
                    <DialogDescription>
                        Sign in to save properties to your favorites list.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-6 space-y-4">
                    <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                            <LogIn className="h-6 w-6 text-gray-500" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Sign in required</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Create an account to save your favorite properties and access them anytime.
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
            </DialogContent>
        </Dialog>
    )

    if (variant === 'default') {
        return (
            <>
                <Button
                    variant="outline"
                    className={cn("gap-2", className)}
                    onClick={handleToggle}
                    disabled={isLoading}
                >
                    <Heart className={cn("h-4 w-4", isSaved ? "fill-red-500 text-red-500" : "")} />
                    {isSaved ? 'Saved' : 'Save Property'}
                </Button>
                {LoginDialog}
            </>
        )
    }

    return (
        <div onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
        }}>
            <Button
                size="icon"
                variant="secondary"
                className={cn(
                    "h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-white shadow-sm hover:bg-neutral-50 border border-neutral-100 transition-all hover:scale-105 active:scale-95",
                    isSaved ? "text-red-500" : "text-black",
                    className
                )}
                onClick={handleToggle}
                disabled={isLoading}
            >
                <Heart 
                    className={cn(
                        "h-5 w-5 transition-all duration-300", 
                        isSaved ? "fill-[#FF385C] text-[#FF385C] scale-110" : "text-black"
                    )} 
                    strokeWidth={2.5}
                />
                <span className="sr-only">{isSaved ? 'Unsave property' : 'Save property'}</span>
            </Button>
            {LoginDialog}
        </div>
    )
}

