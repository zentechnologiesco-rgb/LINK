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
import { ChevronLeft, Loader2, Info, Check, XCircle, Home, MapPin, Camera, FileText, Settings, Sparkles } from 'lucide-react'
import { ImageUpload } from './ImageUpload'
import { LocationPicker } from '@/components/maps/LocationPicker'
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { cn } from '@/lib/utils'
import { AMENITIES, PROPERTY_TYPES, PROPERTY_TYPE_LABELS, PropertyType } from '@/constants/property'

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
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
                    <p className="text-sm text-neutral-400 font-medium">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto pb-24">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/landlord/properties"
                    className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-4"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Properties
                </Link>
                <h1 className="text-2xl font-semibold text-neutral-900">
                    {mode === 'edit' ? 'Edit Property' : 'New Property'}
                </h1>
                <p className="text-sm text-neutral-500 mt-1">
                    {mode === 'edit'
                        ? 'Update your property details.'
                        : 'Add a new property to your portfolio.'}
                </p>
            </div>

            {/* Rejection Banner */}
            {mode === 'edit' && initialData?.approvalStatus === 'rejected' && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100 mb-6">
                    <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-red-900 text-sm">Submission Rejected</p>
                        <p className="text-sm text-red-700 mt-1">
                            {initialData.adminNotes || "This property was rejected by the admin team."}
                        </p>
                        <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            Update and save to resubmit for review.
                        </p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Images Section */}
                <section className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 bg-neutral-50">
                        <Camera className="h-4 w-4 text-neutral-500" />
                        <h2 className="text-sm font-semibold text-neutral-900">Photos</h2>
                        <span className="text-xs text-neutral-400 ml-auto">Max 6</span>
                    </div>
                    <div className="p-4">
                        <ImageUpload
                            maxImages={6}
                            onImagesChange={setImages}
                            initialImages={initialData?.images || []}
                        />
                    </div>
                </section>

                {/* Basic Info Section */}
                <section className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 bg-neutral-50">
                        <FileText className="h-4 w-4 text-neutral-500" />
                        <h2 className="text-sm font-semibold text-neutral-900">Basic Info</h2>
                    </div>
                    <div className="p-4 space-y-4">
                        <div>
                            <Label htmlFor="title" className="text-xs font-medium text-neutral-600 mb-1.5 block">
                                Property Title
                            </Label>
                            <Input
                                id="title"
                                placeholder="e.g. Modern 2-Bedroom Apartment"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                minLength={5}
                                className="h-11 rounded-lg bg-neutral-50 border-neutral-200"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                                    Property Type
                                </Label>
                                <Select value={propertyType} onValueChange={setPropertyType}>
                                    <SelectTrigger className="h-11 rounded-lg bg-neutral-50 border-neutral-200">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PROPERTY_TYPES.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {PROPERTY_TYPE_LABELS[type]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="price_nad" className="text-xs font-medium text-neutral-600 mb-1.5 block">
                                    Monthly Rent (N$)
                                </Label>
                                <Input
                                    id="price_nad"
                                    type="number"
                                    placeholder="8500"
                                    value={priceNad}
                                    onChange={(e) => setPriceNad(e.target.value)}
                                    required
                                    min={0}
                                    className="h-11 rounded-lg bg-neutral-50 border-neutral-200 font-semibold"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Location Section */}
                <section className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 bg-neutral-50">
                        <MapPin className="h-4 w-4 text-neutral-500" />
                        <h2 className="text-sm font-semibold text-neutral-900">Location</h2>
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="city" className="text-xs font-medium text-neutral-600 mb-1.5 block">
                                    City
                                </Label>
                                <Input
                                    id="city"
                                    placeholder="Windhoek"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    required
                                    className="h-11 rounded-lg bg-neutral-50 border-neutral-200"
                                />
                            </div>
                            <div>
                                <Label htmlFor="address" className="text-xs font-medium text-neutral-600 mb-1.5 block">
                                    Address
                                </Label>
                                <Input
                                    id="address"
                                    placeholder="123 Main Street"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    required
                                    className="h-11 rounded-lg bg-neutral-50 border-neutral-200"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-medium text-neutral-600 mb-1.5 block">
                                Pin on Map
                            </Label>
                            <div className="rounded-lg overflow-hidden border border-neutral-200">
                                <LocationPicker
                                    initialCoordinates={coordinates}
                                    onLocationChange={setCoordinates}
                                    onAddressChange={handleAddressFromMap}
                                />
                            </div>
                            <p className="text-xs text-neutral-400 mt-1.5">
                                Click on the map to set the exact location.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Specs Section */}
                <section className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 bg-neutral-50">
                        <Settings className="h-4 w-4 text-neutral-500" />
                        <h2 className="text-sm font-semibold text-neutral-900">Specifications</h2>
                    </div>
                    <div className="p-4">
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <Label htmlFor="bedrooms" className="text-xs font-medium text-neutral-600 mb-1.5 block">
                                    Bedrooms
                                </Label>
                                <Input
                                    id="bedrooms"
                                    type="number"
                                    value={bedrooms}
                                    onChange={(e) => setBedrooms(e.target.value)}
                                    min={0}
                                    required
                                    className="h-11 rounded-lg bg-neutral-50 border-neutral-200 text-center"
                                />
                            </div>
                            <div>
                                <Label htmlFor="bathrooms" className="text-xs font-medium text-neutral-600 mb-1.5 block">
                                    Bathrooms
                                </Label>
                                <Input
                                    id="bathrooms"
                                    type="number"
                                    value={bathrooms}
                                    onChange={(e) => setBathrooms(e.target.value)}
                                    min={0}
                                    required
                                    className="h-11 rounded-lg bg-neutral-50 border-neutral-200 text-center"
                                />
                            </div>
                            <div>
                                <Label htmlFor="size_sqm" className="text-xs font-medium text-neutral-600 mb-1.5 block">
                                    Size (m²)
                                </Label>
                                <Input
                                    id="size_sqm"
                                    type="number"
                                    placeholder="50"
                                    value={sizeSqm}
                                    onChange={(e) => setSizeSqm(e.target.value)}
                                    min={0}
                                    required
                                    className="h-11 rounded-lg bg-neutral-50 border-neutral-200 text-center"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Description Section */}
                <section className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 bg-neutral-50">
                        <FileText className="h-4 w-4 text-neutral-500" />
                        <h2 className="text-sm font-semibold text-neutral-900">Description</h2>
                    </div>
                    <div className="p-4">
                        <Textarea
                            id="description"
                            placeholder="Describe your property, nearby amenities, transportation..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            minLength={20}
                            className="min-h-[120px] rounded-lg bg-neutral-50 border-neutral-200 resize-none"
                        />
                    </div>
                </section>

                {/* Amenities Section */}
                <section className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 bg-neutral-50">
                        <Sparkles className="h-4 w-4 text-neutral-500" />
                        <h2 className="text-sm font-semibold text-neutral-900">Amenities</h2>
                    </div>
                    <div className="p-4">
                        <div className="flex flex-wrap gap-2">
                            {AMENITIES.map((amenity) => {
                                const isSelected = selectedAmenities.includes(amenity.name)
                                return (
                                    <button
                                        key={amenity.id}
                                        type="button"
                                        onClick={() => handleAmenityChange(amenity.name)}
                                        className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border",
                                            isSelected
                                                ? 'bg-neutral-900 text-white border-neutral-900'
                                                : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                                        )}
                                    >
                                        {isSelected && <Check className="h-3 w-3" />}
                                        {amenity.name}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </section>

                {/* Action Buttons - Sticky on mobile */}
                <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm border-t border-neutral-100 -mx-4 px-4 py-4 mt-8 flex flex-col sm:flex-row gap-3 sm:justify-end">
                    <Link href="/landlord/properties" className="sm:order-1">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto h-11 rounded-lg border-neutral-200"
                        >
                            Cancel
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full sm:w-auto sm:order-2 h-11 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-medium"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading
                            ? (mode === 'edit' ? 'Saving...' : 'Creating...')
                            : (mode === 'edit' ? 'Save Changes' : 'Create Property')}
                    </Button>
                </div>
            </form>
        </div>
    )
}
