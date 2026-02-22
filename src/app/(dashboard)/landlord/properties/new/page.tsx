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
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-black/10 border-t-black animate-spin" />
                    <p className="text-sm text-black/40 font-medium">Loading...</p>
                </div>
            </div>
        )
    }

    if (!currentUser) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                <p className="text-black/40 font-medium mb-4">Please sign in to continue</p>
                <Link href="/sign-in">
                    <Button className="bg-black hover:bg-black/90 text-white rounded-full font-bold uppercase tracking-wider text-xs">
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

    return (
        <div className="px-6 py-6">
            <PropertyForm mode="create" />
        </div>
    )
}

export default function CreatePropertyPage() {
    return <CreatePropertyContent />
}
