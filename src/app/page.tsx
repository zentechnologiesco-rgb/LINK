"use client"

import { useState, useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import Link from "next/link"
import { PropertyMap } from "@/components/maps/PropertyMap"
import { Header } from "@/components/layout/Header"
import { MobileNav } from "@/components/layout/MobileNav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose,
} from "@/components/ui/sheet"
import {
    Search,
    MapPin,
    BedDouble,
    Bath,
    Maximize,
    ArrowUpRight,
    SlidersHorizontal,
    Zap,
    TrendingUp,
    Filter,
    List,
    Map as MapIcon,
    Check,
    X
} from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { SavePropertyButton } from "@/components/properties/SavePropertyButton"
import { TrustCard } from "@/components/properties/TrustCard"
import { RecentlyViewedSection } from "@/components/properties/RecentlyViewedSection"

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

const CATEGORIES = [
    { id: 'all', label: 'All Assets' },
    { id: 'apartment', label: 'Apartments' },
    { id: 'house', label: 'Houses' },
    { id: 'office', label: 'Commercial' },
]

const AMENITIES_LIST = [
    "WiFi",
    "Air Conditioning",
    "Parking",
    "Pool",
    "Gym",
    "Security",
    "Balcony",
    "Furnished",
    "Pet Friendly"
]

// --- Components ---

function Metric({ label, value, highlight = false }: { label: string, value: string | number, highlight?: boolean }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase text-neutral-400 font-semibold tracking-wider">{label}</span>
            <span className={cn(
                "font-mono text-sm font-medium",
                highlight ? "text-blue-600" : "text-neutral-900"
            )}>
                {value}
            </span>
        </div>
    )
}

// TrustCard moved to @/components/properties/TrustCard

// --- Main Page Component ---

