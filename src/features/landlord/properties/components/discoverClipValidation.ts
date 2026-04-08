export const DISCOVER_CLIP_ACCEPT = ".mp4,.webm,video/mp4,video/webm"

export const DISCOVER_CLIP_PREVIEW_WARNING =
    "If this clip only plays audio, re-export it as an H.264 MP4 and upload it again."

export const DISCOVER_CLIP_UPLOAD_ERROR =
    "Upload an MP4 or WebM clip. MOV clips can play audio without video in some browsers."

const ALLOWED_DISCOVER_CLIP_TYPES = new Set([
    "video/mp4",
    "video/webm",
])

const ALLOWED_DISCOVER_CLIP_EXTENSIONS = [".mp4", ".webm"]

export function isSupportedDiscoverClip(file: File) {
    const normalizedType = file.type.toLowerCase()
    const normalizedName = file.name.toLowerCase()

    return (
        ALLOWED_DISCOVER_CLIP_TYPES.has(normalizedType) ||
        ALLOWED_DISCOVER_CLIP_EXTENSIONS.some((extension) => normalizedName.endsWith(extension))
    )
}
