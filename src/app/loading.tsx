import { HomePageResultsSkeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <HomePageResultsSkeleton isMapView={false} />
    </div>
  )
}
