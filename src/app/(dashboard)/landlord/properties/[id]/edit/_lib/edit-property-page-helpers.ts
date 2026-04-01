import { type PropertyFormInitialData } from '@/features/landlord/properties/editor/types'

const STEP_PARAM_TO_INDEX = {
    type: 0,
    listing: 0,
    photos: 1,
    media: 1,
    clip: 1,
    details: 2,
    location: 3,
    features: 4,
    inventory: 5,
    pricing: 5,
    units: 5,
} satisfies Record<string, number>

export interface EditPropertyRecord {
    _id: string
    landlordId: string
    title: string
    description?: string | null
    listingType?: PropertyFormInitialData['listingType']
    propertyType: string
    occupancyMode?: string | null
    furnishingStatus?: string | null
    genderPolicy?: string | null
    priceNad: number
    address: string
    city: string
    bedrooms?: number | null
    bathrooms?: number | null
    sizeSqm?: number | null
    maxOccupants?: number | null
    amenityNames?: string[] | null
    utilitiesIncluded?: string[] | null
    petPolicy?: string | null
    images?: PropertyFormInitialData['images'] | null
    videos?: PropertyFormInitialData['videos'] | null
    coordinates?: PropertyFormInitialData['coordinates']
    approvalStatus?: string | null
    publicationStatus?: PropertyFormInitialData['publicationStatus'] | null
    adminNotes?: string | null
    units?: PropertyFormInitialData['units']
}

export function getInitialEditStep(stepParam: string | null) {
    const requestedStep = stepParam?.toLowerCase()

    if (!requestedStep || !Object.hasOwn(STEP_PARAM_TO_INDEX, requestedStep)) {
        return undefined
    }

    return STEP_PARAM_TO_INDEX[requestedStep as keyof typeof STEP_PARAM_TO_INDEX]
}

export function getInitialEditFocus(focusParam: string | null) {
    return focusParam === 'clip' ? 'clip' : null
}

export function toPropertyFormInitialData(property: EditPropertyRecord): PropertyFormInitialData {
    return {
        title: property.title,
        description: property.description || '',
        listingType: property.listingType,
        propertyType: property.propertyType,
        occupancyMode: property.occupancyMode || undefined,
        furnishingStatus: property.furnishingStatus || undefined,
        genderPolicy: property.genderPolicy || undefined,
        priceNad: property.priceNad,
        address: property.address,
        city: property.city,
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        sizeSqm: property.sizeSqm || 0,
        maxOccupants: property.maxOccupants || 0,
        amenityNames: property.amenityNames || [],
        utilitiesIncluded: property.utilitiesIncluded || [],
        petPolicy: property.petPolicy || 'negotiable',
        images: property.images || [],
        videos: property.videos || [],
        coordinates: property.coordinates,
        approvalStatus: property.approvalStatus || undefined,
        publicationStatus: property.publicationStatus || undefined,
        adminNotes: property.adminNotes || undefined,
        units: property.units,
    }
}
