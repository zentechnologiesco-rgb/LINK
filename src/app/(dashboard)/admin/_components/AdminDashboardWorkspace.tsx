'use client'

import Link from 'next/link'
import { useMutation, useQuery } from 'convex/react'
import { Shield } from '@/components/ui/icons'
import { toast } from 'sonner'

import { api } from '@convex/_generated/api'
import { Button } from '@/components/ui/button'

import type { DashboardOverview, DashboardProperty, DashboardUser } from '../_lib/admin-dashboard-types'
import {
    AdminDashboardFocusPanels,
    AdminDashboardHero,
    AdminDashboardManagementPanels,
    AdminDashboardMarketPanels,
    AdminDashboardSystemPanels,
} from './AdminDashboardSections'

function AdminAccessDenied() {
    return (
        <div className="p-6 lg:p-8">
            <div className="mx-auto max-w-xl text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/[0.05]">
                    <Shield className="h-7 w-7 text-neutral-400" />
                </div>
                <h1 className="mt-6 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">Access denied</h1>
                <p className="mt-2 text-neutral-500">Admin access is required.</p>
                <Button asChild className="mt-6 rounded-full">
                    <Link href="/">Return home</Link>
                </Button>
            </div>
        </div>
    )
}

export function AdminDashboardWorkspace() {
    const overview = useQuery(api.admin.getDashboardOverview) as DashboardOverview | null | undefined
    const updateUserRole = useMutation(api.admin.updateUserRole)
    const togglePropertyAvailability = useMutation(api.admin.togglePropertyAvailability)
    const deleteProperty = useMutation(api.admin.deleteProperty)

    if (overview === undefined) {
        return <div className="p-6 lg:p-8">Loading…</div>
    }

    if (!overview) {
        return <AdminAccessDenied />
    }

    const pendingLeaseWork =
        overview.leases.sent_to_tenant +
        overview.leases.tenant_signed +
        overview.leases.revision_requested
    const unresolvedSupport =
        overview.engagement.support.open +
        overview.engagement.support.pending

    const assignRole = async (
        userId: DashboardUser['_id'],
        nextRole: DashboardUser['role'],
    ) => {
        try {
            await updateUserRole({ userId, role: nextRole })
            toast.success(`User updated to ${nextRole}`)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not update role')
        }
    }

    const toggleListing = async (
        propertyId: DashboardProperty['_id'],
        isPublished: boolean,
    ) => {
        try {
            await togglePropertyAvailability({ propertyId, isAvailable: !isPublished })
            toast.success(isPublished ? 'Listing hidden' : 'Listing published')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not update listing')
        }
    }

    const removeProperty = async (propertyId: DashboardProperty['_id']) => {
        try {
            await deleteProperty({ propertyId })
            toast.success('Property deleted')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not delete property')
        }
    }

    return (
        <div className="bg-[#ffffff] font-[var(--font-apple-ui)] text-[#111827]">
            <div className="mx-auto max-w-[1360px] space-y-10 px-4 pb-24 pt-6 sm:px-6 lg:px-8">
                <AdminDashboardHero overview={overview} />
                <AdminDashboardFocusPanels
                    overview={overview}
                    unresolvedSupport={unresolvedSupport}
                    pendingLeaseWork={pendingLeaseWork}
                />
                <AdminDashboardSystemPanels overview={overview} />
                <AdminDashboardMarketPanels overview={overview} />
                <AdminDashboardManagementPanels
                    overview={overview}
                    onAssignRole={assignRole}
                    onToggleListing={toggleListing}
                    onRemoveProperty={removeProperty}
                />
            </div>
        </div>
    )
}
