'use client'

import Link from 'next/link'
import { useMemo, useState, type ReactNode } from 'react'

import {
    Bell,
    ChevronRight,
    CreditCard,
    FileText,
    MessageSquare,
    Volume2,
    type LucideIcon,
} from '@/components/ui/icons'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { useNotificationCounts } from '@/components/providers/NotificationCountsProvider'
import { useUser } from '@/components/providers/UserProvider'
import type { UserRole } from '@/lib/user-preferences'
import { cn } from '@/lib/utils'

type NotificationItem = {
    id: 'messages' | 'leases' | 'payments'
    label: string
    href: string
    description: string
    count: number
    icon: LucideIcon
}

function getNotificationBadgeClassName(type: NotificationItem['id']) {
    if (type === 'leases') return 'bg-amber-500'
    if (type === 'payments') return 'bg-emerald-500'
    return 'bg-neutral-900'
}

export function NotificationCenterSheet({
    userRole,
    children,
}: {
    userRole?: UserRole | null
    children: ReactNode
}) {
    const [open, setOpen] = useState(false)
    const { user } = useUser()
    const {
        unreadCount,
        leaseActionCount,
        paymentActionCount,
        totalNotifications,
    } = useNotificationCounts()

    const soundEnabledLabels = [
        user?.preferences?.notifications?.messages !== false ? 'messages' : null,
        user?.preferences?.notifications?.leases !== false ? 'leases' : null,
        user?.preferences?.notifications?.payments !== false ? 'payments' : null,
    ].filter(Boolean)

    const items = useMemo<NotificationItem[]>(() => {
        const baseItems: NotificationItem[] = [
            {
                id: 'messages',
                label: 'Messages',
                href: '/chat',
                description: unreadCount > 0
                    ? `${unreadCount} unread conversation update${unreadCount === 1 ? '' : 's'} waiting for you.`
                    : 'No unread conversation updates right now.',
                count: unreadCount,
                icon: MessageSquare,
            },
        ]

        if (userRole === 'tenant') {
            baseItems.push(
                {
                    id: 'leases',
                    label: 'Leases',
                    href: '/tenant/leases',
                    description: leaseActionCount > 0
                        ? `${leaseActionCount} lease step${leaseActionCount === 1 ? '' : 's'} still need your attention.`
                        : 'Your lease workflow is clear right now.',
                    count: leaseActionCount,
                    icon: FileText,
                },
                {
                    id: 'payments',
                    label: 'Payments',
                    href: '/tenant/payments',
                    description: paymentActionCount > 0
                        ? `${paymentActionCount} payment item${paymentActionCount === 1 ? '' : 's'} are due soon or overdue.`
                        : 'No payment reminders are waiting right now.',
                    count: paymentActionCount,
                    icon: CreditCard,
                },
            )
        }

        if (userRole === 'landlord') {
            baseItems.push(
                {
                    id: 'leases',
                    label: 'Leases',
                    href: '/landlord/leases',
                    description: leaseActionCount > 0
                        ? `${leaseActionCount} tenant-signed lease${leaseActionCount === 1 ? '' : 's'} are ready for review.`
                        : 'No lease approvals are waiting right now.',
                    count: leaseActionCount,
                    icon: FileText,
                },
                {
                    id: 'payments',
                    label: 'Payments',
                    href: '/landlord/payments',
                    description: paymentActionCount > 0
                        ? `${paymentActionCount} rent or fee item${paymentActionCount === 1 ? '' : 's'} need payment follow-up.`
                        : 'No due-soon or overdue collections need attention right now.',
                    count: paymentActionCount,
                    icon: CreditCard,
                },
            )
        }

        return baseItems.sort((left, right) => right.count - left.count)
    }, [leaseActionCount, paymentActionCount, unreadCount, userRole])

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {children}
            </SheetTrigger>
            <SheetContent
                side="bottom"
                className="h-[min(82vh,40rem)] rounded-t-[2rem] border-x-0 border-t border-neutral-200 bg-white p-0"
            >
                <div className="flex h-full flex-col">
                    <SheetHeader className="border-b border-neutral-100 px-5 pb-4 pt-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                                <Bell className="h-5 w-5" />
                            </div>
                            <div>
                                <SheetTitle className="text-left text-lg tracking-tight text-neutral-950">
                                    Notifications
                                </SheetTitle>
                                <SheetDescription className="text-left text-sm text-neutral-500">
                                    Messages, leases, and payments stay synced here on mobile.
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-5 pb-5 pt-4">
                        <div className="rounded-[1.75rem] border border-neutral-200 bg-neutral-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                                Live Summary
                            </p>
                            <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
                                {totalNotifications > 0
                                    ? `${totalNotifications} active alert${totalNotifications === 1 ? '' : 's'}`
                                    : 'All caught up'}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-neutral-500">
                                {soundEnabledLabels.length > 0
                                    ? `A subtle in-app sound will play for enabled ${soundEnabledLabels.join(', ')} updates after you interact with the app.`
                                    : 'Notification sound is currently muted in your preferences.'}
                            </p>
                        </div>

                        <div className="mt-4 space-y-3">
                            {items.map((item) => {
                                const Icon = item.icon

                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        onClick={() => setOpen(false)}
                                        className="flex items-center gap-3 rounded-[1.6rem] border border-neutral-200 bg-white p-4 transition-colors hover:bg-neutral-50"
                                    >
                                        <div className={cn(
                                            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white',
                                            getNotificationBadgeClassName(item.id),
                                        )}>
                                            <Icon className="h-5 w-5" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-neutral-950">{item.label}</p>
                                                <span className={cn(
                                                    'inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white',
                                                    getNotificationBadgeClassName(item.id),
                                                )}>
                                                    {item.count > 99 ? '99+' : item.count}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm leading-5 text-neutral-500">
                                                {item.description}
                                            </p>
                                        </div>

                                        <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" />
                                    </Link>
                                )
                            })}
                        </div>
                    </div>

                    <div className="border-t border-neutral-100 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
                        <Link
                            href="/settings"
                            onClick={() => setOpen(false)}
                            className="flex items-center justify-between rounded-[1.4rem] bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
                        >
                            <span className="flex items-center gap-2">
                                <Volume2 className="h-4 w-4" />
                                Manage alert preferences
                            </span>
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
