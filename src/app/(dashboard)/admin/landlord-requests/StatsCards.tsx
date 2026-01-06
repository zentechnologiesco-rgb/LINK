import { Card, CardContent } from '@/components/ui/card'
import { Clock, CheckCircle2, XCircle, FileStack } from 'lucide-react'

interface StatsCardsProps {
    stats: {
        total: number
        pending: number
        approved: number
        rejected: number
    }
}

export function StatsCards({ stats }: StatsCardsProps) {
    const cards = [
        {
            title: 'Total Requests',
            value: stats.total,
            icon: FileStack,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Pending',
            value: stats.pending,
            icon: Clock,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
        },
        {
            title: 'Approved',
            value: stats.approved,
            icon: CheckCircle2,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            title: 'Rejected',
            value: stats.rejected,
            icon: XCircle,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
        },
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {cards.map((card) => (
                <Card key={card.title} className="overflow-hidden">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${card.bgColor}`}>
                                <card.icon className={`h-5 w-5 ${card.color}`} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{card.title}</p>
                                <p className="text-2xl font-bold">{card.value}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
