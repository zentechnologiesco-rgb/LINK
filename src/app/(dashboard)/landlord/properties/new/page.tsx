import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PropertyForm } from '@/components/properties/PropertyForm'

export default async function CreatePropertyPage() {
    const supabase = await createClient()

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

    return (
        <div className="px-4 py-6 sm:px-6 lg:px-8">
            <PropertyForm mode="create" />
        </div>
    )
}
