"use client"

import { useState, useCallback, useRef, useEffect } from "react"

// Cache for loaded images to prevent re-downloads
const imageCache = new Map<string, HTMLImageElement>()

/**
 * Preload an image and cache it
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
    // Return cached image if available
    if (imageCache.has(src)) {
        return Promise.resolve(imageCache.get(src)!)
    }

    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            imageCache.set(src, img)
            resolve(img)
        }
        img.onerror = reject
        img.src = src
    })
}

/**
 * Preload multiple images
 */
export function preloadImages(sources: string[]): Promise<HTMLImageElement[]> {
    return Promise.all(sources.map(preloadImage))
}

/**
 * Hook for preloading images with status tracking
 */
export function useImagePreloader(sources: string[]) {
    const [loaded, setLoaded] = useState<Set<string>>(new Set())
    const [failed, setFailed] = useState<Set<string>>(new Set())

    useEffect(() => {
        sources.forEach(src => {
            if (imageCache.has(src)) {
                setLoaded(prev => new Set(prev).add(src))
                return
            }

            const img = new Image()
            img.onload = () => {
                imageCache.set(src, img)
                setLoaded(prev => new Set(prev).add(src))
            }
            img.onerror = () => {
                setFailed(prev => new Set(prev).add(src))
            }
            img.src = src
        })
    }, [sources])

    return {
        allLoaded: loaded.size === sources.length,
        loadedCount: loaded.size,
        failedCount: failed.size,
        isLoaded: (src: string) => loaded.has(src) || imageCache.has(src),
        isFailed: (src: string) => failed.has(src),
    }
}

/**
 * Generate a simple blur placeholder (neutral gray gradient)
 */
export function generatePlaceholder(width: number = 10, height: number = 10): string {
    if (typeof document === 'undefined') return ''

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    if (!ctx) return ''

    // Create a subtle gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#f5f5f5')
    gradient.addColorStop(0.5, '#ebebeb')
    gradient.addColorStop(1, '#e0e0e0')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    return canvas.toDataURL('image/png')
}

/**
 * Property-specific color placeholder based on property type
 */
export function getPropertyPlaceholder(propertyType?: string): string {
    const colors: Record<string, string> = {
        apartment: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)',
        house: 'linear-gradient(135deg, #fef3e2 0%, #fce4c4 100%)',
        townhouse: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
        studio: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
        default: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
    }

    return colors[propertyType?.toLowerCase() || 'default'] || colors.default
}

/**
 * Intersection Observer based image loading
 */
export function useLazyImage(src: string, options?: IntersectionObserverInit) {
    const [isLoaded, setIsLoaded] = useState(false)
    const [isInView, setIsInView] = useState(false)
    const [error, setError] = useState(false)
    const imgRef = useRef<HTMLImageElement>(null)

    useEffect(() => {
        if (!imgRef.current) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true)
                    observer.disconnect()
                }
            },
            { rootMargin: '100px', ...options }
        )

        observer.observe(imgRef.current)
        return () => observer.disconnect()
    }, [options])

    useEffect(() => {
        if (!isInView || !src) return

        // Check cache first
        if (imageCache.has(src)) {
            setIsLoaded(true)
            return
        }

        const img = new Image()
        img.onload = () => {
            imageCache.set(src, img)
            setIsLoaded(true)
        }
        img.onerror = () => setError(true)
        img.src = src
    }, [isInView, src])

    return { imgRef, isLoaded, isInView, error }
}

/**
 * Get the size of an image from cache or load it
 */
export async function getImageSize(src: string): Promise<{ width: number; height: number } | null> {
    try {
        const img = await preloadImage(src)
        return { width: img.naturalWidth, height: img.naturalHeight }
    } catch {
        return null
    }
}

/**
 * Clear the image cache (useful for development)
 */
export function clearImageCache(): void {
    imageCache.clear()
}

/**
 * Get cache statistics
 */
export function getImageCacheStats(): { size: number; images: string[] } {
    return {
        size: imageCache.size,
        images: Array.from(imageCache.keys()),
    }
}
