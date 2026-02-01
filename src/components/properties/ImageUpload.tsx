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
    maxImages = 15,
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
                const uploadUrl = await generateUploadUrl({
                    contentType: file.type,
                    fileSize: file.size,
                })

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
        <div className="space-y-6">
            {/* Upload Area */}
            <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={cn(
                    'rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-300',
                    uploading
                        ? 'border-neutral-200 bg-neutral-50 cursor-not-allowed opacity-50'
                        : 'border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300'
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
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-10 w-10 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
                        <p className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-500">Uploading... {uploadProgress}%</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center">
                            <ImagePlus className="h-5 w-5 text-neutral-500" strokeWidth={1.5} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-neutral-900">Click to upload images</p>
                            <p className="text-[10px] font-mono font-bold uppercase tracking-wide text-neutral-400">
                                PNG, JPG up to 5MB • {imageIds.length}/{maxImages} uploaded
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Image Preview Grid */}
            {imageIds.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imageIds.map((id, index) => {
                        const url = urlMap.get(id)
                        return (
                            <div
                                key={id}
                                className={cn(
                                    'relative rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 group transition-all hover:shadow-lg hover:shadow-neutral-900/5',
                                    index === 0 ? 'col-span-2 row-span-2 aspect-[4/3]' : 'aspect-square'
                                )}
                            >
                                {url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={url}
                                        alt={`Property image ${index + 1}`}
                                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                                    </div>
                                )}
                                {index === 0 && (
                                    <span className="absolute top-4 left-4 rounded-full bg-neutral-900/90 backdrop-blur-md px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-white shadow-sm">
                                        Main Photo
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        removeImage(id)
                                    }}
                                    className="absolute top-3 right-3 rounded-full bg-white/90 backdrop-blur border border-neutral-200 p-2 opacity-0 group-hover:opacity-100 transition-all text-neutral-500 hover:text-red-500 hover:bg-white shadow-sm hover:scale-110"
                                >
                                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
