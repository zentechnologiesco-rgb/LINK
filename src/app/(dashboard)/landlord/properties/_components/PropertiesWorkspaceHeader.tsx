import Link from 'next/link'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function PropertiesWorkspaceHeader() {
    return (
        <header className="sticky top-0 z-40 border-b border-neutral-100/60 bg-white/80 backdrop-blur-2xl">
            <div className="flex h-14 items-center justify-between px-4 sm:px-6">
                <p className="text-[15px] font-semibold tracking-[-0.02em] text-neutral-950">
                    Properties
                </p>
                <Link href="/landlord/properties/new">
                    <Button className="h-9 rounded-full bg-neutral-950 px-4 text-[13px] font-semibold text-white transition-all hover:bg-neutral-800 active:scale-95">
                        <Plus className="mr-1.5 h-4 w-4" strokeWidth={2.5} />
                        Add New
                    </Button>
                </Link>
            </div>
        </header>
    )
}
