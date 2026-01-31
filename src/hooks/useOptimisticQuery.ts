"use client"

import { useQuery } from "convex/react"
import { FunctionReference, FunctionReturnType, OptionalRestArgs } from "convex/server"
import { useEffect, useRef, useState, useCallback } from "react"

/**
 * Enhanced useQuery hook with caching, stale-while-revalidate, and optimistic updates
 */
export function useOptimisticQuery<Query extends FunctionReference<"query">>(
    query: Query,
    ...args: OptionalRestArgs<Query>
): {
    data: FunctionReturnType<Query> | undefined
    isLoading: boolean
    isRefetching: boolean
    isStale: boolean
} {
    const result = useQuery(query, ...args)
    const previousDataRef = useRef<FunctionReturnType<Query> | undefined>(undefined)
    const [isStale, setIsStale] = useState(false)

    useEffect(() => {
        if (result !== undefined) {
            previousDataRef.current = result
            setIsStale(false)
        }
    }, [result])

    // Mark as stale after a period of no updates (for real-time data)
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (previousDataRef.current !== undefined) {
                setIsStale(true)
            }
        }, 5 * 60 * 1000) // 5 minutes

        return () => clearTimeout(timeout)
    }, [result])

    return {
        data: result ?? previousDataRef.current,
        isLoading: result === undefined && previousDataRef.current === undefined,
        isRefetching: result === undefined && previousDataRef.current !== undefined,
        isStale,
    }
}

/**
 * Debounced query hook for search/filter operations
 */
export function useDebouncedQuery<Query extends FunctionReference<"query">>(
    query: Query,
    args: OptionalRestArgs<Query>[0],
    delay: number = 300
): FunctionReturnType<Query> | undefined {
    const [debouncedArgs, setDebouncedArgs] = useState(args)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedArgs(args)
        }, delay)

        return () => clearTimeout(handler)
    }, [args, delay])

    return useQuery(query, debouncedArgs as any)
}

/**
 * Local storage backed cache for initial render speedup
 */
const CACHE_PREFIX = 'link_cache_'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface CacheEntry<T> {
    data: T
    timestamp: number
    key: string
}

function getCacheKey(queryName: string, args: any): string {
    return `${CACHE_PREFIX}${queryName}_${JSON.stringify(args)}`
}

function getFromCache<T>(key: string): T | null {
    if (typeof window === 'undefined') return null

    try {
        const cached = localStorage.getItem(key)
        if (!cached) return null

        const entry: CacheEntry<T> = JSON.parse(cached)
        const isExpired = Date.now() - entry.timestamp > CACHE_TTL

        if (isExpired) {
            localStorage.removeItem(key)
            return null
        }

        return entry.data
    } catch {
        return null
    }
}

function setCache<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return

    try {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            key,
        }
        localStorage.setItem(key, JSON.stringify(entry))
    } catch (e) {
        // Storage full or other error - silently fail
        console.warn('Cache storage failed:', e)
    }
}

/**
 * Query hook with local storage caching for instant initial renders
 */
export function useCachedQuery<Query extends FunctionReference<"query">>(
    query: Query,
    queryName: string,
    ...args: OptionalRestArgs<Query>
): {
    data: FunctionReturnType<Query> | undefined
    isLoading: boolean
    isCached: boolean
} {
    const cacheKey = getCacheKey(queryName, args)
    const [cachedData] = useState<FunctionReturnType<Query> | undefined>(
        () => getFromCache<FunctionReturnType<Query>>(cacheKey) ?? undefined
    )

    const result = useQuery(query, ...args)

    useEffect(() => {
        if (result !== undefined) {
            setCache(cacheKey, result)
        }
    }, [result, cacheKey])

    return {
        data: result ?? cachedData,
        isLoading: result === undefined && cachedData === undefined,
        isCached: result === undefined && cachedData !== undefined,
    }
}

/**
 * Prefetch hook for predictive loading
 */
export function usePrefetch<Query extends FunctionReference<"query">>(
    query: Query,
    shouldPrefetch: boolean,
    ...args: OptionalRestArgs<Query>
) {
    // Only run the query when shouldPrefetch is true
    const skip = !shouldPrefetch
    return useQuery(query, skip ? "skip" : (args[0] as any))
}

/**
 * Intersection Observer hook for viewport-based loading
 */
export function useInView(
    options: IntersectionObserverInit = {}
): [React.RefCallback<Element>, boolean] {
    const [isInView, setIsInView] = useState(false)
    const [node, setNode] = useState<Element | null>(null)

    const ref = useCallback((node: Element | null) => {
        setNode(node)
    }, [])

    useEffect(() => {
        if (!node) return

        const observer = new IntersectionObserver(([entry]) => {
            setIsInView(entry.isIntersecting)
        }, {
            threshold: 0,
            rootMargin: '100px', // Start loading 100px before entering viewport
            ...options,
        })

        observer.observe(node)

        return () => observer.disconnect()
    }, [node, options])

    return [ref, isInView]
}
