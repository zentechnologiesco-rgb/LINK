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
import { ChevronLeft, Loader2, Info, Check } from 'lucide-react'
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

        setIsLoading(true)

        try {
            const propertyData = {
                title,
                description: description || undefined,
                propertyType,
                address,
                city,
                coordinates: coordinates || undefined,
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
        <div className="max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="mb-10">
                <Link
                    href="/landlord/properties"
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black/40 hover:text-black transition-colors mb-6"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to properties
                </Link>
                <h1 className="font-[family-name:var(--font-anton)] text-4xl uppercase tracking-wide text-black mb-2">
                    {mode === 'edit' ? 'Edit Property' : 'List a New Property'}
                </h1>
                <p className="text-black/60 font-medium">
                    {mode === 'edit'
                        ? 'Update your property details below.'
                        : 'Fill in the details to publish your listing.'}
                </p>
            </div>

            {/* Info Banner */}
            {mode === 'create' && (
                <div className="flex items-start gap-4 p-6 rounded-2xl bg-black/5 border border-black/5 mb-10">
                    <Info className="h-5 w-5 text-black shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-black/80 leading-relaxed">
                        Your property will be submitted for approval. Once approved by our team, it will be listed publicly on the platform.
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-10">
                {/* Property Images */}
                <section className="p-8 bg-white border border-black/5 rounded-3xl">
                    <div className="mb-6">
                        <h2 className="font-[family-name:var(--font-anton)] uppercase tracking-wide text-xl text-black mb-1">Property Images</h2>
                        <p className="text-sm text-black/50 font-medium">
                            Upload high-quality photos. The first image will be the main photo.
                        </p>
                    </div>
                    <div className="rounded-2xl border-2 border-dashed border-black/10 bg-gray-50/50 p-6 transition-colors hover:border-black/20">
                        <ImageUpload
                            maxImages={6}
                            onImagesChange={setImages}
                            initialImages={initialData?.images || []}
                        />
                    </div>
                </section>

                {/* Basic Information */}
                <section className="p-8 bg-white border border-black/5 rounded-3xl">
                    <h2 className="font-[family-name:var(--font-anton)] uppercase tracking-wide text-xl text-black mb-6">Basic Information</h2>
                    <div className="space-y-6">
                        <div>
                            <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-black/40 mb-2 block">Property Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g. Modern 2-Bedroom Apartment in CBD"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                minLength={5}
                                className="h-12 rounded-xl bg-white border-black/10 focus-visible:ring-black font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="property_type" className="text-xs font-bold uppercase tracking-wider text-black/40 mb-2 block">Property Type</Label>
                                <Select value={propertyType} onValueChange={setPropertyType}>
                                    <SelectTrigger className="h-12 rounded-xl bg-white border-black/10 focus:ring-black font-medium">
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
                                <Label htmlFor="price_nad" className="text-xs font-bold uppercase tracking-wider text-black/40 mb-2 block">Monthly Rent (N$)</Label>
                                <Input
                                    id="price_nad"
                                    type="number"
                                    placeholder="8500"
                                    value={priceNad}
                                    onChange={(e) => setPriceNad(e.target.value)}
                                    required
                                    min={0}
                                    className="h-12 rounded-xl bg-white border-black/10 focus-visible:ring-black font-[family-name:var(--font-anton)] tracking-wide text-lg"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Location */}
                <section className="p-8 bg-white border border-black/5 rounded-3xl">
                    <h2 className="font-[family-name:var(--font-anton)] uppercase tracking-wide text-xl text-black mb-6">Location</h2>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="city" className="text-xs font-bold uppercase tracking-wider text-black/40 mb-2 block">City</Label>
                                <Input
                                    id="city"
                                    placeholder="Windhoek"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    required
                                    className="h-12 rounded-xl bg-white border-black/10 focus-visible:ring-black font-medium"
                                />
                            </div>
                            <div>
                                <Label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-black/40 mb-2 block">Address</Label>
                                <Input
                                    id="address"
                                    placeholder="123 Independence Ave"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    required
                                    className="h-12 rounded-xl bg-white border-black/10 focus-visible:ring-black font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-bold uppercase tracking-wider text-black/40 mb-1 block">Pin Location</Label>
                            <p className="text-xs text-black/50 font-medium mb-4">
                                Search or click on the map to confirm the exact location.
                            </p>
                            <div className="rounded-2xl overflow-hidden border border-black/10">
                                <LocationPicker
                                    initialCoordinates={coordinates}
                                    onLocationChange={setCoordinates}
                                    onAddressChange={handleAddressFromMap}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Specifications */}
                <section className="p-8 bg-white border border-black/5 rounded-3xl">
                    <h2 className="font-[family-name:var(--font-anton)] uppercase tracking-wide text-xl text-black mb-6">Specifications</h2>
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <Label htmlFor="bedrooms" className="text-xs font-bold uppercase tracking-wider text-black/40 mb-2 block">Bedrooms</Label>
                            <Input
                                id="bedrooms"
                                type="number"
                                value={bedrooms}
                                onChange={(e) => setBedrooms(e.target.value)}
                                min={0}
                                required
                                className="h-12 rounded-xl bg-white border-black/10 focus-visible:ring-black font-medium text-center"
                            />
                        </div>
                        <div>
                            <Label htmlFor="bathrooms" className="text-xs font-bold uppercase tracking-wider text-black/40 mb-2 block">Bathrooms</Label>
                            <Input
                                id="bathrooms"
                                type="number"
                                value={bathrooms}
                                onChange={(e) => setBathrooms(e.target.value)}
                                min={0}
                                required
                                className="h-12 rounded-xl bg-white border-black/10 focus-visible:ring-black font-medium text-center"
                            />
                        </div>
                        <div>
                            <Label htmlFor="size_sqm" className="text-xs font-bold uppercase tracking-wider text-black/40 mb-2 block">Size (m²)</Label>
                            <Input
                                id="size_sqm"
                                type="number"
                                placeholder="50"
                                value={sizeSqm}
                                onChange={(e) => setSizeSqm(e.target.value)}
                                min={0}
                                required
                                className="h-12 rounded-xl bg-white border-black/10 focus-visible:ring-black font-medium text-center"
                            />
                        </div>
                    </div>
                </section>

                {/* Description */}
                <section className="p-8 bg-white border border-black/5 rounded-3xl">
                    <h2 className="font-[family-name:var(--font-anton)] uppercase tracking-wide text-xl text-black mb-6">Description</h2>
                    <Textarea
                        id="description"
                        placeholder="Describe the property features, nearby amenities, transportation, etc."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        minLength={20}
                        className="min-h-[150px] rounded-xl bg-white border-black/10 focus-visible:ring-black resize-none font-medium leading-relaxed p-4"
                    />
                </section>

                {/* Amenities */}
                <section className="p-8 bg-white border border-black/5 rounded-3xl">
                    <div className="mb-6">
                        <h2 className="font-[family-name:var(--font-anton)] uppercase tracking-wide text-xl text-black mb-1">Amenities</h2>
                        <p className="text-sm text-black/50 font-medium">
                            Select all that apply.
                        </p>
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
                                        "flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-center border",
                                        isSelected
                                            ? 'bg-black text-white border-black'
                                            : 'bg-white text-black/60 border-black/5 hover:bg-black/5 hover:text-black hover:border-black/20'
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
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-4 pt-6">
                    <Link href="/landlord/properties" className="w-full sm:w-auto">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto h-12 rounded-full border-black/10 text-black font-bold uppercase tracking-wider text-xs hover:bg-black/5 hover:text-black shadow-none"
                        >
                            Cancel
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full sm:w-auto h-12 bg-black hover:bg-black/90 text-white rounded-full font-bold uppercase tracking-wider text-xs shadow-none hover:scale-105 transition-all"
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
