/**
 * Utility functions for formatting user names throughout the application
 */

export interface UserNameFields {
    fullName?: string | null
    firstName?: string | null
    surname?: string | null
    name?: string | null
    email?: string | null
}

function cleanNamePart(value: unknown): string | null {
    if (typeof value !== 'string') return null

    const trimmedValue = value.trim()
    return trimmedValue.length > 0 ? trimmedValue : null
}

function getComposedName(user: UserNameFields | null | undefined): string | null {
    const firstName = cleanNamePart(user?.firstName)
    const surname = cleanNamePart(user?.surname)
    const composedName = [firstName, surname].filter(Boolean).join(' ').trim()

    return composedName || null
}

/**
 * Get the display name for a user
 */
export function getDisplayName(user: UserNameFields | null | undefined, fallback = 'User'): string {
    if (!user) return fallback

    const fullName = cleanNamePart(user.fullName)
    if (fullName) return fullName

    const name = cleanNamePart(user.name)
    if (name) return name

    const composedName = getComposedName(user)
    if (composedName) return composedName

    const email = cleanNamePart(user.email)
    if (email) return email

    return fallback
}

/**
 * Get the user's first name for greeting or short display
 */
export function getFirstName(user: UserNameFields | null | undefined, fallback = 'User'): string {
    if (!user) return fallback

    const displayName = getDisplayName(user, '')
    if (!displayName) return fallback

    if (displayName.includes('@')) {
        return displayName.split('@')[0] || fallback
    }

    return displayName.split(/\s+/)[0] || fallback
}

/**
 * Get initials for avatar display
 */
export function getInitials(user: UserNameFields | null | undefined, fallback = 'U'): string {
    if (!user) return fallback

    const displayName = getDisplayName(user, '')
    if (!displayName) return fallback

    if (displayName.includes('@')) {
        return displayName.charAt(0).toUpperCase() || fallback
    }

    const parts = displayName.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
    }
    return parts[0]?.charAt(0)?.toUpperCase() || fallback
}
