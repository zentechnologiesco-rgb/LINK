"use client"

import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Camera, Grid3X3, MapPin, Share2, X } from "lucide-react"
import { toast } from "sonner"

import { SavePropertyButton } from "@/features/properties/public/components/SavePropertyButton"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { DISCOVER_EXPERIENCE_ENABLED } from "@/config/features"
import { cn } from "@/lib/utils"
import { getPropertyDetailBackState } from "./property-detail-media-helpers"
import { PropertyDetailPrimaryMedia } from "./PropertyDetailPrimaryMedia"
import type { PropertyDetailData } from "./types"

const MIN_SWIPE_DISTANCE = 50
const MAX_EAGER_PRELOAD_IMAGES = 10
const PRELOAD_RADIUS = 3

function getPreloadIndices(total: number, currentIndex: number) {
    if (total <= 1) {
        return []
    }

    if (total <= MAX_EAGER_PRELOAD_IMAGES) {
        return Array.from({ length: total }, (_, index) => index)
    }

    const indices = new Set<number>([currentIndex])

    for (let offset = 1; offset <= PRELOAD_RADIUS; offset += 1) {
        indices.add((currentIndex + offset) % total)
        indices.add((currentIndex - offset + total) % total)
    }

    return Array.from(indices)
}

function PropertyDetailImagePreloads({
    images,
    currentPhotoIndex,
    imageSizes,
    qualityPreset,
}: {
    images: string[]
    currentPhotoIndex: number
    imageSizes: string
    qualityPreset: "hero" | "full"
}) {
    const preloadIndices = getPreloadIndices(images.length, currentPhotoIndex)

    if (preloadIndices.length === 0) {
        return null
    }

    return (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden opacity-0">
            {preloadIndices.map((index) => (
                <OptimizedImage
                    key={`${qualityPreset}-${index}`}
                    src={images[index] || "/window.svg"}
                    alt=""
                    width={1}
                    height={1}
                    sizes={imageSizes}
                    qualityPreset={qualityPreset}
                    loading="eager"
                    showSkeleton={false}
                />
            ))}
        </div>
    )
}

