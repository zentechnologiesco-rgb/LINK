"use client"

import { useMemo, useState } from "react"
import { ChevronDown } from "@/components/ui/icons"

import { ContactLandlordButton } from "@/features/properties/public/components/ContactLandlordButton"
import { useUser } from "@/components/providers/UserProvider"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { cn } from "@/lib/utils"
import { formatCurrency, getAvailabilityMeta } from "./shared"
import type { PropertyDetailData, PropertyDetailUnit } from "./types"

type UnitInventoryFilter = "all" | "available" | "reserved" | "occupied" | "unavailable"

type UnitInventoryOption = {
    id: UnitInventoryFilter
    label: string
    count: number
}

const UNIT_FILTER_ORDER: UnitInventoryFilter[] = ["available", "reserved", "occupied", "unavailable"]
const INITIAL_UNITS_VISIBLE = 4

function getUnitInventoryFilter(unit: PropertyDetailUnit): UnitInventoryFilter {
    if (unit.isAvailable || unit.occupancyStatus === "vacant") {
        return "available"
    }

    switch (unit.occupancyStatus) {
        case "reserved":
            return "reserved"
        case "occupied":
            return "occupied"
        default:
            return "unavailable"
    }
}

export function PropertyUnitInventorySection({ property }: { property: PropertyDetailData }) {
    const { user } = useUser()
    const isOwner = Boolean(user && user._id === property.landlordId)
    const [activeFilter, setActiveFilter] = useState<UnitInventoryFilter>(isOwner ? "all" : "available")
    const [showAllUnits, setShowAllUnits] = useState(false)

    const visibleUnits = useMemo(
        () => property.units.filter((unit) => unit.publicationStatus === "published" || isOwner),
        [isOwner, property.units]
    )

    const sortedUnits = useMemo(
        () =>
            [...visibleUnits].sort((left, right) => {
                const statusDelta =
                    UNIT_FILTER_ORDER.indexOf(getUnitInventoryFilter(left)) -
                    UNIT_FILTER_ORDER.indexOf(getUnitInventoryFilter(right))

                if (statusDelta !== 0) {
                    return statusDelta
                }

                if (left.priceNad !== right.priceNad) {
                    return left.priceNad - right.priceNad
                }

                return left.title.localeCompare(right.title)
            }),
        [visibleUnits]
    )

    const unitCounts = useMemo(
        () =>
            sortedUnits.reduce(
                (counts, unit) => {
                    counts.all += 1
                    counts[getUnitInventoryFilter(unit)] += 1
                    return counts
                },
                { all: 0, available: 0, reserved: 0, occupied: 0, unavailable: 0 }
            ),
        [sortedUnits]
    )

    const priceRange = useMemo(() => {
        const prices = sortedUnits.map((unit) => unit.priceNad).filter((price) => price > 0)
        if (prices.length === 0) {
            return null
        }

        return {
            min: Math.min(...prices),
            max: Math.max(...prices),
        }
    }, [sortedUnits])

    const inventoryLabel = property.listingType === "student_accommodation" ? "rooms" : "units"
    const inventoryTitle = property.listingType === "student_accommodation" ? "Room Inventory" : "Unit Inventory"

    const filterOptions = useMemo<UnitInventoryOption[]>(() => {
        const allOption: UnitInventoryOption = {
            id: "all",
            label: `All ${inventoryLabel}`,
            count: unitCounts.all,
        }

        if (isOwner) {
            return [
                allOption,
                unitCounts.available > 0 ? { id: "available", label: "Open now", count: unitCounts.available } : null,
                unitCounts.reserved > 0 ? { id: "reserved", label: "Reserved", count: unitCounts.reserved } : null,
                unitCounts.occupied > 0 ? { id: "occupied", label: "Occupied", count: unitCounts.occupied } : null,
                unitCounts.unavailable > 0 ? { id: "unavailable", label: "Unavailable", count: unitCounts.unavailable } : null,
            ].filter((option): option is UnitInventoryOption => option !== null)
        }

        if (unitCounts.available > 0 && unitCounts.available < unitCounts.all) {
            return [
                { id: "available", label: "Open now", count: unitCounts.available },
                allOption,
            ]
        }

        return [allOption]
    }, [inventoryLabel, isOwner, unitCounts])

    const selectedFilter = filterOptions.some((option) => option.id === activeFilter)
        ? activeFilter
        : filterOptions[0]?.id ?? "all"

    const filteredUnits = useMemo(() => {
        if (selectedFilter === "all") {
            return sortedUnits
        }

        return sortedUnits.filter((unit) => getUnitInventoryFilter(unit) === selectedFilter)
    }, [selectedFilter, sortedUnits])

    const displayedUnits = showAllUnits ? filteredUnits : filteredUnits.slice(0, INITIAL_UNITS_VISIBLE)
    const hiddenUnitCount = Math.max(filteredUnits.length - displayedUnits.length, 0)

    if (sortedUnits.length <= 1 && property.listingType === "single_home") {
        return null
    }

    return (
        <section className="mb-6">
            <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-[18px] font-[800] tracking-[-0.02em] text-neutral-900">{inventoryTitle}</h2>
                    <p className="text-[14px] text-neutral-500">
                        {unitCounts.available > 0
                            ? `Showing the ${inventoryLabel} renters can move into first.`
                            : `Browse the full ${inventoryLabel} mix in this listing.`}
                    </p>
                </div>
                {unitCounts.available > 0 && (
                    <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-bold text-emerald-700">
                        {unitCounts.available} open
                    </span>
                )}
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
                <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                    <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-neutral-400">Open now</p>
                    <p className="mt-2 text-[22px] font-[900] tracking-[-0.03em] text-neutral-900">{unitCounts.available}</p>
                    <p className="mt-1 text-[13px] font-medium text-neutral-500">Ready to enquire today</p>
                </div>
                <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                    <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-neutral-400">Inventory</p>
                    <p className="mt-2 text-[22px] font-[900] tracking-[-0.03em] text-neutral-900">{unitCounts.all}</p>
                    <p className="mt-1 text-[13px] font-medium text-neutral-500">Published {inventoryLabel} on this page</p>
                </div>
                <div className="col-span-2 rounded-2xl border border-neutral-100 bg-neutral-50 p-4 lg:col-span-1">
                    <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-neutral-400">Price range</p>
                    <p className="mt-2 text-[22px] font-[900] tracking-[-0.03em] text-neutral-900">
                        {priceRange
                            ? priceRange.min === priceRange.max
                                ? formatCurrency(priceRange.min)
                                : `${formatCurrency(priceRange.min)} - ${formatCurrency(priceRange.max)}`
                            : "Ask host"}
                    </p>
                    <p className="mt-1 text-[13px] font-medium text-neutral-500">Compare faster before opening each card</p>
                </div>
            </div>

            {filterOptions.length > 1 && (
                <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {filterOptions.map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                                setActiveFilter(option.id)
                                setShowAllUnits(false)
                            }}
                            className={cn(
                                "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-bold transition-colors",
                                selectedFilter === option.id
                                    ? "border-neutral-900 bg-neutral-900 text-white"
                                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50"
                            )}
                        >
                            <span>{option.label}</span>
                            <span
                                className={cn(
                                    "rounded-full px-2 py-0.5 text-[11px] font-extrabold",
                                    selectedFilter === option.id ? "bg-white/15 text-white" : "bg-neutral-100 text-neutral-500"
                                )}
                            >
                                {option.count}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {filteredUnits.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-center">
                    <p className="text-[15px] font-[800] text-neutral-900">No {inventoryLabel} match this view yet.</p>
                    <p className="mt-1 text-[13px] font-medium text-neutral-500">Try another filter to see the rest of the inventory.</p>
                </div>
            ) : (
                <>
                    <div className="grid gap-3 lg:grid-cols-2">
                        {displayedUnits.map((unit, index) => {
                            const unitImage = unit.imageUrls?.[0] || property.images[0] || "/window.svg"
                            const availability = getAvailabilityMeta(unit.occupancyStatus)
                            const unitTags = [unit.unitCode, unit.unitType, unit.roomType, unit.occupancyMode].filter(Boolean)

                            return (
                                <div
                                    key={`${unit._id ?? "synthetic"}-${index}`}
                                    className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
                                >
                                    <div className="relative h-40 bg-neutral-100">
                                        <OptimizedImage src={unitImage} alt={unit.title} fill className="object-cover" qualityPreset="card" />
                                        <span
                                            className={cn(
                                                "absolute left-3 top-3 inline-flex rounded-full px-3 py-1 text-[12px] font-bold shadow-sm",
                                                availability.className
                                            )}
                                        >
                                            {availability.label}
                                        </span>
                                    </div>
                                    <div className="flex h-full flex-col p-4">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-[17px] font-[800] tracking-[-0.02em] text-neutral-900">
                                                    {unit.title}
                                                </p>
                                                {unitTags.length > 0 && (
                                                    <p className="mt-1 text-[13px] text-neutral-500">{unitTags.join(" · ")}</p>
                                                )}
                                            </div>
                                            <div className="text-left sm:text-right">
                                                <p className="text-[18px] font-[900] tracking-[-0.03em] text-neutral-900">
                                                    {formatCurrency(unit.priceNad)}
                                                </p>
                                                <p className="text-[12px] font-semibold text-neutral-400">/month</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-3 text-[13px] font-medium text-neutral-600">
                                            {typeof unit.bedrooms === "number" && <span>{unit.bedrooms} bed</span>}
                                            {typeof unit.bathrooms === "number" && <span>{unit.bathrooms} bath</span>}
                                            {typeof unit.sizeSqm === "number" && unit.sizeSqm > 0 && <span>{unit.sizeSqm} m²</span>}
                                            {typeof unit.maxOccupants === "number" && unit.maxOccupants > 0 && <span>Max {unit.maxOccupants}</span>}
                                        </div>
                                        <div className="mt-4 flex flex-wrap items-center gap-3">
                                            {!isOwner && unit._id && availability.isAvailable ? (
                                                <ContactLandlordButton
                                                    propertyId={property.id}
                                                    unitId={unit._id}
                                                    landlordId={property.landlordId}
                                                    className="h-10 w-auto rounded-full px-4"
                                                />
                                            ) : (
                                                <span className="text-[12px] font-semibold text-neutral-400">
                                                    {availability.isAvailable ? "Owner view" : "Currently not available"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {filteredUnits.length > INITIAL_UNITS_VISIBLE && (
                        <button
                            type="button"
                            onClick={() => setShowAllUnits((current) => !current)}
                            className="mt-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-[14px] font-bold text-neutral-900 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
                        >
                            {showAllUnits ? `Show fewer ${inventoryLabel}` : `Show ${hiddenUnitCount} more ${inventoryLabel}`}
                            <ChevronDown className={cn("h-4 w-4 transition-transform", showAllUnits && "rotate-180")} />
                        </button>
                    )}
                </>
            )}
        </section>
    )
}
