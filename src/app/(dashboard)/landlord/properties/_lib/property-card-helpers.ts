import { formatCurrency } from './properties-page-helpers'
import { type PropertyCardData } from './properties-page-types'

export interface PropertyCardViewModel {
    imageSrc: string
    unitCount: number
    isMultiUnit: boolean
    portfolioLabel: string
    hasDiscoveryClip: boolean
    clipHref: string
    editDetailsHref: string
    viewHref: string
    clipStatusLabel: string
    clipDescription: string
    clipActionLabel: string
    priceLabel: string
    bedroomsLabel: string
    bathroomsLabel: string
    sizeLabel: string
    unitCountLabel: string
}

export function getPropertyCardViewModel(property: PropertyCardData): PropertyCardViewModel {
    const imageSrc = property.imageUrls && property.imageUrls.length > 0
        ? property.imageUrls[0]
        : '/window.svg'
    const unitCount = property.unitCount ?? 1
    const isMultiUnit =
        unitCount > 1
        || property.listingType === 'multi_unit_block'
        || property.listingType === 'student_accommodation'
    const hasDiscoveryClip = (property.videos?.length ?? 0) > 0
    const clipHref = `/landlord/properties/${property._id}/edit?step=media&focus=clip`
    const editDetailsHref = `/landlord/properties/${property._id}/edit?step=details`
    const viewHref = `/properties/${property._id}`
    const clipStatusLabel = hasDiscoveryClip
        ? property.workflow.isListed
            ? 'Discover clip live'
            : 'Clip saved for launch'
        : 'No discover clip yet'
    const clipDescription = hasDiscoveryClip
        ? property.workflow.isListed
            ? 'Renters can find this listing through Discover right now.'
            : 'This clip is ready whenever you publish the listing again.'
        : 'Add a short clip to give renters a faster way into this listing.'

    return {
        imageSrc,
        unitCount,
        isMultiUnit,
        portfolioLabel: isMultiUnit ? `${unitCount} Units Portfolio` : property.propertyType,
        hasDiscoveryClip,
        clipHref,
        editDetailsHref,
        viewHref,
        clipStatusLabel,
        clipDescription,
        clipActionLabel: hasDiscoveryClip ? 'Manage Clip' : 'Add Clip',
        priceLabel: formatCurrency(property.minPriceNad ?? property.priceNad),
        bedroomsLabel: String(property.bedrooms || 0),
        bathroomsLabel: String(property.bathrooms || 0),
        sizeLabel: `${property.sizeSqm || 0}m²`,
        unitCountLabel: `${unitCount} Units`,
    }
}
