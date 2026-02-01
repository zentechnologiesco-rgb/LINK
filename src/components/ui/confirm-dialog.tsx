'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
    trigger: React.ReactNode
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive'
    onConfirm: () => Promise<void> | void
    disabled?: boolean
}

export function ConfirmDialog({
    trigger,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
    onConfirm,
    disabled = false,
}: ConfirmDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleConfirm = async () => {
        setIsLoading(true)
        try {
            await onConfirm()
            setOpen(false)
        } catch (error) {
            // Error handling should be done in the onConfirm callback
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild disabled={disabled}>
                {trigger}
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl border border-neutral-200">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-semibold">{title}</AlertDialogTitle>
                    <AlertDialogDescription className="text-neutral-500">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel
                        className="rounded-lg border-neutral-200"
                        disabled={isLoading}
                    >
                        {cancelText}
                    </AlertDialogCancel>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        variant={variant}
                        className={cn(
                            "rounded-lg",
                            variant === 'default' && "bg-neutral-900 hover:bg-neutral-800 text-white"
                        )}
                    >
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        {confirmText}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

// Hook for programmatic confirmation dialogs
export function useConfirmDialog() {
    const [dialogState, setDialogState] = useState<{
        open: boolean
        title: string
        description: string
        confirmText: string
        variant: 'default' | 'destructive'
        onConfirm: () => Promise<void> | void
    }>({
        open: false,
        title: '',
        description: '',
        confirmText: 'Confirm',
        variant: 'default',
        onConfirm: () => { },
    })
    const [isLoading, setIsLoading] = useState(false)

    const confirm = (options: {
        title: string
        description: string
        confirmText?: string
        variant?: 'default' | 'destructive'
        onConfirm: () => Promise<void> | void
    }) => {
        setDialogState({
            open: true,
            title: options.title,
            description: options.description,
            confirmText: options.confirmText || 'Confirm',
            variant: options.variant || 'default',
            onConfirm: options.onConfirm,
        })
    }

    const handleConfirm = async () => {
        setIsLoading(true)
        try {
            await dialogState.onConfirm()
            setDialogState(prev => ({ ...prev, open: false }))
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const ConfirmDialogComponent = (
        <AlertDialog open={dialogState.open} onOpenChange={(open) => setDialogState(prev => ({ ...prev, open }))}>
            <AlertDialogContent className="rounded-2xl border border-neutral-200">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-semibold">{dialogState.title}</AlertDialogTitle>
                    <AlertDialogDescription className="text-neutral-500">
                        {dialogState.description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel
                        className="rounded-lg border-neutral-200"
                        disabled={isLoading}
                    >
                        Cancel
                    </AlertDialogCancel>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        variant={dialogState.variant}
                        className={cn(
                            "rounded-lg",
                            dialogState.variant === 'default' && "bg-neutral-900 hover:bg-neutral-800 text-white"
                        )}
                    >
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        {dialogState.confirmText}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )

    return { confirm, ConfirmDialogComponent }
}
