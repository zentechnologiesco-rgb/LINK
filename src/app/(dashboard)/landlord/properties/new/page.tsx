'use client'

import { redirect } from 'next/navigation'
import { PropertyForm } from '@/components/properties/PropertyForm'
import { useQuery } from "convex/react"
import { api } from "../../../../../../convex/_generated/api"

import Link from 'next/link'
import { Button } from '@/components/ui/button'

function CreatePropertyContent() {
    const currentUser = useQuery(api.users.currentUser)

    if (currentUser === undefined) {
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

    return (
        <div className="px-4 py-6 sm:px-6 lg:px-8">
            <PropertyForm mode="create" />
        </div>
    )
}

export default function CreatePropertyPage() {
    return <CreatePropertyContent />
}
