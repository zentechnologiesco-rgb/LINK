import { createClient } from '@/lib/supabase/server'
import { MOCK_PROPERTIES } from '@/lib/mock-data'
import { PropertyFeed } from '@/components/properties/PropertyFeed'

// Normalize property data from different sources
interface NormalizedProperty {
  id: string
  title: string
  description: string
  price: number
  address: string
  city: string
  bedrooms: number
  bathrooms: number
  size: number
  type: string
  images: string[]
  amenities: string[]
  isFromDatabase?: boolean
}

async function getApprovedProperties(): Promise<NormalizedProperty[]> {
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

  // Normalize database properties to match mock structure
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
    isFromDatabase: true,
  }))
}

export default async function HomePage() {
  // Fetch real properties from database
  const dbProperties = await getApprovedProperties()

  // Combine with mock properties (database properties first)
  const allProperties = [...dbProperties, ...MOCK_PROPERTIES]

  return (
    <div className="p-6 lg:p-8">
      <PropertyFeed properties={allProperties} />
    </div>
  )
}
