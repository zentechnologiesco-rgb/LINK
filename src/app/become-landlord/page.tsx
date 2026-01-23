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
        redirect('/landlord')
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-lg">
                {/* Back Link */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>

                {/* Main Card */}
                <div className="rounded-2xl overflow-hidden bg-sidebar-accent/20 border border-border">
                    {/* Header Section */}
                    <div className="bg-lime-500 px-8 py-10 text-center relative overflow-hidden">
                        {/* Decorative elements */}
                        <div className="absolute top-1/2 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                        <div className="absolute top-1/2 -right-10 w-24 h-24 bg-white/10 rounded-full blur-2xl" />

                        <div className="relative z-10">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm mb-5">
                                <Building2 className="h-8 w-8 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Become a Landlord</h1>
                            <p className="mt-2 text-white/80 text-sm max-w-xs mx-auto">
                                Join our partner program to list properties and start earning rental income.
                            </p>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-8 bg-background">
                        {verificationStatus ? (
                            <div className="text-center py-4">
                                {verificationStatus.status === 'pending' && (
                                    <div className="space-y-4">
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
                                            <Clock className="h-8 w-8 text-amber-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-foreground">Verification Pending</h2>
                                            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                                                Your application is currently under review. We'll notify you once it's approved.
                                            </p>
                                        </div>
                                        <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-sm font-medium">
                                            Pending Review
                                        </span>
                                        {verificationStatus._creationTime && (
                                            <p className="text-xs text-muted-foreground mt-4">
                                                Submitted on {format(new Date(verificationStatus._creationTime), 'PPP p')}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {verificationStatus.status === 'approved' && (
                                    <div className="space-y-4">
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-lime-500/10">
                                            <CheckCircle className="h-8 w-8 text-lime-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-foreground">You're Verified!</h2>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Your landlord account has been approved. You can now list properties.
                                            </p>
                                        </div>
                                        <span className="inline-block px-4 py-1.5 rounded-full bg-lime-500/10 text-lime-600 text-sm font-medium">
                                            Approved
                                        </span>
                                        <div className="pt-4">
                                            <Button asChild className="w-full bg-lime-500 hover:bg-lime-600 text-white rounded-lg h-11 font-medium shadow-lg shadow-lime-500/20">
                                                <Link href="/landlord">Go to Dashboard</Link>
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {verificationStatus.status === 'rejected' && (
                                    <div className="text-left">
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
                <p className="text-center text-xs text-muted-foreground mt-8">
                    &copy; {new Date().getFullYear()} LINK Property Rental. All rights reserved.
                </p>
            </div>
        </div>
    )
}

export default function BecomeLandlordPage() {
    return <BecomeLandlordContent />
}
