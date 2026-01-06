import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getPropertyForReview } from '../actions'
import { PropertyApprovalActions } from './PropertyApprovalActions'
import { ArrowLeft, User, Building2, MapPin, Bed, Bath, Square, DollarSign, Clock, CheckCircle2, XCircle, Calendar } from 'lucide-react'
import { format } from 'date-fns'

// Status configuration
const statusConfig = {
    pending: {
        label: 'Pending Review',
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        icon: Clock,
    },
    approved: {
        label: 'Approved',
        color: 'bg-green-50 text-green-700 border-green-200',
        icon: CheckCircle2,
    },
    rejected: {
        label: 'Rejected',
        color: 'bg-red-50 text-red-700 border-red-200',
        icon: XCircle,
    },
}

export default async function PropertyReviewPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const resolvedParams = await params

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/sign-in')
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        redirect('/')
    }

    const property = await getPropertyForReview(resolvedParams.id)

    if (!property) {
        notFound()
    }

    const status = property.approval_status as keyof typeof statusConfig
    const StatusIcon = statusConfig[status]?.icon || Clock

    return (
        <div className="p-6">
            {/* Navigation */}
            <div className="mb-6">
                <Link href="/admin/property-requests" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Property Requests
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <Building2 className="h-6 w-6 text-purple-600" />
                            <h1 className="text-3xl font-bold tracking-tight">Property Review</h1>
                            <Badge
                                variant="outline"
                                className={`${statusConfig[status]?.color || ''} inline-flex items-center gap-1`}
                            >
                                <StatusIcon className="h-3 w-3" />
                                {statusConfig[status]?.label || property.approval_status}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1">
                            Submitted {property.approval_requested_at
                                ? format(new Date(property.approval_requested_at), 'PPP p')
                                : format(new Date(property.created_at), 'PPP p')}
                        </p>
                    </div>
                    {property.approval_status === 'pending' && (
                        <PropertyApprovalActions propertyId={property.id} />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Property Details */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" /> Property Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Title</p>
                                <p className="font-semibold">{property.title}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Type</p>
                                <p className="capitalize">{property.property_type}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Price</p>
                                <p className="text-lg font-bold text-green-600">
                                    N${property.price_nad.toLocaleString()}/mo
                                </p>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <Bed className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                                    <p className="font-medium">{property.bedrooms}</p>
                                    <p className="text-xs text-muted-foreground">Beds</p>
                                </div>
                                <div>
                                    <Bath className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                                    <p className="font-medium">{property.bathrooms}</p>
                                    <p className="text-xs text-muted-foreground">Baths</p>
                                </div>
                                <div>
                                    <Square className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                                    <p className="font-medium">{property.size_sqm}</p>
                                    <p className="text-xs text-muted-foreground">m²</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" /> Location
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">City</p>
                                <p>{property.city}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Address</p>
                                <p>{property.address}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" /> Landlord
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-gray-100 relative overflow-hidden shrink-0">
                                    {property.landlord?.avatar_url ? (
                                        <Image src={property.landlord.avatar_url} alt="Profile" fill className="object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                                            <User className="h-6 w-6" />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold truncate">{property.landlord?.full_name || 'No Name'}</p>
                                    <p className="text-sm text-muted-foreground truncate">{property.landlord?.email}</p>
                                    <p className="text-sm text-muted-foreground">{property.landlord?.phone || 'No phone'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Previous rejection info */}
                    {property.approval_status === 'rejected' && property.admin_notes && (
                        <Card className="border-red-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-600">
                                    <XCircle className="h-5 w-5" /> Rejection Reason
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm p-3 bg-red-50 text-red-700 rounded-md border border-red-100">
                                    {property.admin_notes}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {property.approval_status === 'approved' && property.approved_at && (
                        <Card className="border-green-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-green-600">
                                    <CheckCircle2 className="h-5 w-5" /> Approval Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>Approved on {format(new Date(property.approved_at), 'PPP p')}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: Images and Description */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="h-fit">
                        <CardHeader>
                            <CardTitle>Property Images</CardTitle>
                            <CardDescription>Review the property photos carefully.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {property.images && property.images.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {property.images.map((image, index) => (
                                        <div
                                            key={index}
                                            className={`relative rounded-lg overflow-hidden border border-gray-200 ${index === 0 ? 'col-span-2 aspect-video' : 'aspect-square'}`}
                                        >
                                            <Link href={image} target="_blank">
                                                <Image
                                                    src={image}
                                                    alt={`Property image ${index + 1}`}
                                                    fill
                                                    className="object-cover hover:scale-105 transition-transform cursor-zoom-in"
                                                />
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex h-48 items-center justify-center text-muted-foreground bg-gray-50 rounded-lg">
                                    No images available
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {property.description || 'No description provided.'}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
