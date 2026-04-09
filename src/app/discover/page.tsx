import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import { DISCOVER_EXPERIENCE_ENABLED } from '@/config/features'
import { DiscoverFeed } from "@/features/discover/components/DiscoverFeed";

export default function DiscoverPage() {
  if (!DISCOVER_EXPERIENCE_ENABLED) {
    redirect('/')
  }

  return (
    <Suspense fallback={null}>
      <DiscoverFeed />
    </Suspense>
  )
}
