'use client'

import Link from 'next/link'
import { Building2, Wallet2 } from '@/components/ui/icons'

export function LeaseWorkspaceSecondaryNav() {
    return (
        <div className="mt-6 hidden px-6 sm:flex sm:gap-3">
            <Link
                href="/landlord/payments"
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
            >
                <Wallet2 className="h-4 w-4" strokeWidth={2} />
                Payments
            </Link>
            <Link
                href="/landlord/properties"
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
            >
                <Building2 className="h-4 w-4" strokeWidth={2} />
                Properties
            </Link>
        </div>
    )
}

