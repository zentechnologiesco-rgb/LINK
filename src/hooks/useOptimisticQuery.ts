"use client"

import { useQuery } from "convex/react"
import { FunctionReference, FunctionReturnType, OptionalRestArgs } from "convex/server"
import { useEffect, useMemo, useRef, useState, useCallback } from "react"

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

    return useQuery(query, debouncedArgs as OptionalRestArgs<Query>[0])
}

/**
 * Local storage backed cache for initial render speedup
 */
const CACHE_PREFIX = 'link_cache_'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const memoryCache = new Map<string, CacheEntry<unknown>>()

interface CacheEntry<T> {
    data: T
    timestamp: number
    key: string
}

type CacheStorage = "local" | "session" | "none"

function getCacheKey(queryName: string, args: unknown, cacheKeySuffix?: string): string {
    return `${CACHE_PREFIX}${queryName}_${cacheKeySuffix ?? "default"}_${JSON.stringify(args)}`
}

function isEntryExpired(entry: CacheEntry<unknown>) {
    return Date.now() - entry.timestamp > CACHE_TTL
}

function getStorage(storage: CacheStorage) {
    if (typeof window === 'undefined' || storage === 'none') return null
    return storage === 'session' ? window.sessionStorage : window.localStorage
}

function getFromMemoryCache<T>(key: string): T | null {
    const cachedEntry = memoryCache.get(key)
    if (!cachedEntry) return null

    if (isEntryExpired(cachedEntry)) {
        memoryCache.delete(key)
        return null
    }

    return cachedEntry.data as T
}

function getFromStorageCache<T>(key: string, storage: CacheStorage): T | null {
    const storageArea = getStorage(storage)
    if (!storageArea) return null

    try {
        const cached = storageArea.getItem(key)
        if (!cached) return null

        const entry: CacheEntry<T> = JSON.parse(cached)
        if (isEntryExpired(entry)) {
            storageArea.removeItem(key)
            return null
        }

        return entry.data
    } catch {
        return null
    }
}

function setCache<T>(key: string, data: T, storage: CacheStorage): void {
    const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        key,
    }

    memoryCache.set(key, entry)

    const storageArea = getStorage(storage)
    if (!storageArea) return

    try {
        storageArea.setItem(key, JSON.stringify(entry))
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
    options: {
        queryName: string
        cacheKeySuffix?: string
        storage?: CacheStorage
    },
    ...args: OptionalRestArgs<Query>
): {
    data: FunctionReturnType<Query> | undefined
    isLoading: boolean
    isCached: boolean
    isRefetching: boolean
} {
    const { queryName, cacheKeySuffix, storage = "local" } = options
    const cacheKey = useMemo(
        () => getCacheKey(queryName, args, cacheKeySuffix),
        [args, cacheKeySuffix, queryName]
    )
    const [cachedData, setCachedData] = useState<FunctionReturnType<Query> | undefined>(
        () => getFromMemoryCache<FunctionReturnType<Query>>(cacheKey) ?? undefined
    )
    const previousDataRef = useRef<FunctionReturnType<Query> | undefined>(cachedData)

    const result = useQuery(query, ...args)

    useEffect(() => {
        const memoryData = getFromMemoryCache<FunctionReturnType<Query>>(cacheKey)
        if (memoryData !== null) {
            setCachedData(memoryData)
            previousDataRef.current = memoryData
            return
        }

        const storageData = getFromStorageCache<FunctionReturnType<Query>>(cacheKey, storage)
        if (storageData !== null) {
            setCachedData(storageData)
            previousDataRef.current = storageData
            memoryCache.set(cacheKey, {
                data: storageData,
                timestamp: Date.now(),
                key: cacheKey,
            })
            return
        }

        setCachedData(undefined)
    }, [cacheKey, storage])

    useEffect(() => {
        if (result !== undefined) {
            previousDataRef.current = result
            setCachedData(result)
            setCache(cacheKey, result, storage)
        }
    }, [result, cacheKey, storage])

    const fallbackData = cachedData ?? previousDataRef.current
    const hasFallbackData = fallbackData !== undefined

    return {
        data: result ?? fallbackData,
        isLoading: result === undefined && !hasFallbackData,
        isCached: result === undefined && hasFallbackData,
        isRefetching: result === undefined && hasFallbackData,
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
    const effectiveArgs = shouldPrefetch
        ? args
        : (["skip"] as unknown as OptionalRestArgs<Query>)

    return useQuery(query, ...effectiveArgs)
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
