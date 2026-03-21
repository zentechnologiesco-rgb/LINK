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

// Immersive TrustCard-style Property Card Skeleton
function PropertyCardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("block w-full h-full", className)}>
            <div className="relative w-full rounded-[24px] overflow-hidden bg-neutral-100 aspect-square shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)]">
                {/* Image Area Skeleton */}
                <Skeleton className="absolute inset-0 rounded-none bg-neutral-200/50" />
                
                {/* Bottom Overlay Skeleton (Mimics the gradient/text area) */}
                <div className="absolute inset-x-0 bottom-0 p-3 pb-4 space-y-2">
                    <div className="flex items-center gap-2">
                        <Skeleton variant="circular" className="w-3.5 h-3.5 bg-neutral-300/40" />
                        <Skeleton variant="text" className="h-3 w-8 bg-neutral-300/40" />
                        <Skeleton variant="text" className="h-3 w-16 bg-neutral-300/40 ml-2" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Skeleton variant="text" className="h-6 w-24 bg-neutral-300/60" />
                    </div>
                </div>
            </div>
            {/* Desktop Title Skeleton */}
            <div className="hidden md:block mt-2.5 px-0.5">
                <Skeleton variant="text" className="h-4 w-3/4 bg-neutral-100" />
            </div>
        </div>
    )
}

// Property Row Skeleton (Horizontal Scroll)
function PropertyRowSkeleton() {
    return (
        <div className="w-full mb-8 sm:mb-10">
            <div className="flex justify-between items-end mb-3 px-0">
                <Skeleton variant="text" className="h-6 sm:h-7 w-32 sm:w-40" />
                <Skeleton variant="text" className="h-4 w-16 sm:w-20" />
            </div>
            <div className="grid grid-flow-col auto-cols-[72vw] sm:auto-cols-[200px] md:auto-cols-[195px] lg:auto-cols-[185px] xl:auto-cols-[200px] gap-3 sm:gap-4 overflow-x-auto pb-2 [scrollbar-width:none]">
                {Array.from({ length: 5 }).map((_, i) => (
                    <PropertyCardSkeleton key={i} />
                ))}
            </div>
        </div>
    )
}

// Recently Viewed Section Skeleton
function RecentlyViewedSkeleton() {
    return (
        <section className="mb-8 md:mb-12">
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <div>
                        <Skeleton variant="text" className="h-4 w-28 mb-1" />
                        <Skeleton variant="text" className="h-3 w-16" />
                    </div>
                </div>
            </div>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-[160px] sm:w-[200px] md:w-[220px] rounded-xl border border-neutral-100 bg-white overflow-hidden">
                        <Skeleton className="aspect-[4/3] rounded-none" />
                        <div className="p-2.5 sm:p-3 space-y-2">
                            <Skeleton variant="text" className="h-3 w-3/4" />
                            <Skeleton variant="text" className="h-2 w-full" />
                            <div className="flex justify-between items-center pt-1">
                                <Skeleton variant="text" className="h-3 w-16" />
                                <Skeleton variant="text" className="h-2 w-6" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}

// Large Search Bar Skeleton
function HeroSkeleton() {
    return (
        <div className="flex justify-center mb-10 w-full relative z-10 px-0 sm:px-4">
            <div className="w-full max-w-[800px] flex items-center bg-white border border-neutral-200/50 rounded-full h-[68px] sm:h-20 px-4 sm:px-8">
                <Skeleton variant="circular" className="w-5 h-5 sm:w-6 sm:h-6 mr-3 sm:mr-4" />
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" className="h-4 w-24 sm:w-32" />
                    <Skeleton variant="text" className="h-3 w-32 sm:w-40" />
                </div>
                <div className="hidden sm:block w-[1px] h-10 bg-neutral-100 mx-4"></div>
                <div className="flex items-center gap-4">
                     <Skeleton className="h-10 w-24 rounded-full hidden sm:block" />
                     <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-full" />
                </div>
            </div>
        </div>
    )
}

// Full Page Loading Skeleton — Matching the new wide feed design
function HomePageSkeleton() {
    return (
        <div className="min-h-screen bg-white font-sans text-neutral-900 overflow-x-hidden">
            <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-transparent">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 h-16 md:h-20 flex items-center justify-between">
                    {/* Left: Hamburger/Nav skeleton */}
                    <div className="flex-1 flex justify-start">
                        <Skeleton variant="circular" className="h-10 w-10" />
                    </div>
                    
                    {/* Center: Centered Logo skeleton */}
                    <div className="flex-1 flex justify-center">
                        <Skeleton className="h-7 w-20 rounded-lg bg-neutral-200" />
                    </div>
                    
                    {/* Right: Avatar skeleton */}
                    <div className="flex-1 flex justify-end">
                        <Skeleton variant="circular" className="h-9 w-9" />
                    </div>
                </div>
            </header>

            <div className="h-16 md:h-20" />

            <main className="w-full max-w-[1440px] mx-auto pt-4 sm:pt-6 pb-40 px-4 sm:px-5 lg:px-8 xl:px-12">
                <HeroSkeleton />
                <RecentlyViewedSkeleton />
                <div className="space-y-4">
                    <PropertyRowSkeleton />
                    <PropertyRowSkeleton />
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
    PropertyRowSkeleton,
    RecentlyViewedSkeleton,
    HeroSkeleton,
    HomePageSkeleton,
    TableRowSkeleton,
    DashboardCardSkeleton
}
