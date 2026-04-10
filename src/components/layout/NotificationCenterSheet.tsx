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
    const {
        unreadCount,
        leaseActionCount,
        paymentActionCount,
        totalNotifications,
    } = useNotificationCounts()

    const items = useMemo<NotificationItem[]>(() => {
        const baseItems: NotificationItem[] = [
            {
                id: 'messages',
                label: 'Messages',
                href: '/chat',
                description: unreadCount > 0
                    ? `${unreadCount} unread`
                    : 'No unread messages',
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
                        ? `${leaseActionCount} need attention`
                        : 'Nothing pending',
                    count: leaseActionCount,
                    icon: FileText,
                },
                {
                    id: 'payments',
                    label: 'Payments',
                    href: '/tenant/payments',
                    description: paymentActionCount > 0
                        ? `${paymentActionCount} due soon`
                        : 'Nothing due',
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
                        ? `${leaseActionCount} ready to review`
                        : 'Nothing pending',
                    count: leaseActionCount,
                    icon: FileText,
                },
                {
                    id: 'payments',
                    label: 'Payments',
                    href: '/landlord/payments',
                    description: paymentActionCount > 0
                        ? `${paymentActionCount} need follow-up`
                        : 'Nothing pending',
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
                    <SheetHeader className="border-b border-neutral-100 px-5 pb-3 pt-5">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                                    <Bell className="h-[18px] w-[18px]" />
                                </div>
                                <div>
                                    <SheetTitle className="text-left text-lg tracking-tight text-neutral-950">
                                        Notifications
                                    </SheetTitle>
                                    <SheetDescription className="text-left text-sm text-neutral-500">
                                        {totalNotifications > 0
                                            ? 'Needs attention'
                                            : 'All caught up'}
                                    </SheetDescription>
                                </div>
                            </div>
                            {totalNotifications > 0 ? (
                                <span className="inline-flex h-7 min-w-[2rem] items-center justify-center rounded-full bg-neutral-950 px-2.5 text-xs font-semibold text-white">
                                    {totalNotifications > 99 ? '99+' : totalNotifications}
                                </span>
                            ) : null}
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-5 pb-5 pt-4">
                        <div className="space-y-2.5">
                            {items.map((item) => {
                                const Icon = item.icon

                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        onClick={() => setOpen(false)}
                                        className="flex items-center gap-3 rounded-[1.4rem] border border-neutral-200 bg-white p-3.5 transition-colors hover:bg-neutral-50"
                                    >
                                        <div className={cn(
                                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white',
                                            getNotificationBadgeClassName(item.id),
                                        )}>
                                            <Icon className="h-[18px] w-[18px]" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-neutral-950">{item.label}</p>
                                                {item.count > 0 ? (
                                                    <span className={cn(
                                                        'inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white',
                                                        getNotificationBadgeClassName(item.id),
                                                    )}>
                                                        {item.count > 99 ? '99+' : item.count}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p className="mt-0.5 text-sm text-neutral-500">
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
                            className="flex items-center justify-between rounded-[1.2rem] border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                        >
                            <span className="flex items-center gap-2">
                                <Volume2 className="h-4 w-4 text-neutral-500" />
                                Notification settings
                            </span>
                            <ChevronRight className="h-4 w-4 text-neutral-400" />
                        </Link>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
