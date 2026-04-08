"use client"

import {
    forwardRef,
    useCallback,
    useEffect,
    useRef,
    useState,
    type ComponentPropsWithoutRef,
    type ForwardedRef,
} from "react"

import { OptimizedImage } from "@/components/ui/optimized-image"
import { cn } from "@/lib/utils"

type BrowserSafeVideoProps = Omit<ComponentPropsWithoutRef<"video">, "poster"> & {
    posterSrc?: string | null
    posterAlt?: string
    containerClassName?: string
    posterClassName?: string
    warningText?: string
    warningClassName?: string
    frameWaitMs?: number
}

function assignVideoRef(
    ref: ForwardedRef<HTMLVideoElement>,
    node: HTMLVideoElement | null,
) {
    if (typeof ref === "function") {
        ref(node)
        return
    }

    if (ref) {
        ref.current = node
    }
}

export const BrowserSafeVideo = forwardRef<HTMLVideoElement, BrowserSafeVideoProps>(
    function BrowserSafeVideo(
        {
            posterSrc,
            posterAlt,
            containerClassName,
            posterClassName,
            warningText,
            warningClassName,
            frameWaitMs = 1600,
            className,
            onError,
            onLoadedData,
            onPlaying,
            src,
            ...props
        },
        ref,
    ) {
        const videoRef = useRef<HTMLVideoElement | null>(null)
        const frameTimeoutRef = useRef<number | null>(null)
        const frameCallbackRef = useRef<number | null>(null)
        const hasRenderedFrameRef = useRef(false)

        const [hasRenderedFrame, setHasRenderedFrame] = useState(false)
        const [showWarning, setShowWarning] = useState(false)

        const clearPendingFrameChecks = useCallback(() => {
            if (frameTimeoutRef.current !== null) {
                window.clearTimeout(frameTimeoutRef.current)
                frameTimeoutRef.current = null
            }

            const currentVideo = videoRef.current
            if (
                frameCallbackRef.current !== null &&
                currentVideo &&
                typeof currentVideo.cancelVideoFrameCallback === "function"
            ) {
                currentVideo.cancelVideoFrameCallback(frameCallbackRef.current)
            }

            frameCallbackRef.current = null
        }, [])

        const markFrameRendered = useCallback(() => {
            hasRenderedFrameRef.current = true
            setHasRenderedFrame(true)
            setShowWarning(false)

            if (frameTimeoutRef.current !== null) {
                window.clearTimeout(frameTimeoutRef.current)
                frameTimeoutRef.current = null
            }
        }, [])

        const startFrameGuard = useCallback(() => {
            const currentVideo = videoRef.current
            if (!currentVideo || currentVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
                return
            }

            clearPendingFrameChecks()

            if (typeof currentVideo.requestVideoFrameCallback === "function") {
                frameCallbackRef.current = currentVideo.requestVideoFrameCallback(() => {
                    markFrameRendered()
                })
            } else if (currentVideo.videoWidth > 0 && currentVideo.videoHeight > 0) {
                markFrameRendered()
                return
            }

            frameTimeoutRef.current = window.setTimeout(() => {
                const activeVideo = videoRef.current
                if (!activeVideo || hasRenderedFrameRef.current || activeVideo.paused || activeVideo.ended) {
                    return
                }

                if (
                    typeof activeVideo.requestVideoFrameCallback !== "function" &&
                    activeVideo.videoWidth > 0 &&
                    activeVideo.videoHeight > 0
                ) {
                    markFrameRendered()
                    return
                }

                setShowWarning(Boolean(warningText))
            }, frameWaitMs)
        }, [clearPendingFrameChecks, frameWaitMs, markFrameRendered, warningText])

        useEffect(() => clearPendingFrameChecks, [clearPendingFrameChecks])

        const setCombinedRef = useCallback((node: HTMLVideoElement | null) => {
            videoRef.current = node
            assignVideoRef(ref, node)
        }, [ref])

        const handleLoadedData = useCallback<NonNullable<ComponentPropsWithoutRef<"video">["onLoadedData"]>>((event) => {
            onLoadedData?.(event)

            if (!event.currentTarget.paused && !event.currentTarget.ended) {
                startFrameGuard()
            }
        }, [onLoadedData, startFrameGuard])

        const handlePlaying = useCallback<NonNullable<ComponentPropsWithoutRef<"video">["onPlaying"]>>((event) => {
            onPlaying?.(event)
            startFrameGuard()
        }, [onPlaying, startFrameGuard])

        const handleError = useCallback<NonNullable<ComponentPropsWithoutRef<"video">["onError"]>>((event) => {
            onError?.(event)
            setShowWarning(Boolean(warningText))
        }, [onError, warningText])

        const showPosterOverlay = Boolean(posterSrc) && !hasRenderedFrame
        const showOverlay = showPosterOverlay || (showWarning && Boolean(warningText))

        return (
            <div className={cn("relative h-full w-full overflow-hidden", containerClassName)}>
                <video
                    {...props}
                    ref={setCombinedRef}
                    src={src}
                    poster={posterSrc ?? undefined}
                    onLoadedData={handleLoadedData}
                    onPlaying={handlePlaying}
                    onError={handleError}
                    className={cn("h-full w-full", className)}
                />

                {showOverlay ? (
                    <div className="pointer-events-none absolute inset-0">
                        {showPosterOverlay ? (
                            <div className="relative h-full w-full">
                                <OptimizedImage
                                    src={posterSrc ?? "/window.svg"}
                                    alt={posterAlt ?? ""}
                                    fill
                                    sizes="100vw"
                                    qualityPreset="hero"
                                    showSkeleton={false}
                                    className={cn("object-cover", posterClassName)}
                                />
                            </div>
                        ) : null}

                        {showWarning && warningText ? (
                            <div
                                className={cn(
                                    "absolute inset-x-3 bottom-3 rounded-2xl bg-black/68 px-3 py-2 text-center text-[11px] font-medium leading-relaxed text-white backdrop-blur-sm",
                                    warningClassName,
                                )}
                            >
                                {warningText}
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>
        )
    },
)
