'use client'

import Link from 'next/link'
import { FileText, FolderArchive, Plus } from '@/components/ui/icons'

import { getFilterEmptyMessage } from '../_lib/leases-page-helpers'
import type { FilterTab } from '../_lib/leases-page-types'

export function GlobalEmptyState() {
    return (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                <FileText className="h-7 w-7 text-neutral-400" strokeWidth={1.6} />
            </div>
            <h2 className="mt-6 text-xl font-semibold tracking-[-0.02em] text-neutral-950">
                No leases yet
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-neutral-500">
                Create your first lease agreement, send it to a tenant, and
                manage everything from here.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                    href="/landlord/leases/new"
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white shadow-lg shadow-neutral-950/15 transition-all hover:bg-neutral-800 active:scale-95"
                >
                    <Plus className="h-4 w-4" strokeWidth={2} />
                    Create first lease
                </Link>
                <Link
                    href="/landlord/properties"
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-700 transition-all hover:bg-neutral-50 active:scale-95"
                >
                    View properties
                </Link>
            </div>
        </div>
    )
}

export function FilterEmptyState({ filter }: { filter: FilterTab }) {
    const message = getFilterEmptyMessage(filter)

    return (
        <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                <FolderArchive
                    className="h-5 w-5 text-neutral-400"
                    strokeWidth={1.8}
                />
            </div>
            <h3 className="mt-4 text-base font-semibold text-neutral-950">
                {message.title}
            </h3>
            <p className="mx-auto mt-1.5 max-w-xs text-sm text-neutral-500">
                {message.description}
            </p>
        </div>
    )
}

