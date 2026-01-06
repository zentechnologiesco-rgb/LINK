import Link from 'next/link'
import Image from 'next/image'
import { getLandlordLeases } from './actions'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LeaseStatusBadge } from '@/components/leases/LeaseStatusTimeline'
import { FileText, Users, DollarSign, Plus, Building2 } from 'lucide-react'
import { format } from 'date-fns'

export default async function LandlordLeasesPage() {
    const leases = await getLandlordLeases()

    // Group leases by status
    const actionRequired = leases.filter((l: any) => l.status === 'tenant_signed')
    const pendingLeases = leases.filter((l: any) =>
        ['draft', 'sent_to_tenant', 'revision_requested'].includes(l.status)
    )
    const activeLeases = leases.filter((l: any) => l.status === 'approved')
    const pastLeases = leases.filter((l: any) =>
        ['rejected', 'expired', 'terminated'].includes(l.status)
    )

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Leases</h1>
                    <p className="text-muted-foreground">
                        Manage your rental agreements and track payments
                    </p>
                </div>
                <Link href="/landlord/leases/new">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Lease
                    </Button>
                </Link>
            </div>

            {/* Stats Overview */}
            {leases.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-3xl font-bold text-yellow-600">{actionRequired.length}</p>
                            <p className="text-sm text-muted-foreground">Need Approval</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-3xl font-bold text-blue-600">{pendingLeases.length}</p>
                            <p className="text-sm text-muted-foreground">In Progress</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-3xl font-bold text-green-600">{activeLeases.length}</p>
                            <p className="text-sm text-muted-foreground">Active</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-3xl font-bold">{leases.length}</p>
                            <p className="text-sm text-muted-foreground">Total</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Empty State */}
            {leases.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center p-12">
                        <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Leases Yet</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Create your first lease agreement for one of your properties.
                        </p>
                        <Link href="/landlord/leases/new">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Lease
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Action Required */}
            {actionRequired.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                        <h2 className="text-lg font-semibold">Action Required ({actionRequired.length})</h2>
                    </div>
                    <div className="grid gap-4">
                        {actionRequired.map((lease: any) => (
                            <LeaseCard key={lease.id} lease={lease} highlight />
                        ))}
                    </div>
                </section>
            )}

            {/* In Progress */}
            {pendingLeases.length > 0 && (
                <section>
                    <h2 className="text-lg font-semibold mb-4">In Progress ({pendingLeases.length})</h2>
                    <div className="grid gap-4">
                        {pendingLeases.map((lease: any) => (
                            <LeaseCard key={lease.id} lease={lease} />
                        ))}
                    </div>
                </section>
            )}

            {/* Active Leases */}
            {activeLeases.length > 0 && (
                <section>
                    <h2 className="text-lg font-semibold mb-4 text-green-600">Active Leases ({activeLeases.length})</h2>
                    <div className="grid gap-4">
                        {activeLeases.map((lease: any) => (
                            <LeaseCard key={lease.id} lease={lease} />
                        ))}
                    </div>
                </section>
            )}

            {/* Past Leases */}
            {pastLeases.length > 0 && (
                <section>
                    <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Past Leases</h2>
                    <div className="grid gap-4 opacity-75">
                        {pastLeases.map((lease: any) => (
                            <LeaseCard key={lease.id} lease={lease} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}

function LeaseCard({ lease, highlight }: { lease: any; highlight?: boolean }) {
    return (
        <Link href={`/landlord/leases/${lease.id}`}>
            <Card className={`hover:shadow-md transition-all cursor-pointer ${highlight ? 'ring-2 ring-yellow-400 ring-offset-2' : ''
                }`}>
                <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                        {/* Property Image */}
                        <div className="relative w-full md:w-48 h-32 md:h-auto bg-gray-100 flex-shrink-0">
                            {lease.property?.images?.[0] ? (
                                <Image
                                    src={lease.property.images[0]}
                                    alt={lease.property?.title || 'Property'}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                    <Building2 className="h-8 w-8 text-gray-300" />
                                </div>
                            )}
                        </div>

                        {/* Lease Info */}
                        <div className="flex-1 p-4 space-y-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg">{lease.property?.title}</h3>
                                    <p className="text-sm text-muted-foreground">{lease.property?.address}</p>
                                </div>
                                <LeaseStatusBadge status={lease.status} />
                            </div>

                            <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span>{lease.tenant?.full_name || 'No tenant assigned'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <span>N$ {lease.monthly_rent?.toLocaleString()}/mo</span>
                                </div>
                            </div>

                            <div className="text-xs text-muted-foreground">
                                {format(new Date(lease.start_date), 'MMM d, yyyy')} - {format(new Date(lease.end_date), 'MMM d, yyyy')}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
