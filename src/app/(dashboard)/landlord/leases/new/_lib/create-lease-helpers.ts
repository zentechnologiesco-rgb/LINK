import { type LeaseClause } from '@/features/landlord/leases/components/LeaseClauseEditor'
import { type RentalRulesData } from '@/features/landlord/leases/components/LeaseRulesConfigurator'
import { PROPERTY_TYPE_LABELS } from '@/constants/property'

import {
    LEASE_PET_POLICY_MAP,
    LEASE_UTILITY_LABEL_MAP,
    PARKING_AMENITY_KEYWORDS,
} from './create-lease-constants'
import {
    type LandlordProperty,
    type LandlordPropertyUnit,
    type LeaseTemplateRecord,
} from './create-lease-types'

function formatInputDate(value: Date) {
    return value.toISOString().split('T')[0]
}

export function getDefaultRentalRules(): RentalRulesData {
    return {
        startDate: formatInputDate(new Date()),
        endDate: formatInputDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
        monthlyRent: 0,
        deposit: 0,
        rentDueDay: 1,
        gracePeriodDays: 5,
        lateFeeType: 'percentage',
        lateFeeAmount: 5,
        petPolicy: 'no_pets',
        utilitiesIncluded: [],
        parkingIncluded: false,
        maintenanceResponsibility: 'shared',
        noticePeriodDays: 30,
        maxOccupants: 2,
        smokingAllowed: false,
        sublettingAllowed: false,
    }
}

export function getOrdinal(n: number) {
    if (n > 3 && n < 21) return 'th'
    switch (n % 10) {
        case 1:
            return 'st'
        case 2:
            return 'nd'
        case 3:
            return 'rd'
        default:
            return 'th'
    }
}

export function getPropertyTypeLabel(propertyType?: string | null) {
    if (!propertyType) return 'Residential'
    return PROPERTY_TYPE_LABELS[propertyType as keyof typeof PROPERTY_TYPE_LABELS] ?? propertyType
}

export function getUnitSelectionKey(unit: LandlordPropertyUnit) {
    return unit._id ?? `synthetic:${unit.title}:${unit.unitCode ?? ''}:${unit.priceNad ?? 0}:${unit.occupancyMode ?? ''}`
}

export function isSameUnit(left: LandlordPropertyUnit | null, right: LandlordPropertyUnit | null) {
    if (!left || !right) return false
    return getUnitSelectionKey(left) === getUnitSelectionKey(right)
}

export function normalizeLeaseUtilities(utilities?: string[] | null): RentalRulesData['utilitiesIncluded'] {
    if (!utilities || utilities.length === 0) return []

    return Array.from(new Set(
        utilities
            .map((utility) => LEASE_UTILITY_LABEL_MAP[utility.trim().toLowerCase()] ?? utility)
            .filter((utility): utility is string => Boolean(utility)),
    ))
}

export function normalizeLeasePetPolicy(petPolicy?: string | null) {
    if (!petPolicy) return undefined
    return LEASE_PET_POLICY_MAP[petPolicy.trim().toLowerCase()]
}

export function hasParkingAmenity(amenities?: string[] | null) {
    if (!amenities || amenities.length === 0) return false
    return amenities.some((amenity) => {
        const normalizedAmenity = amenity.trim().toLowerCase()
        return PARKING_AMENITY_KEYWORDS.some((keyword) => normalizedAmenity.includes(keyword))
    })
}

export function getLeaseableUnits(
    property: LandlordProperty,
    blockedPropertyIds: Set<LandlordProperty['_id']>,
    blockedUnitIds: Set<Exclude<LandlordPropertyUnit['_id'], null>>,
) {
    return (property.units ?? []).filter((unit) => {
        if (unit.publicationStatus !== 'published' || unit.occupancyStatus !== 'vacant') {
            return false
        }

        if (unit._id) {
            return !blockedUnitIds.has(unit._id)
        }

        return !blockedPropertyIds.has(property._id)
    })
}

