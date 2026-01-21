/**
 * Utility hooks for the LINK application
 */

import { useState, useEffect } from 'react'

/**
 * Hook that debounces a value
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 500ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(timer)
        }
    }, [value, delay])

    return debouncedValue
}

/**
 * Hook that provides a debounced callback
 * @param callback - The callback to debounce
 * @param delay - The delay in milliseconds
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
    callback: T,
    delay: number = 500
): T {
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

    const debouncedCallback = ((...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId)
        }

        const newTimeoutId = setTimeout(() => {
            callback(...args)
        }, delay)

        setTimeoutId(newTimeoutId)
    }) as T

    useEffect(() => {
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId)
            }
        }
    }, [timeoutId])

    return debouncedCallback
}
