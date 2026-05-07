import { DashboardCardSkeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="p-6 sm:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
      </div>
      <div className="space-y-4">
        <div className="h-8 w-48 bg-neutral-100 animate-pulse rounded-lg" />
        <div className="bg-white rounded-xl border border-neutral-200 p-1 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 border-b border-neutral-100 animate-pulse bg-neutral-50/30" />
          ))}
        </div>
      </div>
    </div>
  )
}
