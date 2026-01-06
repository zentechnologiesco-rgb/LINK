import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PropertyForm } from '@/components/properties/PropertyForm'
import { getPropertyById } from '@/app/(dashboard)/landlord/actions'

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const resolvedParams = await params

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/sign-in')
    }

    // Check if user is landlord
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'landlord' && profile?.role !== 'admin') {
        redirect('/')
    }

    const property = await getPropertyById(resolvedParams.id)

    if (!property) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <main className="flex-1 py-8">
                <PropertyForm
                    mode="edit"
                    propertyId={property.id}
                    initialData={{
                        title: property.title,
                        description: property.description,
                        property_type: property.property_type,
                        price_nad: property.price_nad,
                        address: property.address,
                        city: property.city,
                        bedrooms: property.bedrooms,
                        bathrooms: property.bathrooms,
                        size_sqm: property.size_sqm,
                        amenities: property.amenities || [],
                        images: property.images || [],
                        coordinates: property.coordinates,
                    }}
                />
            </main>
        </div>
    )
}
