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
                    <div className="h-10 w-10 rounded-full border-2 border-lime-500/20 border-t-lime-500 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/landlord/properties"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to properties
                </Link>
                <h1 className="text-2xl font-semibold text-foreground">
                    {mode === 'edit' ? 'Edit Property' : 'List a New Property'}
                </h1>
                <p className="text-muted-foreground mt-1">
                    {mode === 'edit'
                        ? 'Update your property details below.'
                        : 'Fill in the details to publish your listing.'}
                </p>
            </div>

            {/* Info Banner */}
            {mode === 'create' && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-lime-500/10 border border-lime-500/20 mb-8">
                    <Info className="h-5 w-5 text-lime-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">
                        Your property will be submitted for approval. Once approved by our team, it will be listed publicly.
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Property Images */}
                <section>
                    <h2 className="text-lg font-medium text-foreground mb-1">Property Images</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        Upload high-quality photos. The first image will be the main photo.
                    </p>
                    <div className="p-6 rounded-xl border border-border bg-sidebar-accent/30">
                        <ImageUpload
                            maxImages={6}
                            onImagesChange={setImages}
                            initialImages={initialData?.images || []}
                        />
                    </div>
                </section>

                {/* Basic Information */}
                <section>
                    <h2 className="text-lg font-medium text-foreground mb-4">Basic Information</h2>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="title" className="text-foreground">Property Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g. Modern 2-Bedroom Apartment in CBD"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                minLength={5}
                                className="mt-1.5 h-11 rounded-lg bg-sidebar-accent border-0 focus-visible:ring-2 focus-visible:ring-lime-500/50"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="property_type" className="text-foreground">Property Type</Label>
                                <Select value={propertyType} onValueChange={setPropertyType}>
                                    <SelectTrigger className="mt-1.5 h-11 rounded-lg bg-sidebar-accent border-0">
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
                                <Label htmlFor="price_nad" className="text-foreground">Monthly Rent (N$)</Label>
                                <Input
                                    id="price_nad"
                                    type="number"
                                    placeholder="8500"
                                    value={priceNad}
                                    onChange={(e) => setPriceNad(e.target.value)}
                                    required
                                    min={0}
                                    className="mt-1.5 h-11 rounded-lg bg-sidebar-accent border-0 focus-visible:ring-2 focus-visible:ring-lime-500/50"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Location */}
                <section>
                    <h2 className="text-lg font-medium text-foreground mb-4">Location</h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="city" className="text-foreground">City</Label>
                                <Input
                                    id="city"
                                    placeholder="Windhoek"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    required
                                    className="mt-1.5 h-11 rounded-lg bg-sidebar-accent border-0 focus-visible:ring-2 focus-visible:ring-lime-500/50"
                                />
                            </div>
                            <div>
                                <Label htmlFor="address" className="text-foreground">Address</Label>
                                <Input
                                    id="address"
                                    placeholder="123 Independence Ave"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    required
                                    className="mt-1.5 h-11 rounded-lg bg-sidebar-accent border-0 focus-visible:ring-2 focus-visible:ring-lime-500/50"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-foreground">Pin Location on Map</Label>
                            <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                                Search or click on the map to set the exact location.
                            </p>
                            <div className="rounded-xl overflow-hidden border border-border">
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
                <section>
                    <h2 className="text-lg font-medium text-foreground mb-4">Specifications</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="bedrooms" className="text-foreground">Bedrooms</Label>
                            <Input
                                id="bedrooms"
                                type="number"
                                value={bedrooms}
                                onChange={(e) => setBedrooms(e.target.value)}
                                min={0}
                                required
                                className="mt-1.5 h-11 rounded-lg bg-sidebar-accent border-0 focus-visible:ring-2 focus-visible:ring-lime-500/50"
                            />
                        </div>
                        <div>
                            <Label htmlFor="bathrooms" className="text-foreground">Bathrooms</Label>
                            <Input
                                id="bathrooms"
                                type="number"
                                value={bathrooms}
                                onChange={(e) => setBathrooms(e.target.value)}
                                min={0}
                                required
                                className="mt-1.5 h-11 rounded-lg bg-sidebar-accent border-0 focus-visible:ring-2 focus-visible:ring-lime-500/50"
                            />
                        </div>
                        <div>
                            <Label htmlFor="size_sqm" className="text-foreground">Size (m²)</Label>
                            <Input
                                id="size_sqm"
                                type="number"
                                placeholder="50"
                                value={sizeSqm}
                                onChange={(e) => setSizeSqm(e.target.value)}
                                min={0}
                                required
                                className="mt-1.5 h-11 rounded-lg bg-sidebar-accent border-0 focus-visible:ring-2 focus-visible:ring-lime-500/50"
                            />
                        </div>
                    </div>
                </section>

                {/* Description */}
                <section>
                    <h2 className="text-lg font-medium text-foreground mb-4">Description</h2>
                    <Textarea
                        id="description"
                        placeholder="Describe the property features, nearby amenities, transportation, etc."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        minLength={20}
                        className="min-h-[120px] rounded-lg bg-sidebar-accent border-0 focus-visible:ring-2 focus-visible:ring-lime-500/50 resize-none"
                    />
                </section>

                {/* Amenities */}
                <section>
                    <h2 className="text-lg font-medium text-foreground mb-1">Amenities</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        Select all amenities that apply to your property.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {AMENITIES.map((amenity) => {
                            const isSelected = selectedAmenities.includes(amenity.name)
                            return (
                                <button
                                    key={amenity.id}
                                    type="button"
                                    onClick={() => handleAmenityChange(amenity.name)}
                                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-center ${isSelected
                                            ? 'bg-lime-500 text-white shadow-sm'
                                            : 'bg-sidebar-accent text-foreground hover:bg-sidebar-accent/80'
                                        }`}
                                >
                                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                                    <span className="truncate">{amenity.name}</span>
                                </button>
                            )
                        })}
                    </div>
                </section>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-border">
                    <Link href="/landlord/properties" className="w-full sm:w-auto">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto h-11 rounded-lg"
                        >
                            Cancel
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full sm:w-auto h-11 bg-lime-500 hover:bg-lime-600 text-white rounded-lg font-medium shadow-lg shadow-lime-500/20"
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