export default function HomePage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [activeCategory, setActiveCategory] = useState("all")
    const [activeCity, setActiveCity] = useState("all")
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')

    // Additional Filters
    const [priceRange, setPriceRange] = useState<{ min: string, max: string }>({ min: "", max: "" })
    const [minBedrooms, setMinBedrooms] = useState<number | null>(null)
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])

    // Data Fetching
    const properties = useQuery(api.properties.list, { onlyAvailable: true })
    const currentUser = useQuery(api.users.currentUser)

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
            // Category Match
            const matchType = activeCategory === "all" || p.type.toLowerCase() === activeCategory

            // Text Search Match
            const matchSearch = !searchQuery ||
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.address.toLowerCase().includes(searchQuery.toLowerCase())

            // Price Match
            const minPrice = priceRange.min ? parseInt(priceRange.min) : 0
            const maxPrice = priceRange.max ? parseInt(priceRange.max) : Infinity
            const matchPrice = p.price >= minPrice && p.price <= maxPrice

            // Bedrooms Match
            const matchBedrooms = minBedrooms === null || p.bedrooms >= minBedrooms

            // Amenities Match
            const matchAmenities = selectedAmenities.length === 0 ||
                selectedAmenities.every(amenity => p.amenities.includes(amenity))

            return matchType && matchSearch && matchPrice && matchBedrooms && matchAmenities
        })
    }, [normalizedProperties, activeCategory, searchQuery, priceRange, minBedrooms, selectedAmenities])

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

    if (properties === undefined) {
        return (
            <div className="h-screen w-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#fafafa] font-sans text-neutral-900 overflow-x-hidden">
            <Header user={currentUser} userRole={currentUser?.role} isLoading={currentUser === undefined} />

            <main className="max-w-[1400px] mx-auto pt-4 sm:pt-6 md:pt-8 pb-24 px-4 sm:px-6 md:px-12">

                {/* Minimal Hero Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10 mb-6 md:mb-12 border-b border-neutral-100 pb-6 md:pb-12">
                    <div className="max-w-2xl w-full">

                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold tracking-tight text-neutral-900 mb-3 sm:mb-6 leading-[1.1]">
                            Verified Properties.
                        </h1>
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-neutral-500 leading-relaxed font-light max-w-lg">
                            Direct access to Namibia's most trusted real estate database. Updated in real-time.
                        </p>
                    </div>

                    {/* Search Component - Aligned right */}
                    <div className="w-full md:max-w-[420px] shrink-0">
                        <div className="relative group">
                            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search database..."
                                className="w-full h-12 sm:h-14 pl-10 sm:pl-11 pr-3 sm:pr-4 bg-neutral-50 hover:bg-white border border-transparent hover:border-neutral-200 rounded-xl text-sm sm:text-base transition-all focus:outline-none focus:bg-white focus:border-neutral-300 focus:ring-4 focus:ring-neutral-100 placeholder:text-neutral-400 shadow-sm font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* Recently Viewed Properties Section */}
                <RecentlyViewedSection />

                {/* Refined Feed Controls */}
                <div className="sticky top-[64px] md:top-[80px] z-30 bg-[#fafafa]/95 backdrop-blur-md py-3 sm:py-4 mb-4 md:mb-8 -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 border-b border-transparent transition-all">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
                        {/* View Toggle and Categories Row */}
                        <div className="flex items-center gap-2 w-full md:w-auto overflow-hidden">
                            {/* List/Map Toggle */}
                            <div className="flex bg-neutral-100/80 p-0.5 sm:p-1 rounded-full border border-neutral-200/60 shrink-0">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={cn(
                                        "px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-all flex items-center gap-1.5 sm:gap-2",
                                        viewMode === 'grid'
                                            ? "bg-white text-neutral-900 shadow-sm"
                                            : "text-neutral-500 hover:text-neutral-700"
                                    )}
                                >
                                    <List className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    <span className="hidden xs:inline">List</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('map')}
                                    className={cn(
                                        "px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-all flex items-center gap-1.5 sm:gap-2",
                                        viewMode === 'map'
                                            ? "bg-white text-neutral-900 shadow-sm"
                                            : "text-neutral-500 hover:text-neutral-700"
                                    )}
                                >
                                    <MapIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    <span className="hidden xs:inline">Map</span>
                                </button>
                            </div>
                            <div className="w-px h-4 sm:h-6 bg-neutral-200 mx-1 sm:mx-2 hidden sm:block" />
                            {/* Categories - Horizontal scroll on mobile */}
                            <div className="flex overflow-x-auto no-scrollbar gap-1.5 sm:gap-2 items-center flex-1 min-w-0">
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={cn(
                                            "h-7 sm:h-9 px-2.5 sm:px-4 rounded-full text-[10px] sm:text-xs font-semibold transition-all whitespace-nowrap border shrink-0",
                                            activeCategory === cat.id
                                                ? "bg-neutral-900 text-white border-neutral-900"
                                                : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-300 hover:text-neutral-900"
                                        )}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Filter and Results Count Row */}
                        <div className="flex items-center justify-between gap-2 sm:gap-3">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <button className={cn(
                                        "flex items-center gap-1.5 sm:gap-2 h-7 sm:h-9 px-2.5 sm:px-4 rounded-full text-[10px] sm:text-xs font-semibold border transition-all",
                                        activeFilterCount > 0
                                            ? "bg-neutral-900 text-white border-neutral-900"
                                            : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
                                    )}>
                                        <Filter className="w-3 h-3" />
                                        <span>Filters</span>
                                        {activeFilterCount > 0 && (
                                            <span className="ml-0.5 sm:ml-1 px-1 sm:px-1.5 py-0.5 rounded-full bg-white/20 text-[9px] sm:text-[10px]">
                                                {activeFilterCount}
                                            </span>
                                        )}
                                    </button>
                                </SheetTrigger>
                                <SheetContent className="overflow-y-auto w-full sm:max-w-[400px] md:max-w-[500px]">
                                    <SheetHeader className="border-b border-neutral-100 pb-4 sm:pb-6">
                                        <div className="flex items-center justify-between">
                                            <SheetTitle className="text-lg sm:text-xl font-bold font-[family-name:var(--font-anton)] tracking-wide">
                                                FILTER FEED
                                            </SheetTitle>
                                            <button
                                                onClick={clearFilters}
                                                className="text-[10px] sm:text-xs font-medium text-neutral-500 hover:text-neutral-900 underline decoration-neutral-300 underline-offset-4"
                                            >
                                                Reset All
                                            </button>
                                        </div>
                                    </SheetHeader>

                                    <div className="py-4 sm:py-6 space-y-6 sm:space-y-8 pb-28 sm:pb-32">
                                        {/* Price Range */}
                                        <div className="space-y-3 sm:space-y-4">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="text-[10px] sm:text-xs font-bold text-neutral-900 uppercase tracking-widest font-mono">Price Range</h3>
                                                <span className="text-[9px] sm:text-[10px] bg-neutral-100 text-neutral-500 px-1.5 sm:px-2 py-0.5 rounded-full font-mono shrink-0">NAD</span>
                                            </div>

                                            <div className="flex items-center gap-2 sm:gap-4">
                                                <div className="relative flex-1 group">
                                                    <span className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-xs sm:text-sm">N$</span>
                                                    <input
                                                        type="number"
                                                        placeholder="Min"
                                                        value={priceRange.min}
                                                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                                        className="w-full h-10 sm:h-12 pl-8 sm:pl-10 pr-2 sm:pr-4 bg-neutral-50 border border-neutral-200 rounded-lg sm:rounded-xl outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all font-medium text-xs sm:text-sm"
                                                    />
                                                </div>
                                                <div className="w-3 sm:w-4 h-[1px] bg-neutral-300 shrink-0" />
                                                <div className="relative flex-1 group">
                                                    <span className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-xs sm:text-sm">N$</span>
                                                    <input
                                                        type="number"
                                                        placeholder="Max"
                                                        value={priceRange.max}
                                                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                                        className="w-full h-10 sm:h-12 pl-8 sm:pl-10 pr-2 sm:pr-4 bg-neutral-50 border border-neutral-200 rounded-lg sm:rounded-xl outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all font-medium text-xs sm:text-sm"
                                                    />
                                                </div>
                                            </div>

                                            {/* Quick Chips */}
                                            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
                                                {["5000", "15000", "30000", "50000"].map((price) => (
                                                    <button
                                                        key={price}
                                                        onClick={() => setPriceRange({ ...priceRange, max: price })}
                                                        className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg border border-neutral-200 bg-white text-[10px] sm:text-xs font-medium text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 transition-all whitespace-nowrap shrink-0"
                                                    >
                                                        Under {parseInt(price) / 1000}k
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Bedrooms */}
                                        <div className="space-y-3 sm:space-y-4">
                                            <h3 className="text-[10px] sm:text-xs font-bold text-neutral-900 uppercase tracking-widest font-mono">Bedrooms</h3>
                                            <div className="flex bg-neutral-100 p-0.5 sm:p-1 rounded-lg sm:rounded-xl">
                                                <button
                                                    onClick={() => setMinBedrooms(null)}
                                                    className={cn(
                                                        "flex-1 h-8 sm:h-9 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold transition-all shadow-sm",
                                                        minBedrooms === null
                                                            ? "bg-white text-neutral-900 shadow-sm"
                                                            : "bg-transparent text-neutral-500 hover:text-neutral-900 shadow-none"
                                                    )}
                                                >
                                                    Any
                                                </button>
                                                {[1, 2, 3, 4].map((num) => (
                                                    <button
                                                        key={num}
                                                        onClick={() => setMinBedrooms(num)}
                                                        className={cn(
                                                            "flex-1 h-8 sm:h-9 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold transition-all",
                                                            minBedrooms === num
                                                                ? "bg-white text-neutral-900 shadow-sm"
                                                                : "bg-transparent text-neutral-500 hover:text-neutral-900"
                                                        )}
                                                    >
                                                        {num}+
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Amenities */}
                                        <div className="space-y-3 sm:space-y-4">
                                            <h3 className="text-[10px] sm:text-xs font-bold text-neutral-900 uppercase tracking-widest font-mono">Amenities</h3>
                                            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                                                {AMENITIES_LIST.map((amenity) => (
                                                    <label
                                                        key={amenity}
                                                        className={cn(
                                                            "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl border cursor-pointer transition-all",
                                                            selectedAmenities.includes(amenity)
                                                                ? "bg-neutral-900 border-neutral-900 text-white"
                                                                : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
                                                        )}
                                                    >
                                                        <Checkbox
                                                            className={cn(
                                                                "border-2 h-3.5 w-3.5 sm:h-4 sm:w-4",
                                                                selectedAmenities.includes(amenity)
                                                                    ? "border-white data-[state=checked]:bg-white data-[state=checked]:text-neutral-900"
                                                                    : "border-neutral-300"
                                                            )}
                                                            checked={selectedAmenities.includes(amenity)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setSelectedAmenities([...selectedAmenities, amenity])
                                                                } else {
                                                                    setSelectedAmenities(selectedAmenities.filter(a => a !== amenity))
                                                                }
                                                            }}
                                                        />
                                                        <span className="text-[10px] sm:text-xs font-medium leading-tight">{amenity}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-white/80 backdrop-blur-xl border-t border-neutral-100 safe-area-bottom">
                                        <SheetClose asChild>
                                            <Button className="w-full h-11 sm:h-12 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg sm:rounded-xl font-bold text-sm sm:text-base tracking-wide shadow-lg shadow-neutral-900/10 transition-all hover:scale-[1.01]">
                                                View {filtered.length} Properties
                                            </Button>
                                        </SheetClose>
                                    </div>

                                </SheetContent>
                            </Sheet>

                            <span className="hidden sm:inline-block w-px h-4 bg-neutral-200" />
                            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono text-neutral-400">
                                <span>{filtered.length} <span className="hidden xs:inline">RESULTS</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="min-h-[300px] sm:min-h-[500px]">
                    {viewMode === 'map' ? (
                        <div className="h-[400px] sm:h-[500px] md:h-[600px] w-full rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden border border-neutral-200 shadow-sm relative">
                            <PropertyMap properties={mapData} onPropertyClick={() => { }} />
                        </div>
                    ) : (
                        filtered.length > 0 ? (
                            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                                {filtered.map((property) => (
                                    <TrustCard key={property.id} property={property} />
                                ))}
                            </div>
                        ) : (
                            <div className="py-16 sm:py-24 md:py-32 flex flex-col items-center justify-center text-center opacity-60 px-4">
                                <Search className="w-10 h-10 sm:w-12 sm:h-12 text-neutral-300 mb-3 sm:mb-4" />
                                <h3 className="text-base sm:text-lg font-medium text-neutral-900">No properties found</h3>
                                <p className="text-xs sm:text-sm text-neutral-500">Adjust your filters to see more results</p>
                                <Button variant="link" onClick={clearFilters} className="text-blue-600 text-sm">
                                    Clear filters
                                </Button>
                            </div>
                        )
                    )}
                </div>
            </main>
            <MobileNav user={currentUser} />
        </div>
    )
}
