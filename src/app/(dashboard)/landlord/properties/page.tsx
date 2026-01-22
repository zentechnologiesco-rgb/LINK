'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Building2,
    Plus,
    MapPin,
    Bed,
    Bath,
    Square,
    Home,
    Clock,
    CheckCircle2,
} from 'lucide-react'
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"


function LandlordPropertiesContent() {
    const properties = useQuery(api.properties.getByLandlord, {})
    const leases = useQuery(api.leases.getForLandlord, {})

    if (properties === undefined) {
        return (
            <div className="p-6 lg:p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-gray-200 rounded" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
                        ))}
                    </div>
                    <div className="h-64 bg-gray-100 rounded-xl" />
                </div>
            </div>
        )
    }

    // Calculate stats
    const activeLeases = leases?.filter((l: any) => l.status === 'approved') || []
    const propertyIdsWithLease = new Set(activeLeases.map((l: any) => l.propertyId))

    const stats = {
        total: properties.length,
        listed: properties.filter(p => p.isAvailable).length,
        leased: propertyIdsWithLease.size,
    }

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-background">
                        <Building2 className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">My Properties</h1>
                        <p className="text-sm text-muted-foreground">Manage your property listings</p>
                    </div>
                </div>

                <Link href="/landlord/properties/new" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
                        Add Property
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
                <Card className="gap-0 py-4">
                    <CardContent className="px-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Total</p>
                                <p className="mt-1 text-2xl font-semibold tracking-tight">{stats.total}</p>
                            </div>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/40">
                                <Home className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="gap-0 py-4">
                    <CardContent className="px-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Listed</p>
                                <p className="mt-1 text-2xl font-semibold tracking-tight">{stats.listed}</p>
                            </div>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/40">
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="gap-0 py-4">
                    <CardContent className="px-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Leased</p>
                                <p className="mt-1 text-2xl font-semibold tracking-tight">{stats.leased}</p>
                            </div>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/40">
                                <Clock className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="gap-0 py-4">
                    <CardContent className="px-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Available</p>
                                <p className="mt-1 text-2xl font-semibold tracking-tight">{stats.listed - stats.leased}</p>
                            </div>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/40">
                                <Building2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Properties List */}
            <Card className="gap-0 py-0">
                <CardHeader className="border-b px-4 sm:px-6 py-4 pb-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="text-base font-semibold tracking-tight">All Properties</CardTitle>
                        <Badge variant="secondary" className="text-xs font-medium text-muted-foreground">
                            {properties.length} {properties.length === 1 ? 'property' : 'properties'}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="px-4 sm:px-6 py-6">
                    {properties.length === 0 ? (
                        <div className="py-10 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border bg-muted/40">
                                <Building2 className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
                            </div>
                            <h3 className="mt-5 text-lg font-semibold tracking-tight">No properties yet</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Start by adding your first property listing.
                            </p>
                            <Link href="/landlord/properties/new" className="mt-6 inline-flex">
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
                                    Add Your First Property
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {properties.map((property: any) => (
                                <Card key={property._id} className="gap-0 py-0 overflow-hidden">
                                    <Link
                                        href={`/properties/${property._id}`}
                                        className="relative block aspect-[16/10] bg-muted/30"
                                    >
                                        <div className="flex h-full w-full items-center justify-center">
                                            <Home className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
                                        </div>
                                    </Link>

                                    <CardContent className="px-4 sm:px-5 py-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-muted-foreground capitalize">
                                                    {property.propertyType}
                                                </p>
                                                <Link href={`/properties/${property._id}`} className="block">
                                                    <p className="mt-1 text-base font-semibold tracking-tight line-clamp-1">
                                                        {property.title}
                                                    </p>
                                                </Link>
                                            </div>

                                            <Link href={`/landlord/properties/${property._id}/edit`}>
                                                <Button size="sm" variant="outline">Edit</Button>
                                            </Link>
                                        </div>

                                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                                            <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                                            <span className="truncate">{property.city}</span>
                                        </div>

                                        <div className="mt-5 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                <span className="inline-flex items-center gap-1">
                                                    <Bed className="h-4 w-4" strokeWidth={1.5} />
                                                    {property.bedrooms || 0}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Bath className="h-4 w-4" strokeWidth={1.5} />
                                                    {property.bathrooms || 0}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Square className="h-4 w-4" strokeWidth={1.5} />
                                                    {property.sizeSqm || 0}m²
                                                </span>
                                            </div>

                                            <div className="shrink-0 text-right">
                                                <p className="text-base font-semibold tracking-tight">
                                                    N${property.priceNad?.toLocaleString()}
                                                </p>
                                                <p className="text-xs text-muted-foreground">per month</p>
                                            </div>
                                        </div>

                                        <div className="mt-5 flex flex-wrap gap-2">
                                            {property.isAvailable ? (
                                                <Badge variant="secondary" className="text-muted-foreground">
                                                    Listed
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-muted-foreground">
                                                    Unlisted
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default function LandlordPropertiesPage() {
    return <LandlordPropertiesContent />
}
