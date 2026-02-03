"use client"

import Image, { ImageProps } from "next/image"
import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"

/**
 * Quality presets for different use cases
 * Lower quality = smaller file size = faster loading
 */
export type ImageQualityPreset = 'thumbnail' | 'card' | 'gallery' | 'hero' | 'full'

const QUALITY_PRESETS: Record<ImageQualityPreset, number> = {
    thumbnail: 60,  // Small previews, cards in lists
    card: 70,       // Property cards, medium previews
    gallery: 80,    // Gallery view, larger images
    hero: 85,       // Hero images, main display
    full: 90,       // Full resolution view
}

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError' | 'quality'> {
    containerClassName?: string
    aspectRatio?: 'video' | 'square' | '4/3' | '3/2' | '16/9'
    showSkeleton?: boolean
    /** Quality preset - determines compression level */
    qualityPreset?: ImageQualityPreset
    /** Override quality directly (0-100) */
    quality?: number
}

const aspectRatioClasses = {
    'video': 'aspect-video',
    'square': 'aspect-square',
    '4/3': 'aspect-[4/3]',
    '3/2': 'aspect-[3/2]',
    '16/9': 'aspect-[16/9]',
}

// Simple shimmer skeleton for loading state
function ImageSkeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "absolute inset-0 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%] animate-shimmer",
                className
            )}
        />
    )
}

export function OptimizedImage({
    src,
    alt,
    className,
    containerClassName,
    fill,
    aspectRatio,
    sizes,
    priority,
    showSkeleton = true,
    qualityPreset = 'card',
    quality,
    loading,
    ...props
}: OptimizedImageProps) {
    const [isLoaded, setIsLoaded] = useState(false)
    const [hasError, setHasError] = useState(false)

    const handleLoad = useCallback(() => {
        setIsLoaded(true)
    }, [])

    const handleError = useCallback(() => {
        setHasError(true)
        setIsLoaded(true) // Hide skeleton on error too
    }, [])

    // Determine quality - use explicit quality if provided, otherwise use preset
    const imageQuality = quality ?? QUALITY_PRESETS[qualityPreset]

    // Determine loading strategy - priority images load eagerly, others are lazy
    const loadingStrategy = loading ?? (priority ? 'eager' : 'lazy')

    // If using fill with aspectRatio, wrap in a container
    if (fill && aspectRatio) {
        return (
            <div className={cn(
                "relative overflow-hidden",
                aspectRatioClasses[aspectRatio],
                containerClassName
            )}>
                {/* Loading skeleton - shown until image loads */}
                {showSkeleton && !isLoaded && !hasError && (
                    <ImageSkeleton />
                )}

                <Image
                    src={src}
                    alt={alt}
                    fill
                    sizes={sizes}
                    priority={priority}
                    quality={imageQuality}
                    loading={loadingStrategy}
                    onLoad={handleLoad}
                    onError={handleError}
                    className={cn(
                        "object-cover transition-opacity duration-300",
                        isLoaded ? "opacity-100" : "opacity-0",
                        className
                    )}
                    {...props}
                />
            </div>
        )
    }

    // Simple pass-through for all other cases
    return (
        <Image
            src={src}
            alt={alt}
            fill={fill}
            sizes={sizes}
            priority={priority}
            quality={imageQuality}
            loading={loadingStrategy}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
                "transition-opacity duration-300",
                isLoaded ? "opacity-100" : "opacity-0",
                className
            )}
            {...props}
        />
    )
}

// Thumbnail variant for property cards - optimized for small displays
export function PropertyThumbnail({
    src,
    alt,
    className,
    priority,
    ...props
}: Omit<OptimizedImageProps, 'aspectRatio' | 'fill' | 'sizes' | 'qualityPreset'>) {
    return (
        <OptimizedImage
            src={src}
            alt={alt}
            fill
            aspectRatio="4/3"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            qualityPreset="thumbnail"
            priority={priority}
            className={cn("object-cover", className)}
            {...props}
        />
    )
}

// Card image variant - slightly higher quality for featured cards
export function PropertyCardImage({
    src,
    alt,
    className,
    priority,
    ...props
}: Omit<OptimizedImageProps, 'aspectRatio' | 'fill' | 'sizes' | 'qualityPreset'>) {
    return (
        <OptimizedImage
            src={src}
            alt={alt}
            fill
            aspectRatio="4/3"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            qualityPreset="card"
            priority={priority}
            className={cn("object-cover", className)}
            {...props}
        />
    )
}

// Hero image variant for property detail pages - highest quality
export function PropertyHeroImage({
    src,
    alt,
    className,
    priority = true,
    ...props
}: Omit<OptimizedImageProps, 'fill' | 'sizes' | 'qualityPreset'>) {
    return (
        <OptimizedImage
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes="100vw"
            qualityPreset="hero"
            className={cn("object-cover", className)}
            {...props}
        />
    )
}

// Gallery image variant - balanced quality for gallery views
export function GalleryImage({
    src,
    alt,
    className,
    priority,
    aspectRatio = '4/3',
    ...props
}: Omit<OptimizedImageProps, 'fill' | 'sizes' | 'qualityPreset'>) {
    return (
        <OptimizedImage
            src={src}
            alt={alt}
            fill
            aspectRatio={aspectRatio}
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 50vw"
            qualityPreset="gallery"
            className={cn("object-cover", className)}
            {...props}
        />
    )
}

// Avatar image with circular crop
export function AvatarImage({
    src,
    alt,
    size = 40,
    className,
    ...props
}: Omit<OptimizedImageProps, 'fill' | 'width' | 'height' | 'qualityPreset'> & { size?: number }) {
    return (
        <div
            className={cn("relative rounded-full overflow-hidden bg-neutral-100", className)}
            style={{ width: size, height: size }}
        >
            <Image
                src={src || '/window.svg'}
                alt={alt}
                width={size}
                height={size}
                quality={60}
                className="object-cover"
                {...props}
            />
        </div>
    )
}
