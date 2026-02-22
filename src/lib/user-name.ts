/**
 * Utility functions for formatting user names throughout the application
 */

export interface UserNameFields {
    fullName?: string | null
}

/**
 * Get the display name for a user
 */
export function getDisplayName(user: UserNameFields | any | null | undefined, fallback = 'User'): string {
    if (!user) return fallback

    if (user.fullName) return user.fullName

    return fallback
}

/**
 * Get the user's first name for greeting or short display
 */
export function getFirstName(user: UserNameFields | any | null | undefined, fallback = 'User'): string {
    if (!user) return fallback

    const name = user.fullName
    if (!name) return fallback

    const parts = name.trim().split(' ')
    return parts[0] || fallback

    return fallback
}

/**
 * Get initials for avatar display
 */
export function getInitials(user: UserNameFields | any | null | undefined, fallback = 'U'): string {
    if (!user) return fallback

    const name = user.fullName
    if (!name) return fallback

    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
    }
    return parts[0]?.charAt(0)?.toUpperCase() || fallback

    return fallback
}
