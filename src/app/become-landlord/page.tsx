import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { VerificationForm } from '@/components/verification/VerificationForm'
import { ResubmissionForm } from '@/components/verification/ResubmissionForm'
import { submitVerificationRequest, getVerificationStatus } from '@/lib/verification'
import { CheckCircle, Clock, XCircle, Building2, ArrowLeft, ChevronLeft, AlertCircle, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'

export default async function BecomeLandlordPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/sign-in')
    }

    // Check current role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role === 'landlord') {
        redirect('/landlord')
    }

    const verificationStatus = await getVerificationStatus()

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg">
                {/* Back Link */}
                <div className="mb-6">
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
                    {/* Header Section */}
                    <div className="bg-gray-900 px-8 py-10 text-center relative overflow-hidden">
                        {/* Decorative background visual */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-10">
                            <svg className="h-full w-full text-white" fill="currentColor" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <path d="M0 100 C 20 0 50 0 100 100 Z" />
                            </svg>
                        </div>

                        <div className="relative z-10">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm mb-6 ring-1 ring-white/20">
                                <Building2 className="h-8 w-8 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Become a Landlord</h1>
                            <p className="mt-2 text-gray-400 text-sm max-w-xs mx-auto">
                                Join our partner program to list properties and start earning rental income.
                            </p>
                        </div>
                    </div>

                    <div className="p-8">
                        {verificationStatus ? (
                            <div className="text-center py-6">
                                {verificationStatus.status === 'pending' && (
                                    <div className="space-y-4">
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-50">
                                            <Clock className="h-8 w-8 text-yellow-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900">Verification Pending</h2>
                                            <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                                                Your application is currently under review by our team. We'll notify you once it's approved.
                                            </p>
                                        </div>
                                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 px-3 py-1">
                                            Pending Review
                                        </Badge>
                                        {verificationStatus.created_at && (
                                            <p className="text-xs text-muted-foreground mt-4">
                                                Submitted on {format(new Date(verificationStatus.created_at), 'PPP p')}
                                            </p>
                                        )}
                                    </div>
                                )}
                                {verificationStatus.status === 'approved' && (
                                    <div className="space-y-4">
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                                            <CheckCircle className="h-8 w-8 text-green-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900">You're Verified!</h2>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Your landlord account has been approved. You can now list properties.
                                            </p>
                                        </div>
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1">
                                            Approved
                                        </Badge>
                                        <Button asChild className="w-full mt-6">
                                            <Link href="/landlord">Go to Dashboard</Link>
                                        </Button>
                                    </div>
                                )}
                                {verificationStatus.status === 'rejected' && (
                                    <div className="text-left">
                                        <ResubmissionForm
                                            previousRequestId={verificationStatus.id}
                                            previousData={{
                                                id_type: verificationStatus.documents?.id_type,
                                                id_number: verificationStatus.documents?.id_number,
                                                business_name: verificationStatus.documents?.business_name,
                                                business_registration: verificationStatus.documents?.business_registration,
                                            }}
                                            rejectionReason={verificationStatus.admin_notes}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <VerificationForm submitAction={submitVerificationRequest} />
                        )}
                    </div>
                </div>

                {/* Footer note */}
                <p className="text-center text-xs text-gray-400 mt-8">
                    &copy; {new Date().getFullYear()} ZEN Property Rental. All rights reserved.
                </p>
            </div>
        </div>
    )
}
