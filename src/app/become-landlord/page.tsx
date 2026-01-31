'use client'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { VerificationForm } from '@/components/verification/VerificationForm'
import { ResubmissionForm } from '@/components/verification/ResubmissionForm'

import { CheckCircle, Clock, XCircle, Building2, ChevronLeft } from 'lucide-react'
import { format } from 'date-fns'
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"

function BecomeLandlordContent() {
    const user = useQuery(api.users.currentUser)
    const verificationStatus = useQuery(api.verification.getStatus)

    if (user === undefined || verificationStatus === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-lime-500/20 border-t-lime-500 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    // Redirect if already a landlord
    if (user?.role === 'landlord') {
        redirect('/landlord/properties')
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-2xl">
                {/* Back Link */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-black/60 hover:text-black transition-colors mb-8 font-medium"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>

                {/* Main Card */}
                <div className="rounded-3xl overflow-hidden bg-white border border-black/5">
                    {/* Header Section */}
                    <div className="px-8 pt-12 pb-6 text-center">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-black text-white mb-6">
                            <Building2 className="h-8 w-8" />
                        </div>
                        <h1 className="font-[family-name:var(--font-anton)] text-4xl text-black tracking-wide mb-3">
                            Become a Landlord
                        </h1>
                        <p className="text-black/60 text-lg max-w-md mx-auto leading-relaxed">
                            Join our partner program to list properties and start earning rental income.
                        </p>
                    </div>

                    {/* Content Section */}
                    <div className="p-8 md:p-10 pt-4">
                        {verificationStatus ? (
                            <div className="text-center py-6">
                                {verificationStatus.status === 'pending' && (
                                    <div className="space-y-8">
                                        <div className="p-8 rounded-2xl border border-dashed border-black/10 bg-gray-50/50">
                                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black/5 mb-4">
                                                <Clock className="h-8 w-8 text-black/60" />
                                            </div>
                                            <h2 className="font-[family-name:var(--font-anton)] text-2xl text-black mb-2">
                                                Verification Pending
                                            </h2>
                                            <p className="text-black/60 max-w-xs mx-auto mb-6">
                                                Your application is currently under review. We'll notify you once it's approved.
                                            </p>
                                            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-black text-white text-xs font-bold tracking-wide uppercase">
                                                Pending Review
                                            </span>
                                            {verificationStatus._creationTime && (
                                                <p className="text-xs text-black/40 mt-6 font-medium uppercase tracking-wider">
                                                    Submitted on {format(new Date(verificationStatus._creationTime), 'MMM dd, yyyy')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {verificationStatus.status === 'approved' && (
                                    <div className="space-y-8">
                                        <div className="p-8 rounded-2xl border border-dashed border-black/10 bg-gray-50/50">
                                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black mb-4">
                                                <CheckCircle className="h-8 w-8 text-white" />
                                            </div>
                                            <h2 className="font-[family-name:var(--font-anton)] text-2xl text-black mb-2">
                                                You're Verified!
                                            </h2>
                                            <p className="text-black/60 max-w-sm mx-auto mb-6">
                                                Your landlord account has been approved. You can now list properties.
                                            </p>
                                            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-black/5 text-black text-xs font-bold tracking-wide uppercase border border-black/10">
                                                Approved
                                            </span>
                                        </div>
                                        <div className="pt-2">
                                            <Button asChild className="w-full bg-black hover:bg-black/80 text-white rounded-full h-12 font-medium text-base shadow-lg shadow-black/10">
                                                <Link href="/landlord/properties">Go to Dashboard</Link>
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {verificationStatus.status === 'rejected' && (
                                    <div className="text-left">
                                        <div className="mb-8 text-center p-6 rounded-2xl bg-red-50/50 border border-red-100">
                                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-3">
                                                <XCircle className="h-6 w-6 text-red-600" />
                                            </div>
                                            <h3 className="font-[family-name:var(--font-anton)] text-xl text-red-900 mb-1">Action Required</h3>
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
                <p className="text-center text-xs text-black/40 mt-8 font-medium">
                    &copy; {new Date().getFullYear()} LINK Property Rental. All rights reserved.
                </p>
            </div>
        </div>
    )
}

export default function BecomeLandlordPage() {
    return <BecomeLandlordContent />
}
