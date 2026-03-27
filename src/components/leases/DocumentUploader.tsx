'use client'

import { useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Eye, Loader2, Upload } from 'lucide-react'

interface DocumentUploaderProps {
    type: string
    currentStorageId?: Id<"_storage">
    disabled?: boolean
    onUploadComplete: (storageId: Id<"_storage">) => void
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_FILE_SIZE = 5 * 1024 * 1024

export function DocumentUploader({
    type,
    currentStorageId,
    disabled,
    onUploadComplete,
}: DocumentUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)

    const generateUploadUrl = useMutation(api.files.generateUploadUrl)
    const registerUpload = useMutation(api.files.registerUpload)
    const fileUrls = useQuery(
        api.files.getUrls,
        currentStorageId ? { storageIds: [currentStorageId] } : "skip",
    )
    const fileUrl = fileUrls?.[0]?.url ?? null

    const handleUpload = async (file?: File) => {
        if (!file) return

        if (!ACCEPTED_TYPES.includes(file.type)) {
            toast.error('Upload a JPG, PNG, WebP, or PDF file.')
            return
        }

        if (file.size > MAX_FILE_SIZE) {
            toast.error('Upload a file smaller than 5 MB.')
            return
        }

        setIsUploading(true)

        try {
            const postUrl = await generateUploadUrl({
                contentType: file.type,
                fileSize: file.size,
            })

            const response = await fetch(postUrl, {
                method: 'POST',
                headers: { 'Content-Type': file.type },
                body: file,
            })

            if (!response.ok) {
                throw new Error('Upload failed')
            }

            const { storageId } = await response.json()
            await registerUpload({ storageId: storageId as Id<"_storage"> })
            onUploadComplete(storageId as Id<"_storage">)
            toast.success('Document uploaded.')
        } catch (error) {
            console.error(`Failed to upload ${type}`, error)
            toast.error('Upload failed. Please try again.')
        } finally {
            setIsUploading(false)
            if (inputRef.current) {
                inputRef.current.value = ''
            }
        }
    }

    return (
        <div className="flex items-center gap-2">
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={(event) => handleUpload(event.target.files?.[0])}
                disabled={disabled || isUploading}
            />

            <Button
                type="button"
                variant={currentStorageId ? 'outline' : 'default'}
                onClick={() => inputRef.current?.click()}
                disabled={disabled || isUploading}
                className={cn(
                    'h-10 rounded-full px-4 text-sm font-medium shadow-none',
                    currentStorageId
                        ? 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                        : 'bg-neutral-900 text-white hover:bg-neutral-800'
                )}
            >
                {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <>
                        <Upload className="mr-1.5 h-4 w-4" />
                        {currentStorageId ? 'Re-upload' : 'Upload'}
                    </>
                )}
            </Button>

            {fileUrl && (
                <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => window.open(fileUrl, '_blank', 'noopener,noreferrer')}
                className="h-10 w-10 rounded-full border border-neutral-200 text-neutral-500 shadow-none hover:bg-neutral-50 hover:text-neutral-900"
            >
                <Eye className="h-4 w-4" />
                <span className="sr-only">View uploaded document</span>
                </Button>
            )}
        </div>
    )
}
