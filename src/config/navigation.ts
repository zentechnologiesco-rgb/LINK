import {
    Home,
    Search,
    MessageSquare,
    Heart,
    FileCheck,
    Wallet,
    Building2,
    LayoutDashboard,
    Users,
    Shield,
    ClipboardList,
    FileText
} from 'lucide-react'

export interface NavItem {
    label: string
    href: string
    icon: React.ElementType
    badge?: number
    tag?: string
}

export const publicNavItems: NavItem[] = [
    { label: 'Home', href: '/', icon: Home },
]

export const authenticatedNavItems: NavItem[] = [
    { label: 'Messages', href: '/chat', icon: MessageSquare },
]

export const tenantNavItems: NavItem[] = [
    { label: 'My Favorites', href: '/tenant/saved', icon: Heart },
    { label: 'My Leases', href: '/tenant/leases', icon: FileCheck },
]

export const landlordNavItems: NavItem[] = [
    { label: 'My Properties', href: '/landlord/properties', icon: Building2 },
    { label: 'Leases', href: '/landlord/leases', icon: FileCheck },
]

export const adminNavItems: NavItem[] = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'All Properties', href: '/admin/properties', icon: Building2 },
    { label: 'Property Requests', href: '/admin/property-requests', icon: Shield },
    { label: 'Landlord Requests', href: '/admin/landlord-requests', icon: ClipboardList },
    { label: 'System Reports', href: '/admin/reports', icon: FileText },
]
