'use client'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronLeft } from '@/components/ui/icons'
import { useQuery } from 'convex/react'

import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { useUser } from '@/components/providers/UserProvider'
import { api } from '@convex/_generated/api'

import { BecomeLandlordLoadingState } from './BecomeLandlordLoadingState'
import {
    BecomeLandlordCardShell,
    BecomeLandlordEmptyState,
    VerificationApprovedPanel,
    VerificationPendingPanel,
    VerificationRejectedPanel,
} from './BecomeLandlordStatusPanels'

type VerificationStatusRecord = {
    _id: string
    _creationTime?: number
    adminNotes?: string | null
    status: 'pending' | 'approved' | 'rejected'
    documents?: {
        businessName?: string | null
        businessRegistration?: string | null
        idNumber?: string | null
        idType?: string | null
    } | null
}

export function BecomeLandlordWorkspace() {
    const { user, isLoading } = useUser()
    const verificationStatus = useQuery(api.verification.getStatus) as VerificationStatusRecord | null | undefined

    if (isLoading) {
        return <BecomeLandlordLoadingState />
    }

    if (user?.role === 'landlord') {
        redirect('/landlord/properties')
    }

    return (
        <div className="min-h-screen overflow-x-hidden bg-white font-sans text-neutral-900">
            <Header user={user} userRole={user?.role} isLoading={isLoading} />

            <main className="mx-auto flex max-w-[1400px] flex-col items-center px-4 pb-24 pt-8 sm:px-6 sm:pt-12 md:px-12">
                <div className="mb-6 w-full max-w-2xl sm:mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Home
                    </Link>
                </div>

                <BecomeLandlordCardShell>
                    {verificationStatus ? (
                        <div className="py-4 text-center">
                            {verificationStatus.status === 'pending' ? (
                                <VerificationPendingPanel submittedAt={verificationStatus._creationTime} />
                            ) : verificationStatus.status === 'approved' ? (
                                <VerificationApprovedPanel />
                            ) : (
                                <VerificationRejectedPanel
                                    previousRequestId={verificationStatus._id}
                                    previousData={{
                                        business_name: verificationStatus.documents?.businessName,
                                        business_registration: verificationStatus.documents?.businessRegistration,
                                        id_number: verificationStatus.documents?.idNumber,
                                        id_type: verificationStatus.documents?.idType,
                                    }}
                                    rejectionReason={verificationStatus.adminNotes}
                                />
                            )}
                        </div>
                    ) : (
                        <BecomeLandlordEmptyState />
                    )}
                </BecomeLandlordCardShell>

                <p className="mt-8 text-center text-[10px] font-medium text-neutral-400 sm:text-xs">
                    &copy; {new Date().getFullYear()} LINK Property Rental. All rights reserved.
                </p>
            </main>
            <MobileNav user={user} />
        </div>
    )
}
