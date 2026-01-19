import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
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
    XCircle,
    ShieldCheck,
} from 'lucide-react'
import { format } from 'date-fns'
import { PropertyActions } from './PropertyActions'

interface Property {
    id: string
    title: string
    property_type: string
    address: string
    city: string
    price_nad: number
    bedrooms: number
    bathrooms: number
    size_sqm: number
    images: string[]
    is_available: boolean
    featured: boolean
    approval_status: 'pending' | 'approved' | 'rejected'
    admin_notes: string | null
    created_at: string
    updated_at: string
}

export default async function LandlordPropertiesPage() {
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

    // Get landlord's properties with active lease info
    const { data: properties } = await supabase
        .from('properties')
        .select('*')
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false })

    // Get active leases for this landlord's properties
    const { data: activeLeases } = await supabase
        .from('leases')
        .select('property_id, status, id')
        .eq('landlord_id', user.id)
        .in('status', ['approved', 'tenant_signed', 'sent_to_tenant', 'draft'])

    // Create a map of property_id to active lease
    const propertyLeaseMap = new Map<string, { leaseId: string; status: string }>()
    activeLeases?.forEach((lease: any) => {
        // Only track the most important lease (approved takes precedence)
        const existing = propertyLeaseMap.get(lease.property_id)
        if (!existing || lease.status === 'approved') {
            propertyLeaseMap.set(lease.property_id, {
                leaseId: lease.id,
                status: lease.status
            })
        }
    })

    const propertyList = (properties || []).map((p: any) => ({
        ...p,
        activeLease: propertyLeaseMap.get(p.id) || null
    })) as (Property & { activeLease: { leaseId: string; status: string } | null })[]

    // Calculate stats
    const stats = {
        total: propertyList.length,
        pending: propertyList.filter(p => p.approval_status === 'pending').length,
        approved: propertyList.filter(p => p.approval_status === 'approved').length,
        listed: propertyList.filter(p => p.is_available && p.approval_status === 'approved').length,
        leased: propertyList.filter(p => p.activeLease?.status === 'approved').length,
    }

    return (
        <div className="px-4 py-6 sm:px-6 lg:px-8">
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
                                <p className="text-xs font-medium text-muted-foreground">Pending</p>
                                <p className="mt-1 text-2xl font-semibold tracking-tight">{stats.pending}</p>
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
                                <p className="text-xs font-medium text-muted-foreground">Approved</p>
                                <p className="mt-1 text-2xl font-semibold tracking-tight">{stats.approved}</p>
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
                                <p className="text-xs font-medium text-muted-foreground">Listed</p>
                                <p className="mt-1 text-2xl font-semibold tracking-tight">{stats.listed}</p>
                            </div>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/40">
                                <ShieldCheck className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
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
                            {propertyList.length} {propertyList.length === 1 ? 'property' : 'properties'}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="px-4 sm:px-6 py-6">
                    {propertyList.length === 0 ? (
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
                            {propertyList.map((property) => (
                                <Card key={property.id} className="gap-0 py-0 overflow-hidden">
                                    <Link
                                        href={`/properties/${property.id}`}
                                        className="relative block aspect-[16/10] bg-muted/30"
                                    >
                                        {property.images?.[0] ? (
                                            <Image
                                                src={property.images[0]}
                                                alt={property.title}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <Home className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
                                            </div>
                                        )}
                                    </Link>

                                    <CardContent className="px-4 sm:px-5 py-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-muted-foreground capitalize">
                                                    {property.property_type}
                                                </p>
                                                <Link href={`/properties/${property.id}`} className="block">
                                                    <p className="mt-1 text-base font-semibold tracking-tight line-clamp-1">
                                                        {property.title}
                                                    </p>
                                                </Link>
                                            </div>

                                            <PropertyActions
                                                propertyId={property.id}
                                                propertyTitle={property.title}
                                                propertyPrice={property.price_nad}
                                                isAvailable={property.is_available}
                                                approvalStatus={property.approval_status}
                                                adminNotes={property.admin_notes}
                                                hasActiveLease={!!property.activeLease}
                                                activeLeaseId={property.activeLease?.leaseId}
                                            />
                                        </div>

                                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                                            <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                                            <span className="truncate">{property.city}</span>
                                        </div>

                                        <div className="mt-5 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                <span className="inline-flex items-center gap-1">
                                                    <Bed className="h-4 w-4" strokeWidth={1.5} />
                                                    {property.bedrooms}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Bath className="h-4 w-4" strokeWidth={1.5} />
                                                    {property.bathrooms}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Square className="h-4 w-4" strokeWidth={1.5} />
                                                    {property.size_sqm}m²
                                                </span>
                                            </div>

                                            <div className="shrink-0 text-right">
                                                <p className="text-base font-semibold tracking-tight">
                                                    N${property.price_nad.toLocaleString()}
                                                </p>
                                                <p className="text-xs text-muted-foreground">per month</p>
                                            </div>
                                        </div>

                                        <div className="mt-5 flex flex-wrap gap-2">
                                            {/* Active Lease Badge - highest priority */}
                                            {property.activeLease?.status === 'approved' && (
                                                <Link href={`/landlord/leases/${property.activeLease.leaseId}`}>
                                                    <Badge variant="secondary" className="cursor-pointer text-muted-foreground">
                                                        <Home className="h-3 w-3" strokeWidth={1.5} />
                                                        Active Lease
                                                    </Badge>
                                                </Link>
                                            )}
                                            {/* Pending Lease */}
                                            {property.activeLease && property.activeLease.status !== 'approved' && (
                                                <Link href={`/landlord/leases/${property.activeLease.leaseId}`}>
                                                    <Badge variant="secondary" className="cursor-pointer text-muted-foreground">
                                                        <Clock className="h-3 w-3" strokeWidth={1.5} />
                                                        Lease Pending
                                                    </Badge>
                                                </Link>
                                            )}
                                            {/* Approval Status */}
                                            {property.approval_status === 'pending' && (
                                                <Badge variant="secondary" className="text-muted-foreground">
                                                    <Clock className="h-3 w-3" strokeWidth={1.5} />
                                                    Pending Approval
                                                </Badge>
                                            )}
                                            {property.approval_status === 'approved' && !property.activeLease && (
                                                <Badge variant="secondary" className="text-muted-foreground">
                                                    <CheckCircle2 className="h-3 w-3" strokeWidth={1.5} />
                                                    Approved
                                                </Badge>
                                            )}
                                            {property.approval_status === 'rejected' && (
                                                <Badge variant="secondary" className="text-muted-foreground">
                                                    <XCircle className="h-3 w-3" strokeWidth={1.5} />
                                                    Rejected
                                                </Badge>
                                            )}
                                            {/* Listing Status - only show for approved properties without active lease */}
                                            {property.approval_status === 'approved' && !property.activeLease && (
                                                property.is_available ? (
                                                    <Badge variant="secondary" className="text-muted-foreground">
                                                        Listed
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-muted-foreground">
                                                        Unlisted
                                                    </Badge>
                                                )
                                            )}
                                        </div>

                                        <p className="mt-5 text-xs text-muted-foreground">
                                            Added {format(new Date(property.created_at), 'MMM d, yyyy')}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div >
    )
}
