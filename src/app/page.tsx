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

function TrustCard({ property }: { property: Property }) {
    const images = property.images.length > 0 ? property.images : ['/window.svg']

    return (
        <Link
            href={`/properties/${property.id}`}
            className="group block"
        >
            <div className="h-full bg-white rounded-xl border border-neutral-200 overflow-hidden transition-all duration-200 hover:border-blue-500/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col">
                {/* Visual Header */}
                <div className="relative aspect-[16/10] bg-neutral-100 overflow-hidden border-b border-neutral-100">
                    <Image
                        src={images[0]}
                        alt={property.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

                    {/* Floating Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                        <span className="px-2 py-1 rounded-md bg-white/95 backdrop-blur shadow-sm text-[10px] font-bold uppercase tracking-wide text-neutral-900">
                            {property.type}
                        </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                        <div className="text-white drop-shadow-md">
                            <div className="text-xs font-medium opacity-90 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {property.city}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Body */}
                <div className="p-4 flex flex-col gap-4 flex-1">
                    <div>
                        <h3 className="font-semibold text-neutral-900 text-base leading-tight group-hover:text-blue-600 transition-colors mb-1 truncate">
                            {property.title}
                        </h3>
                        <p className="text-xs text-neutral-500 truncate">{property.address}</p>
                    </div>

                    {/* Tech-Forward Data Grid */}
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-neutral-50/50 border border-neutral-100">
                        <Metric label="Price" value={`N$${(property.price / 1000).toFixed(1)}k`} highlight />
                        <Metric label="Layout" value={`${property.bedrooms}b / ${property.bathrooms}b`} />
                        <Metric label="Size" value={`${property.size}m²`} />
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                            <Zap className="w-3 h-3 fill-current" />
                            <span>Verified Listing</span>
                        </div>
                        <div className="text-[11px] text-neutral-400 font-medium">
                            Added recently
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}

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
            amenities: p.amenities || [],
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
        <div className="min-h-screen bg-[#fafafa] font-sans text-neutral-900">
            <Header user={currentUser} userRole={currentUser?.role} isLoading={currentUser === undefined} />

            <main className="max-w-[1400px] mx-auto pt-8 pb-24 px-6 md:px-12">

                {/* Minimal Hero Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-12 border-b border-neutral-100 pb-12">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-neutral-100/80 border border-neutral-200/60">
                            <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </div>
                            <span className="text-[11px] font-mono text-neutral-600 uppercase tracking-widest font-medium">Live Feed</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-neutral-900 mb-6 leading-[1.1]">
                            Verified Properties.
                        </h1>
                        <p className="text-lg md:text-xl text-neutral-500 leading-relaxed font-light max-w-lg">
                            Direct access to Namibia's most trusted real estate database. Updated in real-time.
                        </p>
                    </div>

                    {/* Search Component - Aligned right */}
                    <div className="w-full md:w-[420px]">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search database..."
                                className="w-full h-14 pl-11 pr-4 bg-neutral-50 hover:bg-white border border-transparent hover:border-neutral-200 rounded-xl text-base transition-all focus:outline-none focus:bg-white focus:border-neutral-300 focus:ring-4 focus:ring-neutral-100 placeholder:text-neutral-400 shadow-sm font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* Refined Feed Controls */}
                <div className="sticky top-[80px] z-30 bg-[#fafafa]/95 backdrop-blur-md py-4 mb-8 -mx-4 px-4 md:px-0 border-b border-transparent transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="flex bg-neutral-100/80 p-1 rounded-full border border-neutral-200/60">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-2",
                                        viewMode === 'grid'
                                            ? "bg-white text-neutral-900 shadow-sm"
                                            : "text-neutral-500 hover:text-neutral-700"
                                    )}
                                >
                                    <List className="w-3.5 h-3.5" />
                                    List
                                </button>
                                <button
                                    onClick={() => setViewMode('map')}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-2",
                                        viewMode === 'map'
                                            ? "bg-white text-neutral-900 shadow-sm"
                                            : "text-neutral-500 hover:text-neutral-700"
                                    )}
                                >
                                    <MapIcon className="w-3.5 h-3.5" />
                                    Map
                                </button>
                            </div>
                            <div className="w-px h-6 bg-neutral-200 mx-2 hidden md:block" />
                            <div className="flex overflow-x-auto no-scrollbar gap-2 items-center pb-2 md:pb-0">
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={cn(
                                            "h-9 px-4 rounded-full text-xs font-semibold transition-all whitespace-nowrap border",
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

                        <div className="flex items-center gap-3">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <button className={cn(
                                        "flex items-center gap-2 h-9 px-4 rounded-full text-xs font-semibold border transition-all",
                                        activeFilterCount > 0
                                            ? "bg-neutral-900 text-white border-neutral-900"
                                            : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
                                    )}>
                                        <Filter className="w-3 h-3" />
                                        <span>Filters</span>
                                        {activeFilterCount > 0 && (
                                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
                                                {activeFilterCount}
                                            </span>
                                        )}
                                    </button>
                                </SheetTrigger>
                                <SheetContent className="overflow-y-auto w-full sm:w-[500px]">
                                    <SheetHeader className="mb-8">
                                        <SheetTitle className="text-2xl font-bold">Filters</SheetTitle>
                                        <SheetDescription>
                                            Refine your search to find the perfect property.
                                        </SheetDescription>
                                    </SheetHeader>

                                    <div className="space-y-8">
                                        {/* Price Range */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-widest">Price Range (N$)</h3>
                                            <div className="flex items-center gap-4">
                                                <div className="space-y-1.5 flex-1">
                                                    <Label htmlFor="min-price" className="text-xs text-neutral-500">Min Price</Label>
                                                    <Input
                                                        id="min-price"
                                                        type="number"
                                                        placeholder="0"
                                                        value={priceRange.min}
                                                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1.5 flex-1">
                                                    <Label htmlFor="max-price" className="text-xs text-neutral-500">Max Price</Label>
                                                    <Input
                                                        id="max-price"
                                                        type="number"
                                                        placeholder="Any"
                                                        value={priceRange.max}
                                                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bedrooms */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-widest">Bedrooms</h3>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setMinBedrooms(null)}
                                                    className={cn(
                                                        "h-10 px-4 rounded-lg text-sm font-medium border transition-all flex-1",
                                                        minBedrooms === null
                                                            ? "bg-neutral-900 text-white border-neutral-900"
                                                            : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-900"
                                                    )}
                                                >
                                                    Any
                                                </button>
                                                {[1, 2, 3, 4].map((num) => (
                                                    <button
                                                        key={num}
                                                        onClick={() => setMinBedrooms(num)}
                                                        className={cn(
                                                            "h-10 w-12 rounded-lg text-sm font-medium border transition-all",
                                                            minBedrooms === num
                                                                ? "bg-neutral-900 text-white border-neutral-900"
                                                                : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-900"
                                                        )}
                                                    >
                                                        {num}+
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Amenities */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-widest">Amenities</h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {AMENITIES_LIST.map((amenity) => (
                                                    <label
                                                        key={amenity}
                                                        className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:border-neutral-400 cursor-pointer transition-colors bg-white hover:bg-neutral-50"
                                                    >
                                                        <Checkbox
                                                            checked={selectedAmenities.includes(amenity)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setSelectedAmenities([...selectedAmenities, amenity])
                                                                } else {
                                                                    setSelectedAmenities(selectedAmenities.filter(a => a !== amenity))
                                                                }
                                                            }}
                                                        />
                                                        <span className="text-sm font-medium text-neutral-700">{amenity}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <SheetFooter className="mt-12">
                                        <div className="flex w-full gap-4">
                                            <Button
                                                variant="outline"
                                                className="flex-1 h-12 rounded-xl"
                                                onClick={clearFilters}
                                            >
                                                Clear All
                                            </Button>
                                            <SheetClose asChild>
                                                <Button className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
                                                    Show Results
                                                </Button>
                                            </SheetClose>
                                        </div>
                                    </SheetFooter>

                                </SheetContent>
                            </Sheet>

                            <span className="hidden md:inline-block w-px h-4 bg-neutral-200" />
                            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-neutral-400">
                                <span>{filtered.length} RESULTS</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="min-h-[500px]">
                    {viewMode === 'map' ? (
                        <div className="h-[600px] w-full rounded-3xl overflow-hidden border border-neutral-200 shadow-sm relative">
                            <PropertyMap properties={mapData} onPropertyClick={() => { }} />
                        </div>
                    ) : (
                        filtered.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                                {filtered.map((property) => (
                                    <TrustCard key={property.id} property={property} />
                                ))}
                            </div>
                        ) : (
                            <div className="py-32 flex flex-col items-center justify-center text-center opacity-60">
                                <Search className="w-12 h-12 text-neutral-300 mb-4" />
                                <h3 className="text-lg font-medium text-neutral-900">No properties found</h3>
                                <p className="text-sm text-neutral-500">Adjust your filters to see more results</p>
                                <Button variant="link" onClick={clearFilters} className="text-blue-600">
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
