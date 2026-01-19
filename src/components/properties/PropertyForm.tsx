'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { ArrowLeft, Building2, Info, Loader2 } from 'lucide-react'
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
        <div className="mx-auto max-w-5xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-background">
                        <Building2 className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                            {mode === 'edit' ? 'Edit Property' : 'List a New Property'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {mode === 'edit'
                                ? 'Update your property details below.'
                                : 'Fill in the details below to publish your listing.'}
                        </p>
                    </div>
                </div>

                <Link href="/landlord/properties" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:w-auto">
                        <ArrowLeft className="mr-2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                        Back to properties
                    </Button>
                </Link>
            </div>

            {mode === 'create' && (
                <Alert className="mb-6 bg-muted/40">
                    <Info className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    <AlertDescription className="text-muted-foreground">
                        Your property will be submitted for approval. Once approved by our team, you'll be able to list it publicly.
                    </AlertDescription>
                </Alert>
            )}

            <form action={handleSubmit} className="space-y-6 sm:space-y-8">
                {/* Property Images */}
                <Card className="gap-0 py-0">
                    <CardHeader className="border-b px-4 sm:px-6 py-4">
                        <CardTitle className="text-base font-semibold tracking-tight">Property Images</CardTitle>
                        <CardDescription>
                            Upload high-quality photos of your property. The first image will be the main photo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 py-6">
                        {userId ? (
                            <ImageUpload
                                userId={userId}
                                maxImages={6}
                                onImagesChange={setImages}
                                initialImages={initialData?.images || []}
                            />
                        ) : (
                            <div className="h-32 flex items-center justify-center rounded-xl border bg-muted/30">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" strokeWidth={1.5} />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Basic Info */}
                <Card className="gap-0 py-0">
                    <CardHeader className="border-b px-4 sm:px-6 py-4">
                        <CardTitle className="text-base font-semibold tracking-tight">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 py-6 space-y-5">
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    </CardContent>
                </Card>

                {/* Location */}
                <Card className="gap-0 py-0">
                    <CardHeader className="border-b px-4 sm:px-6 py-4">
                        <CardTitle className="text-base font-semibold tracking-tight">Location</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 py-6 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <p className="text-xs text-muted-foreground">
                                Search for your address or click on the map to set the exact location.
                            </p>
                            <LocationPicker
                                initialCoordinates={coordinates}
                                onLocationChange={setCoordinates}
                                onAddressChange={handleAddressFromMap}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Specifications */}
                <Card className="gap-0 py-0">
                    <CardHeader className="border-b px-4 sm:px-6 py-4">
                        <CardTitle className="text-base font-semibold tracking-tight">Specifications</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 py-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    </CardContent>
                </Card>

                {/* Description & Amenities */}
                <Card className="gap-0 py-0">
                    <CardHeader className="border-b px-4 sm:px-6 py-4">
                        <CardTitle className="text-base font-semibold tracking-tight">Details</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 py-6 space-y-5">
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

                        <div className="space-y-3">
                            <Label>Amenities</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                    </CardContent>
                </Card>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-4 pt-2">
                    <Link href="/landlord/properties" className="w-full sm:w-auto">
                        <Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button>
                    </Link>
                    <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={1.5} />}
                        {isLoading
                            ? (mode === 'edit' ? 'Saving...' : 'Creating...')
                            : (mode === 'edit' ? 'Save Changes' : 'Create Listing')}
                    </Button>
                </div>
            </form>
        </div>
    )
}
