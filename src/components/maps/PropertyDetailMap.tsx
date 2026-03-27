'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapPin, Loader2, School, Hospital, ShoppingBag, Bus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PropertyDetailMapProps {
    coordinates: { lat: number; lng: number }
    address?: string
}

// POI Categories Configuration
const POI_CATEGORIES = [
    {
        id: 'school',
        label: 'Schools',
        icon: School,
        color: '#3b82f6', // Blue
        query: 'school',
        emoji: '🏫'
    },
    {
        id: 'hospital',
        label: 'Healthcare',
        icon: Hospital,
        color: '#ef4444', // Red
        query: 'hospital clinic',
        emoji: '🏥'
    },
    {
        id: 'shopping',
        label: 'Shopping',
        icon: ShoppingBag,
        color: '#8b5cf6', // Purple
        query: 'mall supermarket',
        emoji: '🛒'
    },
    {
        id: 'transit',
        label: 'Transit',
        icon: Bus,
        color: '#f59e0b', // Amber
        query: 'bus station taxi rank',
        emoji: '🚌'
    },
]

interface POI {
    id: string
    name: string
    category: string
    coordinates: [number, number]
    distance?: string
}

export function PropertyDetailMap({ coordinates, address }: PropertyDetailMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<mapboxgl.Map | null>(null)
    const marker = useRef<mapboxgl.Marker | null>(null)
    const poiMarkers = useRef<mapboxgl.Marker[]>([])
    const [mapLoaded, setMapLoaded] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pois, setPois] = useState<POI[]>([])
    const [activeCategories, setActiveCategories] = useState<string[]>(['school', 'hospital', 'shopping', 'transit'])
    const [isLoadingPois, setIsLoadingPois] = useState(false)
    const [showNearby, setShowNearby] = useState(false)

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

    // Calculate distance between two points
    const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number): string => {
        const R = 6371 // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLng = (lng2 - lng1) * Math.PI / 180
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const d = R * c

        if (d < 1) {
            return `${Math.round(d * 1000)}m`
        }
        return `${d.toFixed(1)}km`
    }

    // Fetch nearby POIs using Mapbox Geocoding API
    const fetchPOIs = useCallback(async () => {
        if (!token) return

        setIsLoadingPois(true)

        try {
            const categoryResults = await Promise.all(
                POI_CATEGORIES.map(async (category) => {
                    const response = await fetch(
                        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(category.query)}.json?` +
                        `proximity=${coordinates.lng},${coordinates.lat}&` +
                        `limit=3&` +
                        `types=poi&` +
                        `access_token=${token}`
                    )

                    if (!response.ok) return []

                    const data = await response.json()
                    if (!data.features) return []

                    return data.features.map((feature: { center: [number, number]; id: string; text?: string; place_name?: string }) => {
                        const [lng, lat] = feature.center
                        return {
                            id: feature.id,
                            name: feature.text || feature.place_name?.split(',')[0] || 'Unknown',
                            category: category.id,
                            coordinates: [lng, lat] as [number, number],
                            distance: getDistance(coordinates.lat, coordinates.lng, lat, lng),
                        }
                    })
                })
            )

            setPois(categoryResults.flat())
        } catch (err) {
            console.error('Error fetching POIs:', err)
        } finally {
            setIsLoadingPois(false)
        }
    }, [coordinates.lat, coordinates.lng, token])

    // Add POI markers to map
    const updatePoiMarkers = useCallback(() => {
        if (!map.current || !mapLoaded) return

        // Clear existing POI markers
        poiMarkers.current.forEach(m => m.remove())
        poiMarkers.current = []

        // Add markers for active categories
        const filteredPois = pois.filter(poi => activeCategories.includes(poi.category))

        filteredPois.forEach(poi => {
            const category = POI_CATEGORIES.find(c => c.id === poi.category)
            if (!category) return

            // Create marker element
            const el = document.createElement('div')
            el.className = 'poi-marker'
            el.innerHTML = `
                <div style="
                    width: 32px;
                    height: 32px;
                    background: ${category.color};
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid white;
                    outline: 1px solid rgba(0,0,0,0.1);
                    cursor: pointer;
                    transition: transform 0.2s;
                    font-size: 14px;
                ">
                    ${category.emoji}
                </div>
            `

            // Hover effect
            el.addEventListener('mouseenter', () => {
                el.querySelector('div')!.style.transform = 'scale(1.2)'
            })
            el.addEventListener('mouseleave', () => {
                el.querySelector('div')!.style.transform = 'scale(1)'
            })

            // Create popup
            const popup = new mapboxgl.Popup({
                offset: 20,
                closeButton: false,
                closeOnClick: false,
            }).setHTML(`
                <div style="padding: 8px 12px; min-width: 120px;">
                    <p style="font-weight: 600; font-size: 13px; margin: 0 0 4px 0; color: #111827;">${poi.name}</p>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 11px; color: ${category.color}; font-weight: 600;">${category.label}</span>
                        <span style="font-size: 11px; color: #6b7280;">• ${poi.distance}</span>
                    </div>
                </div>
            `)

            const poiMarker = new mapboxgl.Marker({ element: el, anchor: 'center' })
                .setLngLat(poi.coordinates)
                .setPopup(popup)
                .addTo(map.current!)

            // Show popup on hover
            el.addEventListener('mouseenter', () => popup.addTo(map.current!))
            el.addEventListener('mouseleave', () => popup.remove())

            poiMarkers.current.push(poiMarker)
        })
    }, [pois, activeCategories, mapLoaded])

    // Toggle category
    const toggleCategory = (categoryId: string) => {
        setActiveCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(c => c !== categoryId)
                : [...prev, categoryId]
        )
    }

    // Initialize map
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

                // Create property marker element
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

                // Add marker
                marker.current = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
                    .setLngLat([coordinates.lng, coordinates.lat])
                    .addTo(map.current!)

                // Add popup if address is provided
                if (address) {
                    const popup = new mapboxgl.Popup({
                        offset: 30,
                        closeButton: false,
                        closeOnClick: false,
                    }).setHTML(`
                        <div style="padding: 8px 12px; font-size: 14px; font-weight: 600; color: #1a1a1a;">
                            📍 ${address}
                        </div>
                    `)
                    marker.current.setPopup(popup)
                }

            })

            map.current.on('error', (e) => {
                console.error('Mapbox error:', e)
                setError('Map failed to load')
            })
        } catch (err: unknown) {
            console.error('Map initialization error:', err)
            setError(err instanceof Error ? err.message : 'Failed to initialize map')
        }

        return () => {
            poiMarkers.current.forEach(m => m.remove())
            marker.current?.remove()
            map.current?.remove()
            map.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, coordinates.lat, coordinates.lng])

    // Update POI markers when categories or POIs change
    useEffect(() => {
        updatePoiMarkers()
    }, [updatePoiMarkers])

    useEffect(() => {
        if (!mapLoaded || !showNearby || pois.length > 0 || isLoadingPois) return
        void fetchPOIs()
    }, [fetchPOIs, isLoadingPois, mapLoaded, pois.length, showNearby])

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
        <div className="space-y-3">
            {/* Map Container */}
            <div className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-neutral-200">
                <div ref={mapContainer} className="w-full h-full" />

                {/* Loading overlay */}
                {!mapLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                )}

                {/* POI Loading indicator */}
                {showNearby && isLoadingPois && mapLoaded && (
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-lg px-3 py-2 border border-neutral-200 flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-500" />
                        <span className="text-xs font-medium text-neutral-600">Finding nearby places...</span>
                    </div>
                )}
            </div>

            {mapLoaded && !showNearby && (
                <button
                    type="button"
                    onClick={() => setShowNearby(true)}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
                >
                    Load nearby places
                </button>
            )}

            {/* POI Category Filters */}
            {mapLoaded && showNearby && pois.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {POI_CATEGORIES.map(category => {
                        const Icon = category.icon
                        const count = pois.filter(p => p.category === category.id).length
                        const isActive = activeCategories.includes(category.id)

                        return (
                            <button
                                key={category.id}
                                onClick={() => toggleCategory(category.id)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all",
                                    isActive
                                        ? "border-neutral-900 bg-neutral-900 text-white"
                                        : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                                )}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{category.label}</span>
                                {count > 0 && (
                                    <span className={cn(
                                        "px-1.5 py-0.5 rounded-full text-[10px]",
                                        isActive ? "bg-white/20" : "bg-neutral-100"
                                    )}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            )}

            {/* POI List */}
            {mapLoaded && showNearby && pois.length > 0 && activeCategories.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {pois
                        .filter(poi => activeCategories.includes(poi.category))
                        .slice(0, 8)
                        .map(poi => {
                            const category = POI_CATEGORIES.find(c => c.id === poi.category)
                            if (!category) return null

                            return (
                                <div
                                    key={poi.id}
                                    className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-50 border border-neutral-100"
                                >
                                    <div
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0"
                                        style={{ backgroundColor: `${category.color}20` }}
                                    >
                                        {category.emoji}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-neutral-900 truncate">{poi.name}</p>
                                        <p className="text-[10px] text-neutral-500">{poi.distance}</p>
                                    </div>
                                </div>
                            )
                        })}
                </div>
            )}
        </div>
    )
}
