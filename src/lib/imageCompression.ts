"use client"

/**
 * Image Compression Utility
 * 
 * Compresses images on the client-side before upload to reduce:
 * - Upload time
 * - Storage costs
 * - Download bandwidth
 * 
 * Target: Reduce 2-5MB images to 150-300KB while maintaining visual quality
 */

export interface CompressionOptions {
    /** Maximum width or height in pixels (default: 2000) */
    maxDimension?: number
    /** Output quality 0-1 (default: 0.8) */
    quality?: number
    /** Output format (default: 'image/webp') */
    outputFormat?: 'image/webp' | 'image/jpeg'
    /** Maximum file size in bytes (default: 500KB) */
    maxFileSize?: number
}

export interface CompressionResult {
    blob: Blob
    originalSize: number
    compressedSize: number
    compressionRatio: number
    width: number
    height: number
    format: string
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
    maxDimension: 2000,
    quality: 0.8,
    outputFormat: 'image/webp',
    maxFileSize: 500 * 1024, // 500KB
}

/**
 * Load an image file into an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            URL.revokeObjectURL(img.src)
            resolve(img)
        }
        img.onerror = () => {
            URL.revokeObjectURL(img.src)
            reject(new Error('Failed to load image'))
        }
        img.src = URL.createObjectURL(file)
    })
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
function calculateDimensions(
    width: number,
    height: number,
    maxDimension: number
): { width: number; height: number } {
    if (width <= maxDimension && height <= maxDimension) {
        return { width, height }
    }

    const ratio = Math.min(maxDimension / width, maxDimension / height)
    return {
        width: Math.round(width * ratio),
        height: Math.round(height * ratio),
    }
}

/**
 * Compress an image file using Canvas API
 */
export async function compressImage(
    file: File,
    options: CompressionOptions = {}
): Promise<CompressionResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options }
    const originalSize = file.size

    // Skip compression for already small files (under 100KB)
    if (file.size < 100 * 1024) {
        return {
            blob: file,
            originalSize,
            compressedSize: file.size,
            compressionRatio: 1,
            width: 0,
            height: 0,
            format: file.type,
        }
    }

    // Load the image
    const img = await loadImage(file)
    const { width: originalWidth, height: originalHeight } = img

    // Calculate new dimensions
    const { width, height } = calculateDimensions(
        originalWidth,
        originalHeight,
        opts.maxDimension
    )

    // Create canvas and draw resized image
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
        throw new Error('Failed to get canvas context')
    }

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Draw the image
    ctx.drawImage(img, 0, 0, width, height)

    // Try WebP first, fall back to JPEG if not supported
    let blob: Blob | null = null
    let format = opts.outputFormat

    // Convert to blob with specified quality
    blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, format, opts.quality)
    })

    // If WebP failed or resulted in larger file, try JPEG
    if (!blob || (format === 'image/webp' && blob.size > file.size * 0.9)) {
        format = 'image/jpeg'
        blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, format, opts.quality)
        })
    }

    if (!blob) {
        throw new Error('Failed to compress image')
    }

    // If still too large, reduce quality progressively
    let quality = opts.quality
    while (blob.size > opts.maxFileSize && quality > 0.3) {
        quality -= 0.1
        blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, format, quality)
        })
        if (!blob) break
    }

    if (!blob) {
        throw new Error('Failed to compress image to target size')
    }

    return {
        blob,
        originalSize,
        compressedSize: blob.size,
        compressionRatio: originalSize / blob.size,
        width,
        height,
        format,
    }
}

/**
 * Compress multiple images with progress callback
 */
export async function compressImages(
    files: File[],
    options: CompressionOptions = {},
    onProgress?: (completed: number, total: number, currentFile: string) => void
): Promise<CompressionResult[]> {
    const results: CompressionResult[] = []
    const total = files.length

    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        onProgress?.(i, total, file.name)

        try {
            const result = await compressImage(file, options)
            results.push(result)
        } catch (error) {
            console.error(`Failed to compress ${file.name}:`, error)
            // Return original file on error
            results.push({
                blob: file,
                originalSize: file.size,
                compressedSize: file.size,
                compressionRatio: 1,
                width: 0,
                height: 0,
                format: file.type,
            })
        }

        onProgress?.(i + 1, total, file.name)
    }

    return results
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Check if browser supports WebP
 */
export function supportsWebP(): boolean {
    if (typeof document === 'undefined') return false

    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    return canvas.toDataURL('image/webp').startsWith('data:image/webp')
}

/**
 * Get optimal compression options based on use case
 */
export function getCompressionPreset(
    useCase: 'thumbnail' | 'card' | 'gallery' | 'hero'
): CompressionOptions {
    const presets: Record<string, CompressionOptions> = {
        thumbnail: {
            maxDimension: 400,
            quality: 0.7,
            maxFileSize: 50 * 1024, // 50KB
        },
        card: {
            maxDimension: 800,
            quality: 0.75,
            maxFileSize: 150 * 1024, // 150KB
        },
        gallery: {
            maxDimension: 1600,
            quality: 0.8,
            maxFileSize: 300 * 1024, // 300KB
        },
        hero: {
            maxDimension: 2000,
            quality: 0.85,
            maxFileSize: 500 * 1024, // 500KB
        },
    }

    return presets[useCase] || presets.gallery
}
