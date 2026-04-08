"use client"

import { type MouseEventHandler } from "react"
import { PlayCircle } from "lucide-react"

import { OptimizedImage } from "@/components/ui/optimized-image"
import { BrowserSafeVideo } from "@/components/ui/BrowserSafeVideo"
import { cn } from "@/lib/utils"

type MediaQualityPreset = "hero" | "full" | "card"

interface PropertyDetailPrimaryMediaProps {
    videoUrl?: string | null
    imageSrc: string
    imageAlt: string
    title: string
    className?: string
    imageSizes: string
    qualityPreset?: MediaQualityPreset
    onImageClick?: MouseEventHandler<HTMLButtonElement>
    badgeClassName?: string
    priority?: boolean
    imageClassName?: string
}

export function PropertyDetailPrimaryMedia({
    videoUrl,
    imageSrc,
    imageAlt,
    title,
    className,
    imageSizes,
    qualityPreset = "hero",
    onImageClick,
    badgeClassName,
    priority = false,
    imageClassName,
}: PropertyDetailPrimaryMediaProps) {
    return (
        <div className={cn("relative", className)}>
            {videoUrl ? (
                <>
                    <BrowserSafeVideo
                        key={videoUrl}
                        src={videoUrl}
                        posterSrc={imageSrc}
                        posterAlt={imageAlt}
                        controls
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        aria-label={title}
                        className={cn("h-full w-full object-cover", imageClassName)}
                        containerClassName="h-full w-full"
                    />
                    <div
                        className={cn(
                            "pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-white backdrop-blur-md",
                            badgeClassName
                        )}
                    >
                        <PlayCircle className="h-4 w-4 text-white" strokeWidth={2.1} />
                        <span className="text-[12px] font-semibold uppercase tracking-[0.18em]">Discover Clip</span>
                    </div>
                </>
            ) : onImageClick ? (
                <button type="button" onClick={onImageClick} className="relative h-full w-full cursor-pointer">
                    <OptimizedImage
                        src={imageSrc}
                        alt={imageAlt}
                        fill
                        sizes={imageSizes}
                        className={cn("object-cover", imageClassName)}
                        qualityPreset={qualityPreset}
                        priority={priority}
                    />
                </button>
            ) : (
                <div className="relative h-full w-full">
                    <OptimizedImage
                        src={imageSrc}
                        alt={imageAlt}
                        fill
                        sizes={imageSizes}
                        className={cn("object-cover", imageClassName)}
                        qualityPreset={qualityPreset}
                        priority={priority}
                    />
                </div>
            )}
        </div>
    )
}
