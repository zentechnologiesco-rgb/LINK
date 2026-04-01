import { Suspense } from 'react'

import { AdminRequestWorkspaceLoadingState } from '../_components/AdminPageStates'
import { LandlordRequestsWorkspace } from './_components/LandlordRequestsWorkspace'

export default function LandlordRequestsPage() {
    return (
        <Suspense fallback={<AdminRequestWorkspaceLoadingState />}>
            <LandlordRequestsWorkspace />
        </Suspense>
    )
}
