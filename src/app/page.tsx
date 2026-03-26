"use client"

import { useState, useMemo, Suspense, lazy } from "react"
import { useQuery } from "convex/react"
import { useRouter } from "next/navigation"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
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
    SlidersHorizontal,
    Map as MapIcon,
    Home,
    Building2,
    Tent,
    Building,
    X,
    List,
    Compass,
    BedDouble
} from "lucide-react"

import { cn } from "@/lib/utils"
import { TrustCard } from "@/components/properties/TrustCard"
import { HomePageSkeleton } from "@/components/ui/skeleton"
import { useUser } from "@/components/providers/UserProvider"
import { useDebounce } from "@/hooks/useDebounce"
import { AMENITIES } from "@/constants/property"

// Lazy load the map component for faster initial page load
const PropertyMap = lazy(() => import("@/components/maps/PropertyMap").then(m => ({ default: m.PropertyMap })))

// --- Types ---
interface Property {
    id: Id<"properties">
    title: string
    price: number
    maxPrice?: number
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
    landlordId?: string
    listingType?: 'single_home' | 'multi_unit_block' | 'student_accommodation'
    unitCount?: number
    availableUnitCount?: number
    unitTypeLabels?: string[]
}

const PROPERTY_ICONS: Record<string, React.ReactNode> = {
    'Apartment': <Building2 className="w-5 h-5" />,
    'House': <Home className="w-5 h-5" />,
    'Townhouse': <Building className="w-5 h-5" />,
    'Room': <BedDouble className="w-5 h-5" />,
    'Land': <Tent className="w-5 h-5" />,
    'Other': <MapIcon className="w-5 h-5" />
}

