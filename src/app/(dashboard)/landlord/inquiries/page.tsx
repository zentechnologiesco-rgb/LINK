'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, MessageSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"


function LandlordInquiriesContent() {
    const inquiries = useQuery(api.inquiries.getForLandlord, {})

    if (inquiries === undefined) {
        return (
            <div className="p-6 lg:p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-gray-200 rounded" />
                    <div className="h-32 bg-gray-100 rounded-xl" />
                    <div className="h-32 bg-gray-100 rounded-xl" />
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Inquiries</h1>
                <Badge variant="outline">{inquiries.length} Total</Badge>
            </div>

            <div className="grid gap-4">
                {inquiries.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                            <MessageSquare className="h-10 w-10 mb-4 opacity-20" />
                            <p>No inquiries yet.</p>
                        </CardContent>
                    </Card>
                ) : (
                    inquiries.map((inquiry: any) => (
                        <Link key={inquiry._id} href={`/landlord/inquiries/${inquiry._id}`}>
                            <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                                <div className="flex flex-col md:flex-row">
                                    <div className="md:w-64 bg-slate-50 p-4 border-r border-border/50 flex flex-col justify-center">
                                        <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Property</p>
                                        <p className="font-medium text-sm line-clamp-2 mb-2">{inquiry.property?.title}</p>
                                        <Badge variant="secondary" className="w-fit text-xs">{inquiry.status}</Badge>
                                    </div>
                                    <div className="flex-1 p-4">
                                        <div className="flex items-start gap-4">
                                            <Avatar>
                                                <AvatarFallback>
                                                    {inquiry.tenant?.fullName?.charAt(0) || 'T'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <div className="font-semibold">{inquiry.tenant?.fullName || 'Anonymous Tenant'}</div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <CalendarDays className="h-3 w-3" />
                                                        {inquiry._creationTime && formatDistanceToNow(new Date(inquiry._creationTime), { addSuffix: true })}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-zinc-600 leading-relaxed line-clamp-2">
                                                    {inquiry.message}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}

export default function LandlordInquiriesPage() {
    return <LandlordInquiriesContent />
}
