"use client"

import dynamic from "next/dynamic"

const PropertyDetailMap = dynamic(
    () => import("@/components/maps/PropertyDetailMap").then((module) => ({ default: module.PropertyDetailMap })),
    {
        ssr: false,
        loading: () => <div className="h-full w-full animate-pulse bg-neutral-100" />,
    }
)

export function PropertyDetailLazyMap(props: { coordinates: { lat: number; lng: number }; address: string }) {
    return <PropertyDetailMap {...props} />
}
