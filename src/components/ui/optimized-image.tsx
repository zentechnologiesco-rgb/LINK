"use client"

import Image, { ImageProps } from "next/image"
import { cn } from "@/lib/utils"

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
    containerClassName?: string
    aspectRatio?: 'video' | 'square' | '4/3' | '3/2' | '16/9'
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
    className,
    containerClassName,
    fill,
    aspectRatio,
    sizes,
    priority,
    ...props
}: OptimizedImageProps) {
    // For Convex storage images, skip Next.js optimization to avoid issues
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
                <Image
                    src={src}
                    alt={alt}
                    fill
                    sizes={sizes}
                    priority={priority}
                    unoptimized={isConvexImage}
                    className={cn("object-cover", className)}
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
            unoptimized={isConvexImage}
            className={className}
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
