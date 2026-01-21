'use client'

import { CreateLeaseClient } from './CreateLeaseClient'
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react"
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function CreateLeasePage() {
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
                        <p className="text-gray-500">Please sign in to create a lease</p>
                        <Link href="/sign-in">
                            <Button className="mt-4 bg-gray-900 hover:bg-gray-800">Sign In</Button>
                        </Link>
                    </div>
                </div>
            </Unauthenticated>

            <Authenticated>
                <CreateLeaseClient />
            </Authenticated>
        </>
    )
}
