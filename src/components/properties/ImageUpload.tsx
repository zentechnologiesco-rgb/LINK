'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { X, Loader2, ImagePlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"

interface ImageUploadProps {
    maxImages?: number
    onImagesChange: (storageIds: Id<"_storage">[]) => void
    initialImages?: Id<"_storage">[]
}

export function ImageUpload({
    maxImages = 6,
    onImagesChange,
    initialImages = []
}: ImageUploadProps) {
    const [imageIds, setImageIds] = useState<Id<"_storage">[]>(initialImages)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState<number>(0)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const generateUploadUrl = useMutation(api.files.generateUploadUrl)
    const removeFile = useMutation(api.files.remove)

    // Query to get URLs for display
    const imageUrls = useQuery(api.files.getUrls, { storageIds: imageIds })

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        const remainingSlots = maxImages - imageIds.length
        if (files.length > remainingSlots) {
            toast.error(`You can only upload ${remainingSlots} more image(s)`)
            return
        }

        setUploading(true)
        setUploadProgress(0)

        const newIds: Id<"_storage">[] = []
        const totalFiles = files.length

        for (let i = 0; i < files.length; i++) {
            const file = files[i]

            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} is not an image`)
                continue
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} is too large (max 5MB)`)
                continue
            }

            try {
                // Get upload URL from Convex
                const uploadUrl = await generateUploadUrl()

                // Upload file to Convex storage
                const response = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': file.type },
                    body: file,
                })

                if (!response.ok) {
                    throw new Error('Upload failed')
                }

                const { storageId } = await response.json()
                newIds.push(storageId as Id<"_storage">)

                setUploadProgress(Math.round(((i + 1) / totalFiles) * 100))
            } catch (err) {
                console.error('Upload error:', err)
                toast.error(`Failed to upload ${file.name}`)
            }
        }

        if (newIds.length > 0) {
            const updatedIds = [...imageIds, ...newIds]
            setImageIds(updatedIds)
            onImagesChange(updatedIds)
            toast.success(`${newIds.length} image(s) uploaded successfully`)
        }

        setUploading(false)
        setUploadProgress(0)

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const removeImage = async (idToRemove: Id<"_storage">) => {
        try {
            await removeFile({ storageId: idToRemove })

            const updatedIds = imageIds.filter(id => id !== idToRemove)
            setImageIds(updatedIds)
            onImagesChange(updatedIds)
            toast.success('Image removed')
        } catch (err) {
            console.error('Delete error:', err)
            toast.error('Failed to delete image')
        }
    }

    // Build a map of storage ID to URL for display
    const urlMap = new Map<string, string>()
    imageUrls?.forEach(item => {
        if (item.url) {
            urlMap.set(item.id, item.url)
        }
    })

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={cn(
                    'rounded-xl border border-dashed p-6 text-center cursor-pointer transition-colors',
                    uploading
                        ? 'border-border bg-muted/30 cursor-not-allowed'
                        : 'border-border bg-muted/20 hover:bg-muted/30'
                )}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading || imageIds.length >= maxImages}
                />
                {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" strokeWidth={1.5} />
                        <p className="text-sm text-muted-foreground">Uploading... {uploadProgress}%</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <ImagePlus className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
                        <p className="text-sm font-medium">Click to upload images</p>
                        <p className="text-xs text-muted-foreground">
                            PNG, JPG up to 5MB • {imageIds.length}/{maxImages} uploaded
                        </p>
                    </div>
                )}
            </div>

            {/* Image Preview Grid */}
            {imageIds.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {imageIds.map((id, index) => {
                        const url = urlMap.get(id)
                        return (
                            <div
                                key={id}
                                className={cn(
                                    'relative rounded-xl overflow-hidden bg-muted/30 border group',
                                    index === 0 ? 'col-span-2 row-span-2 aspect-video' : 'aspect-square'
                                )}
                            >
                                {url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={url}
                                        alt={`Property image ${index + 1}`}
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                                {index === 0 && (
                                    <span className="absolute top-2 left-2 rounded-md bg-background/80 backdrop-blur px-2 py-1 text-xs font-medium text-foreground border">
                                        Main Photo
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        removeImage(id)
                                    }}
                                    className="absolute top-2 right-2 rounded-full bg-background/80 backdrop-blur border p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" strokeWidth={1.5} />
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
