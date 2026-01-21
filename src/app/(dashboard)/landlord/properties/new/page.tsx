'use client'

import { redirect } from 'next/navigation'
import { PropertyForm } from '@/components/properties/PropertyForm'
import { useQuery } from "convex/react"
import { api } from "../../../../../../convex/_generated/api"
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react"
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
        redirect('/sign-in')
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
    return (
        <>
            <AuthLoading>
                <div className="p-6 lg:p-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 w-48 bg-gray-200 rounded" />
                        <div className="h-96 bg-gray-100 rounded-xl" />
                    </div>
                </div>
            </AuthLoading>

            <Unauthenticated>
                <div className="p-6 lg:p-8">
                    <div className="text-center py-16">
                        <p className="text-gray-500">Please sign in to create a property</p>
                        <Link href="/sign-in">
                            <Button className="mt-4 bg-gray-900 hover:bg-gray-800">Sign In</Button>
                        </Link>
                    </div>
                </div>
            </Unauthenticated>

            <Authenticated>
                <CreatePropertyContent />
            </Authenticated>
        </>
    )
}
