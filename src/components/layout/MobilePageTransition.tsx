'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

import { consumeMobileNavTransition } from '@/components/layout/mobile-nav-transition'

interface MobilePageTransitionProps {
    children: React.ReactNode
}

const MOBILE_PAGE_TRANSITION_CLASSES = [
    'mobile-page-transition-forward',
    'mobile-page-transition-backward',
] as const

export function MobilePageTransition({ children }: MobilePageTransitionProps) {
    const pathname = usePathname()
    const contentRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const nextTransition = consumeMobileNavTransition(pathname)
        const contentNode = contentRef.current

        if (!nextTransition || !contentNode) {
            return
        }

        const animationClassName = nextTransition.direction === 'forward'
            ? 'mobile-page-transition-forward'
            : 'mobile-page-transition-backward'

        contentNode.classList.remove(...MOBILE_PAGE_TRANSITION_CLASSES)

        const animationFrame = window.requestAnimationFrame(() => {
            void contentNode.offsetWidth
            contentNode.classList.add(animationClassName)
        })

        const cleanupTimeout = window.setTimeout(() => {
            contentNode.classList.remove(animationClassName)
        }, 480)

        return () => {
            window.cancelAnimationFrame(animationFrame)
            window.clearTimeout(cleanupTimeout)
            contentNode.classList.remove(...MOBILE_PAGE_TRANSITION_CLASSES)
        }
    }, [pathname])

    return (
        <div className="mobile-page-transition-viewport">
            <div
                ref={contentRef}
                className="md:animate-in md:fade-in md:slide-in-from-bottom-4 md:duration-500"
            >
                {children}
            </div>
        </div>
    )
}