export function getAutoSelectedUnit(
    property: LandlordProperty,
    blockedPropertyIds: Set<LandlordProperty['_id']>,
    blockedUnitIds: Set<Exclude<LandlordPropertyUnit['_id'], null>>,
) {
    if (property.listingType === 'single_home') {
        return null
    }

    const leaseableUnits = getLeaseableUnits(property, blockedPropertyIds, blockedUnitIds)
    return leaseableUnits.length === 1 ? leaseableUnits[0] : null
}

export function requiresUnitSelection(
    property: LandlordProperty,
    blockedPropertyIds: Set<LandlordProperty['_id']>,
    blockedUnitIds: Set<Exclude<LandlordPropertyUnit['_id'], null>>,
) {
    if (property.listingType === 'single_home') {
        return false
    }

    return getLeaseableUnits(property, blockedPropertyIds, blockedUnitIds).length > 1
}

export function deriveMaxOccupants(property: LandlordProperty, unit?: LandlordPropertyUnit | null) {
    const explicitMax = unit?.maxOccupants ?? property.maxOccupants
    if (explicitMax && explicitMax > 0) return explicitMax

    const bedrooms = unit?.bedrooms ?? property.bedrooms ?? 0
    const targetType = unit?.unitType ?? property.propertyType

    if (property.listingType === 'student_accommodation' || targetType === 'room') {
        return 1
    }

    if (targetType === 'studio') {
        return 2
    }

    if (bedrooms > 0) {
        return Math.max(2, bedrooms * 2)
    }

    if (targetType === 'house') {
        return 4
    }

    return 2
}

export function buildLeaseRulesPrefill(property: LandlordProperty, unit?: LandlordPropertyUnit | null): Partial<RentalRulesData> {
    const monthlyRent = unit?.priceNad || property.minPriceNad || property.priceNad || 0
    const utilitiesIncluded = normalizeLeaseUtilities(unit?.utilitiesIncluded ?? property.utilitiesIncluded)
    const parkingIncluded = hasParkingAmenity(unit?.amenityNames) || hasParkingAmenity(property.amenityNames)
    const petPolicy = normalizeLeasePetPolicy(unit?.petPolicy ?? property.petPolicy)

    return {
        monthlyRent,
        deposit: monthlyRent,
        maxOccupants: deriveMaxOccupants(property, unit),
        utilitiesIncluded,
        parkingIncluded,
        ...(petPolicy ? { petPolicy } : {}),
    }
}

export function applyTemplateToRules(currentRules: RentalRulesData, template: LeaseTemplateRecord): RentalRulesData {
    return {
        ...currentRules,
        rentDueDay: template.rentDueDay ?? currentRules.rentDueDay,
        gracePeriodDays: template.gracePeriodDays ?? currentRules.gracePeriodDays,
        lateFeeType: template.lateFeeType ?? currentRules.lateFeeType,
        lateFeeAmount: template.lateFeeAmount ?? currentRules.lateFeeAmount,
        petPolicy: template.petPolicy ?? currentRules.petPolicy,
        utilitiesIncluded: template.utilitiesIncluded ?? currentRules.utilitiesIncluded,
        parkingIncluded: template.parkingIncluded ?? currentRules.parkingIncluded,
        maintenanceResponsibility: template.maintenanceResponsibility ?? currentRules.maintenanceResponsibility,
        noticePeriodDays: template.noticePeriodDays ?? currentRules.noticePeriodDays,
        maxOccupants: template.maxOccupants ?? currentRules.maxOccupants,
        smokingAllowed: template.smokingAllowed ?? currentRules.smokingAllowed,
        sublettingAllowed: template.sublettingAllowed ?? currentRules.sublettingAllowed,
    }
}

export function getLeaseContextLabel(property: LandlordProperty, unit?: LandlordPropertyUnit | null) {
    if (property.listingType === 'student_accommodation') {
        if (unit?.occupancyMode === 'shared_room' || unit?.roomType === 'shared') {
            return 'Shared room stay'
        }
        return 'Private room stay'
    }

    const targetType = unit?.unitType ?? property.propertyType
    switch (targetType) {
        case 'house':
            return 'House lease'
        case 'room':
            return 'Room lease'
        case 'studio':
            return 'Studio lease'
        case 'townhouse':
            return 'Townhouse lease'
        case 'duplex':
            return 'Duplex lease'
        case 'penthouse':
            return 'Penthouse lease'
        case 'apartment':
            return 'Apartment lease'
        default:
            return `${getPropertyTypeLabel(targetType)} lease`
    }
}

