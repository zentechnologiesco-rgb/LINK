'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface AuthBrandLinkProps {
    className?: string
}

export function AuthBrandLink({ className }: AuthBrandLinkProps) {
    return (
        <Link
            href="/"
            className={cn(
                'inline-flex w-fit items-center gap-2 rounded-full border border-neutral-200/80 bg-white px-3.5 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-transform active:scale-[0.98]',
                className
            )}
        >
            <Image
                src="/logo-trans-cropped.png"
                alt="LINK logo"
                width={140}
                height={140}
                priority
                className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10"
            />
            <span className="text-[22px] font-bold leading-none tracking-tight text-neutral-900 sm:text-[24px]">
                LINK
            </span>
        </Link>
    )
}
