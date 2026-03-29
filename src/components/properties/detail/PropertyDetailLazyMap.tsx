"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"

const PropertyDetailMap = dynamic(
    () => import("@/components/maps/PropertyDetailMap").then((module) => module.PropertyDetailMap),
    {
        ssr: false,
        loading: () => <div className="h-full w-full animate-pulse bg-neutral-100" />,
    }
)

export function PropertyDetailLazyMap(props: { coordinates: { lat: number; lng: number }; address: string }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [shouldRenderMap, setShouldRenderMap] = useState(
        () => typeof window !== "undefined" && typeof window.IntersectionObserver === "undefined"
    )

    useEffect(() => {
        if (shouldRenderMap) return

        const container = containerRef.current
        if (!container) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) return

                setShouldRenderMap(true)
                observer.disconnect()
            },
            { rootMargin: "240px 0px" }
        )

        observer.observe(container)

        return () => observer.disconnect()
    }, [shouldRenderMap])

    return (
        <div ref={containerRef} className="h-full w-full">
            {shouldRenderMap ? (
                <PropertyDetailMap {...props} />
            ) : (
                <div className="h-full w-full animate-pulse bg-neutral-100" />
            )}
        </div>
    )
}
