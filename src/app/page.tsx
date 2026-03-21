"use client"

import { useState, useMemo, Suspense, lazy } from "react"
import { useQuery } from "convex/react"
import { useRouter } from "next/navigation"
import { api } from "../../convex/_generated/api"
import { Header } from "@/components/layout/Header"
import { MobileNav } from "@/components/layout/MobileNav"
import { PullToRefresh } from "@/components/ui/pull-to-refresh"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from "@/components/ui/sheet"
import {
    Search,
    MapPin,
    SlidersHorizontal,
    Map as MapIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { TrustCard } from "@/components/properties/TrustCard"
import { RecentlyViewedSection } from "@/components/properties/RecentlyViewedSection"
import { HomePageSkeleton } from "@/components/ui/skeleton"
import { VirtualizedGrid } from "@/components/ui/virtualized-grid"
import { useUser } from "@/components/providers/UserProvider"
import { useDebounce } from "@/hooks/useDebounce"

// Lazy load the map component for faster initial page load
const PropertyMap = lazy(() => import("@/components/maps/PropertyMap").then(m => ({ default: m.PropertyMap })))

// --- Types ---
interface Property {
    id: string
    title: string
    price: number
    address: string
    city: string
    bedrooms: number
    bathrooms: number
    size: number
    type: string
    images: string[]
    amenities: string[]
    description: string
    coordinates?: { lat: number; lng: number } | null
}
// --- Main Page Component ---

export default function HomePage() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState("")

    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')

    // Additional Filters
    const [priceRange, setPriceRange] = useState<{ min: string, max: string }>({ min: "", max: "" })
    const [minBedrooms, setMinBedrooms] = useState<number | null>(null)
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
    const [selectedPropertyType, setSelectedPropertyType] = useState<string | null>(null)

    // Debounced search for performance
    const debouncedSearchQuery = useDebounce(searchQuery, 300)

    // Data Fetching
    const properties = useQuery(api.properties.list, { onlyAvailable: true })
    const { user: currentUser } = useUser()

    // Pull-to-refresh handler
    const handleRefresh = async () => {
        router.refresh()
        await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Normalize Data
    const normalizedProperties: Property[] = useMemo(() => {
        if (!properties) return []
        return properties.map((p) => ({
            id: p._id,
            title: p.title,
            description: p.description || "",
            price: p.priceNad,
            address: p.address,
            city: p.city,
            bedrooms: p.bedrooms ?? 0,
            bathrooms: p.bathrooms ?? 0,
            size: p.sizeSqm ?? 0,
            type: p.propertyType,
            images: p.imageUrls ?? [],
            amenities: p.amenityNames || [],
            coordinates: p.coordinates ?? null,
        }))
    }, [properties])

    // Filter Logic
    const filtered = useMemo(() => {
        return normalizedProperties.filter((p) => {
            const matchSearch = !debouncedSearchQuery ||
                p.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                p.city.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                p.address.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
            const minPrice = priceRange.min ? parseInt(priceRange.min) : 0
            const maxPrice = priceRange.max ? parseInt(priceRange.max) : Infinity
            const matchPrice = p.price >= minPrice && p.price <= maxPrice
            const matchBedrooms = minBedrooms === null || p.bedrooms >= minBedrooms
            const matchAmenities = selectedAmenities.length === 0 ||
                selectedAmenities.every(amenity => p.amenities.includes(amenity))
            const matchType = !selectedPropertyType || p.type.toLowerCase() === selectedPropertyType.toLowerCase()
            return matchSearch && matchPrice && matchBedrooms && matchAmenities && matchType
        })
    }, [normalizedProperties, debouncedSearchQuery, priceRange, minBedrooms, selectedAmenities, selectedPropertyType])

    const groupedProperties = useMemo(() => {
        const groups: Record<string, Property[]> = {}
        filtered.forEach(p => {
            const t = p.type || "Other"
            if (!groups[t]) groups[t] = []
            groups[t].push(p)
        })
        return groups
    }, [filtered])

    const mapData = useMemo(() => filtered.map((p, i) => ({
        id: p.id,
        title: p.title,
        price_nad: p.price,
        address: p.address,
        images: p.images,
        coordinates: p.coordinates || { lat: -22.56 + i * 0.01, lng: 17.06 + (i % 5) * 0.02 }
    })), [filtered])

    const activeFilterCount = (minBedrooms !== null ? 1 : 0) +
        (priceRange.min ? 1 : 0) +
        (priceRange.max ? 1 : 0) +
        selectedAmenities.length

    const clearFilters = () => {
        setPriceRange({ min: "", max: "" })
        setMinBedrooms(null)
        setSelectedAmenities([])
        setSelectedPropertyType(null)
    }

    // Loading skeleton
    if (properties === undefined) {
        return <HomePageSkeleton />
    }

    return (
        <>
            <div className="min-h-screen bg-white font-sans text-neutral-900 overflow-x-hidden">
                <Header user={currentUser} userRole={currentUser?.role} isLoading={currentUser === undefined} />

                <PullToRefresh onRefresh={handleRefresh} className="min-h-[calc(100vh-80px)]">
                    <main className="w-full max-w-[1440px] mx-auto pt-2 sm:pt-4 pb-40 px-4 sm:px-5 lg:px-8 xl:px-12">

                        {/* Premium Search & Filter Bar */}
                        <div className="flex justify-center mb-10 w-full relative z-10 px-0 sm:px-4">
                            <div className="w-full max-w-[800px] flex items-center bg-white border border-neutral-200/80 rounded-full h-[68px] sm:h-20 pl-4 sm:pl-8 pr-1.5 sm:pr-2.5 transition-all duration-300 mx-auto hover:border-black/5">

                                {/* Search Section */}
                                <div className="flex-1 flex items-center h-full">
                                    <Search className="w-5 h-5 sm:w-6 sm:h-6 text-black mr-3 sm:mr-4 shrink-0" strokeWidth={2.5} />
                                    <div className="flex flex-col justify-center w-full min-w-0 pr-2">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search"
                                            className="bg-transparent border-none outline-none font-extrabold text-[15px] sm:text-[17px] text-black placeholder:text-neutral-400 w-full truncate h-5 sm:h-6"
                                        />
                                        <p className="text-[12px] sm:text-[13px] text-neutral-500 font-semibold tracking-tight pointer-events-none truncate leading-none mt-1 sm:mt-1.5">
                                            Search for a home
                                        </p>
                                    </div>
                                </div>

                                {/* Divider (Desktop only) */}
                                <div className="hidden sm:block w-[1px] h-10 bg-neutral-200 mx-2"></div>

                                {/* Map Toggle */}
                                <div className="flex items-center shrink-0">
                                    <button
                                        onClick={() => setViewMode(viewMode === 'grid' ? 'map' : 'grid')}
                                        className={cn(
                                            "h-12 w-12 sm:w-auto sm:h-[52px] sm:px-6 rounded-full flex items-center justify-center gap-2.5 transition-all font-bold text-[15px] group",
                                            viewMode === 'map' ? "bg-neutral-900 text-white" : "bg-transparent text-black hover:bg-neutral-100"
                                        )}
                                    >
                                        {viewMode === 'grid' ? (
                                            <>
                                                <MapIcon className={cn("w-5 h-5", viewMode === 'grid' && "group-hover:scale-110 transition-transform")} strokeWidth={2.5} />
                                                <span className="hidden sm:inline">Map View</span>
                                            </>
                                        ) : (
                                            <>
                                                <Search className="w-5 h-5" strokeWidth={2.5} />
                                                <span className="hidden sm:inline">List View</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Divider (Desktop only) */}
                                <div className="hidden sm:block w-[1px] h-10 bg-neutral-200 mx-2"></div>

                                {/* Filters Button */}
                                <div className="flex items-center shrink-0 ml-1 sm:ml-0">
                                    <Sheet>
                                        <SheetTrigger asChild>
                                            <button className={cn(
                                                "w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 rounded-full flex items-center justify-center transition-all relative border border-transparent group outline-none",
                                                activeFilterCount > 0
                                                    ? "bg-black text-white hover:bg-neutral-800"
                                                    : "bg-white text-black hover:bg-neutral-50 border-neutral-200 hover:border-black/30"
                                            )}>
                                                <SlidersHorizontal className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                                                {activeFilterCount > 0 && (
                                                    <span className="absolute -top-1 -right-1 w-[22px] h-[22px] bg-red-500 text-white text-[11px] font-black rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                                                        {activeFilterCount}
                                                    </span>
                                                )}
                                            </button>
                                        </SheetTrigger>
                                        <SheetContent side="right" className="!w-[85%] sm:!w-[400px] overflow-hidden bg-white p-0 sm:rounded-l-[32px] border-l-0 flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.1)]">
                                            <div className="flex items-center gap-3 px-6 py-5 border-b border-neutral-100">
                                                <SheetTitle className="text-xl font-bold text-neutral-900">Filters</SheetTitle>
                                                {activeFilterCount > 0 && (
                                                    <button onClick={clearFilters} className="text-xs font-semibold text-neutral-400 hover:text-neutral-900 ml-auto transition-colors">
                                                        Reset
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex-1 px-6 py-7 space-y-8 overflow-y-auto">
                                                {/* Filters Content ... same as before but styled a bit cleaner */}
                                                <div className="space-y-4">
                                                    <label className="text-[11px] font-black text-neutral-900 uppercase tracking-widest">Price Range</label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <input
                                                            type="number"
                                                            placeholder="Min"
                                                            value={priceRange.min}
                                                            onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                                            className="w-full h-12 px-4 bg-neutral-50 rounded-2xl text-sm font-semibold outline-none focus:ring-1 focus:ring-neutral-200"
                                                        />
                                                        <input
                                                            type="number"
                                                            placeholder="Max"
                                                            value={priceRange.max}
                                                            onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                                            className="w-full h-12 px-4 bg-neutral-50 rounded-2xl text-sm font-semibold outline-none focus:ring-1 focus:ring-neutral-200"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <label className="text-[11px] font-black text-neutral-900 uppercase tracking-widest">Bedrooms</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {[null, 1, 2, 3, 4].map((num) => (
                                                            <button
                                                                key={`bed-${num}`}
                                                                onClick={() => setMinBedrooms(num)}
                                                                className={cn(
                                                                    "h-11 px-5 rounded-2xl text-xs sm:text-sm font-bold transition-all",
                                                                    minBedrooms === num
                                                                        ? "bg-neutral-900 text-white"
                                                                        : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
                                                                )}
                                                            >
                                                                {num === null ? 'Any' : `${num}+`}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-6 border-t border-neutral-100 safe-area-bottom">
                                                <SheetClose asChild>
                                                    <button className="w-full h-14 bg-neutral-900 text-white rounded-[20px] font-bold text-[15px] hover:bg-neutral-800 transition-all active:scale-[0.98]">
                                                        Show {filtered.length} properties
                                                    </button>
                                                </SheetClose>
                                            </div>
                                        </SheetContent>
                                    </Sheet>
                                </div>
                            </div>
                        </div>

                        {/* Recently Viewed */}
                        <RecentlyViewedSection />

                        {/* Content Area — Grid/Map */}
                        <div className="min-h-[500px]">
                            {viewMode === 'map' ? (
                                <div className="h-[600px] w-full rounded-[32px] overflow-hidden relative border border-neutral-100 mb-20">
                                    <Suspense fallback={
                                        <div className="h-full w-full bg-neutral-50 animate-pulse flex items-center justify-center">
                                            <div className="flex flex-col items-center gap-3 text-neutral-400">
                                                <MapIcon className="w-8 h-8" />
                                                <span className="text-sm font-semibold">Preparing results map...</span>
                                            </div>
                                        </div>
                                    }>
                                        <PropertyMap properties={mapData} onPropertyClick={() => { }} />
                                    </Suspense>
                                </div>
                            ) : (
                                <div className="mb-20">
                                    {selectedPropertyType ? (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4 px-2">
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => setSelectedPropertyType(null)}
                                                    className="rounded-full shadow-sm hover:shadow-md transition-all font-bold"
                                                >
                                                    &larr; Back
                                                </Button>
                                                <h2 className="text-xl sm:text-2xl font-bold tracking-tight capitalize">
                                                    {selectedPropertyType.endsWith('s') ? selectedPropertyType : `${selectedPropertyType}s`}
                                                </h2>
                                                <span className="text-neutral-500 font-semibold bg-neutral-100 px-3 py-1 rounded-full text-sm">
                                                    {filtered.length}
                                                </span>
                                            </div>
                                            <VirtualizedGrid
                                                items={filtered}
                                                renderItem={(property, index) => (
                                                    <TrustCard
                                                        key={property.id}
                                                        property={property}
                                                        priority={index < 4}
                                                    />
                                                )}
                                                getItemKey={(property) => property.id}
                                                initialLoadCount={12}
                                                loadMoreCount={8}
                                                gridClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6"
                                                emptyState={
                                                    <div className="py-24 flex flex-col items-center text-center">
                                                        <div className="w-20 h-20 rounded-full bg-neutral-50 flex items-center justify-center mb-6">
                                                            <Search className="w-8 h-8 text-neutral-300" />
                                                        </div>
                                                        <h3 className="text-xl font-bold text-neutral-900">No matches found</h3>
                                                        <p className="text-neutral-500 mt-2">No properties match your current filters.</p>
                                                        <Button variant="link" onClick={clearFilters} className="text-black font-bold mt-4 underline">
                                                            Clear filters
                                                        </Button>
                                                    </div>
                                                }
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-6 sm:space-y-8">
                                            {Object.entries(groupedProperties).length === 0 ? (
                                                <div className="py-24 flex flex-col items-center text-center">
                                                    <div className="w-20 h-20 rounded-full bg-neutral-50 flex items-center justify-center mb-6">
                                                        <Search className="w-8 h-8 text-neutral-300" />
                                                    </div>
                                                    <h3 className="text-xl font-bold text-neutral-900">No matches found</h3>
                                                    <p className="text-neutral-500 mt-2">Try adjusting your filters or search terms.</p>
                                                    <Button variant="link" onClick={clearFilters} className="text-black font-bold mt-4 underline">
                                                        Clear all filters
                                                    </Button>
                                                </div>
                                            ) : (
                                                Object.entries(groupedProperties).map(([type, props]) => (
                                                    <div key={type} className="w-full">
                                                        <div className="flex justify-between items-end mb-3 px-0">
                                                            <div>
                                                                <h2 className="text-xl sm:text-2xl font-bold tracking-tight capitalize">
                                                                    {type.endsWith('s') ? type : `${type}s`}
                                                                </h2>
                                                            </div>
                                                            {props.length > 4 && (
                                                                <button
                                                                    className="font-bold text-[15px] sm:text-base text-black hover:text-neutral-600 transition-colors pb-1 flex items-center gap-1.5 group"
                                                                    onClick={() => setSelectedPropertyType(type)}
                                                                >
                                                                    View more
                                                                    <span className="group-hover:translate-x-1 transition-transform inline-block group-active:translate-x-2">&rarr;</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                        {/* Horizontal Scrollable Row — Grid for consistent sizing */}
                                                        <div className="grid grid-flow-col auto-cols-[72vw] sm:auto-cols-[200px] md:auto-cols-[195px] lg:auto-cols-[185px] xl:auto-cols-[200px] gap-3 sm:gap-4 overflow-x-auto pb-2 snap-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                                            {props.slice(0, 10).map((property, idx) => (
                                                                <div
                                                                    key={property.id}
                                                                    className="snap-center sm:snap-start"
                                                                >
                                                                    <TrustCard property={property} priority={idx < 2} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </main>
                </PullToRefresh>
            </div>


            <MobileNav user={currentUser} userRole={currentUser?.role} />
        </>
    )
}
