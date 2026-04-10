import type { NavigationItem } from '@/config/navigation'

export type MobileNavTransitionDirection = 'forward' | 'backward'

interface PendingMobileNavTransition {
    createdAt: number
    direction: MobileNavTransitionDirection
    sourcePath: string
    targetPath: string
}

const MOBILE_NAV_TRANSITION_KEY = 'link.mobile-nav-transition'
const MOBILE_NAV_TRANSITION_TTL_MS = 3000

function normalizePathname(pathname: string) {
    if (pathname === '/') {
        return pathname
    }

    return pathname.replace(/\/+$/, '')
}

function pathsMatch(pathname: string, href: string) {
    const normalizedPathname = normalizePathname(pathname)
    const normalizedHref = normalizePathname(href)

    if (normalizedHref === '/') {
        return normalizedPathname === normalizedHref
    }

    return (
        normalizedPathname === normalizedHref ||
        normalizedPathname.startsWith(`${normalizedHref}/`)
    )
}

function isMotionEnabled() {
    if (typeof window === 'undefined') {
        return false
    }

    return (
        window.matchMedia('(max-width: 767px)').matches &&
        window.matchMedia('(prefers-reduced-motion: no-preference)').matches
    )
}

function readPendingTransition() {
    if (typeof window === 'undefined') {
        return null
    }

    const rawValue = window.sessionStorage.getItem(MOBILE_NAV_TRANSITION_KEY)

    if (!rawValue) {
        return null
    }

    try {
        return JSON.parse(rawValue) as PendingMobileNavTransition
    } catch {
        window.sessionStorage.removeItem(MOBILE_NAV_TRANSITION_KEY)
        return null
    }
}

function clearPendingTransition() {
    if (typeof window === 'undefined') {
        return
    }

    window.sessionStorage.removeItem(MOBILE_NAV_TRANSITION_KEY)
}

export function getMobileNavTransitionDirection(
    items: NavigationItem[],
    pathname: string,
    targetPath: string,
) {
    const currentIndex = items.findIndex((item) => pathsMatch(pathname, item.href))
    const targetIndex = items.findIndex((item) => normalizePathname(item.href) === normalizePathname(targetPath))

    if (currentIndex === -1 || targetIndex === -1 || currentIndex === targetIndex) {
        return null
    }

    return targetIndex > currentIndex ? 'forward' : 'backward'
}

export function persistMobileNavTransition(
    items: NavigationItem[],
    pathname: string,
    targetPath: string,
) {
    if (!isMotionEnabled()) {
        clearPendingTransition()
        return null
    }

    const direction = getMobileNavTransitionDirection(items, pathname, targetPath)

    if (!direction) {
        clearPendingTransition()
        return null
    }

    const nextTransition: PendingMobileNavTransition = {
        createdAt: Date.now(),
        direction,
        sourcePath: normalizePathname(pathname),
        targetPath: normalizePathname(targetPath),
    }

    window.sessionStorage.setItem(MOBILE_NAV_TRANSITION_KEY, JSON.stringify(nextTransition))

    return nextTransition
}

export function consumeMobileNavTransition(pathname: string) {
    const pendingTransition = readPendingTransition()

    if (!pendingTransition) {
        return null
    }

    clearPendingTransition()

    if (!isMotionEnabled()) {
        return null
    }

    const isFresh = Date.now() - pendingTransition.createdAt <= MOBILE_NAV_TRANSITION_TTL_MS

    if (!isFresh) {
        return null
    }

    if (normalizePathname(pathname) !== pendingTransition.targetPath) {
        return null
    }

    return pendingTransition
}
