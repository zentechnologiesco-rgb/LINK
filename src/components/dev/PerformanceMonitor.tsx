"use client"

import { useEffect, useState, useRef } from "react"

interface PerformanceMetrics {
    // Core Web Vitals
    LCP?: number // Largest Contentful Paint
    FID?: number // First Input Delay  
    CLS?: number // Cumulative Layout Shift
    FCP?: number // First Contentful Paint
    TTFB?: number // Time to First Byte

    // Custom metrics
    renderCount: number
    lastRenderTime?: number
    memoryUsage?: number
}

/**
 * Development-only performance monitor
 * Shows Core Web Vitals and render metrics
 */
export function PerformanceMonitor() {
    const [metrics, setMetrics] = useState<PerformanceMetrics>({ renderCount: 0 })
    const [isVisible, setIsVisible] = useState(false)
    const renderCount = useRef(0)
    const lastRenderTime = useRef(Date.now())

    useEffect(() => {
        // Only run in development
        if (process.env.NODE_ENV !== 'development') return

        renderCount.current++
        const now = Date.now()
        const timeSinceLastRender = now - lastRenderTime.current
        lastRenderTime.current = now

        // Web Vitals observation
        if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
            try {
                // Largest Contentful Paint
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries()
                    const lastEntry = entries[entries.length - 1] as any
                    setMetrics(m => ({ ...m, LCP: lastEntry.startTime }))
                })
                lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

                // First Contentful Paint
                const fcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries()
                    const fcp = entries.find(e => e.name === 'first-contentful-paint')
                    if (fcp) {
                        setMetrics(m => ({ ...m, FCP: fcp.startTime }))
                    }
                })
                fcpObserver.observe({ type: 'paint', buffered: true })

                // Layout Shift
                const clsObserver = new PerformanceObserver((list) => {
                    let clsValue = 0
                    for (const entry of list.getEntries() as any[]) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value
                        }
                    }
                    setMetrics(m => ({ ...m, CLS: clsValue }))
                })
                clsObserver.observe({ type: 'layout-shift', buffered: true })

                // First Input Delay
                const fidObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries() as any[]
                    if (entries.length > 0) {
                        setMetrics(m => ({ ...m, FID: entries[0].processingStart - entries[0].startTime }))
                    }
                })
                fidObserver.observe({ type: 'first-input', buffered: true })

                return () => {
                    lcpObserver.disconnect()
                    fcpObserver.disconnect()
                    clsObserver.disconnect()
                    fidObserver.disconnect()
                }
            } catch (e) {
                // PerformanceObserver not fully supported
            }
        }

        // Navigation timing
        if (typeof window !== 'undefined' && window.performance?.timing) {
            const timing = window.performance.timing
            setMetrics(m => ({
                ...m,
                TTFB: timing.responseStart - timing.requestStart,
            }))
        }

        // Memory usage (Chrome only)
        if (typeof window !== 'undefined' && (performance as any).memory) {
            setMetrics(m => ({
                ...m,
                memoryUsage: (performance as any).memory.usedJSHeapSize / 1048576, // MB
            }))
        }

        setMetrics(m => ({
            ...m,
            renderCount: renderCount.current,
            lastRenderTime: timeSinceLastRender,
        }))
    }, [])

    // Only show in development
    if (process.env.NODE_ENV !== 'development') return null

    const getMetricColor = (metric: string, value: number): string => {
        switch (metric) {
            case 'LCP':
                return value < 2500 ? 'text-green-500' : value < 4000 ? 'text-yellow-500' : 'text-red-500'
            case 'FID':
                return value < 100 ? 'text-green-500' : value < 300 ? 'text-yellow-500' : 'text-red-500'
            case 'CLS':
                return value < 0.1 ? 'text-green-500' : value < 0.25 ? 'text-yellow-500' : 'text-red-500'
            case 'FCP':
                return value < 1800 ? 'text-green-500' : value < 3000 ? 'text-yellow-500' : 'text-red-500'
            case 'TTFB':
                return value < 200 ? 'text-green-500' : value < 500 ? 'text-yellow-500' : 'text-red-500'
            default:
                return 'text-neutral-400'
        }
    }

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsVisible(!isVisible)}
                className="fixed bottom-4 right-4 z-[9999] p-2 bg-neutral-900 text-white rounded-full shadow-lg hover:bg-neutral-800 transition-colors"
                title="Performance Monitor"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            </button>

            {/* Metrics Panel */}
            {isVisible && (
                <div className="fixed bottom-16 right-4 z-[9999] p-4 bg-neutral-900/95 text-white rounded-xl shadow-2xl backdrop-blur text-xs font-mono w-64">
                    <h3 className="font-bold mb-3 text-sm flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Performance
                    </h3>

                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-neutral-800 p-2 rounded">
                                <div className="text-neutral-400 text-[10px] mb-1">LCP</div>
                                <div className={metrics.LCP ? getMetricColor('LCP', metrics.LCP) : 'text-neutral-500'}>
                                    {metrics.LCP ? `${metrics.LCP.toFixed(0)}ms` : '...'}
                                </div>
                            </div>
                            <div className="bg-neutral-800 p-2 rounded">
                                <div className="text-neutral-400 text-[10px] mb-1">FCP</div>
                                <div className={metrics.FCP ? getMetricColor('FCP', metrics.FCP) : 'text-neutral-500'}>
                                    {metrics.FCP ? `${metrics.FCP.toFixed(0)}ms` : '...'}
                                </div>
                            </div>
                            <div className="bg-neutral-800 p-2 rounded">
                                <div className="text-neutral-400 text-[10px] mb-1">CLS</div>
                                <div className={metrics.CLS !== undefined ? getMetricColor('CLS', metrics.CLS) : 'text-neutral-500'}>
                                    {metrics.CLS !== undefined ? metrics.CLS.toFixed(3) : '...'}
                                </div>
                            </div>
                            <div className="bg-neutral-800 p-2 rounded">
                                <div className="text-neutral-400 text-[10px] mb-1">TTFB</div>
                                <div className={metrics.TTFB ? getMetricColor('TTFB', metrics.TTFB) : 'text-neutral-500'}>
                                    {metrics.TTFB ? `${metrics.TTFB.toFixed(0)}ms` : '...'}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-neutral-700 pt-2 mt-2">
                            <div className="flex justify-between">
                                <span className="text-neutral-400">Renders</span>
                                <span>{metrics.renderCount}</span>
                            </div>
                            {metrics.memoryUsage && (
                                <div className="flex justify-between">
                                    <span className="text-neutral-400">Memory</span>
                                    <span>{metrics.memoryUsage.toFixed(1)} MB</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-neutral-700">
                        <div className="text-[10px] text-neutral-400">
                            🟢 Good | 🟡 Needs Work | 🔴 Poor
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

/**
 * HOC to track component render performance
 */
export function withRenderTracking<P extends object>(
    Component: React.ComponentType<P>,
    componentName: string
): React.ComponentType<P> {
    if (process.env.NODE_ENV !== 'development') {
        return Component
    }

    return function TrackedComponent(props: P) {
        const renderCount = useRef(0)
        const lastRenderTime = useRef(Date.now())

        useEffect(() => {
            renderCount.current++
            const now = Date.now()
            const delta = now - lastRenderTime.current
            lastRenderTime.current = now

            if (renderCount.current > 1 && delta < 16) {
                console.warn(
                    `[Performance] ${componentName} re-rendered ${renderCount.current} times in rapid succession (${delta}ms apart)`
                )
            }
        })

        return <Component {...props} />
    }
}
