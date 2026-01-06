import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLandlordProperties } from '../actions'
import { CreateLeaseClient } from './CreateLeaseClient'

export default async function CreateLeasePage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/signin')
    }

    // Get current user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Get landlord's available properties
    const properties = await getLandlordProperties()

    return (
        <CreateLeaseClient
            properties={properties}
            currentUser={profile}
        />
    )
}
