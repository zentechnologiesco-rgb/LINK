'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Loader2, MapPin } from '@/components/ui/icons'

interface PropertyDetailMapProps {
    coordinates: { lat: number; lng: number }
    address?: string
}

function createAddressPopupContent(address: string) {
    const wrapper = document.createElement('div')
    wrapper.style.padding = '8px 12px'
    wrapper.style.fontSize = '14px'
    wrapper.style.fontWeight = '600'
    wrapper.style.color = '#1a1a1a'
    wrapper.textContent = `📍 ${address}`
    return wrapper
}

export function PropertyDetailMap({ coordinates, address }: PropertyDetailMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<mapboxgl.Map | null>(null)
    const marker = useRef<mapboxgl.Marker | null>(null)
    const [mapLoaded, setMapLoaded] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

    useEffect(() => {
        if (map.current || !mapContainer.current) return

        if (!token) {
            return
        }

        try {
            mapboxgl.accessToken = token

            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [coordinates.lng, coordinates.lat],
                zoom: 15,
                pitch: 0,
                bearing: 0,
                antialias: false,
                interactive: true,
                attributionControl: false,
            })

            map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

            map.current.on('load', () => {
                if (!map.current) return

                setMapLoaded(true)

                const el = document.createElement('div')
                el.className = 'property-detail-marker'
                el.innerHTML = `
                    <div style="
                        width: 44px;
                        height: 44px;
                        background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
                        border-radius: 50% 50% 50% 0;
                        transform: rotate(-45deg);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border: 3px solid white;
                        outline: 1px solid rgba(0,0,0,0.1);
                        z-index: 100;
                    ">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            style="transform: rotate(45deg);"
                        >
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                    </div>
                `

                marker.current = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
                    .setLngLat([coordinates.lng, coordinates.lat])
                    .addTo(map.current)

                if (address) {
                    const popup = new mapboxgl.Popup({
                        offset: 30,
                        closeButton: false,
                        closeOnClick: false,
                    }).setDOMContent(createAddressPopupContent(address))

                    marker.current.setPopup(popup)
                }
            })

            map.current.on('error', (event) => {
                console.error('Mapbox error:', event)
                setError('Map failed to load')
            })
        } catch (err: unknown) {
            console.error('Map initialization error:', err)
            queueMicrotask(() => {
                setError(err instanceof Error ? err.message : 'Failed to initialize map')
            })
        }

        return () => {
            marker.current?.remove()
            map.current?.remove()
            map.current = null
        }
    }, [address, coordinates.lat, coordinates.lng, token])

    if (error || !token) {
        return (
            <div className="flex h-full min-h-64 w-full items-center justify-center bg-gray-100">
                <div className="text-center p-6">
                    <MapPin className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-600">{error || 'Map not available'}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="relative h-full w-full">
            <div ref={mapContainer} className="h-full w-full" />

            {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
            )}
        </div>
    )
}
