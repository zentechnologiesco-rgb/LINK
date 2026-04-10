import Image from "next/image"
import {
    Bath,
    BedDouble,
    Home,
    MapPin,
    Maximize,
    Phone,
    Shield,
    Sparkles,
    type LucideIcon,
} from "@/components/ui/icons"

import { PropertyDetailLazyMap } from "./PropertyDetailLazyMap"
import { getAmenityIcon, getLandlordDisplayName, getPropertyTypeLabel } from "./shared"
import type { PropertyDetailData } from "./types"

export function PropertyDetailHostAvatar({ property }: { property: Pick<PropertyDetailData, "landlord"> }) {
    const landlordName = getLandlordDisplayName(property)
    const initial = landlordName.charAt(0).toUpperCase()

    if (property.landlord?.avatarUrl) {
        return (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-sm">
                <Image
                    src={property.landlord.avatarUrl}
                    alt={landlordName}
                    fill
                    sizes="56px"
                    className="object-cover"
                />
            </div>
        )
    }

    return (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white bg-neutral-900 text-lg font-black text-white shadow-sm">
            {initial || "P"}
        </div>
    )
}

export function PropertyDetailMobileAboutSection({ description }: { description: string }) {
    const shouldCollapse = description.length > 240 || description.includes("\n")

    return (
        <section className="mb-6">
            <h2 className="mb-3 text-[18px] font-[800] tracking-[-0.02em] text-neutral-900">About</h2>
            <div className="rounded-2xl border border-neutral-100/80 bg-neutral-50 p-4">
                {shouldCollapse ? (
                    <details className="group">
                        <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
                            <p className="whitespace-pre-line text-[15px] font-medium leading-[1.6] text-neutral-600 line-clamp-4 group-open:line-clamp-none">
                                {description}
                            </p>
                            <span className="mt-3 inline-flex items-center text-[14px] font-bold text-neutral-900 group-open:hidden">
                                Read more
                            </span>
                            <span className="mt-3 hidden items-center text-[14px] font-bold text-neutral-900 group-open:inline-flex">
                                Show less
                            </span>
                        </summary>
                    </details>
                ) : (
                    <p className="whitespace-pre-line text-[15px] font-medium leading-[1.6] text-neutral-600">
                        {description}
                    </p>
                )}
            </div>
        </section>
    )
}

export function PropertyDetailStatsGrid({
    property,
}: {
    property: Pick<PropertyDetailData, "bedrooms" | "bathrooms" | "size" | "type">
}) {
    const stats: Array<{
        Icon: LucideIcon
        label: string
        value: string | number
    }> = [
        { Icon: BedDouble, label: "Beds", value: property.bedrooms },
        { Icon: Bath, label: "Baths", value: property.bathrooms },
        { Icon: Maximize, label: "m²", value: property.size },
        { Icon: Home, label: "Type", value: getPropertyTypeLabel(property.type) },
    ]

    return (
        <div className="mb-6 grid grid-cols-4 gap-2">
            {stats.map(({ Icon, label, value }) => (
                <div
                    key={label}
                    className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-neutral-100/80 bg-neutral-50 p-3"
                >
                    <Icon className="h-5 w-5 text-neutral-600" strokeWidth={2} />
                    <span className="max-w-full truncate text-[13px] font-[800] leading-none capitalize text-neutral-900">
                        {value}
                    </span>
                    <span className="text-[11px] font-semibold text-neutral-400">{label}</span>
                </div>
            ))}
        </div>
    )
}

export function PropertyDetailHighlightsSection({ isMultiUnit }: { isMultiUnit: boolean }) {
    return (
        <div className="mb-7 space-y-5 border-b border-neutral-100 pb-7">
            <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-100 bg-neutral-50">
                    <Home className="h-5 w-5 text-neutral-700" strokeWidth={1.5} />
                </div>
                <div>
                    <h3 className="text-[16px] font-[800] text-neutral-900">
                        {isMultiUnit ? "Grouped inventory" : "Entire home"}
                    </h3>
                    <p className="mt-0.5 text-[14px] font-medium text-neutral-500">
                        {isMultiUnit
                            ? "Browse individual units, rooms, or bed spaces inside this listing."
                            : "You'll have the entire space to yourself."}
                    </p>
                </div>
            </div>
            <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-100 bg-neutral-50">
                    <Sparkles className="h-5 w-5 text-neutral-700" strokeWidth={1.5} />
                </div>
                <div>
                    <h3 className="text-[16px] font-[800] text-neutral-900">Enhanced Clean</h3>
                    <p className="mt-0.5 text-[14px] font-medium text-neutral-500">
                        This host committed to LINK&apos;s enhanced cleaning standards.
                    </p>
                </div>
            </div>
            <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-100 bg-neutral-50">
                    <MapPin className="h-5 w-5 text-neutral-700" strokeWidth={1.5} />
                </div>
                <div>
                    <h3 className="text-[16px] font-[800] text-neutral-900">Great location</h3>
                    <p className="mt-0.5 text-[14px] font-medium text-neutral-500">
                        Highly rated by recent tenants for its location.
                    </p>
                </div>
            </div>
        </div>
    )
}

