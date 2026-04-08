"use client"

import {
    forwardRef,
    useCallback,
    useState,
    type ComponentPropsWithoutRef,
} from "react"

import { cn } from "@/lib/utils"

type BrowserSafeVideoProps = Omit<ComponentPropsWithoutRef<"video">, "poster"> & {
    posterSrc?: string | null
    posterAlt?: string
    containerClassName?: string
    warningText?: string
    warningClassName?: string
}

export const BrowserSafeVideo = forwardRef<HTMLVideoElement, BrowserSafeVideoProps>(
    function BrowserSafeVideo(
        {
            posterSrc,
            posterAlt,
            containerClassName,
            warningText,
            warningClassName,
            className,
            onError,
            onLoadedData,
            src,
            ...props
        },
        ref,
    ) {
        const [showWarning, setShowWarning] = useState(false)

        const handleLoadedData = useCallback<NonNullable<ComponentPropsWithoutRef<"video">["onLoadedData"]>>((event) => {
            setShowWarning(false)
            onLoadedData?.(event)
        }, [onLoadedData])

        const handleError = useCallback<NonNullable<ComponentPropsWithoutRef<"video">["onError"]>>((event) => {
            setShowWarning(Boolean(warningText))
            onError?.(event)
        }, [onError, warningText])

        return (
            <div className={cn("relative h-full w-full overflow-hidden", containerClassName)}>
                {posterAlt ? <span className="sr-only">{posterAlt}</span> : null}
                <video
                    {...props}
                    ref={ref}
                    src={src}
                    poster={posterSrc ?? undefined}
                    onLoadedData={handleLoadedData}
                    onError={handleError}
                    className={cn("h-full w-full", className)}
                />

                {showWarning && warningText ? (
                    <div
                        className={cn(
                            "pointer-events-none absolute inset-x-3 bottom-3 rounded-2xl bg-black/68 px-3 py-2 text-center text-[11px] font-medium leading-relaxed text-white backdrop-blur-sm",
                            warningClassName,
                        )}
                    >
                        {warningText}
                    </div>
                ) : null}
            </div>
        )
    },
)
