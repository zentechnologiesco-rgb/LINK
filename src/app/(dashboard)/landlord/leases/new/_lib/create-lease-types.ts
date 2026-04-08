import { type ElementType } from 'react'

import { type Id } from '../../../../../../../convex/_generated/dataModel'
import { type LeaseClause } from '@/features/landlord/leases/components/LeaseClauseEditor'
import { type RentalRulesData } from '@/features/landlord/leases/components/LeaseRulesConfigurator'

export type Step = 'property' | 'tenant' | 'rules' | 'clauses' | 'review' | 'send'

export type StepDef = {
    key: Step
    label: string
    title: string
    subtitle: string
    icon: ElementType
}

export type LandlordProperty = {
    _id: Id<'properties'>
    title: string
    address: string
    city: string
    priceNad?: number | null
    minPriceNad?: number | null
    imageUrls?: string[] | null
    propertyType?: string | null
    listingType?: string | null
    bedrooms?: number | null
    bathrooms?: number | null
    occupancyMode?: string | null
    furnishingStatus?: string | null
    genderPolicy?: string | null
    maxOccupants?: number | null
    amenityNames?: string[] | null
    utilitiesIncluded?: string[] | null
    petPolicy?: string | null
    approvalStatus?: string | null
    publicationStatus?: string | null
    unitCount?: number | null
    availableUnitCount?: number | null
    units?: LandlordPropertyUnit[] | null
}

export type LandlordPropertyUnit = {
    _id: Id<'propertyUnits'> | null
    title: string
    unitCode?: string | null
    unitType?: string | null
    occupancyMode?: string | null
    roomType?: string | null
    priceNad?: number | null
    bedrooms?: number | null
    bathrooms?: number | null
    maxOccupants?: number | null
    furnishingStatus?: string | null
    genderPolicy?: string | null
    amenityNames?: string[] | null
    utilitiesIncluded?: string[] | null
    petPolicy?: string | null
    publicationStatus?: string | null
    occupancyStatus?: string | null
    imageUrls?: string[] | null
    isSynthetic?: boolean
}

export type TenantLookupResult = {
    fullName?: string | null
    email: string
}

export type LeaseTemplateRecord = {
    _id: Id<'leaseTemplates'>
    name: string
    isDefault?: boolean | null
    customClauses?: LeaseClause[]
    rentDueDay?: number | null
    gracePeriodDays?: number | null
    lateFeeType?: RentalRulesData['lateFeeType']
    lateFeeAmount?: number | null
    petPolicy?: RentalRulesData['petPolicy']
    utilitiesIncluded?: string[]
    parkingIncluded?: boolean | null
    maintenanceResponsibility?: RentalRulesData['maintenanceResponsibility']
    noticePeriodDays?: number | null
    maxOccupants?: number | null
    smokingAllowed?: boolean | null
    sublettingAllowed?: boolean | null
}

export type LandlordLeaseSummary = {
    propertyId: Id<'properties'>
    unitId?: Id<'propertyUnits'>
    status: string
}
