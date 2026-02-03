'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { X, Loader2, ImagePlus, Sparkles, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { compressImage, formatBytes, getCompressionPreset } from '@/lib/imageCompression'

interface ImageUploadProps {
    maxImages?: number
    onImagesChange: (storageIds: Id<"_storage">[]) => void
    initialImages?: Id<"_storage">[]
}

type UploadPhase = 'idle' | 'compressing' | 'uploading'

interface UploadStats {
    originalSize: number
    compressedSize: number
    savedBytes: number
}

export function ImageUpload({
    maxImages = 15,
    onImagesChange,
    initialImages = []
}: ImageUploadProps) {
    const [imageIds, setImageIds] = useState<Id<"_storage">[]>(initialImages)
    const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle')
    const [progress, setProgress] = useState<number>(0)
    const [currentFile, setCurrentFile] = useState<string>('')
    const [uploadStats, setUploadStats] = useState<UploadStats | null>(null)
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

        const fileArray = Array.from(files)
        const totalFiles = fileArray.length
        const newIds: Id<"_storage">[] = []

        let totalOriginal = 0
        let totalCompressed = 0

        // Get compression preset for property images (gallery quality)
        const compressionOptions = getCompressionPreset('gallery')

        for (let i = 0; i < fileArray.length; i++) {
            const file = fileArray[i]
            setCurrentFile(file.name)

            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} is not an image`)
                continue
            }

            // Validate file size (max 10MB for originals, we'll compress them)
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`${file.name} is too large (max 10MB)`)
                continue
            }

            try {
                // Phase 1: Compress the image
                setUploadPhase('compressing')
                setProgress(Math.round((i / totalFiles) * 50))

                const compressionResult = await compressImage(file, compressionOptions)

                totalOriginal += compressionResult.originalSize
                totalCompressed += compressionResult.compressedSize

                // Determine content type for the compressed blob
                const contentType = compressionResult.format

                // Phase 2: Upload the compressed image
                setUploadPhase('uploading')
                setProgress(Math.round(50 + (i / totalFiles) * 50))

                // Get upload URL from Convex
                const uploadUrl = await generateUploadUrl({
                    contentType,
                    fileSize: compressionResult.compressedSize,
                })

                // Upload compressed file to Convex storage
                const response = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': contentType },
                    body: compressionResult.blob,
                })

                if (!response.ok) {
                    throw new Error('Upload failed')
                }

                const { storageId } = await response.json()
                newIds.push(storageId as Id<"_storage">)

                setProgress(Math.round(50 + ((i + 1) / totalFiles) * 50))
            } catch (err) {
                console.error('Upload error:', err)
                toast.error(`Failed to upload ${file.name}`)
            }
        }

        if (newIds.length > 0) {
            const updatedIds = [...imageIds, ...newIds]
            setImageIds(updatedIds)
            onImagesChange(updatedIds)

            const savedBytes = totalOriginal - totalCompressed
            const savingsPercent = totalOriginal > 0 ? Math.round((savedBytes / totalOriginal) * 100) : 0

            setUploadStats({
                originalSize: totalOriginal,
                compressedSize: totalCompressed,
                savedBytes,
            })

            toast.success(
                `${newIds.length} image(s) uploaded • Saved ${formatBytes(savedBytes)} (${savingsPercent}% smaller)`,
                { duration: 5000 }
            )
        }

        setUploadPhase('idle')
        setProgress(0)
        setCurrentFile('')

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

    const isProcessing = uploadPhase !== 'idle'

    return (
        <div className="space-y-6">
            {/* Upload Area */}
            <div
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                className={cn(
                    'rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-300',
                    isProcessing
                        ? 'border-neutral-200 bg-neutral-50 cursor-not-allowed'
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
                    disabled={isProcessing || imageIds.length >= maxImages}
                />
                {isProcessing ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="h-12 w-12 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
                            {uploadPhase === 'compressing' && (
                                <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-amber-500 animate-pulse" />
                            )}
                            {uploadPhase === 'uploading' && (
                                <Zap className="absolute inset-0 m-auto h-5 w-5 text-emerald-500 animate-pulse" />
                            )}
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-700">
                                {uploadPhase === 'compressing' ? 'Optimizing...' : 'Uploading...'} {progress}%
                            </p>
                            {currentFile && (
                                <p className="text-[10px] font-mono text-neutral-400 truncate max-w-[200px]">
                                    {currentFile}
                                </p>
                            )}
                        </div>
                        {/* Progress bar */}
                        <div className="w-full max-w-xs h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full transition-all duration-300 rounded-full",
                                    uploadPhase === 'compressing' ? 'bg-amber-500' : 'bg-emerald-500'
                                )}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center">
                            <ImagePlus className="h-5 w-5 text-neutral-500" strokeWidth={1.5} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-neutral-900">Click to upload images</p>
                            <p className="text-[10px] font-mono font-bold uppercase tracking-wide text-neutral-400">
                                PNG, JPG up to 10MB • Auto-optimized • {imageIds.length}/{maxImages}
                            </p>
                        </div>
                        {uploadStats && uploadStats.savedBytes > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full">
                                <Sparkles className="h-3 w-3 text-emerald-600" />
                                <span className="text-[10px] font-mono font-bold text-emerald-700">
                                    Last upload saved {formatBytes(uploadStats.savedBytes)} bandwidth
                                </span>
                            </div>
                        )}
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
                                        loading="lazy"
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