export function getDefaultClauses(rules: RentalRulesData): LeaseClause[] {
    const clauses: LeaseClause[] = [
        {
            id: 'mandatory_rent',
            title: 'Rent Payment',
            content: `The Tenant agrees to pay the monthly rent amount specified in this agreement on or before the ${rules.rentDueDay}${getOrdinal(rules.rentDueDay)} of each month. Late payments will incur a ${rules.lateFeeType === 'percentage' ? `${rules.lateFeeAmount}% of monthly rent` : `N$${rules.lateFeeAmount}`} fee after a ${rules.gracePeriodDays}-day grace period.`,
            isMandatory: true,
        },
        {
            id: 'mandatory_deposit',
            title: 'Security Deposit',
            content: 'The Tenant shall pay a security deposit as specified in this agreement. The deposit will be held by the Landlord for the duration of the lease and returned within 14 days of lease termination, subject to deductions for damages beyond normal wear and tear, outstanding rent, or other legitimate charges.',
            isMandatory: true,
        },
        {
            id: 'mandatory_condition',
            title: 'Property Condition & Maintenance',
            content: `The Tenant agrees to maintain the property in good, habitable condition. Maintenance responsibility: ${rules.maintenanceResponsibility}. The Tenant shall not make structural modifications without written consent.`,
            isMandatory: true,
        },
        {
            id: 'mandatory_occupancy',
            title: 'Occupancy & Use',
            content: `The property shall be used solely as a residential dwelling. Maximum occupants: ${rules.maxOccupants}. ${rules.sublettingAllowed ? 'Subletting is permitted with written landlord consent.' : 'Subletting is not permitted without written consent.'}`,
            isMandatory: true,
        },
        {
            id: 'mandatory_entry',
            title: 'Entry by Landlord',
            content: 'The Landlord may enter the property with 24-hour notice for inspections, repairs, or showings. Immediate entry is permitted in emergencies.',
            isMandatory: true,
        },
        {
            id: 'mandatory_termination',
            title: 'Termination & Notice',
            content: `Either party may terminate this lease by providing ${rules.noticePeriodDays} days written notice. Early termination by the Tenant may result in forfeiture of the security deposit unless otherwise agreed.`,
            isMandatory: true,
        },
        {
            id: 'mandatory_dispute',
            title: 'Dispute Resolution',
            content: 'Disputes shall first be resolved through negotiation. If negotiation fails, parties agree to seek mediation through the Namibian Rental Tribunal before pursuing legal action. This agreement is governed by the laws of the Republic of Namibia.',
            isMandatory: true,
        },
    ]

    if (rules.petPolicy !== 'no_pets') {
        clauses.push({
            id: 'auto_pets',
            title: 'Pet Policy',
            content: `Pets are permitted: ${rules.petPolicy.replace(/_/g, ' ')}. The Tenant is responsible for any pet-related damage.`,
            isMandatory: false,
        })
    } else {
        clauses.push({
            id: 'auto_pets',
            title: 'Pet Policy',
            content: 'No pets are permitted without prior written consent from the Landlord.',
            isMandatory: false,
        })
    }

    if (rules.utilitiesIncluded.length > 0) {
        clauses.push({
            id: 'auto_utilities',
            title: 'Utilities',
            content: `Included in rent: ${rules.utilitiesIncluded.join(', ')}. All other utilities are the Tenant's responsibility.`,
            isMandatory: false,
        })
    }

    if (!rules.smokingAllowed) {
        clauses.push({
            id: 'auto_smoking',
            title: 'Smoking Policy',
            content: 'Smoking is strictly prohibited inside the property. Violation may result in lease termination.',
            isMandatory: false,
        })
    }

    return clauses
}
