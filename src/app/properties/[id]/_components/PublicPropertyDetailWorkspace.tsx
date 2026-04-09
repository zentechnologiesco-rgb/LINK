import { notFound } from "next/navigation"
import {
    MapPin,
} from "lucide-react"

import { PropertyDetailDesktopSidebar, PropertyDetailMobileActionBar } from "@/features/properties/public/components/detail/PropertyDetailActionPanels"
import { PropertyDetailMedia } from "@/features/properties/public/components/detail/PropertyDetailMedia"
import {
    PropertyDetailAboutSection,
    PropertyDetailAmenitiesSection,
    PropertyDetailHighlightsSection,
    PropertyDetailHostAvatar,
    PropertyDetailHostSection,
    PropertyDetailLocationSection,
    PropertyDetailMobileAboutSection,
    PropertyDetailStatsGrid,
} from "@/features/properties/public/components/detail/PropertyDetailPageSections"
import {
    getLandlordDisplayName,
    getPriceHeading,
    getPropertyTypeLabel,
    isMultiUnitListing,
} from "@/features/properties/public/components/detail/shared"
import { toPropertyDetailData } from "@/features/properties/public/components/detail/property-detail-data"
import { PropertyUnitInventorySection } from "@/features/properties/public/components/detail/PropertyUnitInventorySection"
import { PropertyDetailViewTracker } from "@/features/properties/public/components/detail/PropertyDetailViewTracker"
import { getCachedPublicPropertyById } from "@/lib/server/public-property-cache"

export async function PublicPropertyDetailWorkspace({ id }: { id: string }) {
    const convexProperty = await getCachedPublicPropertyById(id)

    if (!convexProperty) {
        notFound()
    }

    const property = toPropertyDetailData(convexProperty)
    const landlordName = getLandlordDisplayName(property)
    const isMultiUnit = isMultiUnitListing(property)
    const priceHeading = getPriceHeading(property)

    return (
        <div className="min-h-screen bg-white text-[#1A1A1A]" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
            <PropertyDetailViewTracker propertyId={property.id} />
            <PropertyDetailMedia property={property} />

            <div className="lg:hidden pb-28">
                <main className="px-5 pt-5 pb-8">
                    <div className="mb-5">
                        <div className="mb-1.5 flex items-baseline gap-1.5">
                            <span className="text-[28px] font-[900] leading-none tracking-[-0.03em] text-neutral-900">
                                {priceHeading}
                            </span>
                            <span className="text-[15px] font-semibold text-neutral-400">/month</span>
                        </div>
                        <h1 className="mb-2 text-[22px] font-[800] leading-[1.15] tracking-[-0.02em] text-neutral-900">
                            {property.title}
                        </h1>
                        <div className="flex items-center gap-1.5 text-neutral-500">
                            <MapPin className="h-[14px] w-[14px]" strokeWidth={2.5} />
                            <span className="text-[14px] font-semibold">
                                {property.address}, {property.city}
                            </span>
                        </div>
                    </div>

                    <PropertyDetailStatsGrid property={property} />

                    <PropertyDetailMobileAboutSection description={property.description} />

                    <PropertyUnitInventorySection property={property} />

                    <PropertyDetailAmenitiesSection property={property} />

                    <PropertyDetailHostSection property={property} />

                    <PropertyDetailLocationSection property={property} />
                </main>
                <PropertyDetailMobileActionBar property={property} />
            </div>

            <div className="hidden lg:block pb-32">
                <main className="mx-auto max-w-[1200px] px-10">
                    <div className="mt-10 flex gap-16">
                        <div className="min-w-0 flex-1">
                            <div className="mb-7 flex items-center justify-between border-b border-neutral-100 pb-7">
                                <div>
                                    <h2 className="text-[24px] font-[900] tracking-[-0.02em] text-neutral-900">
                                        {isMultiUnit
                                            ? `${property.unitCount} units hosted by ${landlordName}`
                                            : `${getPropertyTypeLabel(property.type)} hosted by ${landlordName}`}
                                    </h2>
                                    <div className="mt-1.5 flex gap-2 text-[15px] font-medium text-neutral-500">
                                        <span>{property.bedrooms} bed{property.bedrooms !== 1 ? "s" : ""}</span>
                                        <span>·</span>
                                        <span>{property.bathrooms} bath{property.bathrooms !== 1 ? "s" : ""}</span>
                                        <span>·</span>
                                        <span>{property.size} m²</span>
                                        {isMultiUnit && (
                                            <>
                                                <span>·</span>
                                                <span>{property.unitCount} units</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <PropertyDetailHostAvatar property={property} />
                            </div>

                            <PropertyDetailHighlightsSection isMultiUnit={isMultiUnit} />

                            <PropertyDetailAboutSection description={property.description} />

                            <PropertyUnitInventorySection property={property} />

                            <PropertyDetailAmenitiesSection property={property} variant="desktop" />
                        </div>

                        <div className="relative w-[340px] max-w-[380px] shrink-0">
                            <PropertyDetailDesktopSidebar property={property} />
                        </div>
                    </div>

                    <PropertyDetailLocationSection property={property} variant="desktop" />
                </main>
            </div>
        </div>
    )
}
