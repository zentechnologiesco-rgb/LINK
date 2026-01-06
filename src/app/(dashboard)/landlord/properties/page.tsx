import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Building2, Plus, Eye, Edit, Trash2, ToggleLeft, ToggleRight, MapPin,
    Bed, Bath, Square, DollarSign, Home, MoreHorizontal, AlertCircle,
    Clock, CheckCircle2, XCircle, ShieldCheck
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
    const { data: properties, error } = await supabase
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
        <div className="p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-6 w-6 text-purple-600" />
                        <h1 className="text-3xl font-bold tracking-tight">My Properties</h1>
                    </div>
                    <p className="text-muted-foreground">Manage your property listings</p>
                </div>
                <Link href="/landlord/properties/new">
                    <Button className="bg-black hover:bg-zinc-800">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Property
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-blue-50">
                                <Home className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-yellow-50">
                                <Clock className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Pending Approval</p>
                                <p className="text-2xl font-bold">{stats.pending}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-green-50">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Approved</p>
                                <p className="text-2xl font-bold">{stats.approved}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-purple-50">
                                <ShieldCheck className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Listed</p>
                                <p className="text-2xl font-bold">{stats.listed}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Properties List */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle>All Properties</CardTitle>
                        <Badge variant="secondary" className="text-sm font-normal">
                            {propertyList.length} {propertyList.length === 1 ? 'property' : 'properties'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {propertyList.length === 0 ? (
                        <div className="py-12 text-center">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                                <Building2 className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium mb-1">No properties yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Start by adding your first property listing.
                            </p>
                            <Link href="/landlord/properties/new">
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Your First Property
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[300px]">Property</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Specs</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {propertyList.map((property) => (
                                        <TableRow key={property.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="relative h-12 w-16 rounded-md overflow-hidden bg-gray-100 shrink-0">
                                                        {property.images?.[0] ? (
                                                            <Image
                                                                src={property.images[0]}
                                                                alt={property.title}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center">
                                                                <Home className="h-5 w-5 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium truncate max-w-[200px]">
                                                            {property.title}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Added {format(new Date(property.created_at), 'MMM d, yyyy')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="capitalize">{property.property_type}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm">
                                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                                    <span className="truncate max-w-[120px]">{property.city}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Bed className="h-3 w-3" /> {property.bedrooms}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Bath className="h-3 w-3" /> {property.bathrooms}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Square className="h-3 w-3" /> {property.size_sqm}m²
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium">
                                                    N${property.price_nad.toLocaleString()}
                                                </span>
                                                <span className="text-xs text-muted-foreground">/mo</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    {/* Active Lease Badge - highest priority */}
                                                    {property.activeLease?.status === 'approved' && (
                                                        <Link href={`/landlord/leases/${property.activeLease.leaseId}`}>
                                                            <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 inline-flex items-center gap-1 cursor-pointer">
                                                                <Home className="h-3 w-3" />
                                                                Active Lease
                                                            </Badge>
                                                        </Link>
                                                    )}
                                                    {/* Pending Lease */}
                                                    {property.activeLease && property.activeLease.status !== 'approved' && (
                                                        <Link href={`/landlord/leases/${property.activeLease.leaseId}`}>
                                                            <Badge className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 inline-flex items-center gap-1 cursor-pointer text-[10px]">
                                                                <Clock className="h-3 w-3" />
                                                                Lease Pending
                                                            </Badge>
                                                        </Link>
                                                    )}
                                                    {/* Approval Status */}
                                                    {property.approval_status === 'pending' && (
                                                        <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50 inline-flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            Pending Approval
                                                        </Badge>
                                                    )}
                                                    {property.approval_status === 'approved' && !property.activeLease && (
                                                        <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50 inline-flex items-center gap-1">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Approved
                                                        </Badge>
                                                    )}
                                                    {property.approval_status === 'rejected' && (
                                                        <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50 inline-flex items-center gap-1">
                                                            <XCircle className="h-3 w-3" />
                                                            Rejected
                                                        </Badge>
                                                    )}
                                                    {/* Listing Status - only show for approved properties without active lease */}
                                                    {property.approval_status === 'approved' && !property.activeLease && (
                                                        property.is_available ? (
                                                            <Badge className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50 text-[10px]">
                                                                Listed
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-[10px]">
                                                                Unlisted
                                                            </Badge>
                                                        )
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
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
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div >
    )
}
