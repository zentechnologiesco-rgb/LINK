import Link from 'next/link'
import type { ReactNode } from 'react'
import { format } from 'date-fns'
import {
    Building2,
    CheckCircle,
    Clock,
    XCircle,
} from '@/components/ui/icons'

import { Button } from '@/components/ui/button'
import { ResubmissionForm } from '@/components/verification/ResubmissionForm'
import { VerificationForm } from '@/components/verification/VerificationForm'

type RejectedPreviousData = {
    business_name?: string | null
    business_registration?: string | null
    id_number?: string | null
    id_type?: string | null
}

export function BecomeLandlordCardShell({ children }: { children: ReactNode }) {
    return (
        <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm sm:rounded-2xl">
            <div className="border-b border-neutral-100/50 px-6 pb-6 pt-10 text-center sm:px-10 sm:pb-6 sm:pt-12">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-900 text-white shadow-xl shadow-neutral-900/10 sm:h-20 sm:w-20">
                    <Building2 className="h-8 w-8 sm:h-9 sm:w-9" />
                </div>
                <h1 className="mb-3 text-2xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-3xl md:text-4xl">
                    Become a Landlord
                </h1>
                <p className="mx-auto max-w-md text-base font-light leading-relaxed text-neutral-500 sm:text-lg">
                    Join our partner program to list properties and start earning rental income.
                </p>
            </div>

            <div className="bg-white p-6 sm:p-10">
                {children}
            </div>
        </div>
    )
}

export function VerificationPendingPanel({ submittedAt }: { submittedAt?: number }) {
    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 p-6 sm:p-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-200/50">
                    <Clock className="h-7 w-7 text-neutral-600" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-neutral-900">
                    Verification Pending
                </h2>
                <p className="mx-auto mb-6 max-w-xs text-sm text-neutral-500">
                    Your application is currently under review. We&apos;ll notify you once it&apos;s approved.
                </p>
                <span className="inline-flex items-center rounded-full bg-neutral-900 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white sm:text-xs">
                    Pending Review
                </span>
                {submittedAt ? (
                    <p className="mt-6 font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                        Submitted on {format(new Date(submittedAt), 'MMM dd, yyyy')}
                    </p>
                ) : null}
            </div>
        </div>
    )
}

export function VerificationApprovedPanel() {
    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-dashed border-emerald-100 bg-emerald-50/30 p-6 sm:p-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle className="h-7 w-7 text-emerald-600" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-neutral-900">
                    You&apos;re Verified!
                </h2>
                <p className="mx-auto mb-6 max-w-sm text-sm text-neutral-500">
                    Your landlord account has been approved. You can now list properties.
                </p>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 sm:text-xs">
                    Approved
                </span>
            </div>
            <div className="pt-2">
                <Button asChild className="h-11 w-full rounded-xl bg-neutral-900 text-sm font-bold text-white shadow-lg shadow-neutral-900/10 transition-all hover:scale-[1.01] hover:bg-neutral-800 sm:h-12 sm:text-base">
                    <Link href="/landlord/properties">Go to Dashboard</Link>
                </Button>
            </div>
        </div>
    )
}

export function VerificationRejectedPanel({
    previousData,
    previousRequestId,
    rejectionReason,
}: {
    previousData: RejectedPreviousData
    previousRequestId: string
    rejectionReason?: string | null
}) {
    const normalizedPreviousData = {
        business_name: previousData.business_name ?? undefined,
        business_registration: previousData.business_registration ?? undefined,
        id_number: previousData.id_number ?? undefined,
        id_type: previousData.id_type ?? undefined,
    }

    return (
        <div className="text-left">
            <div className="mb-8 rounded-xl border border-red-100 bg-red-50 p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                    <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="mb-1 text-lg font-bold text-red-900">Action Required</h3>
                <p className="text-sm text-red-700/80">Please review the issues and resubmit.</p>
            </div>
            <ResubmissionForm
                previousRequestId={previousRequestId}
                previousData={normalizedPreviousData}
                rejectionReason={rejectionReason ?? undefined}
            />
        </div>
    )
}

export function BecomeLandlordEmptyState() {
    return <VerificationForm />
}
