'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Loader2, ArrowDown } from 'lucide-react'

interface PullToRefreshProps {
    onRefresh: () => Promise<void> | void
    children: React.ReactNode
    className?: string
    disabled?: boolean
    /** Threshold in pixels to trigger refresh - default 80 */
    threshold?: number
}

type RefreshState = 'idle' | 'pulling' | 'ready' | 'refreshing'

export function PullToRefresh({
    onRefresh,
    children,
    className,
    disabled = false,
    threshold = 80,
}: PullToRefreshProps) {
    const [state, setState] = useState<RefreshState>('idle')
    const [pullDistance, setPullDistance] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const startYRef = useRef(0)
    const currentYRef = useRef(0)

    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (disabled || state === 'refreshing') return

        // Only enable pull-to-refresh when window is scrolled to top
        if (window.scrollY > 0) return

        startYRef.current = e.touches[0].clientY
        currentYRef.current = e.touches[0].clientY
    }, [disabled, state])

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (disabled || state === 'refreshing') return
        if (startYRef.current === 0) return

        // Only enable pull-to-refresh when window is scrolled to top
        if (window.scrollY > 0) {
            startYRef.current = 0
            setPullDistance(0)
            setState('idle')
            return
        }

        currentYRef.current = e.touches[0].clientY
        const distance = Math.max(0, currentYRef.current - startYRef.current)

        // Apply resistance - the further you pull, the harder it gets
        const resistedDistance = Math.min(distance * 0.5, threshold * 1.5)

        if (resistedDistance > 0) {
            e.preventDefault()
            setPullDistance(resistedDistance)
            setState(resistedDistance >= threshold ? 'ready' : 'pulling')
        }
    }, [disabled, state, threshold])

    const handleTouchEnd = useCallback(async () => {
        if (disabled) return

        if (state === 'ready') {
            setState('refreshing')
            setPullDistance(threshold * 0.6)

            try {
                await onRefresh()
            } catch (error) {
                console.error('Refresh failed:', error)
            }

            // Add a small delay for visual feedback
            await new Promise(resolve => setTimeout(resolve, 300))
        }

        startYRef.current = 0
        setPullDistance(0)
        setState('idle')
    }, [disabled, state, threshold, onRefresh])

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        container.addEventListener('touchstart', handleTouchStart, { passive: true })
        container.addEventListener('touchmove', handleTouchMove, { passive: false })
        container.addEventListener('touchend', handleTouchEnd, { passive: true })

        return () => {
            container.removeEventListener('touchstart', handleTouchStart)
            container.removeEventListener('touchmove', handleTouchMove)
            container.removeEventListener('touchend', handleTouchEnd)
        }
    }, [handleTouchStart, handleTouchMove, handleTouchEnd])

    const indicatorOpacity = Math.min(pullDistance / threshold, 1)
    const indicatorScale = 0.5 + (indicatorOpacity * 0.5)
    const rotation = state === 'ready' ? 180 : (pullDistance / threshold) * 180

    return (
        <div
            ref={containerRef}
            className={cn("relative", className)}
        >
            {/* Pull indicator */}
            <div
                className="absolute left-0 right-0 flex justify-center pointer-events-none z-10 transition-transform duration-200"
                style={{
                    transform: `translateY(${pullDistance - 40}px)`,
                    opacity: indicatorOpacity,
                }}
            >
                <div
                    className={cn(
                        "h-10 w-10 rounded-full bg-white shadow-lg border border-neutral-100 flex items-center justify-center transition-all duration-200",
                    )}
                    style={{ transform: `scale(${indicatorScale})` }}
                >
                    {state === 'refreshing' ? (
                        <Loader2 className="h-5 w-5 text-neutral-600 animate-spin" />
                    ) : (
                        <ArrowDown
                            className={cn(
                                "h-5 w-5 text-neutral-600 transition-transform duration-200",
                            )}
                            style={{ transform: `rotate(${rotation}deg)` }}
                        />
                    )}
                </div>
            </div>

            {/* Content with transform for pull effect */}
            <div
                className="transition-transform duration-200"
                style={{
                    transform: state !== 'idle' ? `translateY(${pullDistance * 0.3}px)` : undefined,
                }}
            >
                {children}
            </div>
        </div>
    )
}
