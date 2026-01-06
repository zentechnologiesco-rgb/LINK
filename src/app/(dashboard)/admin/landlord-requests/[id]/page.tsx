import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getAdminRequestById } from '@/lib/verification'
import { RequestActions } from './RequestActions'
import { ArrowLeft, User, Building2, CreditCard, ClipboardList, CheckCircle2, XCircle, Clock, Calendar, MessageSquare } from 'lucide-react'
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

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

    const request = await getAdminRequestById(resolvedParams.id)

    if (!request) {
        notFound()
    }

    const { user: applicant, documents } = request
    const status = request.status as keyof typeof statusConfig
    const StatusIcon = statusConfig[status]?.icon || Clock

    return (
        <div className="p-6">
            {/* Navigation */}
            <div className="mb-6">
                <Link href="/admin/landlord-requests" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Requests
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <ClipboardList className="h-6 w-6 text-purple-600" />
                            <h1 className="text-3xl font-bold tracking-tight">Application Details</h1>
                            <Badge
                                variant="outline"
                                className={`${statusConfig[status]?.color || ''} inline-flex items-center gap-1`}
                            >
                                <StatusIcon className="h-3 w-3" />
                                {statusConfig[status]?.label || request.status}
                            </Badge>
                            {documents?.is_resubmission && (
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                    Resubmission
                                </Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground mt-1">
                            Submitted on {format(new Date(request.created_at), 'PPP p')}
                        </p>
                    </div>
                    {request.status === 'pending' && (
                        <RequestActions requestId={request.id} />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Applicant Info */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" /> Applicant
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-gray-100 relative overflow-hidden shrink-0">
                                    {applicant?.avatar_url ? (
                                        <Image src={applicant.avatar_url} alt="Profile" fill className="object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                                            <User className="h-8 w-8" />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold truncate">{applicant?.full_name || 'No Name'}</p>
                                    <p className="text-sm text-muted-foreground truncate">{applicant?.email}</p>
                                    <p className="text-sm text-muted-foreground">{applicant?.phone || 'No phone'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" /> Business Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Business Name</p>
                                <p>{documents.business_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Registration Number</p>
                                <p>{documents.business_registration || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" /> ID Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">ID Type</p>
                                <p className="capitalize">{documents.id_type?.replace('_', ' ') || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">ID Number</p>
                                <p>{documents.id_number || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Review Info - shows for approved/rejected */}
                    {request.status !== 'pending' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" /> Review Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Decision</p>
                                    <p className="capitalize font-medium">
                                        {request.status === 'approved' ? (
                                            <span className="text-green-600">Approved</span>
                                        ) : (
                                            <span className="text-red-600">Rejected</span>
                                        )}
                                    </p>
                                </div>
                                {request.reviewed_at && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Reviewed On</p>
                                        <p>{format(new Date(request.reviewed_at), 'PPP p')}</p>
                                    </div>
                                )}
                                {request.admin_notes && request.status === 'rejected' && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                            <MessageSquare className="h-4 w-4" /> Rejection Reason
                                        </p>
                                        <p className="text-sm mt-1 p-3 bg-red-50 text-red-700 rounded-md border border-red-100">
                                            {request.admin_notes}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: Documents */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Identity Documents</CardTitle>
                            <CardDescription>Review the uploaded ID images carefully.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div>
                                <h3 className="text-sm font-medium mb-3">Front of ID</h3>
                                <div className="relative aspect-[16/9] w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                    {documents.id_front_url ? (
                                        <Link href={documents.id_front_url} target="_blank">
                                            <Image
                                                src={documents.id_front_url}
                                                alt="ID Front"
                                                fill
                                                className="object-contain hover:scale-105 transition-transform cursor-zoom-in"
                                            />
                                        </Link>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-muted-foreground">
                                            No image available
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h3 className="text-sm font-medium mb-3">Back of ID</h3>
                                <div className="relative aspect-[16/9] w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                    {documents.id_back_url ? (
                                        <Link href={documents.id_back_url} target="_blank">
                                            <Image
                                                src={documents.id_back_url}
                                                alt="ID Back"
                                                fill
                                                className="object-contain hover:scale-105 transition-transform cursor-zoom-in"
                                            />
                                        </Link>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-muted-foreground">
                                            No image available
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
