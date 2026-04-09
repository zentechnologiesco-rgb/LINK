import {
    Building2,
    ClipboardList,
    Clapperboard,
    FileText,
    Heart,
    Home,
    LayoutDashboard,
    MessageSquare,
    Shield,
    User,
    Users,
    Wallet,
    type LucideIcon,
} from 'lucide-react'

import { DISCOVER_EXPERIENCE_ENABLED } from '@/config/features'
import type { UserRole } from '@/lib/user-preferences'

export type NavigationBadgeType = 'messages' | 'leases'
export type NavigationSurface = 'headerMenu' | 'mobileNav' | 'settingsQuickLinks'

export interface NavigationItem {
    id: string
    label: string
    href: string
    icon: LucideIcon
    badgeType?: NavigationBadgeType
    surfaces: NavigationSurface[]
    settingsMeta?: string
}

export const discoverNavItem: NavigationItem = {
    id: 'discover',
    label: 'Discover',
    href: '/discover',
    icon: Clapperboard,
    surfaces: ['headerMenu', 'mobileNav'],
}

export const settingsNavItem: NavigationItem = {
    id: 'settings',
    label: 'Profile',
    href: '/settings',
    icon: User,
    surfaces: ['mobileNav'],
}

const tenantNavigationItems: NavigationItem[] = [
    ...(DISCOVER_EXPERIENCE_ENABLED ? [discoverNavItem] : []),
    {
        id: 'saved',
        label: 'Saved',
        href: '/tenant/saved',
        icon: Heart,
        surfaces: ['headerMenu', 'mobileNav', 'settingsQuickLinks'],
        settingsMeta: 'Your bookmarks',
    },
    {
        id: 'tenant-leases',
        label: 'Leases',
        href: '/tenant/leases',
        icon: FileText,
        badgeType: 'leases',
        surfaces: ['headerMenu', 'mobileNav', 'settingsQuickLinks'],
        settingsMeta: 'Agreements',
    },
    {
        id: 'tenant-payments',
        label: 'Payments',
        href: '/tenant/payments',
        icon: Wallet,
        surfaces: ['headerMenu', 'mobileNav', 'settingsQuickLinks'],
        settingsMeta: 'Payment tracking',
    },
    {
        id: 'messages',
        label: 'Messages',
        href: '/chat',
        icon: MessageSquare,
        badgeType: 'messages',
        surfaces: ['headerMenu', 'mobileNav'],
    },
    settingsNavItem,
]

const landlordNavigationItems: NavigationItem[] = [
    ...(DISCOVER_EXPERIENCE_ENABLED ? [discoverNavItem] : []),
    {
        id: 'landlord-feed',
        label: 'Feed',
        href: '/',
        icon: Home,
        surfaces: ['mobileNav'],
    },
    {
        id: 'properties',
        label: 'Properties',
        href: '/landlord/properties',
        icon: Building2,
        surfaces: ['headerMenu', 'mobileNav', 'settingsQuickLinks'],
        settingsMeta: 'Listings',
    },
    {
        id: 'landlord-leases',
        label: 'Leases',
        href: '/landlord/leases',
        icon: FileText,
        badgeType: 'leases',
        surfaces: ['headerMenu', 'mobileNav', 'settingsQuickLinks'],
        settingsMeta: 'Agreements',
    },
    {
        id: 'landlord-payments',
        label: 'Payments',
        href: '/landlord/payments',
        icon: Wallet,
        surfaces: ['headerMenu', 'mobileNav', 'settingsQuickLinks'],
        settingsMeta: 'Collections',
    },
    {
        id: 'messages',
        label: 'Messages',
        href: '/chat',
        icon: MessageSquare,
        badgeType: 'messages',
        surfaces: ['headerMenu', 'mobileNav'],
    },
]

const adminNavigationItems: NavigationItem[] = [
    {
        id: 'home',
        label: 'Home',
        href: '/',
        icon: Home,
        surfaces: ['mobileNav'],
    },
    {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
        surfaces: ['headerMenu', 'mobileNav', 'settingsQuickLinks'],
        settingsMeta: 'Overview',
    },
    {
        id: 'users',
        label: 'Users',
        href: '/admin/users',
        icon: Users,
        surfaces: ['headerMenu', 'settingsQuickLinks'],
        settingsMeta: 'Accounts',
    },
    {
        id: 'property-requests',
        label: 'Property Requests',
        href: '/admin/property-requests',
        icon: Shield,
        surfaces: ['headerMenu', 'settingsQuickLinks'],
        settingsMeta: 'Reviews',
    },
    {
        id: 'landlord-requests',
        label: 'Landlord Requests',
        href: '/admin/landlord-requests',
        icon: ClipboardList,
        surfaces: ['headerMenu', 'settingsQuickLinks'],
        settingsMeta: 'Verifications',
    },
    {
        id: 'messages',
        label: 'Messages',
        href: '/chat',
        icon: MessageSquare,
        badgeType: 'messages',
        surfaces: ['headerMenu', 'mobileNav'],
    },
    settingsNavItem,
]

const roleNavigationItems = {
    tenant: tenantNavigationItems,
    landlord: landlordNavigationItems,
    admin: adminNavigationItems,
} satisfies Record<UserRole, NavigationItem[]>

export function canAccessDiscover(role?: UserRole | null) {
    return DISCOVER_EXPERIENCE_ENABLED && role !== 'admin'
}

export function getNavigationItems(role: UserRole) {
    return roleNavigationItems[role]
}

export function getNavigationItemsForSurface(role: UserRole, surface: NavigationSurface) {
    return getNavigationItems(role).filter((item) => item.surfaces.includes(surface))
}
