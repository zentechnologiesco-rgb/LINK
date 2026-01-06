import { createClient } from '@/lib/supabase/server'
import { MOCK_PROPERTIES } from '@/lib/mock-data'
import { SearchPageClient } from './SearchPageClient'

// Define the Property type needed for the feed
interface Property {
    id: string
    title: string
    price: number
    address: string
    city: string
    bedrooms: number
    bathrooms: number
    size: number
    type: string
    images: string[]
    amenities: string[]
    description: string
    coordinates?: { lat: number; lng: number } | null
}

async function getAvailableProperties(): Promise<Property[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('is_available', true)
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching properties:', error)
        return []
    }

    // Normalize database properties to match structure
    return (data || []).map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        price: p.price_nad,
        address: p.address,
        city: p.city,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        size: p.size_sqm,
        type: p.property_type.charAt(0).toUpperCase() + p.property_type.slice(1),
        images: p.images || [],
        amenities: p.amenities || [],
        coordinates: p.coordinates || null, // Pass coordinates
    }))
}

export default async function SearchPage() {
    const dbProperties = await getAvailableProperties()

    // Normalize mock properties to match the interface
    const normalizedMockProperties: Property[] = MOCK_PROPERTIES.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        price: p.price,
        address: p.address,
        city: p.city,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        size: p.size,
        type: p.type,
        images: p.images,
        amenities: p.amenities,
        coordinates: null // Mock data doesn't have coordinates stored
    }))

    const allProperties = [...dbProperties, ...normalizedMockProperties]

    return <SearchPageClient initialProperties={allProperties} />
}
