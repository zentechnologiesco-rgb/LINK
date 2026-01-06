import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PropertyCard } from '@/components/properties/PropertyCard'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { Button } from '@/components/ui/button'
import { PlusCircle, Building2 } from 'lucide-react'

export default async function LandlordDashboard() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/sign-in')
    }

    // Fetch landlord's properties
    const { data: properties } = await supabase
        .from('properties')
        .select('*')
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false })

    const propertyCount = properties?.length || 0

    return (
        <div className="p-4 lg:p-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Overview</h2>
                    <p className="text-sm text-gray-500">Manage your listings and tenant requests.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/landlord/inquiries">
                        <Button variant="outline" size="sm">
                            Inquiries
                        </Button>
                    </Link>
                    <Link href="/dashboard/landlord/leases">
                        <Button variant="outline" size="sm">
                            Leases
                        </Button>
                    </Link>
                    <Link href="/dashboard/landlord/properties/new">
                        <Button size="sm" className="bg-gray-900 hover:bg-gray-800 text-white gap-2">
                            <PlusCircle className="h-4 w-4" />
                            List Property
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatsCard
                    title="Total Revenue"
                    value="N$ 0.00"
                    trend={{
                        value: '+12.5%',
                        direction: 'up',
                        label: 'Trending up this month'
                    }}
                    subtitle="Revenue for the last 6 months"
                />
                <StatsCard
                    title="Active Tenants"
                    value="0"
                    trend={{
                        value: '-20%',
                        direction: 'down',
                        label: 'Down 20% this period'
                    }}
                    subtitle="Tenant acquisition needs attention"
                />
                <StatsCard
                    title="Total Properties"
                    value={propertyCount.toString()}
                    trend={{
                        value: '+12.5%',
                        direction: 'up',
                        label: 'Strong portfolio growth'
                    }}
                    subtitle="Active listings on platform"
                />
                <StatsCard
                    title="Occupancy Rate"
                    value="0%"
                    trend={{
                        value: '+4.5%',
                        direction: 'up',
                        label: 'Steady performance increase'
                    }}
                    subtitle="Meets growth projections"
                />
            </div>

            {/* Properties List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Your Properties</h3>
                </div>

                {!properties || properties.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 rounded-xl bg-white">
                        <Building2 className="h-10 w-10 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No properties listed yet</h3>
                        <p className="text-sm text-gray-500 mb-4">Start by adding your first property to the platform.</p>
                        <Link href="/dashboard/landlord/properties/new">
                            <Button variant="outline">Add Property</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {properties.map((property: any) => (
                            <PropertyCard key={property.id} property={{
                                ...property,
                                images: property.images || [],
                                image: property.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop'
                            }} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
