import { type Id } from '../../../../../../convex/_generated/dataModel'
import { type PropertyWorkflow } from '@/lib/property-workflow'

export interface Property {
    _id: Id<'properties'>
    title: string
    listingType?: 'single_home' | 'multi_unit_block' | 'student_accommodation'
    propertyType: string
    city: string
    address: string
    bedrooms?: number
    bathrooms?: number
    sizeSqm?: number
    priceNad: number
    minPriceNad?: number
    maxPriceNad?: number
    isAvailable: boolean
    imageUrls?: string[]
    videos?: Id<'_storage'>[]
    status?: string
    approvalStatus?: 'pending' | 'approved' | 'rejected'
    publicationStatus?: 'published' | 'unpublished'
    adminNotes?: string
    unitCount?: number
    availableUnitCount?: number
}

export type PropertyCardData = Property & {
    workflow: PropertyWorkflow
    activeLeaseCount: number
    reservedLeaseCount: number
}

export type LandlordLease = {
    propertyId: Id<'properties'>
    status: string
}

export type FilterTab =
    | 'all'
    | 'live'
    | 'review'
    | 'changes'
    | 'reserved'
    | 'leased'
    | 'off_market'

export type PropertiesPageStats = {
    total: number
    live: number
    review: number
    changes: number
    reserved: number
    leased: number
    offMarket: number
}
