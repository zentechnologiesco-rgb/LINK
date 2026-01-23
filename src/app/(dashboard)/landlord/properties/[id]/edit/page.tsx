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
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-lime-500/20 border-t-lime-500 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading property...</p>
                </div>
            </div>
        )
    }

    if (!currentUser) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                <p className="text-muted-foreground mb-4">Please sign in to continue</p>
                <Link href="/sign-in">
                    <Button className="bg-lime-500 hover:bg-lime-600 text-white rounded-lg">
                        Sign In
                    </Button>
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
        <div className="px-6 py-6">
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
                    amenityNames: property.amenityNames || [],
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
