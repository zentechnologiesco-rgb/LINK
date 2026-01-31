"use client"

import { useState, useCallback, useRef, useEffect } from "react"

/**
 * Debounce hook for search inputs
 * Delays execution until user stops typing
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => clearTimeout(timer)
    }, [value, delay])

    return debouncedValue
}

/**
 * Debounced callback hook
 * Useful for search handlers that trigger API calls
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number = 300
): T {
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
    const callbackRef = useRef(callback)

    // Keep callback ref updated
    useEffect(() => {
        callbackRef.current = callback
    }, [callback])

    const debouncedCallback = useCallback(
        (...args: Parameters<T>) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }

            timeoutRef.current = setTimeout(() => {
                callbackRef.current(...args)
            }, delay)
        },
        [delay]
    ) as T

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return debouncedCallback
}

/**
 * Throttle hook - limits execution rate
 * Useful for scroll handlers and resize events
 */
export function useThrottle<T>(value: T, interval: number = 100): T {
    const [throttledValue, setThrottledValue] = useState<T>(value)
    const lastExecuted = useRef<number>(Date.now())

    useEffect(() => {
        const now = Date.now()
        const timeSinceLastExecution = now - lastExecuted.current

        if (timeSinceLastExecution >= interval) {
            lastExecuted.current = now
            setThrottledValue(value)
        } else {
            const timer = setTimeout(() => {
                lastExecuted.current = Date.now()
                setThrottledValue(value)
            }, interval - timeSinceLastExecution)

            return () => clearTimeout(timer)
        }
    }, [value, interval])

    return throttledValue
}

/**
 * Throttled callback hook
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
    callback: T,
    interval: number = 100
): T {
    const lastExecuted = useRef<number>(0)
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
    const callbackRef = useRef(callback)

    useEffect(() => {
        callbackRef.current = callback
    }, [callback])

    const throttledCallback = useCallback(
        (...args: Parameters<T>) => {
            const now = Date.now()
            const timeSinceLastExecution = now - lastExecuted.current

            if (timeSinceLastExecution >= interval) {
                lastExecuted.current = now
                callbackRef.current(...args)
            } else {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current)
                }

                timeoutRef.current = setTimeout(() => {
                    lastExecuted.current = Date.now()
                    callbackRef.current(...args)
                }, interval - timeSinceLastExecution)
            }
        },
        [interval]
    ) as T

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return throttledCallback
}

/**
 * Request Animation Frame throttle for smooth animations
 */
export function useRAFThrottle<T extends (...args: any[]) => any>(
    callback: T
): T {
    const rafRef = useRef<number | undefined>(undefined)
    const callbackRef = useRef(callback)

    useEffect(() => {
        callbackRef.current = callback
    }, [callback])

    const throttledCallback = useCallback(
        (...args: Parameters<T>) => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
            }

            rafRef.current = requestAnimationFrame(() => {
                callbackRef.current(...args)
            })
        },
        []
    ) as T

    useEffect(() => {
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
            }
        }
    }, [])

    return throttledCallback
}
