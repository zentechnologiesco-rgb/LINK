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

function HomePageResultsSkeleton({ isMapView = false }: { isMapView?: boolean }) {
    return (
        <main className="mx-auto w-full max-w-[1440px] px-4 pb-40 pt-6 sm:px-6 lg:px-8">
            {isMapView ? (
                <div className="relative isolate h-[75vh] w-full overflow-hidden rounded-[24px] border border-neutral-200/50 bg-neutral-100 shadow-sm">
                    <Skeleton className="absolute inset-0 rounded-none bg-neutral-200/70" />
                    <div className="absolute left-4 top-4 flex gap-2">
                        <Skeleton className="h-8 w-24 rounded-full bg-white/60" />
                        <Skeleton className="h-8 w-20 rounded-full bg-white/50" />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 grid gap-3 sm:max-w-sm">
                        <Skeleton className="h-5 w-2/3 rounded-full bg-white/70" />
                        <Skeleton className="h-4 w-full rounded-full bg-white/60" />
                        <Skeleton className="h-4 w-4/5 rounded-full bg-white/60" />
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <PropertyCardSkeleton key={i} />
                    ))}
                </div>
            )}
        </main>
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
    HomePageResultsSkeleton,
    TableRowSkeleton,
    DashboardCardSkeleton
}
