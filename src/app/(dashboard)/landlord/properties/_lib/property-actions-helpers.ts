import { type PropertyWorkflowKey } from '@/lib/property-workflow'

export function getVisibilityLabel(isListed: boolean) {
    return isListed ? 'Take Listing Off Market' : 'Publish Listing'
}

export function getVisibilityBlockedLabel(workflowKey: PropertyWorkflowKey) {
    switch (workflowKey) {
        case 'in_review':
            return 'Waiting for Review'
        case 'changes_requested':
            return 'Fix and Resubmit First'
        case 'reserved':
            return 'Lease Flow in Progress'
        case 'leased':
            return 'Active Lease Locked'
        case 'no_vacancies':
            return 'No Vacancies to Publish'
        default:
            return 'Cannot Change Visibility'
    }
}

export function getVisibilityBlockedMessage(workflowKey: PropertyWorkflowKey) {
    switch (workflowKey) {
        case 'leased':
            return 'This listing is locked while an active lease is in place'
        case 'reserved':
            return 'This listing is locked while a lease is already in progress'
        case 'no_vacancies':
            return 'Add at least one vacant public unit before publishing this listing'
        case 'changes_requested':
            return 'Fix the admin feedback and resubmit the listing first'
        default:
            return 'The listing must be approved before it can go live'
    }
}

export function getDiscoveryClipActionLabel(hasDiscoveryClip: boolean) {
    return hasDiscoveryClip ? 'Manage Discovery Clip' : 'Add Discovery Clip'
}
