"use client"

import React, { memo, ComponentType, useMemo } from "react"

/**
 * Higher-order component that memoizes a component
 * Prevents re-renders when props haven't changed
 */
export function withMemo<P extends object>(
    Component: ComponentType<P>,
    displayName?: string
): React.MemoExoticComponent<ComponentType<P>> {
    const MemoizedComponent = memo(Component)
    MemoizedComponent.displayName = displayName || `Memo(${Component.displayName || Component.name || 'Component'})`
    return MemoizedComponent
}

/**
 * Custom comparison function for memo
 * Use when you need deep comparison of specific props
 */
export function shallowEqual<T extends Record<string, any>>(
    prevProps: T,
    nextProps: T,
    keysToCompare?: (keyof T)[]
): boolean {
    const keys = keysToCompare || (Object.keys(prevProps) as (keyof T)[])

    for (const key of keys) {
        if (prevProps[key] !== nextProps[key]) {
            return false
        }
    }

    return true
}

/**
 * Deep comparison for nested objects (use sparingly - expensive)
 */
export function deepEqual(a: any, b: any): boolean {
    if (a === b) return true

    if (typeof a !== 'object' || typeof b !== 'object') return false
    if (a === null || b === null) return false

    const keysA = Object.keys(a)
    const keysB = Object.keys(b)

    if (keysA.length !== keysB.length) return false

    for (const key of keysA) {
        if (!keysB.includes(key)) return false
        if (!deepEqual(a[key], b[key])) return false
    }

    return true
}

/**
 * Hook to memoize expensive computations with proper dependency tracking
 */
export function useMemoizedValue<T>(
    factory: () => T,
    deps: React.DependencyList,
    debugLabel?: string
): T {
    if (process.env.NODE_ENV === 'development' && debugLabel) {
        // In development, log when value is recalculated
        const value = useMemo(() => {
            console.debug(`[Memo] Recalculating: ${debugLabel}`)
            return factory()
        }, deps)
        return value
    }

    return useMemo(factory, deps)
}

/**
 * Stable callback reference that doesn't change between renders
 * Alternative to useCallback with empty deps
 */
export function useStableCallback<T extends (...args: any[]) => any>(
    callback: T
): T {
    const callbackRef = React.useRef(callback)

    React.useEffect(() => {
        callbackRef.current = callback
    }, [callback])

    return React.useCallback(
        ((...args) => callbackRef.current(...args)) as T,
        []
    )
}

/**
 * Create a stable object reference
 * Useful for passing objects as props without causing re-renders
 */
export function useStableObject<T extends Record<string, any>>(obj: T): T {
    const ref = React.useRef(obj)

    // Update only if values actually changed
    const hasChanged = Object.keys(obj).some(
        key => obj[key] !== ref.current[key]
    )

    if (hasChanged) {
        ref.current = obj
    }

    return ref.current
}

/**
 * Previous value hook - useful for comparison
 */
export function usePrevious<T>(value: T): T | undefined {
    const ref = React.useRef<T | undefined>(undefined)

    React.useEffect(() => {
        ref.current = value
    }, [value])

    return ref.current
}

/**
 * Detect if value has changed
 */
export function useHasChanged<T>(value: T): boolean {
    const prevValue = usePrevious(value)
    return prevValue !== value
}
