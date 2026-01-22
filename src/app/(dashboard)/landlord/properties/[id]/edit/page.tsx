'use client'

import { redirect, notFound } from 'next/navigation'
import { PropertyForm } from '@/components/properties/PropertyForm'
import { useQuery } from "convex/react"
import { api } from "../../../../../../../convex/_generated/api"
import { Id } from "../../../../../../../convex/_generated/dataModel"

import { use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Props {
    params: Promise<{ id: string }>
}

function EditPropertyContent({ id }: { id: string }) {
    const currentUser = useQuery(api.users.currentUser)
    const property = useQuery(api.properties.getById, { propertyId: id as Id<"properties"> })

    if (currentUser === undefined || property === undefined) {
        return (
            <div className="p-6 lg:p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-gray-200 rounded" />
                    <div className="h-96 bg-gray-100 rounded-xl" />
                </div>
            </div>
        )
    }

    if (!currentUser) {
        return (
            <div className="p-6 text-center">
                <p className="text-muted-foreground">Please sign in to continue</p>
                <Link href="/sign-in">
                    <Button variant="link">Sign In</Button>
                </Link>
            </div>
        )
    }

    // Check if user is landlord or admin
    if (currentUser.role !== 'landlord' && currentUser.role !== 'admin') {
        redirect('/')
    }

    if (!property) {
        notFound()
    }

    // Authorization: Only the landlord who owns this property can edit
    if (property.landlordId !== currentUser._id && currentUser.role !== 'admin') {
        redirect('/')
    }

    return (
        <div className="px-4 py-6 sm:px-6 lg:px-8">
            <PropertyForm
                mode="edit"
                propertyId={property._id}
                initialData={{
                    title: property.title,
                    description: property.description || '',
                    propertyType: property.propertyType,
                    priceNad: property.priceNad,
                    address: property.address,
                    city: property.city,
                    bedrooms: property.bedrooms || 0,
                    bathrooms: property.bathrooms || 0,
                    sizeSqm: property.sizeSqm || 0,
                    amenities: property.amenities || [],
                    images: property.images || [],
                    coordinates: property.coordinates,
                }}
            />
        </div>
    )
}

export default function EditPropertyPage({ params }: Props) {
    const { id } = use(params)
    return <EditPropertyContent id={id} />
}
