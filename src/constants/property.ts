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
    'penthouse',
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
    penthouse: 'Penthouse',
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

// Amenity categories for property listings
export type AmenityCategory = 'security' | 'utilities' | 'outdoor' | 'indoor' | 'community'

export interface Amenity {
    id: string
    name: string
    category: AmenityCategory
}

// Comprehensive amenities list - single source of truth
export const AMENITIES: Amenity[] = [
    // Security
    { id: 'security-247', name: '24/7 Security', category: 'security' },
    { id: 'security-gate', name: 'Security Gate', category: 'security' },
    { id: 'cctv', name: 'CCTV Cameras', category: 'security' },
    { id: 'electric-fence', name: 'Electric Fence', category: 'security' },
    { id: 'alarm', name: 'Alarm System', category: 'security' },

    // Utilities
    { id: 'borehole', name: 'Borehole Water', category: 'utilities' },
    { id: 'solar', name: 'Solar Panels', category: 'utilities' },
    { id: 'generator', name: 'Backup Generator', category: 'utilities' },
    { id: 'fiber', name: 'Fiber Internet', category: 'utilities' },

    // Outdoor
    { id: 'pool', name: 'Swimming Pool', category: 'outdoor' },
    { id: 'garden', name: 'Garden', category: 'outdoor' },
    { id: 'braai', name: 'Braai Area', category: 'outdoor' },
    { id: 'parking', name: 'Covered Parking', category: 'outdoor' },
    { id: 'garage', name: 'Garage', category: 'outdoor' },
    { id: 'balcony', name: 'Balcony', category: 'outdoor' },

    // Indoor
    { id: 'aircon', name: 'Air Conditioning', category: 'indoor' },
    { id: 'wardrobes', name: 'Built-in Wardrobes', category: 'indoor' },
    { id: 'kitchen', name: 'Kitchen Appliances', category: 'indoor' },
    { id: 'washing', name: 'Washing Machine', category: 'indoor' },
    { id: 'furnished', name: 'Furnished', category: 'indoor' },
    { id: 'fireplace', name: 'Fireplace', category: 'indoor' },

    // Community
    { id: 'pets', name: 'Pet Friendly', category: 'community' },
    { id: 'gym', name: 'Gym Access', category: 'community' },
    { id: 'schools', name: 'Near Schools', category: 'community' },
    { id: 'shopping', name: 'Near Shopping', category: 'community' },
    { id: 'transport', name: 'Near Public Transport', category: 'community' },
]

// Helper to get amenity names array (for backward compatibility)
export const AMENITY_NAMES = AMENITIES.map(a => a.name)

// Helper to get amenities by category
export const getAmenitiesByCategory = (category: AmenityCategory) =>
    AMENITIES.filter(a => a.category === category)
