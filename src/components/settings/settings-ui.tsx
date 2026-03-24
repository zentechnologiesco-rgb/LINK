import { ChevronRight, Loader2 } from 'lucide-react'

import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { cn } from '@/lib/utils'

/* ───────────────── Skeleton ───────────────── */

export function SettingsSkeleton() {
    return (
        <div className="min-h-screen bg-white">
            <Header user={undefined} isLoading={true} />

            <main className="mx-auto w-full max-w-2xl px-4 pb-32 pt-6 sm:px-5">
                {/* Profile hero skeleton */}
                <div className="flex flex-col items-center py-6">
                    <div className="h-20 w-20 rounded-full bg-neutral-200/60 animate-pulse" />
                    <div className="mt-3 h-5 w-32 rounded-full bg-neutral-200/60 animate-pulse" />
                    <div className="mt-1.5 h-4 w-44 rounded-full bg-neutral-100 animate-pulse" />
                    <div className="mt-2.5 h-6 w-20 rounded-full bg-neutral-100 animate-pulse" />
                </div>

                {/* Section skeletons */}
                {[1, 2, 3].map((s) => (
                    <div key={s} className="mt-6">
                        <div className="mb-2 ml-4 h-3 w-28 rounded-full bg-neutral-100 animate-pulse" />
                        <div className="rounded-2xl border border-neutral-100 bg-white">
                            {[1, 2, 3].map((r) => (
                                <div
                                    key={r}
                                    className={cn(
                                        'flex items-center justify-between px-4 py-3.5',
                                        r < 3 && 'border-b border-neutral-100'
                                    )}
                                >
                                    <div className="h-4 w-24 rounded-full bg-neutral-100 animate-pulse" />
                                    <div className="h-4 w-32 rounded-full bg-neutral-50 animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </main>

            <MobileNav user={undefined} />
        </div>
    )
}

/* ───────────────── Settings Group ───────────────── */

export function SettingsGroup({
    title,
    children,
    footer,
}: {
    title?: string
    children: React.ReactNode
    footer?: string
}) {
    return (
        <div className="mt-7 first:mt-0">
            {title && (
                <p className="mb-1.5 ml-4 text-[12px] font-medium uppercase tracking-[0.06em] text-neutral-400">
                    {title}
                </p>
            )}
            <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">
                {children}
            </div>
            {footer && (
                <p className="mt-1.5 ml-4 text-[12px] leading-[1.4] text-neutral-400">
                    {footer}
                </p>
            )}
        </div>
    )
}

/* ───────────────── Settings Row ───────────────── */

interface SettingsRowProps {
    label: string
    value?: string | React.ReactNode
    icon?: React.ReactNode
    chevron?: boolean
    destructive?: boolean
    disabled?: boolean
    onClick?: () => void
    children?: React.ReactNode
    className?: string
    last?: boolean
}

export function SettingsRow({
    label,
    value,
    icon,
    chevron = false,
    destructive = false,
    disabled = false,
    onClick,
    children,
    className,
    last = false,
}: SettingsRowProps) {
    const isButton = Boolean(onClick)
    const Tag = isButton ? 'button' : 'div'

    return (
        <Tag
            {...(isButton ? { type: 'button' as const, onClick, disabled } : {})}
            className={cn(
                'flex w-full items-center gap-3 px-4 py-3',
                !last && 'border-b border-neutral-100',
                isButton && 'transition-colors active:bg-neutral-50',
                disabled && 'opacity-50',
                className
            )}
        >
            {icon && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
                    {icon}
                </div>
            )}

            <span
                className={cn(
                    'text-[15px]',
                    destructive ? 'font-medium text-red-500' : 'text-neutral-900',
                    isButton && !destructive && 'text-left'
                )}
            >
                {label}
            </span>

            <div className="ml-auto flex items-center gap-1.5">
                {children}
                {value && !children && (
                    <span className="max-w-[180px] truncate text-[15px] text-neutral-400">
                        {value}
                    </span>
                )}
                {chevron && (
                    <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" />
                )}
            </div>
        </Tag>
    )
}

/* ───────────────── Settings Input Row ───────────────── */

interface SettingsInputRowProps {
    label: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    last?: boolean
    type?: string
}

export function SettingsInputRow({
    label,
    value,
    onChange,
    placeholder,
    disabled = false,
    last = false,
    type = 'text',
}: SettingsInputRowProps) {
    return (
        <div
            className={cn(
                'flex items-center gap-3 px-4 py-2.5',
                !last && 'border-b border-neutral-100'
            )}
        >
            <label className="shrink-0 text-[15px] text-neutral-900 min-w-[90px]">
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                    'w-full min-w-0 bg-transparent text-right text-[15px] text-neutral-900 outline-none placeholder:text-neutral-300',
                    disabled && 'text-neutral-400'
                )}
            />
        </div>
    )
}

/* ───────────────── Save Changes Button ───────────────── */

export function SaveChangesButton({ saving }: { saving: boolean }) {
    return (
        <>
            {saving ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving
                </>
            ) : (
                'Save Changes'
            )}
        </>
    )
}
