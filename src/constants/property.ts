/**
 * Property-related constants
 */

export const PROPERTY_TYPES = [
    'apartment',
    'house',
    'room',
    'commercial',
    'studio',
    'townhouse',
    'duplex',
] as const

export type PropertyType = (typeof PROPERTY_TYPES)[number]

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
    apartment: 'Apartment',
    house: 'House',
    room: 'Room',
    commercial: 'Commercial',
    studio: 'Studio',
    townhouse: 'Townhouse',
    duplex: 'Duplex',
}

export const APPROVAL_STATUSES = ['pending', 'approved', 'rejected'] as const
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number]

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
    pending: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
}

export const PET_POLICIES = ['no_pets', 'cats_only', 'dogs_only', 'cats_and_dogs', 'negotiable'] as const
export type PetPolicy = (typeof PET_POLICIES)[number]

export const PET_POLICY_LABELS: Record<PetPolicy, string> = {
    no_pets: 'No Pets',
    cats_only: 'Cats Only',
    dogs_only: 'Dogs Only',
    cats_and_dogs: 'Cats & Dogs Allowed',
    negotiable: 'Negotiable',
}

export const UTILITY_OPTIONS = [
    'electricity',
    'water',
    'internet',
    'gas',
    'trash',
    'security',
] as const

export type Utility = (typeof UTILITY_OPTIONS)[number]

export const UTILITY_LABELS: Record<Utility, string> = {
    electricity: 'Electricity',
    water: 'Water',
    internet: 'Internet',
    gas: 'Gas',
    trash: 'Trash Collection',
    security: 'Security',
}

export const DEFAULT_AMENITIES = [
    'Air Conditioning',
    'Parking',
    'Security',
    'Pool',
    'Gym',
    'Garden',
    'Braai Area',
    'Pet Friendly',
    'Furnished',
    'WiFi',
    'Elevator',
    'Balcony',
] as const
