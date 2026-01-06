'use client'

import { useState, useEffect } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { createProperty, updateProperty } from '@/app/(dashboard)/landlord/actions'
import { toast } from 'sonner'
import { Loader2, AlertCircle, Info } from 'lucide-react'
import { ImageUpload } from './ImageUpload'
import { LocationPicker } from '@/components/maps/LocationPicker'
import { createClient } from '@/lib/supabase/client'
import { Alert, AlertDescription } from '@/components/ui/alert'

const AMENITIES_LIST = [
    'Air Conditioning', 'WiFi', 'Pool', 'Gym', 'Parking',
    'Security', 'Balcony', 'Furnished', 'Pet Friendly',
    'Braai Area', 'Garden', 'Solar Power'
]

interface PropertyFormProps {
    mode?: 'create' | 'edit'
    propertyId?: string
    initialData?: {
        title?: string
        description?: string
        property_type?: string
        price_nad?: number
        address?: string
        city?: string
        bedrooms?: number
        bathrooms?: number
        size_sqm?: number
        amenities?: string[]
        images?: string[]
        coordinates?: { lat: number; lng: number } | null
    }
}

export function PropertyForm({ mode = 'create', propertyId, initialData }: PropertyFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialData?.amenities || [])
    const [images, setImages] = useState<string[]>(initialData?.images || [])
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(
        initialData?.coordinates || null
    )
    const [userId, setUserId] = useState<string | null>(null)
    const [address, setAddress] = useState(initialData?.address || '')
    const router = useRouter()

    // Get user ID for image upload - only run once on mount
    useEffect(() => {
        async function getUser() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserId(user.id)
            }
        }
        getUser()
    }, []) // Empty dependency array - run only on mount

    async function handleSubmit(formData: FormData) {
        // Validate images
        if (images.length === 0) {
            toast.error('Please upload at least one property image')
            return
        }

        setIsLoading(true)
        // Add amenities to formData
        formData.set('amenities', selectedAmenities.join(','))
        // Add images to formData
        formData.set('images', JSON.stringify(images))
        // Add coordinates to formData
        formData.set('coordinates', JSON.stringify(coordinates))
        // Update address if from map
        if (address) {
            formData.set('address', address)
        }

        let result
        if (mode === 'edit' && propertyId) {
            result = await updateProperty(propertyId, formData)
        } else {
            result = await createProperty(formData)
        }

        if (result?.error) {
            toast.error(result.error)
            setIsLoading(false)
        } else {
            toast.success(mode === 'edit' ? 'Property updated successfully!' : 'Property created successfully!')
        }
    }

    const handleAmenityChange = (amenity: string, checked: boolean) => {
        if (checked) {
            setSelectedAmenities([...selectedAmenities, amenity])
        } else {
            setSelectedAmenities(selectedAmenities.filter(a => a !== amenity))
        }
    }

    const handleAddressFromMap = (newAddress: string) => {
        setAddress(newAddress)
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold">
                    {mode === 'edit' ? 'Edit Property' : 'List a New Property'}
                </h1>
                <p className="text-muted-foreground">
                    {mode === 'edit'
                        ? 'Update your property details below.'
                        : 'Fill in the details below to publish your listing.'}
                </p>
            </div>

            {mode === 'create' && (
                <Alert className="mb-6 border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700">
                        Your property will be submitted for approval. Once approved by our team, you'll be able to list it publicly.
                    </AlertDescription>
                </Alert>
            )}

            <form action={handleSubmit} className="space-y-8">
                {/* Property Images */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold border-b pb-2">Property Images</h2>
                    <p className="text-sm text-muted-foreground">
                        Upload high-quality photos of your property. The first image will be the main photo.
                    </p>
                    {userId ? (
                        <ImageUpload
                            userId={userId}
                            maxImages={6}
                            onImagesChange={setImages}
                            initialImages={initialData?.images || []}
                        />
                    ) : (
                        <div className="h-32 flex items-center justify-center bg-gray-100 rounded-lg">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    )}
                </div>

                {/* Basic Info */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold border-b pb-2">Basic Information</h2>

                    <div className="space-y-2">
                        <Label htmlFor="title">Property Title</Label>
                        <Input
                            id="title"
                            name="title"
                            placeholder="e.g. Modern 2-Bedroom Apartment in CBD"
                            defaultValue={initialData?.title || ''}
                            required
                            minLength={5}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="property_type">Property Type</Label>
                            <Select name="property_type" required defaultValue={initialData?.property_type || 'apartment'}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="apartment">Apartment</SelectItem>
                                    <SelectItem value="house">House</SelectItem>
                                    <SelectItem value="room">Room</SelectItem>
                                    <SelectItem value="studio">Studio</SelectItem>
                                    <SelectItem value="penthouse">Penthouse</SelectItem>
                                    <SelectItem value="commercial">Commercial</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price_nad">Monthly Rent (N$)</Label>
                            <Input
                                id="price_nad"
                                name="price_nad"
                                type="number"
                                placeholder="8500"
                                defaultValue={initialData?.price_nad || ''}
                                required
                                min={0}
                            />
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold border-b pb-2">Location</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                                id="city"
                                name="city"
                                placeholder="Windhoek"
                                defaultValue={initialData?.city || ''}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                name="address"
                                placeholder="123 Independence Ave"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Pin Location on Map</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                            Search for your address or click on the map to set the exact location.
                        </p>
                        <LocationPicker
                            initialCoordinates={coordinates}
                            onLocationChange={setCoordinates}
                            onAddressChange={handleAddressFromMap}
                        />
                    </div>
                </div>

                {/* Specifications */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold border-b pb-2">Specifications</h2>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bedrooms">Bedrooms</Label>
                            <Input
                                id="bedrooms"
                                name="bedrooms"
                                type="number"
                                defaultValue={initialData?.bedrooms ?? 1}
                                min={0}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bathrooms">Bathrooms</Label>
                            <Input
                                id="bathrooms"
                                name="bathrooms"
                                type="number"
                                defaultValue={initialData?.bathrooms ?? 1}
                                min={0}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="size_sqm">Size (m²)</Label>
                            <Input
                                id="size_sqm"
                                name="size_sqm"
                                type="number"
                                placeholder="50"
                                defaultValue={initialData?.size_sqm || ''}
                                min={0}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Description & Amenities */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold border-b pb-2">Details</h2>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Describe the property features, nearby amenities, etc."
                            className="h-32"
                            defaultValue={initialData?.description || ''}
                            required
                            minLength={20}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Amenities</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {AMENITIES_LIST.map((amenity) => (
                                <div key={amenity} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`amenity-${amenity}`}
                                        checked={selectedAmenities.includes(amenity)}
                                        onCheckedChange={(checked) => handleAmenityChange(amenity, checked as boolean)}
                                    />
                                    <label
                                        htmlFor={`amenity-${amenity}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {amenity}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <Link href="/landlord/properties" className="w-full">
                        <Button type="button" variant="outline" className="w-full">Cancel</Button>
                    </Link>
                    <Button type="submit" className="w-full bg-black hover:bg-zinc-800 text-white" disabled={isLoading}>
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
