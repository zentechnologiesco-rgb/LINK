'use client'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChatThread } from '@/components/chat/ChatThread'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useQuery } from "convex/react"
import { api } from "../../../../../../convex/_generated/api"
import { Id } from "../../../../../../convex/_generated/dataModel"

import { use } from 'react'

interface Props {
    params: Promise<{ id: string }>
}

function TenantInquiryDetailContent({ id }: { id: string }) {
    const inquiry = useQuery(api.inquiries.getById, { inquiryId: id as Id<"inquiries"> })
    const currentUser = useQuery(api.users.currentUser)
    const messages = useQuery(api.messages.getByInquiry, { inquiryId: id as Id<"inquiries"> })

    if (inquiry === undefined || currentUser === undefined || messages === undefined) {
        return (
            <div className="p-6 lg:p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-32 bg-gray-200 rounded" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 h-96 bg-gray-100 rounded-xl" />
                        <div className="space-y-4">
                            <div className="h-48 bg-gray-100 rounded-xl" />
                            <div className="h-32 bg-gray-100 rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!inquiry || !currentUser) {
        notFound()
    }

    // Authorization: Only tenant of this inquiry can view
    if (inquiry.tenantId !== currentUser._id) {
        notFound()
    }

    return (
        <div className="p-6 lg:p-8">
            <Link href="/tenant/inquiries" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Inquiries
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chat Section */}
                <div className="lg:col-span-2">
                    <Card className="h-[600px] flex flex-col">
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Conversation</CardTitle>
                                <Badge variant={inquiry.status === 'pending' ? 'outline' : 'default'}>{inquiry.status}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 overflow-hidden">
                            <ChatThread
                                inquiryId={inquiry._id}
                                messages={messages}
                                currentUserId={currentUser._id}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Property & Landlord Info */}
                <div className="space-y-6">
                    {/* Property Card */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Property</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="relative h-32 w-full rounded-md overflow-hidden bg-gray-100">
                                <Image
                                    src={'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop'}
                                    alt={inquiry.property?.title || 'Property'}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div>
                                <p className="font-semibold">{inquiry.property?.title}</p>
                                <p className="text-sm text-muted-foreground">{inquiry.property?.address}</p>
                                <p className="font-bold mt-1">N$ {inquiry.property?.priceNad?.toLocaleString()}</p>
                            </div>
                            <Link href={`/properties/${inquiry.propertyId}`} className="text-sm text-primary hover:underline">
                                View Listing →
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Landlord Card */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Landlord</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4">
                            <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                <span className="text-gray-400 font-medium">L</span>
                            </div>
                            <div>
                                <p className="font-semibold">{inquiry.landlord?.fullName || 'Landlord'}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default function TenantInquiryDetailPage({ params }: Props) {
    const { id } = use(params)
    return <TenantInquiryDetailContent id={id} />
}
