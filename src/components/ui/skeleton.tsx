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

// Property Card Skeleton
function PropertyCardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("block", className)}>
            <div className="h-full bg-white rounded-xl sm:rounded-2xl border border-neutral-200/80 overflow-hidden flex flex-col">
                {/* Image Skeleton */}
                <Skeleton variant="image" className="aspect-[4/3]" />

                {/* Content Skeleton */}
                <div className="p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 flex-1">
                    {/* Title */}
                    <Skeleton variant="text" className="h-5 w-3/4" />

                    {/* Location & Stats */}
                    <div className="flex items-center gap-2">
                        <Skeleton variant="text" className="h-3 w-16" />
                        <Skeleton variant="text" className="h-3 w-8" />
                        <Skeleton variant="text" className="h-3 w-8" />
                        <Skeleton variant="text" className="h-3 w-12" />
                    </div>

                    {/* Price Footer */}
                    <div className="mt-auto pt-2 sm:pt-3 border-t border-neutral-100 flex items-center justify-between">
                        <Skeleton variant="text" className="h-6 w-24" />
                        <Skeleton variant="text" className="h-5 w-16 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    )
}

// Property Grid Skeleton
function PropertyGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
            ))}
        </div>
    )
}

// Recently Viewed Section Skeleton
function RecentlyViewedSkeleton() {
    return (
        <section className="mb-8 md:mb-12">
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                    <Skeleton variant="circular" className="w-8 h-8 sm:w-9 sm:h-9" />
                    <div>
                        <Skeleton variant="text" className="h-5 w-32 mb-1" />
                        <Skeleton variant="text" className="h-3 w-20" />
                    </div>
                </div>
            </div>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-[160px] sm:w-[200px] md:w-[220px] rounded-xl border border-neutral-200 bg-white overflow-hidden">
                        <Skeleton variant="image" className="aspect-[4/3]" />
                        <div className="p-2.5 sm:p-3 space-y-2">
                            <Skeleton variant="text" className="h-4 w-3/4" />
                            <Skeleton variant="text" className="h-3 w-full" />
                            <Skeleton variant="text" className="h-4 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}

// Hero Section Skeleton
function HeroSkeleton() {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10 mb-6 md:mb-12 border-b border-neutral-100 pb-6 md:pb-12">
            <div className="max-w-2xl w-full">
                <Skeleton variant="text" className="h-12 sm:h-14 md:h-16 lg:h-20 w-3/4 mb-3 sm:mb-6" />
                <Skeleton variant="text" className="h-5 sm:h-6 w-full max-w-lg" />
            </div>
            <div className="w-full md:max-w-[420px] shrink-0">
                <Skeleton className="h-12 sm:h-14 w-full rounded-xl" />
            </div>
        </div>
    )
}

// Filter Bar Skeleton
function FilterBarSkeleton() {
    return (
        <div className="sticky top-[64px] md:top-[80px] z-30 bg-[#fafafa]/95 backdrop-blur-md py-3 sm:py-4 mb-4 md:mb-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Skeleton className="h-8 sm:h-10 w-20 rounded-full" />
                    <div className="flex gap-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-7 sm:h-9 w-16 sm:w-20 rounded-full" />
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-7 sm:h-9 w-20 rounded-full" />
                    <Skeleton variant="text" className="h-4 w-16" />
                </div>
            </div>
        </div>
    )
}

// Full Page Loading Skeleton
function HomePageSkeleton() {
    return (
        <div className="min-h-screen bg-[#fafafa] font-sans text-neutral-900 overflow-x-hidden">
            {/* Header Skeleton */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-100">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 h-16 md:h-20 flex items-center justify-between">
                    <Skeleton className="h-8 w-24 rounded" />
                    <div className="flex items-center gap-4">
                        <Skeleton variant="circular" className="h-8 w-8" />
                        <Skeleton variant="circular" className="h-9 w-9" />
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto pt-4 sm:pt-6 md:pt-8 pb-24 px-4 sm:px-6 md:px-12">
                <HeroSkeleton />
                <RecentlyViewedSkeleton />
                <FilterBarSkeleton />
                <PropertyGridSkeleton count={8} />
            </main>
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
    PropertyGridSkeleton,
    RecentlyViewedSkeleton,
    HeroSkeleton,
    FilterBarSkeleton,
    HomePageSkeleton,
    TableRowSkeleton,
    DashboardCardSkeleton
}
