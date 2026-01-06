import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { ChatThread } from '@/components/chat/ChatThread'
import { getInquiryDetails, getInquiryMessages } from '@/app/(dashboard)/shared/chat/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { CreateLeaseDialog } from '@/components/leases/CreateLeaseDialog'

export default async function InquiryDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        notFound() // Or redirect to login
    }

    const inquiry = await getInquiryDetails(params.id)
    const messages = await getInquiryMessages(params.id)

    if (!inquiry) {
        notFound()
    }

    // Authorization: Only landlord or tenant of this inquiry can view
    if (inquiry.landlord_id !== user.id && inquiry.tenant_id !== user.id) {
        notFound()
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50/50">
            <Header />

            <main className="flex-1 container max-w-screen-xl py-6 px-4">
                <Link href="/dashboard/landlord/inquiries" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
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
                                    inquiryId={inquiry.id}
                                    messages={messages}
                                    currentUserId={user.id}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Property & Tenant Info */}
                    <div className="space-y-6">
                        {/* Property Card */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Property</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="relative h-32 w-full rounded-md overflow-hidden bg-gray-100">
                                    <Image
                                        src={inquiry.property?.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop'}
                                        alt={inquiry.property?.title || 'Property'}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div>
                                    <p className="font-semibold">{inquiry.property?.title}</p>
                                    <p className="text-sm text-muted-foreground">{inquiry.property?.address}</p>
                                    <p className="font-bold mt-1">N$ {inquiry.property?.price_nad?.toLocaleString()}</p>
                                </div>
                                <Link href={`/properties/${inquiry.property?.id}`} className="text-sm text-primary hover:underline">
                                    View Listing →
                                </Link>
                            </CardContent>
                        </Card>

                        {/* Tenant Card */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Tenant</CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-center gap-4">
                                <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                                    <Image
                                        src={inquiry.tenant?.avatar_url || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop'}
                                        alt={inquiry.tenant?.full_name || 'Tenant'}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div>
                                    <p className="font-semibold">{inquiry.tenant?.full_name || 'Anonymous Tenant'}</p>
                                    <p className="text-sm text-muted-foreground">{inquiry.tenant?.email}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Create Lease Action - Only show for landlord */}
                        {inquiry.landlord_id === user.id && (
                            <CreateLeaseDialog
                                propertyId={inquiry.property?.id}
                                tenantId={inquiry.tenant?.id}
                                propertyTitle={inquiry.property?.title || 'Property'}
                                monthlyRent={inquiry.property?.price_nad || 0}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
