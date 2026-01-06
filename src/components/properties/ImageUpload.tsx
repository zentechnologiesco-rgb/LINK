'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { X, Loader2, ImagePlus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
    userId: string
    maxImages?: number
    onImagesChange: (urls: string[]) => void
    initialImages?: string[]
}

export function ImageUpload({
    userId,
    maxImages = 6,
    onImagesChange,
    initialImages = []
}: ImageUploadProps) {
    const [images, setImages] = useState<string[]>(initialImages)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState<number>(0)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        const remainingSlots = maxImages - images.length
        if (files.length > remainingSlots) {
            toast.error(`You can only upload ${remainingSlots} more image(s)`)
            return
        }

        setUploading(true)
        setUploadProgress(0)

        const newUrls: string[] = []
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
                // Generate unique filename
                const fileExt = file.name.split('.').pop()
                const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

                const { data, error } = await supabase.storage
                    .from('property_images')
                    .upload(fileName, file, {
                        cacheControl: '3600',
                        upsert: false
                    })

                if (error) {
                    console.error('Upload error:', error)
                    toast.error(`Failed to upload ${file.name}`)
                    continue
                }

                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('property_images')
                    .getPublicUrl(data.path)

                if (urlData.publicUrl) {
                    newUrls.push(urlData.publicUrl)
                }

                setUploadProgress(Math.round(((i + 1) / totalFiles) * 100))
            } catch (err) {
                console.error('Upload error:', err)
                toast.error(`Failed to upload ${file.name}`)
            }
        }

        if (newUrls.length > 0) {
            const updatedImages = [...images, ...newUrls]
            setImages(updatedImages)
            onImagesChange(updatedImages)
            toast.success(`${newUrls.length} image(s) uploaded successfully`)
        }

        setUploading(false)
        setUploadProgress(0)

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const removeImage = async (urlToRemove: string) => {
        // Extract path from URL
        const urlParts = urlToRemove.split('/property_images/')
        if (urlParts.length < 2) {
            // Just remove from state if we can't parse the path
            const updatedImages = images.filter(url => url !== urlToRemove)
            setImages(updatedImages)
            onImagesChange(updatedImages)
            return
        }

        const path = urlParts[1]

        try {
            const { error } = await supabase.storage
                .from('property_images')
                .remove([path])

            if (error) {
                console.error('Delete error:', error)
                toast.error('Failed to delete image')
                return
            }

            const updatedImages = images.filter(url => url !== urlToRemove)
            setImages(updatedImages)
            onImagesChange(updatedImages)
            toast.success('Image removed')
        } catch (err) {
            console.error('Delete error:', err)
            toast.error('Failed to delete image')
        }
    }

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={cn(
                    'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
                    uploading
                        ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                )}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading || images.length >= maxImages}
                />
                {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        <p className="text-sm text-gray-500">Uploading... {uploadProgress}%</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <ImagePlus className="h-8 w-8 text-gray-400" />
                        <p className="text-sm font-medium text-gray-600">Click to upload images</p>
                        <p className="text-xs text-gray-400">
                            PNG, JPG up to 5MB • {images.length}/{maxImages} uploaded
                        </p>
                    </div>
                )}
            </div>

            {/* Image Preview Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {images.map((url, index) => (
                        <div
                            key={url}
                            className={cn(
                                'relative rounded-lg overflow-hidden bg-gray-100 group',
                                index === 0 ? 'col-span-2 row-span-2 aspect-video' : 'aspect-square'
                            )}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={url}
                                alt={`Property image ${index + 1}`}
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                            {index === 0 && (
                                <span className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                    Main Photo
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    removeImage(url)
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
