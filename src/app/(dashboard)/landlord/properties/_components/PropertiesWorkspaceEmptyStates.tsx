import Link from 'next/link'
import { Plus, TrendingUp } from '@/components/ui/icons'

import { Button } from '@/components/ui/button'

export function PropertiesPortfolioEmptyState() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
            <div className="mb-6 flex h-[88px] w-[88px] items-center justify-center rounded-3xl bg-neutral-50 ring-1 ring-inset ring-neutral-200/60">
                <TrendingUp className="h-10 w-10 text-neutral-400" strokeWidth={1.8} />
            </div>
            <h3 className="text-[22px] font-bold tracking-[-0.03em] text-neutral-950">
                No properties yet
            </h3>
            <p className="mt-2.5 max-w-[320px] text-[15px] leading-relaxed text-neutral-500">
                Start building your portfolio by listing your first property. It&apos;s quick and easy.
            </p>
            <Link
                href="/landlord/properties/new"
                className="mt-8 flex h-12 items-center justify-center rounded-full bg-neutral-950 px-8 text-[15px] font-semibold text-white transition-all hover:bg-neutral-800 active:scale-95"
            >
                <Plus className="mr-2 h-5 w-5" />
                Add Property
            </Link>
        </div>
    )
}

export function PropertiesFilterEmptyState({
    onReset,
}: {
    onReset: () => void
}) {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <p className="text-[15px] text-neutral-500">
                No properties found in this category.
            </p>
            <Button
                variant="link"
                onClick={onReset}
                className="mt-2 font-semibold text-neutral-950"
            >
                Show all properties
            </Button>
        </div>
    )
}