export function PropertyDetailMedia({ property }: { property: PropertyDetailData }) {
    const [showAllPhotos, setShowAllPhotos] = useState(false)
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
    const [isScrolled, setIsScrolled] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const touchStartX = useRef(0)
    const touchEndX = useRef(0)
    const primaryVideoUrl =
        DISCOVER_EXPERIENCE_ENABLED ? property.videoUrls?.[0] || null : null
    const { backHref, backLabel } = getPropertyDetailBackState(searchParams)

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 60)
        handleScroll()
        window.addEventListener("scroll", handleScroll, { passive: true })

        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const handleShare = useCallback(async () => {
        const shareUrl = window.location.href

        if (navigator.share) {
            try {
                await navigator.share({
                    title: property.title,
                    text: property.title,
                    url: shareUrl,
                })
                return
            } catch (error) {
                if (error instanceof Error && error.name === "AbortError") {
                    return
                }
            }
        }

        try {
            await navigator.clipboard.writeText(shareUrl)
            toast.success("Link copied to clipboard")
        } catch {
            toast.error("Unable to share this property right now")
        }
    }, [property.title])

    const openGallery = useCallback((photoIndex = 0) => {
        setCurrentPhotoIndex(photoIndex)
        setShowAllPhotos(true)
    }, [])

    const handleBack = useCallback(() => {
        router.push(backHref)
    }, [backHref, router])

    const onTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
        touchEndX.current = 0
        touchStartX.current = event.targetTouches[0].clientX
    }, [])

    const onTouchMove = useCallback((event: TouchEvent<HTMLDivElement>) => {
        touchEndX.current = event.targetTouches[0].clientX
    }, [])

    const onTouchEnd = useCallback(() => {
        if (primaryVideoUrl || !touchStartX.current || !touchEndX.current || property.images.length <= 1) {
            return
        }

        const distance = touchStartX.current - touchEndX.current
        if (distance > MIN_SWIPE_DISTANCE) {
            setCurrentPhotoIndex((currentIndex) => (currentIndex + 1) % property.images.length)
        } else if (distance < -MIN_SWIPE_DISTANCE) {
            setCurrentPhotoIndex((currentIndex) => (currentIndex - 1 + property.images.length) % property.images.length)
        }

        touchStartX.current = 0
        touchEndX.current = 0
    }, [primaryVideoUrl, property.images.length])

    return (
        <>
            {showAllPhotos && (
                <div className="fixed inset-0 z-[100] bg-black">
                    <div className="absolute left-0 right-0 top-0 z-50 flex h-14 items-center justify-between px-4 safe-area-top">
                        <button
                            type="button"
                            onClick={() => setShowAllPhotos(false)}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition-transform active:scale-90"
                        >
                            <X className="h-5 w-5 text-white" strokeWidth={2} />
                        </button>
                        <span className="text-[14px] font-semibold tabular-nums text-white/90">
                            {currentPhotoIndex + 1} / {property.images.length}
                        </span>
                        <div className="w-9" />
                    </div>

                    <div
                        className="absolute inset-0 flex items-center justify-center pb-8 pt-14"
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        <div className="relative h-full w-full">
                            <PropertyDetailImagePreloads
                                images={property.images}
                                currentPhotoIndex={currentPhotoIndex}
                                imageSizes="100vw"
                                qualityPreset="full"
                            />
                            <OptimizedImage
                                src={property.images[currentPhotoIndex] || "/window.svg"}
                                alt={`${property.title} - Photo ${currentPhotoIndex + 1}`}
                                fill
                                sizes="100vw"
                                className="object-contain"
                                qualityPreset="full"
                                loading="eager"
                            />
                        </div>
                    </div>

                    {property.images.length > 1 && property.images.length <= 12 ? (
                        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/40 px-3 py-2 backdrop-blur-md safe-area-bottom">
                            {property.images.map((_, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => setCurrentPhotoIndex(index)}
                                    className={cn(
                                        "h-1.5 rounded-full transition-all duration-300",
                                        index === currentPhotoIndex ? "w-5 bg-white" : "w-1.5 bg-white/40"
                                    )}
                                />
                            ))}
                        </div>
                    ) : property.images.length > 12 ? (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-4 py-2 backdrop-blur-md safe-area-bottom">
                            <span className="text-[13px] font-semibold text-white/80">
                                {currentPhotoIndex + 1} of {property.images.length}
                            </span>
                        </div>
                    ) : null}
                </div>
            )}

            <div className="lg:hidden">
                <header
                    className={cn(
                        "fixed top-0 z-50 flex h-14 w-full items-center justify-between px-4 transition-all duration-300 safe-area-top",
                        isScrolled
                            ? "bg-white/80 shadow-[0_1px_0_rgba(0,0,0,0.06)] backdrop-blur-2xl"
                            : "bg-gradient-to-b from-black/40 to-transparent"
                    )}
                >
                    <button
                        type="button"
                        onClick={handleBack}
                        aria-label={backLabel}
                        className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-90",
                            isScrolled ? "bg-neutral-100 text-neutral-900" : "bg-black/20 text-white backdrop-blur-md"
                        )}
                    >
                        <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
                    </button>

                    <div
                        className={cn(
                            "absolute left-14 right-24 overflow-hidden text-center transition-all duration-300",
                            isScrolled ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
                        )}
                    >
                        <span className="block truncate text-[15px] font-bold text-neutral-900">{property.title}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={handleShare}
                            className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-90",
                                isScrolled ? "bg-neutral-100 text-neutral-900" : "bg-black/20 text-white backdrop-blur-md"
                            )}
                        >
                            <Share2 className="h-[18px] w-[18px]" strokeWidth={2.5} />
                        </button>
                        <div
                            className={cn(
                                "overflow-hidden rounded-full",
                                !isScrolled && "[&_button]:border-0 [&_button]:bg-black/20 [&_button]:text-white [&_button]:backdrop-blur-md [&_button]:hover:bg-black/30 [&_svg]:text-white"
                            )}
                        >
                            <SavePropertyButton
                                propertyId={property.id}
                                landlordId={property.landlordId}
                                variant="icon"
                                className={cn(
                                    "h-9 w-9 border-0 shadow-none transition-all",
                                    isScrolled ? "bg-neutral-100 text-neutral-900 hover:bg-neutral-200" : ""
                                )}
                            />
                        </div>
                    </div>
                </header>

                <div
                    className="relative w-full overflow-hidden bg-neutral-100 aspect-[4/3]"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    <PropertyDetailImagePreloads
                        images={property.images}
                        currentPhotoIndex={currentPhotoIndex}
                        imageSizes="100vw"
                        qualityPreset="hero"
                    />
                    <PropertyDetailPrimaryMedia
                        className="h-full w-full"
                        videoUrl={primaryVideoUrl}
                        imageSrc={property.images[currentPhotoIndex] || "/window.svg"}
                        imageAlt={property.title}
                        title={property.title}
                        imageSizes="100vw"
                        qualityPreset="hero"
                        priority
                    />

                    <button
                        type="button"
                        onClick={() => openGallery(currentPhotoIndex)}
                        className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-white backdrop-blur-md transition-transform active:scale-95"
                    >
                        <Camera className="h-3.5 w-3.5" />
                        <span className="text-[12px] font-semibold tabular-nums">
                            {currentPhotoIndex + 1}/{property.images.length}
                        </span>
                    </button>

                    {!primaryVideoUrl && property.images.length > 1 && property.images.length <= 8 && (
                        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                            {property.images.map((_, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "h-[6px] rounded-full transition-all duration-300",
                                        index === currentPhotoIndex ? "w-5 bg-white shadow-sm" : "w-[6px] bg-white/50"
                                    )}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="hidden lg:block">
                <header
                    className={cn(
                        "fixed left-0 right-0 top-0 z-50 flex h-[72px] items-center justify-between px-10 transition-all duration-300",
                        isScrolled ? "bg-white/80 shadow-[0_1px_0_rgba(0,0,0,0.06)] backdrop-blur-2xl" : "bg-transparent"
                    )}
                >
                    <button
                        type="button"
                        onClick={handleBack}
                        aria-label={backLabel}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-900 shadow-sm transition-all active:scale-95 hover:bg-neutral-50"
                    >
                        <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleShare}
                            className="flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-bold transition-colors hover:bg-neutral-100"
                        >
                            <Share2 className="h-[18px] w-[18px]" strokeWidth={2} /> Share
                        </button>
                        <SavePropertyButton
                            variant="default"
                            propertyId={property.id}
                            landlordId={property.landlordId}
                            className="h-10 flex-row-reverse gap-2 rounded-full border-0 bg-transparent px-4 text-[14px] font-bold text-neutral-900 shadow-none hover:bg-neutral-100"
                        />
                    </div>
                </header>

                <div className="mx-auto max-w-[1200px] px-10 pt-24">
                    <h1 className="mb-2 text-[36px] font-[900] leading-tight tracking-[-0.03em] text-neutral-900">
                        {property.title}
                    </h1>
                    <div className="mb-8 flex items-center gap-4 text-neutral-600">
                        <div className="flex items-center gap-1.5">
                            <MapPin className="h-[16px] w-[16px]" strokeWidth={2.5} />
                            <span className="text-[15px] font-semibold text-neutral-600">
                                {property.address}, {property.city}
                            </span>
                        </div>
                    </div>

                    <div className="group relative grid h-[460px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-[24px]">
                        <PropertyDetailPrimaryMedia
                            className="col-span-2 row-span-2 overflow-hidden rounded-[24px] bg-neutral-100"
                            videoUrl={primaryVideoUrl}
                            imageSrc={property.images[0] || "/window.svg"}
                            imageAlt={`${property.title} hero`}
                            title={property.title}
                            imageSizes="(max-width: 1024px) 100vw, 592px"
                            qualityPreset="hero"
                            onImageClick={primaryVideoUrl ? undefined : () => openGallery(0)}
                            badgeClassName="left-5 top-5"
                            imageClassName="transition-all duration-300 hover:brightness-95"
                        />
                        {[1, 2, 3, 4].map((index) => (
                            <div
                                key={index}
                                className="relative cursor-pointer"
                                onClick={() => openGallery(index)}
                            >
                                <OptimizedImage
                                    src={property.images[index] || property.images[0] || "/window.svg"}
                                    alt={`${property.title} gallery ${index}`}
                                    fill
                                    sizes="(max-width: 1024px) 50vw, 296px"
                                    className="object-cover transition-all duration-300 hover:brightness-95"
                                />
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={() => openGallery(currentPhotoIndex)}
                            className="absolute bottom-5 right-5 flex items-center gap-2 rounded-xl border border-neutral-200 bg-white/90 px-4 py-2.5 text-[13px] font-[800] shadow-sm transition-all active:scale-95 hover:bg-white"
                        >
                            <Grid3X3 className="h-4 w-4" /> Show all photos
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
