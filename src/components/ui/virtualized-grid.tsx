"use client"

import { useRef, useState, useEffect, useCallback, useMemo } from "react"
import { useInView } from "@/hooks/useOptimisticQuery"
import { PropertyGridSkeleton } from "@/components/ui/skeleton"

interface VirtualizedGridProps<T> {
    items: T[]
    renderItem: (item: T, index: number) => React.ReactNode
    getItemKey: (item: T) => string
    initialLoadCount?: number
    loadMoreCount?: number
    gridClassName?: string
    emptyState?: React.ReactNode
}

/**
 * VirtualizedGrid component for efficient rendering of large property lists.
 * Uses intersection observer for infinite scroll loading.
 */
export function VirtualizedGrid<T>({
    items,
    renderItem,
    getItemKey,
    initialLoadCount = 12,
    loadMoreCount = 8,
    gridClassName = "grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6",
    emptyState,
}: VirtualizedGridProps<T>) {
    const [loadedCount, setLoadedCount] = useState(initialLoadCount)
    const [loadMoreRef, isLoadMoreVisible] = useInView({ threshold: 0, rootMargin: '200px' })

    // Load more when bottom sentinel is visible
    useEffect(() => {
        if (isLoadMoreVisible && loadedCount < items.length) {
            setLoadedCount(prev => Math.min(prev + loadMoreCount, items.length))
        }
    }, [isLoadMoreVisible, loadedCount, items.length, loadMoreCount])

    // Reset loaded count when items change significantly
    useEffect(() => {
        if (items.length < loadedCount) {
            setLoadedCount(Math.min(initialLoadCount, items.length))
        }
    }, [items.length, loadedCount, initialLoadCount])

    const visibleItems = useMemo(() =>
        items.slice(0, loadedCount),
        [items, loadedCount]
    )

    const hasMore = loadedCount < items.length

    if (items.length === 0 && emptyState) {
        return <>{emptyState}</>
    }

    return (
        <div className="space-y-6">
            <div className={gridClassName}>
                {visibleItems.map((item, index) => (
                    <div key={getItemKey(item)}>
                        {renderItem(item, index)}
                    </div>
                ))}
            </div>

            {/* Load more sentinel */}
            {hasMore && (
                <div ref={loadMoreRef} className="flex justify-center py-8">
                    <div className="flex items-center gap-3 text-neutral-400">
                        <div className="w-4 h-4 border-2 border-neutral-300 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Loading more...</span>
                    </div>
                </div>
            )}

            {/* Load indicator */}
            {!hasMore && items.length > initialLoadCount && (
                <div className="text-center py-6">
                    <span className="text-xs text-neutral-400 font-mono">
                        Showing all {items.length} properties
                    </span>
                </div>
            )}
        </div>
    )
}

/**
 * Lazy load wrapper that only renders content when in viewport
 */
interface LazyLoadProps {
    children: React.ReactNode
    placeholder?: React.ReactNode
    rootMargin?: string
    once?: boolean
}

export function LazyLoad({
    children,
    placeholder,
    rootMargin = '100px',
    once = true
}: LazyLoadProps) {
    const [hasBeenVisible, setHasBeenVisible] = useState(false)
    const [ref, isInView] = useInView({ rootMargin })

    useEffect(() => {
        if (isInView && once) {
            setHasBeenVisible(true)
        }
    }, [isInView, once])

    const shouldRender = once ? hasBeenVisible : isInView

    return (
        <div ref={ref}>
            {shouldRender ? children : placeholder}
        </div>
    )
}

/**
 * Image preloader for critical images
 */
export function preloadImages(urls: string[]): void {
    if (typeof window === 'undefined') return

    urls.forEach(url => {
        const img = new Image()
        img.src = url
    })
}

/**
 * Link prefetch on hover for faster navigation
 */
export function usePrefetchOnHover(href: string): {
    onMouseEnter: () => void
    onFocus: () => void
} {
    const prefetched = useRef(false)

    const prefetch = useCallback(() => {
        if (prefetched.current || typeof window === 'undefined') return

        // Use Next.js prefetch API
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = href
        link.as = 'document'
        document.head.appendChild(link)

        prefetched.current = true
    }, [href])

    return {
        onMouseEnter: prefetch,
        onFocus: prefetch,
    }
}
