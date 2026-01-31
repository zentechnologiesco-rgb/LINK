"use client"

import Image, { ImageProps } from "next/image"
import { useState, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "./skeleton"

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
    fallbackSrc?: string
    showSkeleton?: boolean
    aspectRatio?: 'video' | 'square' | '4/3' | '3/2' | '16/9'
    containerClassName?: string
}

const aspectRatioClasses = {
    'video': 'aspect-video',
    'square': 'aspect-square',
    '4/3': 'aspect-[4/3]',
    '3/2': 'aspect-[3/2]',
    '16/9': 'aspect-[16/9]',
}

export function OptimizedImage({
    src,
    alt,
    fallbackSrc = '/window.svg',
    showSkeleton = true,
    aspectRatio,
    className,
    containerClassName,
    fill,
    sizes,
    priority,
    ...props
}: OptimizedImageProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)
    const [imageSrc, setImageSrc] = useState(src)

    // Sync imageSrc when src prop changes (important for Convex dynamic URLs)
    useEffect(() => {
        if (src && src !== imageSrc && !hasError) {
            setImageSrc(src)
            setIsLoading(true)
        }
    }, [src, imageSrc, hasError])

    const handleLoad = useCallback(() => {
        setIsLoading(false)
    }, [])

    const handleError = useCallback(() => {
        setHasError(true)
        setIsLoading(false)
        setImageSrc(fallbackSrc)
    }, [fallbackSrc])

    // Optimized sizes for different contexts
    const optimizedSizes = sizes || (fill
        ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        : undefined
    )

    // When fill is used, container needs explicit dimensions
    // If aspectRatio is provided, use that for self-sizing (relative position)
    // If no aspectRatio, use absolute inset-0 to fill positioned parent
    // Note: We still need 'relative' for the nested Image with fill to work correctly
    const usesAbsoluteFill = fill && !aspectRatio

    const containerStyles = cn(
        "relative overflow-hidden bg-neutral-100",
        // Minimum height to avoid "height 0" warnings from Next.js when parent collapses
        "min-h-[1px]",
        // Additional absolute positioning to fill parent when no aspectRatio
        usesAbsoluteFill && "absolute inset-0 h-full w-full",
        aspectRatio && aspectRatioClasses[aspectRatio],
        containerClassName
    )

    return (
        <div className={containerStyles}>
            {/* Skeleton loader */}
            {showSkeleton && isLoading && (
                <Skeleton
                    className="absolute inset-0 z-10"
                    animation="shimmer"
                />
            )}

            <Image
                src={hasError ? fallbackSrc : imageSrc}
                alt={alt}
                fill={fill}
                sizes={optimizedSizes}
                priority={priority}
                className={cn(
                    "transition-opacity duration-300",
                    isLoading ? "opacity-0" : "opacity-100",
                    className
                )}
                onLoad={handleLoad}
                onError={handleError}
                // Performance optimizations
                loading={priority ? undefined : "lazy"}
                decoding="async"
                // Skip optimization for Convex storage images to avoid timeouts
                unoptimized={typeof imageSrc === 'string' && (imageSrc.includes('convex.cloud') || imageSrc.includes('convex.site'))}
                {...props}
            />
        </div>
    )
}

// Thumbnail variant for property cards - smaller size hints
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
                loading="lazy"
                {...props}
            />
        </div>
    )
}
