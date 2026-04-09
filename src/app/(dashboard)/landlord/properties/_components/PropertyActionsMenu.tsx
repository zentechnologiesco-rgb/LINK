'use client'

import Link from 'next/link'
import {
    AlertCircle,
    Clapperboard,
    Edit,
    Eye,
    Loader2,
    MoreHorizontal,
    Send,
    ToggleLeft,
    ToggleRight,
    Trash2,
    UserPlus,
} from 'lucide-react'
import { type Id } from '../../../../../../convex/_generated/dataModel'

import { Button } from '@/components/ui/button'
import { DISCOVER_EXPERIENCE_ENABLED } from '@/config/features'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { getDiscoveryClipActionLabel } from '../_lib/property-actions-helpers'

const menuItemClassName = 'rounded-lg focus:bg-black/5 cursor-pointer py-2 font-medium'
const separatorClassName = 'bg-black/5'

interface PropertyActionsMenuProps {
    propertyId: Id<'properties'>
    activeLeaseId?: string
    approvalStatus: 'pending' | 'approved' | 'rejected'
    adminNotes: string | null
    hasDiscoveryClip: boolean
    canAssignTenant: boolean
    canToggleVisibility: boolean
    isListed: boolean
    isToggling: boolean
    isRequestingApproval: boolean
    visibilityLabel: string
    visibilityBlockedLabel: string
    onAssignTenant: () => void
    onOpenRejection: () => void
    onRequestApproval: () => void
    onToggleVisibility: () => void
    onDelete: () => void
}

export function PropertyActionsMenu({
    propertyId,
    activeLeaseId,
    approvalStatus,
    adminNotes,
    hasDiscoveryClip,
    canAssignTenant,
    canToggleVisibility,
    isListed,
    isToggling,
    isRequestingApproval,
    visibilityLabel,
    visibilityBlockedLabel,
    onAssignTenant,
    onOpenRejection,
    onRequestApproval,
    onToggleVisibility,
    onDelete,
}: PropertyActionsMenuProps) {
    const toggleLabel = canToggleVisibility ? visibilityLabel : visibilityBlockedLabel

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon' className='h-8 w-8 rounded-full text-black/60 shadow-none hover:bg-black/5 hover:text-black'>
                    <MoreHorizontal className='h-4 w-4' strokeWidth={1.5} />
                    <span className='sr-only'>Open menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='min-w-[200px] rounded-xl border border-black/5 p-1.5 shadow-none'>
                <DropdownMenuItem asChild className='rounded-lg cursor-pointer py-2 focus:bg-black/5'>
                    <Link href={`/properties/${propertyId}`} className='flex items-center font-medium'>
                        <Eye className='mr-2 h-4 w-4 text-black/60' strokeWidth={1.5} />
                        View Listing
                    </Link>
                </DropdownMenuItem>
                {DISCOVER_EXPERIENCE_ENABLED ? (
                    <DropdownMenuItem asChild className='rounded-lg cursor-pointer py-2 focus:bg-black/5'>
                        <Link href={`/landlord/properties/${propertyId}/edit?step=media&focus=clip`} className='flex items-center font-medium'>
                            <Clapperboard className='mr-2 h-4 w-4 text-black/60' strokeWidth={1.5} />
                            {getDiscoveryClipActionLabel(hasDiscoveryClip)}
                        </Link>
                    </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem asChild className='rounded-lg cursor-pointer py-2 focus:bg-black/5'>
                    <Link href={`/landlord/properties/${propertyId}/edit?step=details`} className='flex items-center font-medium'>
                        <Edit className='mr-2 h-4 w-4 text-black/60' strokeWidth={1.5} />
                        Edit Details
                    </Link>
                </DropdownMenuItem>

                {activeLeaseId ? (
                    <DropdownMenuItem asChild className='rounded-lg cursor-pointer py-2 focus:bg-black/5'>
                        <Link href={`/landlord/leases/${activeLeaseId}`} className='flex items-center font-medium'>
                            <Eye className='mr-2 h-4 w-4 text-black/60' strokeWidth={1.5} />
                            View Lease
                        </Link>
                    </DropdownMenuItem>
                ) : null}

                <DropdownMenuSeparator className={separatorClassName} />

                {canAssignTenant ? (
                    <>
                        <DropdownMenuItem onClick={onAssignTenant} className={menuItemClassName}>
                            <UserPlus className='mr-2 h-4 w-4 text-black/60' strokeWidth={1.5} />
                            Assign Tenant
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className={separatorClassName} />
                    </>
                ) : null}

                {approvalStatus === 'rejected' && adminNotes ? (
                    <>
                        <DropdownMenuItem onClick={onOpenRejection} className={menuItemClassName}>
                            <AlertCircle className='mr-2 h-4 w-4 text-black/60' strokeWidth={1.5} />
                            View Rejection Reason
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className={separatorClassName} />
                    </>
                ) : null}

                {approvalStatus === 'rejected' ? (
                    <DropdownMenuItem
                        onClick={onRequestApproval}
                        disabled={isRequestingApproval}
                        className={menuItemClassName}
                    >
                        {isRequestingApproval ? (
                            <Loader2 className='mr-2 h-4 w-4 animate-spin text-black/60' strokeWidth={1.5} />
                        ) : (
                            <Send className='mr-2 h-4 w-4 text-black/60' strokeWidth={1.5} />
                        )}
                        Resubmit for Review
                    </DropdownMenuItem>
                ) : null}

                <DropdownMenuItem
                    onClick={onToggleVisibility}
                    disabled={isToggling || !canToggleVisibility}
                    className={`${menuItemClassName} ${!canToggleVisibility ? 'opacity-50' : ''}`}
                >
                    {isToggling ? (
                        <Loader2 className='mr-2 h-4 w-4 animate-spin text-black/60' strokeWidth={1.5} />
                    ) : isListed ? (
                        <ToggleLeft className='mr-2 h-4 w-4 text-black/60' strokeWidth={1.5} />
                    ) : (
                        <ToggleRight className='mr-2 h-4 w-4 text-black/60' strokeWidth={1.5} />
                    )}
                    {toggleLabel}
                </DropdownMenuItem>

                <DropdownMenuSeparator className={separatorClassName} />

                <DropdownMenuItem
                    onClick={onDelete}
                    className='cursor-pointer rounded-lg py-2 font-medium text-red-600 focus:bg-red-50 focus:text-red-700'
                >
                    <Trash2 className='mr-2 h-4 w-4' strokeWidth={1.5} />
                    Delete Property
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
