import { getDisplayName } from '@/lib/user-name'

export interface AvatarIdentity {
    _id?: string | null
    id?: string | null
    email?: string | null
    fullName?: string | null
    firstName?: string | null
    surname?: string | null
    name?: string | null
    avatarUrl?: string | null
}

function cleanAvatarValue(value: unknown): string | null {
    if (typeof value !== 'string') return null

    const trimmedValue = value.trim()
    return trimmedValue.length > 0 ? trimmedValue : null
}

function isSafeAvatarSrc(value: string) {
    return (
        value.startsWith('/') ||
        value.startsWith('data:') ||
        value.startsWith('blob:') ||
        /^https:\/\/.+\.convex\.(cloud|site)(\/|$)/i.test(value)
    )
}

function getComposedName(identity?: AvatarIdentity | null) {
    const firstName = cleanAvatarValue(identity?.firstName)
    const surname = cleanAvatarValue(identity?.surname)
    const composedName = [firstName, surname].filter(Boolean).join(' ').trim()

    return composedName || null
}

export function getAvatarSeed(identity?: AvatarIdentity | null, fallback = 'user') {
    return (
        cleanAvatarValue(identity?.email)?.toLowerCase() ||
        cleanAvatarValue(identity?._id) ||
        cleanAvatarValue(identity?.id) ||
        cleanAvatarValue(identity?.fullName) ||
        cleanAvatarValue(identity?.name) ||
        getComposedName(identity) ||
        fallback
    )
}

export function getAvatarAlt(identity?: AvatarIdentity | null, fallback = 'User avatar') {
    const displayName = getDisplayName(identity, '')
    return displayName ? `${displayName} avatar` : fallback
}

export function getAvatarImageSrc(src?: string | null) {
    const normalizedSrc = cleanAvatarValue(src)
    if (!normalizedSrc) return undefined

    return isSafeAvatarSrc(normalizedSrc) ? normalizedSrc : undefined
}
