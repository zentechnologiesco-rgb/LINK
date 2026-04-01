import {
    normalizeUserPreferences,
    type UserPreferences,
    type UserRole,
} from '@/lib/user-preferences'

export type NotificationPreferenceKey = keyof UserPreferences['notifications']

export type SettingsUser = {
    _id: string
    email: string
    fullName?: string
    firstName?: string
    surname?: string
    phone?: string
    avatarUrl?: string | null
    role: UserRole
    isVerified: boolean
    preferences?: UserPreferences
}

export type SettingsFormState = {
    firstName: string
    surname: string
    phone: string
    preferences: UserPreferences
}

export type VerificationStatus = {
    status?: string
    adminNotes?: string
} | null | undefined

export function sanitizeText(value: string) {
    return value.trim().replace(/\s+/g, ' ')
}

export function buildFormState(user: SettingsUser): SettingsFormState {
    const fallbackNameParts = (user.fullName || '').split(' ').filter(Boolean)

    return {
        firstName: user.firstName || fallbackNameParts[0] || '',
        surname: user.surname || fallbackNameParts.slice(1).join(' ') || '',
        phone: user.phone || '',
        preferences: normalizeUserPreferences(user.role, user.preferences),
    }
}

export function serializeFormState(formState: SettingsFormState) {
    return JSON.stringify(formState)
}

export function getVerificationStatusCopy(user: SettingsUser, verificationStatus: VerificationStatus) {
    if (user.role === 'landlord' && user.isVerified) {
        return {
            label: 'Verified',
            className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
            description: 'Your landlord account is verified and ready for listings and leases.',
        }
    }

    if (verificationStatus?.status === 'pending') {
        return {
            label: 'Pending Review',
            className: 'border-amber-200 bg-amber-50 text-amber-700',
            description: 'Your documents are with the admin team right now.',
        }
    }

    if (verificationStatus?.status === 'rejected') {
        return {
            label: 'Needs Resubmission',
            className: 'border-rose-200 bg-rose-50 text-rose-700',
            description: verificationStatus.adminNotes || 'A few details need to be corrected before approval.',
        }
    }

    return {
        label: user.role === 'tenant' ? 'Tenant Account' : 'Standard Access',
        className: 'border-neutral-200 bg-neutral-50 text-neutral-700',
        description: user.role === 'tenant'
            ? 'You can keep renting as normal and apply for landlord verification any time.'
            : 'Your account is active.',
    }
}
