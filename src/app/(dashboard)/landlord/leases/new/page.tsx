import { Suspense } from 'react'
import { CreateLeaseClient } from './CreateLeaseClient'

export default function CreateLeasePage() {
    return (
        <Suspense fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
                    <p className="text-sm text-neutral-400 font-medium">Loading...</p>
                </div>
            </div>
        }>
            <CreateLeaseClient />
        </Suspense>
    )
}
