'use client'

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import {
    Building2,
    Camera,
    ChevronRight,
    CreditCard,
    FileText,
    Heart,
    LayoutDashboard,
    Loader2,
    Lock,
    LogOut,
    Mail,
    Phone,
    ShieldCheck,
    UserRound,
    Users,
} from 'lucide-react'
import { toast } from 'sonner'

import { api } from '../../../convex/_generated/api'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { useUser } from '@/components/providers/UserProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { UserAvatar, type UserAvatarActivity } from '@/components/ui/user-avatar'
import { getDisplayName } from '@/lib/user-name'
import { cn } from '@/lib/utils'

import {
    buildFormState,
    getVerificationStatusCopy,
    sanitizeText,
    serializeFormState,
    type SettingsFormState,
    type SettingsUser,
} from './settings-helpers'
import {
    SaveChangesButton,
    SettingsGroup,
    SettingsInputRow,
    SettingsRow,
    SettingsSkeleton,
} from './settings-ui'

/* ─────────────── role quick links ─────────────── */

type QuickLink = {
    label: string
    href: string
    icon: React.ReactNode
    meta?: string
}

function getQuickLinks(role: SettingsUser['role']): QuickLink[] {
    if (role === 'tenant') {
        return [
            { label: 'Saved Properties', href: '/tenant/saved', icon: <Heart className="h-3.5 w-3.5 text-white" />, meta: 'Your bookmarks' },
            { label: 'My Leases', href: '/tenant/leases', icon: <FileText className="h-3.5 w-3.5 text-white" />, meta: 'Agreements' },
            { label: 'Payments', href: '/tenant/payments', icon: <CreditCard className="h-3.5 w-3.5 text-white" />, meta: 'Coming soon' },
        ]
    }
    if (role === 'landlord') {
        return [
            { label: 'My Properties', href: '/landlord/properties', icon: <Building2 className="h-3.5 w-3.5 text-white" />, meta: 'Listings' },
            { label: 'Leases', href: '/landlord/leases', icon: <FileText className="h-3.5 w-3.5 text-white" />, meta: 'Agreements' },
            { label: 'Payments', href: '/landlord/payments', icon: <CreditCard className="h-3.5 w-3.5 text-white" />, meta: 'Coming soon' },
        ]
    }
    return [
        { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="h-3.5 w-3.5 text-white" />, meta: 'Overview' },
        { label: 'Users', href: '/admin/users', icon: <Users className="h-3.5 w-3.5 text-white" />, meta: 'Accounts' },
        { label: 'Property Requests', href: '/admin/property-requests', icon: <ShieldCheck className="h-3.5 w-3.5 text-white" />, meta: 'Reviews' },
    ]
}

function getRoleIcon(role: SettingsUser['role']) {
    if (role === 'landlord') return <Building2 className="h-3.5 w-3.5" />
    if (role === 'admin') return <ShieldCheck className="h-3.5 w-3.5" />
    return <UserRound className="h-3.5 w-3.5" />
}

/* ─────────────── link icon colors ─────────────── */
const iconColors = [
    'bg-[#007AFF]',
    'bg-[#34C759]',
    'bg-[#FF9500]',
    'bg-[#AF52DE]',
    'bg-[#FF3B30]',
]

/* ━━━━━━━━━━━━━━━━ MAIN ━━━━━━━━━━━━━━━━ */