export function PropertyDetailAboutSection({ description }: { description: string }) {
    return (
        <section className="mb-7 border-b border-neutral-100 pb-7">
            <h2 className="mb-4 text-[22px] font-[900] tracking-[-0.02em]">About this space</h2>
            <p className="max-w-[620px] whitespace-pre-line break-words text-[15px] font-medium leading-[1.65] text-neutral-600">
                {description}
            </p>
        </section>
    )
}

export function PropertyDetailAmenitiesSection({
    property,
    variant = "mobile",
}: {
    property: Pick<PropertyDetailData, "amenities">
    variant?: "mobile" | "desktop"
}) {
    if (property.amenities.length === 0) {
        return null
    }

    if (variant === "desktop") {
        return (
            <section className="mb-7 border-b border-neutral-100 pb-7">
                <h2 className="mb-5 text-[22px] font-[900] tracking-[-0.02em]">What this place offers</h2>
                <div className="grid max-w-[620px] grid-cols-2 gap-x-6 gap-y-4">
                    {property.amenities.map((amenity) => {
                        const Icon = getAmenityIcon(amenity)
                        return (
                            <div key={amenity} className="flex items-center gap-3.5">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neutral-100 bg-neutral-50">
                                    <Icon className="h-[20px] w-[20px] text-neutral-700" strokeWidth={1.5} />
                                </div>
                                <span className="text-[15px] font-medium text-neutral-700">{amenity}</span>
                            </div>
                        )
                    })}
                </div>
            </section>
        )
    }

    return (
        <section className="mb-6">
            <h2 className="mb-3 text-[18px] font-[800] tracking-[-0.02em] text-neutral-900">Amenities</h2>
            <div className="overflow-hidden rounded-2xl border border-neutral-100/80 bg-neutral-50">
                {property.amenities.map((amenity, index) => {
                    const Icon = getAmenityIcon(amenity)
                    return (
                        <div
                            key={amenity}
                            className={`flex items-center gap-3.5 px-4 py-3.5 ${index < property.amenities.length - 1 ? "border-b border-neutral-100/80" : ""}`}
                        >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-neutral-100 bg-white">
                                <Icon className="h-[18px] w-[18px] text-neutral-700" strokeWidth={2} />
                            </div>
                            <span className="text-[15px] font-semibold text-neutral-700">{amenity}</span>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}

export function PropertyDetailHostSection({ property }: { property: PropertyDetailData }) {
    const landlordName = getLandlordDisplayName(property)

    return (
        <section className="mb-6">
            <h2 className="mb-3 text-[18px] font-[800] tracking-[-0.02em] text-neutral-900">Your Host</h2>
            <div className="rounded-2xl border border-neutral-100/80 bg-neutral-50 p-4">
                <div className="flex items-center gap-3.5">
                    <PropertyDetailHostAvatar property={property} />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[16px] font-[800] leading-tight text-neutral-900">
                            {landlordName}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                            <Shield className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2.5} />
                            <span className="text-[13px] font-semibold text-emerald-600">Verified Host</span>
                        </div>
                    </div>
                    {property.landlord?.phone ? (
                        <a
                            href={`tel:${property.landlord.phone}`}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-900 transition-transform active:scale-90"
                        >
                            <Phone className="h-5 w-5" strokeWidth={2} />
                        </a>
                    ) : null}
                </div>
            </div>
        </section>
    )
}

export function PropertyDetailLocationSection({
    property,
    variant = "mobile",
}: {
    property: Pick<PropertyDetailData, "coordinates" | "address" | "city">
    variant?: "mobile" | "desktop"
}) {
    if (!property.coordinates) {
        return null
    }

    if (variant === "desktop") {
        return (
            <div className="mt-8 border-t border-neutral-100 pt-8">
                <h2 className="mb-2 text-[22px] font-[900] tracking-[-0.02em]">Where you&apos;ll be</h2>
                <p className="mb-5 text-[15px] font-medium text-neutral-500">
                    {property.address}, {property.city}
                </p>
                <div className="h-[440px] w-full overflow-hidden rounded-[20px] border border-neutral-200 bg-neutral-100">
                    <PropertyDetailLazyMap coordinates={property.coordinates} address={property.address} />
                </div>
            </div>
        )
    }

    return (
        <section className="mb-6">
            <h2 className="mb-1 text-[18px] font-[800] tracking-[-0.02em] text-neutral-900">Location</h2>
            <p className="mb-3 text-[14px] font-semibold text-neutral-500">
                {property.address}, {property.city}
            </p>
            <div className="h-[220px] w-full overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-100 sm:h-[280px]">
                <PropertyDetailLazyMap coordinates={property.coordinates} address={property.address} />
            </div>
        </section>
    )
}
