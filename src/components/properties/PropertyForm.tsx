'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ChevronLeft, Loader2, Info, Check, XCircle, Home, MapPin } from 'lucide-react'
import { ImageUpload } from './ImageUpload'
import { LocationPicker } from '@/components/maps/LocationPicker'
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { cn } from '@/lib/utils'

// Hardcoded amenities list
const AMENITIES = [
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

interface PropertyFormProps {
    mode?: 'create' | 'edit'
    propertyId?: Id<"properties">
    initialData?: {
        title?: string
        description?: string
        propertyType?: string
        priceNad?: number
        address?: string
        city?: string
        bedrooms?: number
        bathrooms?: number
        sizeSqm?: number
        amenityNames?: string[]
        images?: Id<"_storage">[]

        coordinates?: { lat: number; lng: number } | null
        approvalStatus?: string
        adminNotes?: string
    }
}

export function PropertyForm({ mode = 'create', propertyId, initialData }: PropertyFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialData?.amenityNames || [])
    const [images, setImages] = useState<Id<"_storage">[]>(initialData?.images || [])
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(
        initialData?.coordinates || null
    )
    const [address, setAddress] = useState(initialData?.address || '')

    // Form field states
    const [title, setTitle] = useState(initialData?.title || '')
    const [propertyType, setPropertyType] = useState(initialData?.propertyType || 'apartment')
    const [priceNad, setPriceNad] = useState(initialData?.priceNad?.toString() || '')
    const [city, setCity] = useState(initialData?.city || '')
    const [bedrooms, setBedrooms] = useState(initialData?.bedrooms?.toString() || '1')
    const [bathrooms, setBathrooms] = useState(initialData?.bathrooms?.toString() || '1')
    const [sizeSqm, setSizeSqm] = useState(initialData?.sizeSqm?.toString() || '')
    const [description, setDescription] = useState(initialData?.description || '')

    const currentUser = useQuery(api.users.currentUser)
    const createProperty = useMutation(api.properties.create)
    const updateProperty = useMutation(api.properties.update)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (images.length === 0) {
            toast.error('Please upload at least one property image')
            return
        }

        if (!title || !priceNad || !city || !address) {
            toast.error('Please fill in all required fields')
            return
        }

        if (!coordinates) {
            toast.error('Please select a location on the map')
            return
        }

        setIsLoading(true)

        try {
            const propertyData = {
                title,
                description: description || undefined,
                propertyType,
                address,
                city,
                coordinates: coordinates!,
                priceNad: Number(priceNad),
                bedrooms: bedrooms ? Number(bedrooms) : undefined,
                bathrooms: bathrooms ? Number(bathrooms) : undefined,
                sizeSqm: sizeSqm ? Number(sizeSqm) : undefined,
                amenityNames: selectedAmenities,
                images,
            }

            if (mode === 'edit' && propertyId) {
                await updateProperty({ propertyId, ...propertyData })
                toast.success('Property updated successfully!')
            } else {
                await createProperty(propertyData)
                toast.success('Property created successfully! It will be reviewed by our team.')
            }

            router.push('/landlord/properties')
        } catch (error) {
            console.error('Error saving property:', error)
            toast.error('Failed to save property. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleAmenityChange = (amenityName: string) => {
        setSelectedAmenities((prev) =>
            prev.includes(amenityName)
                ? prev.filter((name) => name !== amenityName)
                : [...prev, amenityName]
        )
    }

    const handleAddressFromMap = (newAddress: string) => {
        setAddress(newAddress)
    }

    if (currentUser === undefined) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-black/10 border-t-black animate-spin" />
                    <p className="text-sm text-black/40 font-medium">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-12">
                <Link
                    href="/landlord/properties"
                    className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-500 hover:text-neutral-900 transition-colors mb-6"
                >
                    <ChevronLeft className="h-3 w-3" />
                    Back to portfolio
                </Link>
                <h1 className="font-[family-name:var(--font-anton)] text-4xl uppercase tracking-wide text-neutral-900 mb-2">
                    {mode === 'edit' ? 'Edit Property' : 'New Listing'}
                </h1>
                <p className="text-neutral-500 font-medium max-w-lg">
                    {mode === 'edit'
                        ? 'Update your property details and manage availability.'
                        : 'Fill in the details below to publish your listing to the marketplace.'}
                </p>
            </div>

            {/* Rejection Banner */}
            {mode === 'edit' && initialData?.approvalStatus === 'rejected' && (
                <div className="flex items-start gap-4 p-6 rounded-2xl bg-red-50 border border-red-100 mb-10">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-1">
                        <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                        <h3 className="font-[family-name:var(--font-anton)] text-xl uppercase tracking-wide text-red-900 mb-2">Submission Rejected</h3>
                        <p className="text-sm font-medium text-red-700 leading-relaxed mb-4 p-4 bg-white/50 rounded-xl border border-red-200/50">
                            "{initialData.adminNotes || "This property was rejected by the admin team."}"
                        </p>
                        <p className="text-xs font-bold uppercase tracking-wider text-red-800 flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            Update the details below and save to resubmit for approval.
                        </p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-12">
                {/* Property Images */}
                <section>
                    <div className="mb-6 flex items-baseline justify-between border-b border-neutral-200 pb-2">
                        <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-widest font-mono">01. Visuals</h2>
                        <span className="text-xs text-neutral-400 font-mono">Max 6 images</span>
                    </div>
                    <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8 transition-all hover:border-neutral-300">
                        <ImageUpload
                            maxImages={6}
                            onImagesChange={setImages}
                            initialImages={initialData?.images || []}
                        />
                    </div>
                </section>

                {/* Basic Information */}
                <section>
                    <div className="mb-6 border-b border-neutral-200 pb-2">
                        <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-widest font-mono">02. Essentials</h2>
                    </div>

                    <div className="grid gap-6">
                        <div>
                            <Label htmlFor="title" className="text-[10px] uppercase tracking-widest font-mono font-bold text-neutral-500 mb-1.5 block">Property Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g. Modern 2-Bedroom Apartment in CBD"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                minLength={5}
                                className="h-12 rounded-xl bg-neutral-50 border-transparent focus:bg-white focus:border-neutral-200 focus:ring-0 font-medium transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="property_type" className="text-[10px] uppercase tracking-widest font-mono font-bold text-neutral-500 mb-1.5 block">Property Type</Label>
                                <Select value={propertyType} onValueChange={setPropertyType}>
                                    <SelectTrigger className="h-12 rounded-xl bg-neutral-50 border-transparent focus:bg-white focus:border-neutral-200 focus:ring-0 font-medium transition-all">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="apartment">Apartment</SelectItem>
                                        <SelectItem value="house">House</SelectItem>
                                        <SelectItem value="room">Room</SelectItem>
                                        <SelectItem value="studio">Studio</SelectItem>
                                        <SelectItem value="penthouse">Penthouse</SelectItem>
                                        <SelectItem value="townhouse">Townhouse</SelectItem>
                                        <SelectItem value="commercial">Commercial</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="price_nad" className="text-[10px] uppercase tracking-widest font-mono font-bold text-neutral-500 mb-1.5 block">Monthly Rent (N$)</Label>
                                <Input
                                    id="price_nad"
                                    type="number"
                                    placeholder="8500"
                                    value={priceNad}
                                    onChange={(e) => setPriceNad(e.target.value)}
                                    required
                                    min={0}
                                    className="h-12 rounded-xl bg-neutral-50 border-transparent focus:bg-white focus:border-neutral-200 focus:ring-0 font-[family-name:var(--font-anton)] tracking-wide text-lg transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Location */}
                <section>
                    <div className="mb-6 border-b border-neutral-200 pb-2">
                        <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-widest font-mono">03. Location</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="city" className="text-[10px] uppercase tracking-widest font-mono font-bold text-neutral-500 mb-1.5 block">City</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                    <Input
                                        id="city"
                                        placeholder="Windhoek"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        required
                                        className="h-12 pl-10 rounded-xl bg-neutral-50 border-transparent focus:bg-white focus:border-neutral-200 focus:ring-0 font-medium transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="address" className="text-[10px] uppercase tracking-widest font-mono font-bold text-neutral-500 mb-1.5 block">Street Address</Label>
                                <div className="relative">
                                    <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                    <Input
                                        id="address"
                                        placeholder="123 Independence Ave"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        required
                                        className="h-12 pl-10 rounded-xl bg-neutral-50 border-transparent focus:bg-white focus:border-neutral-200 focus:ring-0 font-medium transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label className="text-[10px] uppercase tracking-widest font-mono font-bold text-neutral-500 mb-2 block">Pin Location</Label>
                            <div className="rounded-2xl overflow-hidden border border-neutral-200 shadow-sm">
                                <LocationPicker
                                    initialCoordinates={coordinates}
                                    onLocationChange={setCoordinates}
                                    onAddressChange={handleAddressFromMap}
                                />
                            </div>
                            <p className="text-[10px] text-neutral-400 font-mono mt-2 text-right">
                                Click on the map to set exact coordinates.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Specifications */}
                <section>
                    <div className="mb-6 border-b border-neutral-200 pb-2">
                        <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-widest font-mono">04. Specs</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <Label htmlFor="bedrooms" className="text-[10px] uppercase tracking-widest font-mono font-bold text-neutral-500 mb-1.5 block">Bedrooms</Label>
                            <Input
                                id="bedrooms"
                                type="number"
                                value={bedrooms}
                                onChange={(e) => setBedrooms(e.target.value)}
                                min={0}
                                required
                                className="h-12 rounded-xl bg-neutral-50 border-transparent focus:bg-white focus:border-neutral-200 focus:ring-0 font-medium text-center transition-all"
                            />
                        </div>
                        <div>
                            <Label htmlFor="bathrooms" className="text-[10px] uppercase tracking-widest font-mono font-bold text-neutral-500 mb-1.5 block">Bathrooms</Label>
                            <Input
                                id="bathrooms"
                                type="number"
                                value={bathrooms}
                                onChange={(e) => setBathrooms(e.target.value)}
                                min={0}
                                required
                                className="h-12 rounded-xl bg-neutral-50 border-transparent focus:bg-white focus:border-neutral-200 focus:ring-0 font-medium text-center transition-all"
                            />
                        </div>
                        <div>
                            <Label htmlFor="size_sqm" className="text-[10px] uppercase tracking-widest font-mono font-bold text-neutral-500 mb-1.5 block">Size (m²)</Label>
                            <Input
                                id="size_sqm"
                                type="number"
                                placeholder="50"
                                value={sizeSqm}
                                onChange={(e) => setSizeSqm(e.target.value)}
                                min={0}
                                required
                                className="h-12 rounded-xl bg-neutral-50 border-transparent focus:bg-white focus:border-neutral-200 focus:ring-0 font-medium text-center transition-all"
                            />
                        </div>
                    </div>
                </section>

                {/* Description */}
                <section>
                    <div className="mb-6 border-b border-neutral-200 pb-2">
                        <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-widest font-mono">05. Details</h2>
                    </div>
                    <Textarea
                        id="description"
                        placeholder="Describe the property features, nearby amenities, transportation, etc."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        minLength={20}
                        className="min-h-[150px] rounded-xl bg-neutral-50 border-transparent focus:bg-white focus:border-neutral-200 focus:ring-0 resize-none font-medium leading-relaxed p-4 transition-all"
                    />
                </section>

                {/* Amenities */}
                <section>
                    <div className="mb-6 border-b border-neutral-200 pb-2">
                        <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-widest font-mono">06. Amenities</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {AMENITIES.map((amenity) => {
                            const isSelected = selectedAmenities.includes(amenity.name)
                            return (
                                <button
                                    key={amenity.id}
                                    type="button"
                                    onClick={() => handleAmenityChange(amenity.name)}
                                    className={cn(
                                        "flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all text-center border",
                                        isSelected
                                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-md'
                                            : 'bg-white text-neutral-500 border-neutral-100 hover:border-neutral-300 hover:bg-neutral-50'
                                    )}
                                >
                                    {isSelected && <Check className="h-3 w-3 shrink-0" strokeWidth={3} />}
                                    <span className="truncate">{amenity.name}</span>
                                </button>
                            )
                        })}
                    </div>
                </section>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-4 pt-8 sticky bottom-0 bg-white/80 backdrop-blur-xl p-4 -mx-4 sm:mx-0 border-t border-neutral-100 z-10">
                    <Link href="/landlord/properties" className="w-full sm:w-auto">
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full sm:w-auto h-12 rounded-xl text-neutral-500 font-bold uppercase tracking-wider text-xs hover:bg-neutral-100 hover:text-neutral-900"
                        >
                            Cancel
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full sm:w-auto h-12 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-neutral-900/10 transition-all hover:-translate-y-1"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading
                            ? (mode === 'edit' ? 'Saving...' : 'Creating...')
                            : (mode === 'edit' ? 'Save Changes' : 'Create Listing')}
                    </Button>
                </div>
            </form>
        </div>
    )
}
