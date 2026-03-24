"use client"

import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'circular' | 'text' | 'card' | 'image'
    animation?: 'pulse' | 'shimmer' | 'none'
}

function Skeleton({
    className,
    variant = 'default',
    animation = 'shimmer',
    ...props
}: SkeletonProps) {
    const baseStyles = "bg-neutral-100"

    const variantStyles = {
        default: "rounded-md",
        circular: "rounded-full",
        text: "rounded h-4 w-full",
        card: "rounded-xl",
        image: "rounded-lg aspect-video",
    }

    const animationStyles = {
        pulse: "animate-pulse",
        shimmer: "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent",
        none: "",
    }

    return (
        <div
            className={cn(
                baseStyles,
                variantStyles[variant],
                animationStyles[animation],
                className
            )}
            {...props}
        />
    )
}

// Immersive TrustCard-style Property Card Skeleton (Updated to Apple native style)
function PropertyCardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("block w-full h-full flex flex-col gap-3.5", className)}>
            <div className="relative w-full rounded-[24px] overflow-hidden bg-neutral-100 aspect-[4/3]">
                {/* Image Area Skeleton */}
                <Skeleton className="absolute inset-0 rounded-none bg-neutral-200/50" />
                
                {/* Top Control Skeleton */}
                <div className="absolute top-3 right-3 z-20">
                    <Skeleton variant="circular" className="h-9 w-9 sm:h-10 sm:w-10 bg-white/40" />
                </div>

                {/* Bottom Overlay Skeleton (Price) */}
                <div className="absolute bottom-3 left-3 z-20">
                    <Skeleton className="h-8 w-24 rounded-full bg-white/40" />
                </div>
            </div>
            {/* Desktop Title Skeleton */}
            <div className="px-1 flex flex-col gap-1.5 mt-0.5">
                <Skeleton variant="text" className="h-5 w-3/4 bg-neutral-100" />
                <Skeleton variant="text" className="h-4 w-1/2 bg-neutral-100 mt-1" />
                <div className="flex gap-2 mt-1">
                    <Skeleton variant="text" className="h-4 w-12 bg-neutral-100" />
                    <Skeleton variant="text" className="h-4 w-12 bg-neutral-100" />
                    <Skeleton variant="text" className="h-4 w-16 bg-neutral-100" />
                </div>
            </div>
        </div>
    )
}

// Full Page Loading Skeleton — Matching the new Apple Native feed design
function HomePageSkeleton() {
    return (
        <div className="min-h-screen bg-white font-sans text-neutral-900 overflow-x-hidden">
            <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-transparent">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 h-16 md:h-20 flex items-center justify-between">
                    <div className="flex-1 flex justify-start">
                        <Skeleton variant="circular" className="h-10 w-10" />
                    </div>
                    <div className="flex-1 flex justify-center">
                        <Skeleton className="h-7 w-20 rounded-lg bg-neutral-200" />
                    </div>
                    <div className="flex-1 flex justify-end">
                        <Skeleton variant="circular" className="h-9 w-9" />
                    </div>
                </div>
            </header>

            <div className="h-16 md:h-20" />

            {/* Fake Sticky Search & Categories Section */}
            <div className="w-full bg-white/90 pb-2">
                <div className="w-full max-w-[1440px] mx-auto pt-4 px-4 sm:px-6 lg:px-8">
                    {/* Search Bar Skeleton */}
                    <div className="flex items-center gap-3">
                        <Skeleton className="flex-1 h-[52px] sm:h-14 rounded-[16px] bg-neutral-100" />
                        <Skeleton className="h-[52px] w-[52px] sm:h-14 sm:w-14 shrink-0 rounded-[16px] bg-neutral-100" />
                    </div>

                    {/* Scrolling Categories Skeleton */}
                    <div className="flex items-center gap-[22px] overflow-x-hidden pt-5 pb-3 px-1.5">
                         {Array.from({ length: 7 }).map((_, i) => (
                             <div key={i} className="flex flex-col items-center gap-2">
                                 <Skeleton variant="circular" className="w-[26px] h-[26px] bg-neutral-100" />
                                 <Skeleton className="h-3 w-12 bg-neutral-100" />
                             </div>
                         ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area Grid Skeleton */}
            <main className="w-full max-w-[1440px] mx-auto pt-6 px-4 sm:px-6 lg:px-8 pb-40">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <PropertyCardSkeleton key={i} />
                    ))}
                </div>
            </main>

            {/* Mobile Nav Skeleton */}
            <div className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-neutral-100 flex items-center justify-around sm:hidden z-50">
                <Skeleton variant="circular" className="w-10 h-10" />
                <Skeleton variant="circular" className="w-10 h-10" />
                <Skeleton variant="circular" className="w-10 h-10" />
                <Skeleton variant="circular" className="w-10 h-10" />
            </div>
        </div>
    )
}

// Table Row Skeleton
function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
    return (
        <tr className="border-b border-neutral-100">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="py-4 px-4">
                    <Skeleton variant="text" className="h-4 w-full" />
                </td>
            ))}
        </tr>
    )
}

// Dashboard Card Skeleton
function DashboardCardSkeleton() {
    return (
        <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
                <Skeleton variant="text" className="h-4 w-24" />
                <Skeleton variant="circular" className="h-8 w-8" />
            </div>
            <Skeleton variant="text" className="h-8 w-20 mb-2" />
            <Skeleton variant="text" className="h-3 w-32" />
        </div>
    )
}

export {
    Skeleton,
    PropertyCardSkeleton,
    HomePageSkeleton,
    TableRowSkeleton,
    DashboardCardSkeleton
}
