'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MapPin, Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LocationPickerProps {
    initialCoordinates?: { lat: number; lng: number } | null
    onLocationChange: (coordinates: { lat: number; lng: number } | null) => void
    onAddressChange?: (address: string) => void
}

interface GeocodingResult {
    place_name: string
    center: [number, number] // [lng, lat]
}

export function LocationPicker({
    initialCoordinates = null,
    onLocationChange,
    onAddressChange
}: LocationPickerProps) {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<mapboxgl.Map | null>(null)
    const marker = useRef<mapboxgl.Marker | null>(null)
    const [mapLoaded, setMapLoaded] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [searchResults, setSearchResults] = useState<GeocodingResult[]>([])
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(initialCoordinates)
    const isInitialMount = useRef(true)

    // Store callbacks in refs to avoid dependency issues
    const onLocationChangeRef = useRef(onLocationChange)
    onLocationChangeRef.current = onLocationChange

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

    // Default center (Windhoek, Namibia)
    const defaultCenter: [number, number] = [17.0658, -22.5609]

    // Place marker function (not using useCallback to avoid dependency issues)
    const placeMarkerOnMap = (lat: number, lng: number, notifyParent: boolean = true) => {
        if (!map.current) return

        // Remove existing marker
        marker.current?.remove()

        // Create new marker
        marker.current = new mapboxgl.Marker({
            color: '#000000',
            draggable: true,
        })
            .setLngLat([lng, lat])
            .addTo(map.current)

        // Handle marker drag
        marker.current.on('dragend', () => {
            const lngLat = marker.current?.getLngLat()
            if (lngLat) {
                const newCoords = { lat: lngLat.lat, lng: lngLat.lng }
                setCoordinates(newCoords)
                onLocationChangeRef.current(newCoords)
            }
        })

        // Update state
        const newCoords = { lat, lng }
        setCoordinates(newCoords)

        // Only notify parent if not the initial placement
        if (notifyParent) {
            onLocationChangeRef.current(newCoords)
        }

        // Center map on marker
        map.current.flyTo({
            center: [lng, lat],
            zoom: 15,
        })
    }

    // Initialize map
    useEffect(() => {
        if (map.current || !mapContainer.current) return

        if (!token) {
            setError('Map not available - Mapbox token missing')
            return
        }

        try {
            mapboxgl.accessToken = token

            const initialCenter = initialCoordinates
                ? [initialCoordinates.lng, initialCoordinates.lat]
                : defaultCenter

            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: initialCenter as [number, number],
                zoom: initialCoordinates ? 15 : 12,
            })

            map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

            map.current.on('load', () => {
                setMapLoaded(true)
            })

            // Click to place marker
            map.current.on('click', (e) => {
                const { lng, lat } = e.lngLat
                placeMarkerOnMap(lat, lng, true)
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
    }, [token])

    // Place initial marker (only once when map loads)
    useEffect(() => {
        if (mapLoaded && initialCoordinates && map.current && isInitialMount.current) {
            isInitialMount.current = false
            // Don't notify parent for initial placement - it already has the coordinates
            placeMarkerOnMap(initialCoordinates.lat, initialCoordinates.lng, false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapLoaded])

    // Search for address
    const handleSearch = async () => {
        if (!searchQuery.trim() || !token) return

        setIsSearching(true)
        setSearchResults([])

        try {
            // Bias search towards Namibia
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${token}&country=na&limit=5`
            )
            const data = await response.json()

            if (data.features && data.features.length > 0) {
                setSearchResults(data.features.map((f: any) => ({
                    place_name: f.place_name,
                    center: f.center,
                })))
            } else {
                setSearchResults([])
            }
        } catch (err) {
            console.error('Geocoding error:', err)
        } finally {
            setIsSearching(false)
        }
    }

    const selectSearchResult = (result: GeocodingResult) => {
        const [lng, lat] = result.center
        placeMarkerOnMap(lat, lng, true)
        setSearchResults([])
        setSearchQuery(result.place_name)
        onAddressChange?.(result.place_name.split(',')[0])
    }

    if (error || !token) {
        return (
            <div className="w-full h-64 flex items-center justify-center bg-neutral-50 rounded-xl border border-neutral-100">
                <div className="text-center p-6">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-neutral-400" strokeWidth={1.5} />
                    <p className="text-sm text-neutral-500">{error || 'Map not available'}</p>
                    <p className="text-xs text-neutral-400 mt-1">Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" strokeWidth={1.5} />
                        <Input
                            placeholder="Search for an address..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="pl-9 bg-neutral-50 border-transparent focus:bg-white focus:border-neutral-200 h-11 rounded-xl font-medium transition-all"
                        />
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="h-11 px-6 rounded-xl font-bold uppercase tracking-wider text-xs border border-neutral-100 bg-white hover:bg-neutral-50"
                    >
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} /> : 'Search'}
                    </Button>
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-neutral-100 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        {searchResults.map((result, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => selectSearchResult(result)}
                                className="w-full px-4 py-3 text-left text-sm hover:bg-neutral-50 border-b border-neutral-50 last:border-0 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <MapPin className="h-4 w-4 text-neutral-400 shrink-0" strokeWidth={1.5} />
                                    <span className="truncate font-medium text-neutral-700">{result.place_name}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Map */}
            <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-inner bg-neutral-100">
                <div ref={mapContainer} className="w-full h-full" />
                {!mapLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
                        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" strokeWidth={1.5} />
                    </div>
                )}
            </div>

            {/* Coordinates Display */}
            {coordinates && (
                <div className="flex items-center justify-end gap-2 text-[10px] font-mono font-medium text-neutral-400 uppercase tracking-wider">
                    <MapPin className="h-3 w-3" strokeWidth={1.5} />
                    <span>
                        {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                    </span>
                </div>
            )}
        </div>
    )
}
