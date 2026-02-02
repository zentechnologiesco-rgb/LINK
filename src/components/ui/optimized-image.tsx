"use client"

import Image, { ImageProps } from "next/image"
import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
    containerClassName?: string
    aspectRatio?: 'video' | 'square' | '4/3' | '3/2' | '16/9'
    showSkeleton?: boolean
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

    // For Convex storage images, skip Next.js optimization to avoid timeout issues
    // but keep full quality
    const isConvexImage = typeof src === 'string' && (
        src.includes('convex.cloud') || src.includes('convex.site')
    )

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
                    quality={100}
                    unoptimized={isConvexImage}
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
            quality={100}
            unoptimized={isConvexImage}
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

// Thumbnail variant for property cards
export function PropertyThumbnail({
    src,
    alt,
    className,
    ...props
}: Omit<OptimizedImageProps, 'aspectRatio' | 'fill' | 'sizes'>) {
    return (
        <OptimizedImage
            src={src}
            alt={alt}
            fill
            aspectRatio="4/3"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn("object-cover", className)}
            {...props}
        />
    )
}

// Hero image variant for property detail pages
export function PropertyHeroImage({
    src,
    alt,
    className,
    priority = true,
    ...props
}: Omit<OptimizedImageProps, 'fill' | 'sizes'>) {
    return (
        <OptimizedImage
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes="100vw"
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
}: Omit<OptimizedImageProps, 'fill' | 'width' | 'height'> & { size?: number }) {
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
                className="object-cover"
                {...props}
            />
        </div>
    )
}
