'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapPin, Loader2 } from 'lucide-react'

interface PropertyDetailMapProps {
    coordinates: { lat: number; lng: number }
    address?: string
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
            setError('Map not available')
            return
        }

        try {
            mapboxgl.accessToken = token

            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [coordinates.lng, coordinates.lat],
                zoom: 15,
                interactive: true,
            })

            map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

            map.current.on('load', () => {
                setMapLoaded(true)

                // Create custom marker element
                const el = document.createElement('div')
                el.className = 'property-detail-marker'
                el.innerHTML = `
                    <div style="
                        width: 40px;
                        height: 40px;
                        background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
                        border-radius: 50% 50% 50% 0;
                        transform: rotate(-45deg);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                        border: 3px solid white;
                    ">
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="18" 
                            height="18" 
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

                // Add marker
                marker.current = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
                    .setLngLat([coordinates.lng, coordinates.lat])
                    .addTo(map.current!)

                // Add popup if address is provided
                if (address) {
                    const popup = new mapboxgl.Popup({
                        offset: 25,
                        closeButton: false,
                        closeOnClick: false,
                    }).setHTML(`
                        <div style="padding: 8px 12px; font-size: 14px; font-weight: 500; color: #1a1a1a;">
                            ${address}
                        </div>
                    `)
                    marker.current.setPopup(popup)
                }
            })

            map.current.on('error', (e) => {
                console.error('Mapbox error:', e)
                setError('Map failed to load')
            })
        } catch (err: any) {
            console.error('Map initialization error:', err)
            setError(err?.message || 'Failed to initialize map')
        }

        return () => {
            marker.current?.remove()
            map.current?.remove()
            map.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, coordinates.lat, coordinates.lng])

    if (error || !token) {
        return (
            <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-xl border border-gray-200">
                <div className="text-center p-6">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">{error || 'Map not available'}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="relative w-full h-72 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <div ref={mapContainer} className="w-full h-full" />
            {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
            )}
        </div>
    )
}