export function SettingsPageClient() {
    const { user, isLoading } = useUser()
    const updateProfile = useMutation(api.users.updateProfile)
    const generateUploadUrl = useMutation(api.files.generateUploadUrl)
    const registerUpload = useMutation(api.files.registerUpload)
    const verificationStatus = useQuery(api.verification.getStatus, user ? {} : 'skip')
    const { signOut } = useAuthActions()
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [form, setForm] = useState<SettingsFormState | null>(null)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [saveFeedback, setSaveFeedback] = useState<'idle' | 'success'>('idle')

    const typedUser = user as SettingsUser | null | undefined

    const baselineForm = useMemo(() => (typedUser ? buildFormState(typedUser) : null), [typedUser])
    const baselineSnapshot = useMemo(() => (baselineForm ? serializeFormState(baselineForm) : ''), [baselineForm])
    const formSnapshot = useMemo(() => (form ? serializeFormState(form) : ''), [form])
    const isDirty = Boolean(form && baselineForm && formSnapshot !== baselineSnapshot)

    useEffect(() => {
        if (!baselineForm) return
        if (!form || (!isDirty && formSnapshot !== baselineSnapshot)) {
            setForm(baselineForm)
        }
    }, [baselineForm, baselineSnapshot, form, formSnapshot, isDirty])

    useEffect(() => {
        if (saveFeedback !== 'success') return
        const timeoutId = window.setTimeout(() => setSaveFeedback('idle'), 1800)
        return () => window.clearTimeout(timeoutId)
    }, [saveFeedback])

    const avatarActivity: UserAvatarActivity = uploading
        ? 'uploading'
        : saving
            ? 'saving'
            : saveFeedback === 'success'
                ? 'success'
                : isDirty
                    ? 'typing'
                    : 'idle'

    const verificationCopy = useMemo(
        () => (typedUser ? getVerificationStatusCopy(typedUser, verificationStatus) : null),
        [typedUser, verificationStatus],
    )

    const quickLinks = typedUser ? getQuickLinks(typedUser.role) : []

    function updateForm<K extends keyof SettingsFormState>(key: K, value: SettingsFormState[K]) {
        setForm((current) => (current ? { ...current, [key]: value } : current))
    }

    async function handleSaveSettings() {
        if (!typedUser || !form) return

        const firstName = sanitizeText(form.firstName)
        const surname = sanitizeText(form.surname)
        const phone = sanitizeText(form.phone)
        const fullName = [firstName, surname].filter(Boolean).join(' ').trim()

        setSaving(true)
        try {
            await updateProfile({
                firstName,
                surname,
                fullName,
                phone,
                preferences: form.preferences,
            })
            setSaveFeedback('success')
            toast.success('Settings updated')
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Unable to save settings')
        } finally {
            setSaving(false)
        }
    }

    async function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('Choose an image file for your avatar')
            return
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Profile images must be under 2 MB')
            return
        }

        setUploading(true)
        try {
            const uploadUrl = await generateUploadUrl({
                contentType: file.type,
                fileSize: file.size,
            })

            const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: { 'Content-Type': file.type },
                body: file,
            })

            if (!response.ok) throw new Error('Avatar upload failed')

            const { storageId } = await response.json()
            await registerUpload({ storageId })
            await updateProfile({ avatarUrl: storageId })
            toast.success('Profile photo updated')
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Unable to upload avatar')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    async function handleSignOut() {
        try {
            await signOut()
            router.push('/')
            router.refresh()
            toast.success('Signed out')
        } catch {
            toast.error('Unable to sign out right now')
        }
    }

    /* ── loading ── */
    if (isLoading || (typedUser && !form)) {
        return <SettingsSkeleton />
    }

    /* ── not signed in ── */
    if (!typedUser) {
        return (
            <div className="min-h-screen bg-white">
                <Header user={null} isLoading={false} />
                <main className="mx-auto max-w-md px-4 pb-24 pt-16 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                        <UserRound className="h-7 w-7 text-neutral-400" />
                    </div>
                    <p className="mt-5 text-[17px] font-semibold tracking-[-0.2px] text-neutral-900">
                        Sign in to manage settings
                    </p>
                    <p className="mt-1.5 text-[14px] text-neutral-400">
                        Profile details live behind your account.
                    </p>
                    <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
                        <Button asChild className="h-11 rounded-full bg-[#007AFF] px-6 text-white hover:bg-[#0066D6]">
                            <Link href="/sign-in?redirect=%2Fsettings">Sign In</Link>
                        </Button>
                        <Button asChild variant="outline" className="h-11 rounded-full border-neutral-200 px-6 hover:bg-neutral-50">
                            <Link href="/sign-up?redirect=%2Fsettings">Create Account</Link>
                        </Button>
                    </div>
                </main>
            </div>
        )
    }

    if (!form || !verificationCopy) {
        return <SettingsSkeleton />
    }

    return (
        <div className="min-h-screen bg-white font-sans text-neutral-900">
            <Header user={typedUser} userRole={typedUser.role} isLoading={false} />

            <main className="mx-auto w-full max-w-2xl px-4 pb-36 pt-2 sm:px-5">

                {/* ━━━━━━━━ PROFILE HERO ━━━━━━━━ */}
                <div className="flex flex-col items-center py-6">
                    <div className="relative">
                        <UserAvatar
                            activity={avatarActivity}
                            className="h-20 w-20 ring-2 ring-neutral-200/60"
                            user={typedUser}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 ring-2 ring-white transition-all hover:bg-neutral-200 active:scale-90 disabled:opacity-50"
                            aria-label="Change profile photo"
                        >
                            {uploading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Camera className="h-3.5 w-3.5" />
                            )}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                        />
                    </div>

                    <p className="mt-3 text-[19px] font-semibold tracking-[-0.3px] text-neutral-900">
                        {getDisplayName(typedUser, 'Your Account')}
                    </p>
                    <p className="mt-0.5 text-[14px] text-neutral-400">
                        {typedUser.email}
                    </p>
                    <Badge className={cn('mt-2.5 capitalize', verificationCopy.className)}>
                        {typedUser.role}
                    </Badge>
                </div>

                {/* ━━━━━━━━ PERSONAL INFORMATION ━━━━━━━━ */}
                <SettingsGroup title="Personal Information">
                    <SettingsInputRow
                        label="First name"
                        value={form.firstName}
                        onChange={(v) => updateForm('firstName', v)}
                        placeholder="John"
                    />
                    <SettingsInputRow
                        label="Surname"
                        value={form.surname}
                        onChange={(v) => updateForm('surname', v)}
                        placeholder="Doe"
                    />
                    <SettingsInputRow
                        label="Phone"
                        value={form.phone}
                        onChange={(v) => updateForm('phone', v)}
                        placeholder="+264 81 123 4567"
                        type="tel"
                        last
                    />
                </SettingsGroup>

                {/* ━━━━━━━━ EMAIL ━━━━━━━━ */}
                <SettingsGroup
                    title="Email"
                    footer="Managed by your login provider. Cannot be changed here."
                >
                    <SettingsRow
                        label="Email"
                        icon={<Mail className="h-3.5 w-3.5" />}
                        last
                    >
                        <span className="flex items-center gap-1.5 text-[14px] text-neutral-400">
                            <span className="max-w-[180px] truncate">{typedUser.email || '—'}</span>
                            <Lock className="h-3 w-3 text-neutral-300" />
                        </span>
                    </SettingsRow>
                </SettingsGroup>

                {/* ━━━━━━━━ ACCOUNT ━━━━━━━━ */}
                <SettingsGroup title="Account">
                    <SettingsRow
                        label="Role"
                        icon={getRoleIcon(typedUser.role)}
                        last={false}
                    >
                        <span className="text-[14px] capitalize text-neutral-400">{typedUser.role}</span>
                    </SettingsRow>

                    <SettingsRow
                        label="Verification"
                        icon={<ShieldCheck className="h-3.5 w-3.5" />}
                        last={false}
                    >
                        <Badge className={cn('text-[10px]', verificationCopy.className)}>
                            {verificationCopy.label}
                        </Badge>
                    </SettingsRow>

                    <SettingsRow
                        label="Security"
                        icon={<Lock className="h-3.5 w-3.5" />}
                        last
                    >
                        <span className="text-[13px] text-neutral-400">Via provider</span>
                    </SettingsRow>
                </SettingsGroup>

                {/* ━━━━━━━━ NOTIFICATIONS ━━━━━━━━ */}
                {form.preferences?.notifications && (
                    <SettingsGroup title="Notifications">
                        {Object.entries(form.preferences.notifications).map(([key, enabled], index, arr) => {
                            const labels: Record<string, string> = {
                                messages: 'Messages',
                                leases: 'Lease updates',
                                payments: 'Payment reminders',
                                savedSearch: 'Saved search alerts',
                                inquiries: 'New inquiries',
                                approvals: 'Approval updates',
                                reviews: 'Review queue',
                                security: 'Security alerts',
                                digest: 'Daily digest',
                            }

                            return (
                                <SettingsRow
                                    key={key}
                                    label={labels[key] || key}
                                    last={index === arr.length - 1}
                                >
                                    <Switch
                                        checked={Boolean(enabled)}
                                        onCheckedChange={(checked) => {
                                            setForm((current) => {
                                                if (!current) return current
                                                return {
                                                    ...current,
                                                    preferences: {
                                                        ...current.preferences,
                                                        notifications: {
                                                            ...current.preferences.notifications,
                                                            [key]: checked,
                                                        },
                                                    },
                                                }
                                            })
                                        }}
                                    />
                                </SettingsRow>
                            )
                        })}
                    </SettingsGroup>
                )}

                {/* ━━━━━━━━ QUICK LINKS ━━━━━━━━ */}
                <SettingsGroup title="Your Tools">
                    {quickLinks.map((link, index) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                'flex w-full items-center gap-3 px-4 py-3 transition-colors active:bg-neutral-50',
                                index < quickLinks.length - 1 && 'border-b border-neutral-100'
                            )}
                        >
                            <div className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                                iconColors[index % iconColors.length]
                            )}>
                                {link.icon}
                            </div>
                            <span className="flex-1 text-[15px] text-neutral-900">{link.label}</span>
                            {link.meta && (
                                <span className="text-[13px] text-neutral-400">{link.meta}</span>
                            )}
                            <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" />
                        </Link>
                    ))}
                </SettingsGroup>

                {/* ━━━━━━━━ BECOME LANDLORD (tenant only) ━━━━━━━━ */}
                {typedUser.role === 'tenant' && (
                    <SettingsGroup>
                        <Link
                            href="/become-landlord"
                            className="flex w-full items-center gap-3 px-4 py-3 transition-colors active:bg-neutral-50"
                        >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FF9500]">
                                <Building2 className="h-3.5 w-3.5 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="text-[15px] text-neutral-900">Become a Landlord</span>
                                <p className="text-[12px] text-neutral-400">{verificationCopy.description}</p>
                            </div>
                            <Badge className={cn('text-[10px]', verificationCopy.className)}>
                                {verificationCopy.label}
                            </Badge>
                            <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" />
                        </Link>
                    </SettingsGroup>
                )}

                {/* ━━━━━━━━ SIGN OUT ━━━━━━━━ */}
                <SettingsGroup>
                    <SettingsRow
                        label="Sign Out"
                        destructive
                        onClick={handleSignOut}
                        last
                    />
                </SettingsGroup>

                {/* ━━━━━━━━ APP INFO ━━━━━━━━ */}
                <div className="mt-8 text-center">
                    <p className="text-[12px] text-neutral-300">LINK · Version 1.0</p>
                </div>
            </main>

            {/* ── floating save bar ── */}
            <div
                className={cn(
                    'fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ease-out',
                    isDirty
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-full opacity-0 pointer-events-none'
                )}
            >
                <div className="mx-auto max-w-2xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-lg shadow-neutral-900/10 ring-1 ring-neutral-100 backdrop-blur-md">
                        <p className="text-[13px] font-medium text-neutral-500">
                            {saveFeedback === 'success' ? '✓ Saved' : 'Unsaved changes'}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => { if (baselineForm) setForm(baselineForm) }}
                                disabled={saving}
                                className="rounded-full px-4 py-2 text-[13px] font-semibold text-neutral-500 transition-colors hover:bg-neutral-100 active:scale-95"
                            >
                                Reset
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleSaveSettings()}
                                disabled={saving}
                                className="rounded-full bg-[#007AFF] px-5 py-2 text-[13px] font-semibold text-white transition-all hover:bg-[#0066D6] active:scale-95 disabled:opacity-60"
                            >
                                <SaveChangesButton saving={saving} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <MobileNav user={typedUser} userRole={typedUser.role} />
        </div>
    )
}
