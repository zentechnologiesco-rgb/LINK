"use client"

import * as React from 'react'
import { Facehash, type FacehashProps } from 'facehash'
import { BellDot, Check, Loader2, X } from '@/components/ui/icons'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { type AvatarIdentity, getAvatarAlt, getAvatarImageSrc, getAvatarSeed } from '@/lib/avatar'
import { cn } from '@/lib/utils'

const DEFAULT_FACEHASH_COLORS = ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51']

type UserAvatarFacehashProps = Partial<Omit<FacehashProps, 'className' | 'name' | 'size'>>
export type UserAvatarActivity = 'idle' | 'active' | 'typing' | 'saving' | 'uploading' | 'unread' | 'success' | 'error'

export interface UserAvatarProps extends Omit<React.ComponentProps<typeof Avatar>, 'children'> {
    user?: AvatarIdentity | null
    src?: string | null
    name?: string | null
    email?: string | null
    seed?: string | null
    activity?: UserAvatarActivity
    imageAlt?: string
    imageClassName?: string
    fallbackClassName?: string
    facehashClassName?: string
    facehashProps?: UserAvatarFacehashProps
}

function cleanValue(value?: string | null) {
    if (typeof value !== 'string') return null

    const trimmedValue = value.trim()
    return trimmedValue.length > 0 ? trimmedValue : null
}

function ActivityMouth({
    children,
    className,
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div
            className={cn('flex items-center justify-center text-current', className)}
            style={{ width: '30cqw', height: '30cqw' }}
        >
            {children}
        </div>
    )
}

function TypingMouth() {
    return (
        <div className="flex items-center gap-[3cqw]" aria-hidden="true">
            {[0, 1, 2].map((dotIndex) => (
                <span
                    key={dotIndex}
                    className="rounded-full bg-current animate-bounce"
                    style={{
                        width: '6cqw',
                        height: '6cqw',
                        animationDelay: `${dotIndex * 0.12}s`,
                    }}
                />
            ))}
        </div>
    )
}

function getActivityClassName(activity: UserAvatarActivity) {
    switch (activity) {
        case 'active':
            return 'ring-2 ring-sky-200 ring-offset-2 ring-offset-white'
        case 'typing':
            return 'ring-2 ring-sky-300 ring-offset-2 ring-offset-white'
        case 'saving':
        case 'uploading':
            return 'ring-2 ring-amber-200 ring-offset-2 ring-offset-white'
        case 'unread':
            return 'ring-2 ring-red-200 ring-offset-2 ring-offset-white'
        case 'success':
            return 'ring-2 ring-emerald-200 ring-offset-2 ring-offset-white'
        case 'error':
            return 'ring-2 ring-rose-200 ring-offset-2 ring-offset-white'
        default:
            return ''
    }
}

function getActivityFacehashProps(activity: UserAvatarActivity): UserAvatarFacehashProps {
    switch (activity) {
        case 'active':
            return {
                enableBlink: true,
                interactive: true,
                intensity3d: 'medium',
            }
        case 'typing':
            return {
                enableBlink: true,
                interactive: true,
                intensity3d: 'medium',
                showInitial: false,
                onRenderMouth: () => <TypingMouth />,
            }
        case 'saving':
        case 'uploading':
            return {
                enableBlink: false,
                interactive: false,
                intensity3d: 'subtle',
                showInitial: false,
                onRenderMouth: () => (
                    <ActivityMouth>
                        <Loader2 className="size-full animate-spin" strokeWidth={2.25} />
                    </ActivityMouth>
                ),
            }
        case 'unread':
            return {
                enableBlink: true,
                interactive: true,
                intensity3d: 'medium',
                showInitial: false,
                onRenderMouth: () => (
                    <ActivityMouth>
                        <BellDot className="size-full" strokeWidth={2.25} />
                    </ActivityMouth>
                ),
            }
        case 'success':
            return {
                enableBlink: true,
                interactive: true,
                intensity3d: 'subtle',
                showInitial: false,
                onRenderMouth: () => (
                    <ActivityMouth>
                        <Check className="size-full" strokeWidth={2.5} />
                    </ActivityMouth>
                ),
            }
        case 'error':
            return {
                enableBlink: false,
                interactive: false,
                intensity3d: 'none',
                showInitial: false,
                onRenderMouth: () => (
                    <ActivityMouth>
                        <X className="size-full" strokeWidth={2.5} />
                    </ActivityMouth>
                ),
            }
        case 'idle':
        default:
            return {
                enableBlink: true,
                interactive: true,
                intensity3d: 'subtle',
            }
    }
}

export function UserAvatar({
    user,
    src,
    name,
    email,
    seed,
    activity = 'idle',
    imageAlt,
    className,
    imageClassName,
    fallbackClassName,
    facehashClassName,
    facehashProps,
    ...props
}: UserAvatarProps) {
    const avatarIdentity: AvatarIdentity = {
        ...user,
        name: cleanValue(name) ?? cleanValue(user?.name) ?? null,
        email: cleanValue(email) ?? cleanValue(user?.email) ?? null,
        avatarUrl: cleanValue(src) ?? cleanValue(user?.avatarUrl) ?? null,
    }

    const avatarSeed = cleanValue(seed) ?? getAvatarSeed(avatarIdentity)
    const avatarSrc = getAvatarImageSrc(avatarIdentity.avatarUrl)
    const avatarAlt = imageAlt ?? getAvatarAlt(avatarIdentity)
    const activityFacehashProps = getActivityFacehashProps(activity)

    return (
        <Avatar
            className={cn(
                'transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]',
                className,
                getActivityClassName(activity)
            )}
            {...props}
        >
            <AvatarImage src={avatarSrc} alt={avatarAlt} className={cn('object-cover', imageClassName)} />
            <AvatarFallback className={cn('overflow-hidden rounded-full bg-transparent p-0', fallbackClassName)}>
                <Facehash
                    name={avatarSeed}
                    size="100%"
                    className={cn('size-full rounded-full text-neutral-950', facehashClassName)}
                    colors={DEFAULT_FACEHASH_COLORS}
                    variant="gradient"
                    {...activityFacehashProps}
                    {...facehashProps}
                />
            </AvatarFallback>
        </Avatar>
    )
}
