import Link from 'next/link'
import Image from 'next/image'
import { getLandlordLeases } from './actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LeaseStatusBadge } from '@/components/leases/LeaseStatusTimeline'
import { Building2, CheckCircle2, Clock, FileText, Plus, Users, DollarSign } from 'lucide-react'
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
        <div className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-background">
                        <FileText className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Leases</h1>
                        <p className="text-sm text-muted-foreground">Manage your rental agreements and track payments</p>
                    </div>
                </div>

                <Link href="/landlord/leases/new" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
                        Create Lease
                    </Button>
                </Link>
            </div>

            {/* Stats Overview */}
            {leases.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
                    <Card className="gap-0 py-4">
                        <CardContent className="px-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Need Approval</p>
                                    <p className="mt-1 text-2xl font-semibold tracking-tight">{actionRequired.length}</p>
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
                                    <p className="text-xs font-medium text-muted-foreground">In Progress</p>
                                    <p className="mt-1 text-2xl font-semibold tracking-tight">{pendingLeases.length}</p>
                                </div>
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/40">
                                    <FileText className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="gap-0 py-4">
                        <CardContent className="px-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Active</p>
                                    <p className="mt-1 text-2xl font-semibold tracking-tight">{activeLeases.length}</p>
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
                                    <p className="text-xs font-medium text-muted-foreground">Total</p>
                                    <p className="mt-1 text-2xl font-semibold tracking-tight">{leases.length}</p>
                                </div>
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/40">
                                    <Building2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Empty State */}
            {leases.length === 0 && (
                <Card className="gap-0 py-0">
                    <CardContent className="py-10 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border bg-muted/40">
                            <FileText className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
                        </div>
                        <h3 className="mt-5 text-lg font-semibold tracking-tight">No leases yet</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Create your first lease agreement for one of your properties.
                        </p>
                        <Link href="/landlord/leases/new" className="mt-6 inline-flex">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
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
                        <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-pulse" />
                        <h2 className="text-lg font-semibold">Action Required ({actionRequired.length})</h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {pendingLeases.map((lease: any) => (
                            <LeaseCard key={lease.id} lease={lease} />
                        ))}
                    </div>
                </section>
            )}

            {/* Active Leases */}
            {activeLeases.length > 0 && (
                <section>
                    <h2 className="text-lg font-semibold mb-4">Active Leases ({activeLeases.length})</h2>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 opacity-80">
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
        <Link href={`/landlord/leases/${lease.id}`} className="block">
            <Card className={`gap-0 py-0 overflow-hidden transition-shadow hover:shadow-md ${highlight ? 'ring-1 ring-foreground/10' : ''}`}>
                <div className="relative block aspect-[16/10] bg-muted/30">
                    {lease.property?.images?.[0] ? (
                        <Image
                            src={lease.property.images[0]}
                            alt={lease.property?.title || 'Property'}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <Building2 className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
                        </div>
                    )}
                </div>

                <CardContent className="px-4 sm:px-5 py-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-muted-foreground">Lease</p>
                            <p className="mt-1 text-base font-semibold tracking-tight line-clamp-1">
                                {lease.property?.title}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                                {lease.property?.address}
                            </p>
                        </div>
                        <LeaseStatusBadge status={lease.status} />
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" strokeWidth={1.5} />
                            <span className="truncate max-w-[14rem]">{lease.tenant?.full_name || 'No tenant assigned'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <DollarSign className="h-4 w-4" strokeWidth={1.5} />
                            <span>N$ {lease.monthly_rent?.toLocaleString()}/mo</span>
                        </div>
                    </div>

                    <p className="mt-4 text-xs text-muted-foreground">
                        {format(new Date(lease.start_date), 'MMM d, yyyy')} - {format(new Date(lease.end_date), 'MMM d, yyyy')}
                    </p>
                </CardContent>
            </Card>
        </Link>
    )
}
