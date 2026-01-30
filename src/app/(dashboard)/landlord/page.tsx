'use client'

import Link from 'next/link'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { Button } from '@/components/ui/button'
import { PlusCircle, Building2, Home } from 'lucide-react'
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"


function LandlordDashboardContent() {
    const properties = useQuery(api.properties.getByLandlord, {})
    const leases = useQuery(api.leases.getForLandlord, {})
    const inquiries = useQuery(api.inquiries.getForLandlord, {})

    const isLoading = properties === undefined

    if (isLoading) {
        return (
            <div className="p-4 lg:p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-gray-200 rounded" />
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-32 bg-gray-100 rounded-xl" />
                        ))}
                    </div>
                    <div className="h-64 bg-gray-100 rounded-xl" />
                </div>
            </div>
        )
    }

    const propertyCount = properties?.length || 0
    const activeLeases = leases?.filter((l: any) => l.status === 'approved').length || 0
    const occupiedProperties = activeLeases
    const occupancyRate = propertyCount > 0 ? Math.round((occupiedProperties / propertyCount) * 100) : 0

    return (
        <div className="p-4 lg:p-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Overview</h2>
                </div>
                <div className="flex gap-2">
                    <Link href="/landlord/inquiries">
                        <Button variant="outline" size="sm">
                            Inquiries
                        </Button>
                    </Link>
                    <Link href="/landlord/leases">
                        <Button variant="outline" size="sm">
                            Leases
                        </Button>
                    </Link>
                    <Link href="/landlord/properties/new">
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
                    value={activeLeases.toString()}
                    trend={{
                        value: activeLeases > 0 ? '+' + activeLeases : '0%',
                        direction: activeLeases > 0 ? 'up' : 'down',
                        label: activeLeases > 0 ? 'Active leases' : 'No active leases'
                    }}
                    subtitle="Currently renting your properties"
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
                    value={`${occupancyRate}%`}
                    trend={{
                        value: occupancyRate > 50 ? '+4.5%' : '-5%',
                        direction: occupancyRate > 50 ? 'up' : 'down',
                        label: occupancyRate > 50 ? 'Steady performance' : 'Needs attention'
                    }}
                    subtitle="Current occupancy status"
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
                        <Link href="/landlord/properties/new">
                            <Button variant="outline">Add Property</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {properties.map((property: any) => (
                            <div key={property._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="relative h-40 bg-gray-200 flex items-center justify-center">
                                    <Home className="h-10 w-10 text-gray-400" />
                                    {!property.isAvailable && (
                                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                                            Occupied
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h4 className="font-semibold text-gray-900 truncate">{property.title}</h4>
                                    <p className="text-sm text-gray-500 truncate">{property.address}</p>
                                    <div className="flex items-center justify-between mt-3">
                                        <span className="font-bold text-gray-900">N$ {property.priceNad?.toLocaleString()}</span>
                                        <Link href={`/landlord/properties/${property._id}/edit`}>
                                            <Button variant="outline" size="sm">Edit</Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default function LandlordDashboard() {
    return <LandlordDashboardContent />
}