function getIconForType(type: string) {
    const t = type.toLowerCase()
    if (t.includes('apartment')) return PROPERTY_ICONS['Apartment']
    if (t.includes('townhouse')) return PROPERTY_ICONS['Townhouse']
    if (t.includes('house')) return PROPERTY_ICONS['House']
    if (t.includes('room')) return PROPERTY_ICONS['Room']
    if (t.includes('land')) return PROPERTY_ICONS['Land']
    return PROPERTY_ICONS['Other']
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
            price: p.minPriceNad ?? p.priceNad,
            maxPrice: p.maxPriceNad ?? p.priceNad,
            address: p.address,
            city: p.city,
            bedrooms: p.bedrooms ?? 0,
            bathrooms: p.bathrooms ?? 0,
            size: p.sizeSqm ?? 0,
            type: p.propertyType || "House",
            images: p.imageUrls ?? [],
            amenities: p.amenityNames || [],
            coordinates: p.coordinates ?? null,
            landlordId: p.landlordId,
            listingType: p.listingType,
            unitCount: p.unitCount,
            availableUnitCount: p.availableUnitCount,
            unitTypeLabels: p.unitTypeLabels || [],
        }))
    }, [properties])

    // Derive available types directly from properties
    const availableTypes = useMemo(() => {
        const types = new Set<string>()
        normalizedProperties.forEach(p => types.add(p.type))
        return Array.from(types).sort()
    }, [normalizedProperties])

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
    }

    // Loading skeleton
    if (properties === undefined) {
        return <HomePageSkeleton />
    }

    return (
        <div className="min-h-screen bg-white font-sans text-neutral-900 overflow-x-hidden pb-32 sm:pb-40">
            <Header user={currentUser} userRole={currentUser?.role} isLoading={currentUser === undefined} />

            <PullToRefresh onRefresh={handleRefresh} className="min-h-[calc(100vh-80px)]">

                {/* Stiky Search & Categories Section */}
                <div className="sticky top-16 md:top-20 z-40 bg-white/90 backdrop-blur-xl border-b border-neutral-100/50 pb-2 shadow-[0_2px_8px_-6px_rgba(0,0,0,0.1)]">
                    <div className="w-full max-w-[1440px] mx-auto pt-4 px-4 sm:px-6 lg:px-8">
                        
                        {/* Native Style Search Bar */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 flex items-center bg-neutral-100 hover:bg-neutral-200/50 transition-colors rounded-[16px] h-[52px] sm:h-14 px-4">
                                <Search className="w-5 h-5 text-neutral-500 mr-2.5 shrink-0" strokeWidth={2.5} />
                                <div className="flex flex-col justify-center w-full min-w-0 pr-2">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Address, city, or ZIP"
                                        className="bg-transparent border-none outline-none font-semibold text-[15px] sm:text-[16px] text-neutral-900 placeholder:text-neutral-500 w-full truncate"
                                    />
                                </div>
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery("")} className="shrink-0 p-1.5 rounded-full hover:bg-neutral-200">
                                        <X className="w-4 h-4 text-neutral-500" strokeWidth={2.5} />
                                    </button>
                                )}
                            </div>

                            {/* Filters Button */}
                            <Sheet>
                                <SheetTrigger asChild>
                                    <button className={cn(
                                        "h-[52px] w-[52px] sm:h-14 sm:w-14 shrink-0 rounded-[16px] flex items-center justify-center transition-all relative outline-none",
                                        activeFilterCount > 0
                                            ? "bg-black text-white"
                                            : "bg-neutral-100 text-black hover:bg-neutral-200"
                                    )}>
                                        <SlidersHorizontal className="w-[20px] h-[20px]" strokeWidth={2.5} />
                                        {activeFilterCount > 0 && (
                                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                                                {activeFilterCount}
                                            </span>
                                        )}
                                    </button>
                                </SheetTrigger>
                                <SheetContent side="right" className="!w-[90%] sm:!w-[420px] overflow-hidden bg-white p-0 sm:rounded-l-[32px] border-l-0 flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.15)]">
                                    <div className="flex items-center gap-3 px-6 py-5 border-b border-neutral-100/60 transition-colors">
                                        <SheetTitle className="text-[22px] font-bold tracking-tight text-neutral-900">Filters</SheetTitle>
                                        <button onClick={clearFilters} className="text-[15px] font-semibold text-neutral-500 hover:text-black ml-auto transition-colors">
                                            Clear All
                                        </button>
                                    </div>
                                    <div className="flex-1 px-6 py-6 space-y-8 overflow-y-auto overscroll-contain">
                                        {/* Price */}
                                        <div className="space-y-4">
                                            <h3 className="text-[17px] font-semibold text-neutral-900 tracking-tight">Price Range</h3>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-semibold text-[15px]">N$</span>
                                                    <input
                                                        type="number"
                                                        placeholder="Min"
                                                        value={priceRange.min}
                                                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                                        className="w-full h-14 pl-10 pr-4 bg-neutral-100 rounded-[14px] text-[15px] font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-black placeholder:text-neutral-400 placeholder:font-medium transition-all"
                                                    />
                                                </div>
                                                <div className="w-4 h-[2px] bg-neutral-300 rounded-full shrink-0" />
                                                <div className="flex-1 relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-semibold text-[15px]">N$</span>
                                                    <input
                                                        type="number"
                                                        placeholder="Max"
                                                        value={priceRange.max}
                                                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                                        className="w-full h-14 pl-10 pr-4 bg-neutral-100 rounded-[14px] text-[15px] font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-black placeholder:text-neutral-400 placeholder:font-medium transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Bedrooms */}
                                        <div className="space-y-4">
                                            <h3 className="text-[17px] font-semibold text-neutral-900 tracking-tight">Bedrooms</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {[null, 1, 2, 3, 4].map((num) => (
                                                    <button
                                                        key={`bed-${num}`}
                                                        onClick={() => setMinBedrooms(num)}
                                                        className={cn(
                                                            "h-12 px-6 rounded-[14px] text-[15px] font-semibold transition-all border outline-none",
                                                            minBedrooms === num
                                                                ? "bg-black text-white border-black"
                                                                : "bg-white border-neutral-200 text-neutral-600 hover:border-black"
                                                        )}
                                                    >
                                                        {num === null ? 'Any' : `${num}+`}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-[17px] font-semibold text-neutral-900 tracking-tight">Amenities</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {AMENITIES.slice(0, 10).map((amenity) => {
                                                    const isSelected = selectedAmenities.includes(amenity.name)
                                                    return (
                                                        <button
                                                            key={amenity.id}
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedAmenities((prev) =>
                                                                    prev.includes(amenity.name)
                                                                        ? prev.filter((value) => value !== amenity.name)
                                                                        : [...prev, amenity.name]
                                                                )
                                                            }
                                                            className={cn(
                                                                "rounded-[14px] border px-4 py-2.5 text-[14px] font-semibold transition-all",
                                                                isSelected
                                                                    ? "border-black bg-black text-white"
                                                                    : "border-neutral-200 bg-white text-neutral-600 hover:border-black"
                                                            )}
                                                        >
                                                            {amenity.name}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 border-t border-neutral-100/60 safe-area-bottom">
                                        <SheetClose asChild>
                                            <button className="w-full h-14 bg-black text-white rounded-[16px] font-bold text-[16px] tracking-wide hover:bg-neutral-800 transition-all active:scale-[0.98]">
                                                Show {filtered.length} properties
                                            </button>
                                        </SheetClose>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>

                        {/* Scrolling Categories */}
                        <div className="flex items-center gap-[22px] overflow-x-auto no-scrollbar pt-5 pb-3 px-1.5 snap-x">
                            <button 
                                onClick={() => setSelectedPropertyType(null)}
                                className="flex flex-col items-center gap-2 group outline-none snap-start shrink-0 min-w-[56px]"
                            >
                                <div className={cn(
                                    "p-0 transition-all text-neutral-500",
                                    !selectedPropertyType ? "text-black" : "group-hover:text-black"
                                )}>
                                    <Compass className="w-[26px] h-[26px]" strokeWidth={!selectedPropertyType ? 2.5 : 2} />
                                </div>
                                <span className={cn(
                                    "text-[12px] whitespace-nowrap transition-all",
                                    !selectedPropertyType ? "font-bold text-black border-b-[2px] border-black pb-1" : "font-medium text-neutral-500 pb-1 group-hover:text-black"
                                )}>
                                    All Homes
                                </span>
                            </button>

                            {availableTypes.map(type => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedPropertyType(type)}
                                    className="flex flex-col items-center gap-2 group outline-none snap-start shrink-0 min-w-[64px]"
                                >
                                    <div className={cn(
                                        "p-0 transition-all text-neutral-400",
                                        selectedPropertyType === type ? "text-black scale-110" : "group-hover:text-black"
                                    )}>
                                        {getIconForType(type)}
                                    </div>
                                    <span className={cn(
                                        "text-[12px] whitespace-nowrap transition-all",
                                        selectedPropertyType === type ? "font-bold text-black border-b-[2px] border-black pb-1" : "font-medium text-neutral-500 pb-1 group-hover:text-black"
                                    )}>
                                        {type}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <main className="w-full max-w-[1440px] mx-auto pt-6 px-4 sm:px-6 lg:px-8">
                    {viewMode === 'map' ? (
                        <div className="h-[75vh] w-full rounded-[24px] overflow-hidden relative border border-neutral-200/50 shadow-sm isolate">
                            <Suspense fallback={
                                <div className="h-full w-full bg-neutral-100/50 animate-pulse flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-3 text-neutral-400">
                                        <MapIcon className="w-8 h-8" />
                                    </div>
                                </div>
                            }>
                                <PropertyMap properties={mapData} onPropertyClick={() => { }} />
                            </Suspense>
                        </div>
                    ) : (
                        <div>
                            {filtered.length === 0 ? (
                                <div className="py-24 flex flex-col items-center text-center">
                                    <div className="w-24 h-24 rounded-full bg-neutral-50 flex items-center justify-center mb-6 border border-neutral-100">
                                        <Search className="w-10 h-10 text-neutral-400" strokeWidth={2} />
                                    </div>
                                    <h3 className="text-[22px] font-bold text-black tracking-tight">No exact matches</h3>
                                    <p className="text-[16px] text-neutral-500 mt-2 font-medium">Try changing or removing some of your filters.</p>
                                    <Button variant="outline" onClick={clearFilters} className="mt-8 rounded-full font-bold px-8 h-12 border-neutral-200">
                                        Clear all filters
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                                    {filtered.map((property, idx) => (
                                        <TrustCard
                                            key={property.id}
                                            property={property}
                                            priority={idx < 4}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </PullToRefresh>

            {/* Floating Map/List Toggle (Apple Native Style) */}
            <div className="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'map' : 'grid')}
                    className="pointer-events-auto h-14 px-6 bg-neutral-900/95 backdrop-blur-md text-white rounded-full flex items-center gap-2.5 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 pointer-events-auto font-bold text-[15px] tracking-wide"
                >
                    {viewMode === 'grid' ? (
                        <>
                            <span>Map</span>
                            <MapIcon className="w-5 h-5" strokeWidth={2.5} />
                        </>
                    ) : (
                        <>
                            <span>List</span>
                            <List className="w-5 h-5" strokeWidth={2.5} />
                        </>
                    )}
                </button>
            </div>

            <MobileNav user={currentUser} userRole={currentUser?.role} />
        </div>
    )
}
