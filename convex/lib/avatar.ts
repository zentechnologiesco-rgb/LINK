type AvatarContext = {
    storage: {
        getUrl: (storageId: string) => Promise<string | null>
    }
}

function isResolvedAvatarUrl(value: string) {
    return (
        value.startsWith('/') ||
        value.startsWith('data:') ||
        value.startsWith('blob:') ||
        /^https:\/\/.+\.convex\.(cloud|site)(\/|$)/i.test(value)
    )
}

export async function resolveAvatarUrl(ctx: AvatarContext, avatarUrl?: string | null) {
    if (!avatarUrl) return null

    const trimmedAvatarUrl = avatarUrl.trim()
    if (!trimmedAvatarUrl) return null

    if (isResolvedAvatarUrl(trimmedAvatarUrl)) {
        return trimmedAvatarUrl
    }

    try {
        return await ctx.storage.getUrl(trimmedAvatarUrl)
    } catch (error) {
        console.error('Failed to resolve avatar URL:', error)
        return null
    }
}
