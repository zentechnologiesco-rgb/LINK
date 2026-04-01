'use client'

import dynamic from 'next/dynamic'
import { Map as MapIcon } from 'lucide-react'

const loadPropertyMap = () => import('@/components/maps/PropertyMap').then((module) => module.PropertyMap)

export const PublicHomePropertyMap = dynamic(loadPropertyMap, {
    ssr: false,
    loading: () => (
        <div className="flex h-full w-full animate-pulse items-center justify-center bg-neutral-100/50">
            <div className="flex flex-col items-center gap-3 text-neutral-400">
                <MapIcon className="h-8 w-8" />
            </div>
        </div>
    ),
})

let publicHomePropertyMapWarmPromise: Promise<unknown> | null = null

export function warmPublicHomePropertyMap() {
    publicHomePropertyMapWarmPromise ??= Promise.all([
        loadPropertyMap(),
        import('mapbox-gl').then((module) => {
            module.default.prewarm()
        }),
    ])

    return publicHomePropertyMapWarmPromise
}
