'use client'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { RequestActions } from './RequestActions'
import { ArrowLeft, User, Building2, CreditCard, ClipboardList, CheckCircle2, XCircle, Clock, Calendar, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import { useQuery } from "convex/react"
import { api } from "../../../../../../convex/_generated/api"
import { Id } from "../../../../../../convex/_generated/dataModel"
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react"
import { use } from 'react'

interface Props {
    params: Promise<{ id: string }>
}

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

function RequestDetailContent({ id }: { id: string }) {
    const currentUser = useQuery(api.users.currentUser)
    const request = useQuery(api.verification.getByIdAdmin, { requestId: id as Id<"landlordRequests"> })

    if (currentUser === undefined || request === undefined) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-12 w-64 bg-gray-200 rounded" />
                    <div className="grid grid-cols-3 gap-6">
                        <div className="h-96 bg-gray-100 rounded-xl" />
                        <div className="col-span-2 h-96 bg-gray-100 rounded-xl" />
                    </div>
                </div>
            </div>
        )
    }

    if (!currentUser || currentUser.role !== 'admin') {
        return (
            <div className="p-6">
                <div className="text-center py-16">
                    <p className="text-gray-500">Access denied. Admin privileges required.</p>
                </div>
            </div>
        )
    }

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
                            {documents?.isResubmission && (
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                    Resubmission
                                </Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground mt-1">
                            Submitted on {format(new Date(request._creationTime), 'PPP p')}
                        </p>
                    </div>
                    {request.status === 'pending' && (
                        <RequestActions requestId={request._id} />
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
                                <div className="h-16 w-16 rounded-full bg-gray-100 relative overflow-hidden shrink-0 flex items-center justify-center">
                                    <User className="h-8 w-8 text-gray-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold truncate">{applicant?.fullName || 'No Name'}</p>
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
                                <p>{documents.businessName || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Registration Number</p>
                                <p>{documents.businessRegistration || 'N/A'}</p>
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
                                <p className="capitalize">{documents.idType?.replace('_', ' ') || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">ID Number</p>
                                <p>{documents.idNumber || 'N/A'}</p>
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
                                {request.reviewedAt && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Reviewed On</p>
                                        <p>{format(new Date(request.reviewedAt), 'PPP p')}</p>
                                    </div>
                                )}
                                {request.adminNotes && request.status === 'rejected' && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                            <MessageSquare className="h-4 w-4" /> Rejection Reason
                                        </p>
                                        <p className="text-sm mt-1 p-3 bg-red-50 text-red-700 rounded-md border border-red-100">
                                            {request.adminNotes}
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
                                    {documents.idFrontUrl ? (
                                        <Link href={documents.idFrontUrl} target="_blank">
                                            <Image
                                                src={documents.idFrontUrl}
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
                                    {documents.idBackUrl ? (
                                        <Link href={documents.idBackUrl} target="_blank">
                                            <Image
                                                src={documents.idBackUrl}
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

export default function RequestDetailPage({ params }: Props) {
    const { id } = use(params)

    return (
        <>
            <AuthLoading>
                <div className="p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-12 w-64 bg-gray-200 rounded" />
                        <div className="h-96 bg-gray-100 rounded-xl" />
                    </div>
                </div>
            </AuthLoading>

            <Unauthenticated>
                <div className="p-6">
                    <div className="text-center py-16">
                        <p className="text-gray-500">Please sign in to access admin panel</p>
                        <Link href="/sign-in">
                            <Button className="mt-4 bg-gray-900 hover:bg-gray-800">Sign In</Button>
                        </Link>
                    </div>
                </div>
            </Unauthenticated>

            <Authenticated>
                <RequestDetailContent id={id} />
            </Authenticated>
        </>
    )
}
