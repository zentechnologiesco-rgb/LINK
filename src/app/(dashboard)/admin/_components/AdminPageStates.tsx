import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AdminPageLoadingState({ label = 'Loading...' }: { label?: string }) {
    return <div className="p-6 text-sm font-medium text-neutral-500">{label}</div>
}

export function AdminRequestWorkspaceLoadingState() {
    return (
        <div className="p-6">
            <div className="animate-pulse space-y-4">
                <div className="h-12 w-64 rounded bg-gray-200" />
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((card) => (
                        <div key={card} className="h-24 rounded-xl bg-gray-100" />
                    ))}
                </div>
                <div className="h-96 rounded-xl bg-gray-100" />
            </div>
        </div>
    )
}

export function AdminAccessDeniedState() {
    return (
        <div className="p-6">
            <div className="py-16 text-center">
                <p className="text-gray-500">Access denied. Admin privileges required.</p>
            </div>
        </div>
    )
}

export function AdminPlaceholderCard({
    description,
    title = 'Coming Soon',
}: {
    description: string
    title?: string
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}
