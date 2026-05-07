'use client'

import { useEffect, useState, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

function ProgressBarContent() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [visible, setVisible] = useState(false)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        // When path or search params change, it means navigation completed
        setVisible(false)
        setProgress(0)
    }, [pathname, searchParams])

    useEffect(() => {
        const handleAnchorClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            const anchor = target.closest('a')

            if (
                anchor &&
                anchor.href &&
                anchor.target !== '_blank' &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.shiftKey &&
                !event.altKey &&
                anchor.origin === window.location.origin &&
                anchor.pathname !== pathname
            ) {
                // Start progress
                setVisible(true)
                setProgress(10)
                
                // Simulate progressive loading
                const interval = setInterval(() => {
                    setProgress((prev) => {
                        if (prev >= 90) {
                            clearInterval(interval)
                            return 90
                        }
                        return prev + (90 - prev) * 0.1
                    })
                }, 100)
            }
        }

        document.addEventListener('click', handleAnchorClick)
        return () => document.removeEventListener('click', handleAnchorClick)
    }, [pathname])

    if (!visible) return null

    return (
        <div 
            className="fixed top-0 left-0 right-0 z-[9999] h-1 w-full bg-transparent"
            aria-hidden="true"
        >
            <div 
                className="h-full bg-neutral-900 transition-all duration-300 ease-out"
                style={{ 
                    width: `${progress}%`,
                    boxShadow: '0 0 10px rgba(0,0,0,0.2)'
                }}
            />
        </div>
    )
}

export function LoadingProgressBar() {
    return (
        <Suspense fallback={null}>
            <ProgressBarContent />
        </Suspense>
    )
}
