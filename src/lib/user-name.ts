/**
 * Utility functions for formatting user names throughout the application
 */

export interface UserNameFields {
    first_name?: string | null
    surname?: string | null
    full_name?: string | null
}

/**
 * Get the display name for a user, preferring first_name + surname over full_name
 */
export function getDisplayName(user: UserNameFields | null | undefined, fallback = 'User'): string {
    if (!user) return fallback

    // Prefer first_name + surname if both are available
    if (user.first_name && user.surname) {
        return `${user.first_name} ${user.surname}`
    }

    // Fall back to first_name only
    if (user.first_name) {
        return user.first_name
    }

    // Fall back to full_name
    if (user.full_name) {
        return user.full_name
    }

    return fallback
}

/**
 * Get the user's first name for greeting or short display
 */
export function getFirstName(user: UserNameFields | null | undefined, fallback = 'User'): string {
    if (!user) return fallback

    if (user.first_name) {
        return user.first_name
    }

    // Try to extract from full_name
    if (user.full_name) {
        const parts = user.full_name.trim().split(' ')
        return parts[0] || fallback
    }

    return fallback
}

/**
 * Get initials for avatar display
 */
export function getInitials(user: UserNameFields | null | undefined, fallback = 'U'): string {
    if (!user) return fallback

    if (user.first_name && user.surname) {
        return `${user.first_name.charAt(0)}${user.surname.charAt(0)}`.toUpperCase()
    }

    if (user.first_name) {
        return user.first_name.charAt(0).toUpperCase()
    }

    if (user.full_name) {
        const parts = user.full_name.trim().split(' ')
        if (parts.length >= 2) {
            return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
        }
        return parts[0]?.charAt(0)?.toUpperCase() || fallback
    }

    return fallback
}

/**
 * Format for user metadata from auth (uses different key names)
 */
export interface UserMetadataFields {
    first_name?: string | null
    surname?: string | null
    full_name?: string | null
}

export function getDisplayNameFromMetadata(metadata: UserMetadataFields | null | undefined, fallback = 'User'): string {
    if (!metadata) return fallback

    if (metadata.first_name && metadata.surname) {
        return `${metadata.first_name} ${metadata.surname}`
    }

    if (metadata.first_name) {
        return metadata.first_name
    }

    if (metadata.full_name) {
        return metadata.full_name
    }

    return fallback
}
