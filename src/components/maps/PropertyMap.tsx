'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
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

// Cluster configuration
const CLUSTER_MAX_ZOOM = 14
const CLUSTER_RADIUS = 50

export function PropertyMap({
    properties,
    onPropertyClick,
    center = [17.0658, -22.5609], // Windhoek default
    zoom = 12
}: PropertyMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<mapboxgl.Map | null>(null)
    const popup = useRef<mapboxgl.Popup | null>(null)
    const [mapLoaded, setMapLoaded] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null)

    // Store properties in a ref to compare changes
    const prevPropertiesRef = useRef<string>('')

    // Get token
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

    // Convert properties to GeoJSON
    const getGeoJSON = useCallback(() => {
        return {
            type: 'FeatureCollection' as const,
            features: properties
                .filter(p => p.coordinates?.lat && p.coordinates?.lng)
                .map(property => ({
                    type: 'Feature' as const,
                    geometry: {
                        type: 'Point' as const,
                        coordinates: [property.coordinates!.lng, property.coordinates!.lat]
                    },
                    properties: {
                        id: property.id,
                        title: property.title,
                        price_nad: property.price_nad,
                        address: property.address,
                        image: property.images?.[0] || '/placeholder.jpg',
                        priceLabel: `N$${(property.price_nad / 1000).toFixed(0)}k`
                    }
                }))
        }
    }, [properties])

    // Initialize map
    useEffect(() => {
        if (map.current || !mapContainer.current) return

        if (!token) {
            setError('No Mapbox token found')
            console.error('NEXT_PUBLIC_MAPBOX_TOKEN is not set')
            return
        }

        try {
            mapboxgl.accessToken = token

            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: center,
                zoom: zoom,
            })

            map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

            map.current.on('load', () => {
                if (!map.current) return

                // Add clustered source
                map.current.addSource('properties', {
                    type: 'geojson',
                    data: getGeoJSON(),
                    cluster: true,
                    clusterMaxZoom: CLUSTER_MAX_ZOOM,
                    clusterRadius: CLUSTER_RADIUS
                })

                // Cluster circles - outer ring
                map.current.addLayer({
                    id: 'cluster-outer',
                    type: 'circle',
                    source: 'properties',
                    filter: ['has', 'point_count'],
                    paint: {
                        'circle-color': '#ffffff',
                        'circle-radius': [
                            'step',
                            ['get', 'point_count'],
                            22, // Default size
                            5, 26, // 5+ properties
                            10, 30, // 10+ properties
                            25, 36 // 25+ properties
                        ],
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#e5e7eb'
                    }
                })

                // Cluster circles - inner colored circle
                map.current.addLayer({
                    id: 'cluster-inner',
                    type: 'circle',
                    source: 'properties',
                    filter: ['has', 'point_count'],
                    paint: {
                        'circle-color': [
                            'step',
                            ['get', 'point_count'],
                            '#3b82f6', // Blue for small clusters
                            10, '#8b5cf6', // Purple for medium
                            25, '#ec4899' // Pink for large
                        ],
                        'circle-radius': [
                            'step',
                            ['get', 'point_count'],
                            16,
                            5, 20,
                            10, 24,
                            25, 30
                        ]
                    }
                })

                // Cluster count labels
                map.current.addLayer({
                    id: 'cluster-count',
                    type: 'symbol',
                    source: 'properties',
                    filter: ['has', 'point_count'],
                    layout: {
                        'text-field': '{point_count_abbreviated}',
                        'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
                        'text-size': 14
                    },
                    paint: {
                        'text-color': '#ffffff'
                    }
                })

                // Individual property markers (unclustered)
                map.current.addLayer({
                    id: 'unclustered-point-bg',
                    type: 'circle',
                    source: 'properties',
                    filter: ['!', ['has', 'point_count']],
                    paint: {
                        'circle-color': '#ffffff',
                        'circle-radius': 24,
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#e5e7eb'
                    }
                })

                // Price labels for individual properties
                map.current.addLayer({
                    id: 'unclustered-price',
                    type: 'symbol',
                    source: 'properties',
                    filter: ['!', ['has', 'point_count']],
                    layout: {
                        'text-field': ['get', 'priceLabel'],
                        'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
                        'text-size': 11,
                        'text-allow-overlap': true
                    },
                    paint: {
                        'text-color': '#111827'
                    }
                })

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
            popup.current?.remove()
            map.current?.remove()
            map.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token])

    // Add interactions after map loads
    useEffect(() => {
        if (!mapLoaded || !map.current) return

        const mapInstance = map.current

        // Click on cluster to zoom in
        mapInstance.on('click', 'cluster-inner', (e) => {
            const features = mapInstance.queryRenderedFeatures(e.point, {
                layers: ['cluster-inner']
            })
            if (!features.length) return

            const clusterId = features[0].properties?.cluster_id
            const source = mapInstance.getSource('properties') as mapboxgl.GeoJSONSource

            if (!source || typeof clusterId !== 'number') return

            source.getClusterExpansionZoom(clusterId, (err, zoom) => {
                if (err) {
                    console.error('Error expanding cluster:', err)
                    return
                }
                mapInstance.easeTo({
                    center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
                    zoom: zoom ?? 14
                })
            })
        })

        // Click on individual property to navigate
        mapInstance.on('click', 'unclustered-point-bg', (e) => {
            const features = mapInstance.queryRenderedFeatures(e.point, {
                layers: ['unclustered-point-bg']
            })
            if (!features.length) return

            const propertyId = features[0].properties?.id
            if (propertyId) {
                window.location.href = `/properties/${propertyId}`
            }
        })

        // Hover on individual property - show popup
        mapInstance.on('mouseenter', 'unclustered-point-bg', (e) => {
            mapInstance.getCanvas().style.cursor = 'pointer'

            const features = mapInstance.queryRenderedFeatures(e.point, {
                layers: ['unclustered-point-bg']
            })
            if (!features.length) return

            const props = features[0].properties
            if (!props) return

            setHoveredPropertyId(props.id)

            // Remove existing popup
            popup.current?.remove()

            // Create new popup
            popup.current = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false,
                offset: 30,
                className: 'property-map-popup'
            })
                .setLngLat((features[0].geometry as GeoJSON.Point).coordinates as [number, number])
                .setHTML(`
                    <div style="width: 220px; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.15);">
                        <div style="height: 120px; width: 100%; background-color: #f3f4f6; position: relative;">
                            <img src="${props.image}" style="width: 100%; height: 100%; object-fit: cover;" alt="${props.title}" onerror="this.src='/placeholder.jpg'" />
                        </div>
                        <div style="padding: 12px;">
                            <p style="font-weight: 600; font-size: 14px; margin: 0 0 4px 0; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${props.title}</p>
                            <p style="font-size: 12px; color: #6b7280; margin: 0 0 8px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${props.address}</p>
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <span style="font-weight: 700; font-size: 15px; color: #111827;">N$ ${Number(props.price_nad).toLocaleString()}</span>
                                <span style="font-size: 12px; color: #6b7280;">/month</span>
                            </div>
                        </div>
                    </div>
                `)
                .addTo(mapInstance)
        })

        mapInstance.on('mouseleave', 'unclustered-point-bg', () => {
            mapInstance.getCanvas().style.cursor = ''
            popup.current?.remove()
            setHoveredPropertyId(null)
        })

        // Cursor changes for clusters
        mapInstance.on('mouseenter', 'cluster-inner', () => {
            mapInstance.getCanvas().style.cursor = 'pointer'
        })

        mapInstance.on('mouseleave', 'cluster-inner', () => {
            mapInstance.getCanvas().style.cursor = ''
        })

    }, [mapLoaded])

    // Update source data when properties change
    useEffect(() => {
        if (!mapLoaded || !map.current) return

        // Check if property IDs actually changed
        const currentPropertiesIds = properties.map(p => p.id).join(',')
        if (currentPropertiesIds === prevPropertiesRef.current) return
        prevPropertiesRef.current = currentPropertiesIds

        const source = map.current.getSource('properties') as mapboxgl.GeoJSONSource
        if (source) {
            source.setData(getGeoJSON())
        }
    }, [properties, mapLoaded, getGeoJSON])

    // Fit bounds to show all properties
    useEffect(() => {
        if (!mapLoaded || !map.current || properties.length === 0) return

        const validProperties = properties.filter(p => p.coordinates?.lat && p.coordinates?.lng)
        if (validProperties.length === 0) return

        // Only fit bounds on initial load or significant change
        if (validProperties.length > 1) {
            const bounds = new mapboxgl.LngLatBounds()
            validProperties.forEach(p => {
                bounds.extend([p.coordinates!.lng, p.coordinates!.lat])
            })

            map.current.fitBounds(bounds, {
                padding: { top: 50, bottom: 50, left: 50, right: 50 },
                maxZoom: 15,
                duration: 1000
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapLoaded]) // Only run once when map loads

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
        <div className="w-full h-full relative">
            <div ref={mapContainer} className="w-full h-full" />

            {/* Cluster Legend */}
            {mapLoaded && (
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur rounded-xl border border-neutral-200 p-3 shadow-lg">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Properties</p>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="text-xs text-neutral-600">1-9</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-violet-500" />
                            <span className="text-xs text-neutral-600">10-24</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-pink-500" />
                            <span className="text-xs text-neutral-600">25+</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading overlay */}
            {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </div>
    )
}
