'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { toast } from 'sonner'
import { ArrowLeft, Building2, Info, Loader2 } from 'lucide-react'
import { ImageUpload } from './ImageUpload'
import { LocationPicker } from '@/components/maps/LocationPicker'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"

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
        amenities?: Id<"amenities">[]
        images?: Id<"_storage">[]
        coordinates?: { lat: number; lng: number } | null
    }
}

export function PropertyForm({ mode = 'create', propertyId, initialData }: PropertyFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [selectedAmenities, setSelectedAmenities] = useState<Id<"amenities">[]>(initialData?.amenities || [])
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
    const amenities = useQuery(api.admin.getAmenities)
    const createProperty = useMutation(api.properties.create)
    const updateProperty = useMutation(api.properties.update)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        // Validate images
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
                amenities: selectedAmenities,
                images,
            }

            if (mode === 'edit' && propertyId) {
                await updateProperty({
                    propertyId,
                    ...propertyData,
                })
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

    const handleAmenityChange = (amenityId: Id<"amenities">, checked: boolean) => {
        setSelectedAmenities((prev) => (
            checked ? [...prev, amenityId] : prev.filter((id) => id !== amenityId)
        ))
    }

    const handleAddressFromMap = (newAddress: string) => {
        setAddress(newAddress)
    }

    if (currentUser === undefined || amenities === undefined) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
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
                        Your property will be submitted for approval. Once approved by our team, it will be listed publicly.
                    </AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                {/* Property Images */}
                <Card className="gap-0 py-0">
                    <CardHeader className="border-b px-4 sm:px-6 py-4">
                        <CardTitle className="text-base font-semibold tracking-tight">Property Images</CardTitle>
                        <CardDescription>
                            Upload high-quality photos of your property. The first image will be the main photo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 py-6">
                        <ImageUpload
                            maxImages={6}
                            onImagesChange={setImages}
                            initialImages={initialData?.images || []}
                        />
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
                                placeholder="e.g. Modern 2-Bedroom Apartment in CBD"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                minLength={5}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="property_type">Property Type</Label>
                                <Select value={propertyType} onValueChange={setPropertyType}>
                                    <SelectTrigger>
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
                            <div className="space-y-2">
                                <Label htmlFor="price_nad">Monthly Rent (N$)</Label>
                                <Input
                                    id="price_nad"
                                    type="number"
                                    placeholder="8500"
                                    value={priceNad}
                                    onChange={(e) => setPriceNad(e.target.value)}
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
                                    placeholder="Windhoek"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
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
                                    type="number"
                                    value={bedrooms}
                                    onChange={(e) => setBedrooms(e.target.value)}
                                    min={0}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bathrooms">Bathrooms</Label>
                                <Input
                                    id="bathrooms"
                                    type="number"
                                    value={bathrooms}
                                    onChange={(e) => setBathrooms(e.target.value)}
                                    min={0}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="size_sqm">Size (m²)</Label>
                                <Input
                                    id="size_sqm"
                                    type="number"
                                    placeholder="50"
                                    value={sizeSqm}
                                    onChange={(e) => setSizeSqm(e.target.value)}
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
                                placeholder="Describe the property features, nearby amenities, etc."
                                className="h-32"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                minLength={20}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label>Amenities</Label>
                            {amenities.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No amenities available. Ask an admin to seed amenities.
                                </p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {amenities.map((amenity) => (
                                        <div key={amenity._id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`amenity-${amenity._id}`}
                                                checked={selectedAmenities.includes(amenity._id)}
                                                onCheckedChange={(checked) => handleAmenityChange(amenity._id, checked as boolean)}
                                            />
                                            <label
                                                htmlFor={`amenity-${amenity._id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                {amenity.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
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
