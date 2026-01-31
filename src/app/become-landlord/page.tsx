'use client'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { VerificationForm } from '@/components/verification/VerificationForm'
import { ResubmissionForm } from '@/components/verification/ResubmissionForm'
import { Header } from "@/components/layout/Header"
import { MobileNav } from "@/components/layout/MobileNav"

import { CheckCircle, Clock, XCircle, Building2, ChevronLeft } from 'lucide-react'
import { format } from 'date-fns'
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"

function BecomeLandlordContent() {
    const user = useQuery(api.users.currentUser)
    const verificationStatus = useQuery(api.verification.getStatus)

    if (user === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-neutral-500 font-medium">Loading...</p>
                </div>
            </div>
        )
    }

    // Redirect if already a landlord
    if (user?.role === 'landlord') {
        redirect('/landlord/properties')
    }

    return (
        <div className="min-h-screen bg-[#fafafa] font-sans text-neutral-900 overflow-x-hidden">
            <Header user={user} userRole={user?.role} isLoading={user === undefined} />

            <main className="max-w-[1400px] mx-auto pt-8 sm:pt-12 pb-24 px-4 sm:px-6 md:px-12 flex flex-col items-center">

                {/* Back Link - Styled consistently */}
                <div className="w-full max-w-2xl mb-6 sm:mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Home
                    </Link>
                </div>

                {/* Main Card */}
                <div className="w-full max-w-2xl bg-white rounded-xl sm:rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden">
                    {/* Header Section */}
                    <div className="px-6 sm:px-10 pt-10 sm:pt-12 pb-6 text-center border-b border-neutral-100/50">
                        <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-neutral-900 text-white mb-6 shadow-xl shadow-neutral-900/10">
                            <Building2 className="h-8 w-8 sm:h-9 sm:w-9" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 mb-3 leading-tight">
                            Become a Landlord
                        </h1>
                        <p className="text-neutral-500 text-base sm:text-lg max-w-md mx-auto leading-relaxed font-light">
                            Join our partner program to list properties and start earning rental income.
                        </p>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 sm:p-10 bg-white">
                        {verificationStatus ? (
                            <div className="text-center py-4">
                                {verificationStatus.status === 'pending' && (
                                    <div className="space-y-6">
                                        <div className="p-6 sm:p-8 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50">
                                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-200/50 mb-4">
                                                <Clock className="h-7 w-7 text-neutral-600" />
                                            </div>
                                            <h2 className="text-xl font-bold text-neutral-900 mb-2">
                                                Verification Pending
                                            </h2>
                                            <p className="text-neutral-500 max-w-xs mx-auto mb-6 text-sm">
                                                Your application is currently under review. We'll notify you once it's approved.
                                            </p>
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-neutral-900 text-white text-[10px] sm:text-xs font-bold tracking-wide uppercase">
                                                Pending Review
                                            </span>
                                            {verificationStatus._creationTime && (
                                                <p className="text-[10px] text-neutral-400 mt-6 font-mono uppercase tracking-wider">
                                                    Submitted on {format(new Date(verificationStatus._creationTime), 'MMM dd, yyyy')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {verificationStatus.status === 'approved' && (
                                    <div className="space-y-6">
                                        <div className="p-6 sm:p-8 rounded-xl border border-dashed border-emerald-100 bg-emerald-50/30">
                                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 mb-4">
                                                <CheckCircle className="h-7 w-7 text-emerald-600" />
                                            </div>
                                            <h2 className="text-xl font-bold text-neutral-900 mb-2">
                                                You're Verified!
                                            </h2>
                                            <p className="text-neutral-500 max-w-sm mx-auto mb-6 text-sm">
                                                Your landlord account has been approved. You can now list properties.
                                            </p>
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs font-bold tracking-wide uppercase">
                                                Approved
                                            </span>
                                        </div>
                                        <div className="pt-2">
                                            <Button asChild className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl h-11 sm:h-12 font-bold text-sm sm:text-base shadow-lg shadow-neutral-900/10 transition-all hover:scale-[1.01]">
                                                <Link href="/landlord/properties">Go to Dashboard</Link>
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {verificationStatus.status === 'rejected' && (
                                    <div className="text-left">
                                        <div className="mb-8 text-center p-6 rounded-xl bg-red-50 border border-red-100">
                                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-3">
                                                <XCircle className="h-6 w-6 text-red-600" />
                                            </div>
                                            <h3 className="text-lg font-bold text-red-900 mb-1">Action Required</h3>
                                            <p className="text-red-700/80 text-sm">Please review the issues and resubmit.</p>
                                        </div>
                                        <ResubmissionForm
                                            previousRequestId={verificationStatus._id}
                                            previousData={{
                                                id_type: verificationStatus.documents?.idType,
                                                id_number: verificationStatus.documents?.idNumber,
                                                business_name: verificationStatus.documents?.businessName,
                                                business_registration: verificationStatus.documents?.businessRegistration,
                                            }}
                                            rejectionReason={verificationStatus.adminNotes}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <VerificationForm />
                        )}
                    </div>
                </div>

                {/* Footer note */}
                <p className="text-center text-[10px] sm:text-xs text-neutral-400 mt-8 font-medium">
                    &copy; {new Date().getFullYear()} LINK Property Rental. All rights reserved.
                </p>
            </main>
            <MobileNav user={user} />
        </div>
    )
}

export default function BecomeLandlordPage() {
    return <BecomeLandlordContent />
}
