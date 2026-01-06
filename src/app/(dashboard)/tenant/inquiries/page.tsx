import Link from 'next/link'
import { getTenantInquiries } from './actions'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, MessageSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Header } from '@/components/layout/Header'
import { getDisplayName, getInitials } from '@/lib/user-name'

export default async function TenantInquiriesPage() {
    const inquiries = await getTenantInquiries()

    return (
        <div className="min-h-screen flex flex-col bg-gray-50/50">
            <Header />
            <main className="flex-1 container max-w-screen-2xl py-8 px-4 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">My Inquiries</h1>
                    <Badge variant="outline">{inquiries.length} Total</Badge>
                </div>

                <div className="grid gap-4">
                    {inquiries.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                                <MessageSquare className="h-10 w-10 mb-4 opacity-20" />
                                <p>No inquiries yet. Browser properties to start a conversation!</p>
                                <Link href="/search" className="mt-4 text-primary hover:underline">
                                    Browse Properties
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        inquiries.map((inquiry: any) => (
                            <Link key={inquiry.id} href={`/dashboard/tenant/inquiries/${inquiry.id}`}>
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
                                                    <AvatarImage src={inquiry.landlord?.avatar_url} />
                                                    <AvatarFallback>{getInitials(inquiry.landlord)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <div className="font-semibold">{getDisplayName(inquiry.landlord, 'Landlord')}</div>
                                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <CalendarDays className="h-3 w-3" />
                                                            {formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true })}
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
            </main>
        </div>
    )
}
