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
import { togglePropertySave } from '@/actions/saved-properties'
import { toast } from 'sonner'

interface SavePropertyButtonProps {
    propertyId: string
    initialSaved?: boolean
    className?: string
    variant?: 'default' | 'icon'
}

export function SavePropertyButton({
    propertyId,
    initialSaved = false,
    className,
    variant = 'icon'
}: SavePropertyButtonProps) {
    const [isSaved, setIsSaved] = useState(initialSaved)
    const [isLoading, setIsLoading] = useState(false)
    const [showLoginDialog, setShowLoginDialog] = useState(false)

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault() // Prevent link navigation if inside a card link
        e.stopPropagation()

        if (isLoading) return

        // Optimistic update
        const newState = !isSaved
        setIsSaved(newState)
        setIsLoading(true)

        try {
            const result = await togglePropertySave(propertyId)

            if (result.error) {
                // Revert if error
                setIsSaved(!newState)

                // If user needs to log in, show login dialog
                if (result.error.includes('logged in')) {
                    setShowLoginDialog(true)
                } else {
                    toast.error(result.error)
                }
            } else if (result.saved !== undefined) {
                // Confirm state from server
                setIsSaved(result.saved)
                toast.success(result.saved ? 'Property saved' : 'Property removed from saved')
            }
        } catch (error) {
            setIsSaved(!newState)
            toast.error('Something went wrong')
        } finally {
            setIsLoading(false)
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
        <>
            <Button
                size="icon"
                variant="secondary"
                className={cn(
                    "h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-all hover:scale-105",
                    isSaved ? "text-red-500 bg-white" : "text-gray-700",
                    className
                )}
                onClick={handleToggle}
                disabled={isLoading}
            >
                <Heart className={cn("h-4 w-4 transition-colors", isSaved ? "fill-current" : "")} />
                <span className="sr-only">{isSaved ? 'Unsave property' : 'Save property'}</span>
            </Button>
            {LoginDialog}
        </>
    )
}

