'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface Property {
    id: string
    title: string
    price_nad: number
    address: string
    images?: string[]
    coordinates: { lat: number; lng: number } | null
}

interface PropertyMapProps {
    properties: Property[]
    onPropertyClick?: (propertyId: string) => void
    center?: [number, number]
    zoom?: number
}

export function PropertyMap({
    properties,
    onPropertyClick,
    center = [17.0658, -22.5609], // Windhoek default
    zoom = 12
}: PropertyMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<mapboxgl.Map | null>(null)
    const markersRef = useRef<mapboxgl.Marker[]>([])
    const [mapLoaded, setMapLoaded] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Store properties in a ref to compare changes and avoid unnecessary updates
    const prevPropertiesIds = useRef<string>('')

    // Get token
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

    useEffect(() => {
        // Don't initialize if already initialized or no container
        if (map.current || !mapContainer.current) return

        // Check for token
        if (!token) {
            setError('No Mapbox token found')
            console.error('NEXT_PUBLIC_MAPBOX_TOKEN is not set')
            return
        }

        try {
            mapboxgl.accessToken = token

            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/streets-v12', // Consistent with LocationPicker
                center: center,
                zoom: zoom,
            })

            map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

            map.current.on('load', () => {
                setMapLoaded(true)
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
            // Clean up markers
            markersRef.current.forEach(m => m.remove())
            markersRef.current = []
            // Clean up map
            map.current?.remove()
            map.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]) // Only re-run if token changes

    // Add markers when map is loaded or properties change
    useEffect(() => {
        if (!mapLoaded || !map.current) return

        // Check if property IDs actually changed to avoid re-rendering markers on every hover
        const currentPropertiesIds = properties.map(p => p.id).join(',')
        if (currentPropertiesIds === prevPropertiesIds.current) return
        prevPropertiesIds.current = currentPropertiesIds

        // Clear existing markers
        markersRef.current.forEach(m => m.remove())
        markersRef.current = []

        // Add markers for properties with coordinates
        properties.forEach((property) => {
            if (!property.coordinates?.lat || !property.coordinates?.lng) return

            // Create custom marker element
            const el = document.createElement('div')
            el.className = 'group z-10 hover:z-50' // Tailwind classes for z-index handling
            el.innerHTML = `
                <div class="relative cursor-pointer">
                    <!-- Marker Pill -->
                    <div style="
                        background-color: white;
                        border: 1px solid #e5e7eb;
                        border-radius: 9999px;
                        padding: 4px 8px;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                        font-weight: 600;
                        font-size: 0.875rem;
                        color: #111827;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        transition: transform 0.2s;
                    " class="marker-pill">
                        <span>N$ ${(property.price_nad / 1000).toFixed(0)}k</span>
                    </div>

                    <!-- Popup Card (Hidden by default, shown on group hover) -->
                    <div style="
                        position: absolute;
                        bottom: 100%;
                        left: 50%;
                        transform: translateX(-50%) translateY(-8px);
                        width: 220px;
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                        overflow: hidden;
                        display: none;
                    " class="popup-card group-hover:block">
                        <div style="height: 120px; width: 100%; background-color: #f3f4f6;">
                            <img src="${property.images?.[0] || '/placeholder.jpg'}" style="width: 100%; height: 100%; object-fit: cover;" alt="${property.title}" />
                        </div>
                        <div style="padding: 10px;">
                            <p style="font-weight: 600; font-size: 14px; margin: 0; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${property.title}</p>
                            <p style="font-size: 12px; color: #6b7280; margin: 2px 0 6px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${property.address}</p>
                            <p style="font-weight: 700; font-size: 14px; margin: 0; color: #111827;">N$ ${property.price_nad.toLocaleString()}/mo</p>
                        </div>
                        <!-- Triangle arrow -->
                        <div style="
                            position: absolute;
                            bottom: -6px;
                            left: 50%;
                            transform: translateX(-50%) rotate(45deg);
                            width: 12px;
                            height: 12px;
                            background: white;
                        "></div>
                    </div>
                </div>
            `

            // Add simple hover effect for the pill scaling
            const pill = el.querySelector('.marker-pill') as HTMLElement
            el.addEventListener('mouseenter', () => {
                if (pill) pill.style.transform = 'scale(1.1)'
            })
            el.addEventListener('mouseleave', () => {
                if (pill) pill.style.transform = 'scale(1)'
            })

            // Navigate on click
            el.addEventListener('click', (e) => {
                e.stopPropagation()
                // Use window.location for reliability, or pass router if available
                window.location.href = `/properties/${property.id}`
            })

            const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
                .setLngLat([property.coordinates!.lng, property.coordinates!.lat])
                .addTo(map.current!)

            markersRef.current.push(marker)
        })
    }, [properties, mapLoaded, onPropertyClick])

    // Show error or placeholder
    if (error || !token) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center p-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                    </div>
                    <p className="text-gray-600 text-sm font-medium">{error || 'Map not available'}</p>
                    <p className="text-gray-400 text-xs mt-2">Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local</p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full">
            <div ref={mapContainer} className="w-full h-full" />
        </div>
    )
}
