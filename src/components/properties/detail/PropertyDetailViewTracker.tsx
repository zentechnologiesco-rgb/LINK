"use client"

import { useEffect, useRef } from "react"
import { useMutation } from "convex/react"

import { api } from "../../../../convex/_generated/api"
import { type Id } from "../../../../convex/_generated/dataModel"

export function PropertyDetailViewTracker({ propertyId }: { propertyId: string }) {
    const trackView = useMutation(api.recentlyViewed.trackView)
    const hasTracked = useRef(false)

    useEffect(() => {
        if (hasTracked.current) {
            return
        }

        hasTracked.current = true
        trackView({ propertyId: propertyId as Id<"properties"> }).catch(() => {})
    }, [propertyId, trackView])

    return null
}
