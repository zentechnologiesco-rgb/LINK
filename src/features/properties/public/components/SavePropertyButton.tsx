'use client'

import { useState } from 'react'
import { Heart } from '@/components/ui/icons'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"
import { useUser } from '@/components/providers/UserProvider'
import { useSavedProperties } from '@/components/providers/SavedPropertiesProvider'

interface SavePropertyButtonProps {
    propertyId: string
    landlordId?: string
    initialSaved?: boolean
    className?: string
    variant?: 'default' | 'icon' | 'discover'
}

export function SavePropertyButton({
    propertyId,
    landlordId,
    initialSaved = false,
    className,
    variant = 'icon'
}: SavePropertyButtonProps) {
    const { user } = useUser()
    const { savedPropertyIds, isLoading: isLoadingSavedProperties, setSavedState } = useSavedProperties()
    const toggleSave = useMutation(api.savedProperties.toggle)
    const [isLoading, setIsLoading] = useState(false)
    const [showLoginDialog, setShowLoginDialog] = useState(false)

    // Hide the heart if the user is the landlord of this exact property.
    if (user && landlordId && user._id === landlordId) {
        return null;
    }

    const isSaved = savedPropertyIds.has(propertyId) || (initialSaved && (!user || isLoadingSavedProperties))

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault() // Prevent link navigation if inside a card link
        e.stopPropagation()

        if (!user) {
            setShowLoginDialog(true)
            return
        }

        if (isLoading || isLoadingSavedProperties) return

        // Optimistic update
        const newState = !isSaved
        setSavedState(propertyId, newState)
        setIsLoading(true)

        try {
            const result = await toggleSave({ propertyId: propertyId as Id<"properties"> })
            setSavedState(propertyId, result)
            toast.success(result ? 'Property saved to favorites' : 'Property removed from favorites')
        } catch (error) {
            // Revert if error
            setSavedState(propertyId, isSaved)

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
            setIsLoading(false)
        }
    }

    const LoginDialog = (
        <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
            <DialogContent 
                showCloseButton={false}
                className="top-auto bottom-8 left-1/2 right-auto -translate-x-1/2 translate-y-0 w-[calc(100%-32px)] max-w-[380px] gap-0 overflow-hidden rounded-[32px] border border-neutral-200/60 bg-white/95 backdrop-blur-2xl p-0 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.2)]"
            >
                <div className="p-7">
                    {/* Centered Copy */}
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="h-14 w-14 mb-4 rounded-full bg-neutral-100 flex items-center justify-center border border-neutral-200/50">
                            <Heart className="h-6 w-6 text-red-500 fill-red-500" />
                        </div>
                        <DialogTitle className="text-[22px] font-bold tracking-tight text-neutral-900 leading-tight">
                            Save this home
                        </DialogTitle>
                        <DialogDescription className="text-[15px] font-medium text-neutral-500 mt-2 leading-snug px-2">
                            Sign in to save properties to your favorites and pick up right where you left off.
                        </DialogDescription>
                    </div>

                    {/* Thick Apple Actions Stack */}
                    <div className="flex flex-col gap-3">
                        <Link href="/sign-up" className="outline-none" onClick={() => setShowLoginDialog(false)}>
                            <button className="w-full h-[52px] rounded-[16px] bg-black text-[17px] font-bold tracking-tight text-white hover:bg-neutral-800 active:scale-[0.98] transition-all flex items-center justify-center outline-none select-none shadow-sm">
                                Create an account
                            </button>
                        </Link>
                        <Link href="/sign-in" className="outline-none" onClick={() => setShowLoginDialog(false)}>
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

    if (variant === 'default') {
        return (
            <>
                <Button
                    variant="outline"
                    className={cn("gap-2", className)}
                    onClick={handleToggle}
                    disabled={isLoading || (Boolean(user) && isLoadingSavedProperties)}
                >
                    <Heart className={cn("h-4 w-4", isSaved ? "fill-red-500 text-red-500" : "")} />
                    {isSaved ? 'Saved' : 'Save Property'}
                </Button>
                {LoginDialog}
            </>
        )
    }

    if (variant === 'discover') {
        return (
            <div onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
            }}>
                <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                        "h-12 w-12 rounded-full border border-white/20 bg-black/20 hover:bg-black/30 backdrop-blur-md p-0 text-white transition-all active:scale-95",
                        className
                    )}
                    onClick={handleToggle}
                    disabled={isLoading || (Boolean(user) && isLoadingSavedProperties)}
                >
                    <Heart
                        className={cn(
                            "h-[26px] w-[26px] transition-all duration-300 drop-shadow-md",
                            isSaved ? "fill-[#FF385C] text-[#FF385C] scale-110 drop-shadow-none" : "text-white"
                        )}
                        strokeWidth={isSaved ? 0 : 2}
                    />
                    <span className="sr-only">{isSaved ? 'Unsave property' : 'Save property'}</span>
                </Button>
                {LoginDialog}
            </div>
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
                disabled={isLoading || (Boolean(user) && isLoadingSavedProperties)}
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

