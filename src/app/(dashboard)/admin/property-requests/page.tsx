import { Suspense } from 'react'

import { AdminRequestWorkspaceLoadingState } from '../_components/AdminPageStates'
import { PropertyRequestsWorkspace } from './_components/PropertyRequestsWorkspace'

export default function PropertyRequestsPage() {
    return (
        <Suspense fallback={<AdminRequestWorkspaceLoadingState />}>
            <PropertyRequestsWorkspace />
        </Suspense>
    )
}
