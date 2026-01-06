import { Card, CardContent } from '@/components/ui/card'
import { Building2, Clock, CheckCircle2, XCircle } from 'lucide-react'

interface StatsCardsProps {
    stats: {
        total: number
        pending: number
        approved: number
        rejected: number
    }
}

export function StatsCards({ stats }: StatsCardsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-blue-50">
                            <Building2 className="h-5 w-5 text-blue-600" />
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
                            <p className="text-sm text-muted-foreground">Pending</p>
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
                        <div className="p-3 rounded-lg bg-red-50">
                            <XCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Rejected</p>
                            <p className="text-2xl font-bold">{stats.rejected}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
