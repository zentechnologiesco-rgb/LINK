'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from 'convex/react'
import { ArrowLeft, Clapperboard, Loader2, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { BrowserSafeVideo } from '@/components/ui/BrowserSafeVideo'
import { cn } from '@/lib/utils'
import {
    DISCOVER_CLIP_ACCEPT,
    DISCOVER_CLIP_PREVIEW_WARNING,
    DISCOVER_CLIP_UPLOAD_ERROR,
    isSupportedDiscoverClip,
} from './discoverClipValidation'

const MAX_VIDEO_SIZE_MB = 10

interface ClipManagerProps {
    propertyId: Id<'properties'>
    propertyTitle: string
    initialVideos: Id<'_storage'>[]
}

export function ClipManager({
    propertyId,
    propertyTitle,
    initialVideos,
}: ClipManagerProps) {
    const router = useRouter()
    const [videoIds, setVideoIds] = useState<Id<'_storage'>[]>(initialVideos)
    const [isUploading, setIsUploading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const updateProperty = useMutation(api.properties.update)
    const videoUrls = useQuery(api.files.getUrls, { storageIds: videoIds })
    const generateUploadUrl = useMutation(api.files.generateUploadUrl)
    const registerUpload = useMutation(api.files.registerUpload)

    const currentVideoId = videoIds[0]
    const currentVideoUrl =
        videoUrls?.find((item) => item.id === currentVideoId)?.url ?? null
    const hasClip = videoIds.length > 0
    const hasChanges =
        JSON.stringify(videoIds) !== JSON.stringify(initialVideos)
    const backHref = `/landlord/properties`

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!isSupportedDiscoverClip(file)) {
            toast.error(DISCOVER_CLIP_UPLOAD_ERROR)
            return
        }

        if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
            toast.error(`Keep the clip under ${MAX_VIDEO_SIZE_MB} MB.`)
            return
        }

        setIsUploading(true)

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

            if (!response.ok) throw new Error('Upload failed')

            const { storageId } = await response.json()
            const nextId = storageId as Id<'_storage'>
            await registerUpload({ storageId: nextId })

            setVideoIds([nextId])
            toast.success('Clip ready — tap Save to publish it.')
        } catch {
            toast.error('Upload failed. Try again.')
        } finally {
            setIsUploading(false)
            if (inputRef.current) inputRef.current.value = ''
        }
    }

    const handleRemove = () => {
        setVideoIds([])
        toast('Clip removed — tap Save to confirm.', { duration: 3000 })
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await updateProperty({ propertyId, videos: videoIds })
            toast.success(
                hasClip
                    ? 'Discovery clip saved.'
                    : 'Discovery clip removed.',
            )
            router.push(backHref)
        } catch {
            toast.error('Failed to save. Try again.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* ── iOS-style Navbar ─────────────────────────────────── */}
            <header className="sticky top-0 z-50 border-b border-neutral-100/60 bg-white/80 backdrop-blur-2xl">
                <div className="mx-auto flex h-14 max-w-xl items-center gap-3 px-4">
                    <button
                        type="button"
                        onClick={() => router.push(backHref)}
                        className="flex items-center gap-1.5 text-[15px] font-medium text-neutral-950 transition-opacity active:opacity-60"
                    >
                        <ArrowLeft className="h-5 w-5" strokeWidth={2} />
                    </button>

                    <div className="min-w-0 flex-1 text-center">
                        <p className="truncate text-[15px] font-semibold tracking-[-0.01em] text-neutral-950">
                            Discovery Clip
                        </p>
                    </div>

                    {/* Save button */}
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        className={cn(
                            'rounded-full px-4 py-1.5 text-[14px] font-semibold transition-all active:scale-95',
                            hasChanges && !isSaving
                                ? 'bg-neutral-950 text-white hover:bg-neutral-800'
                                : 'bg-neutral-100 text-neutral-300 cursor-not-allowed',
                        )}
                    >
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            'Save'
                        )}
                    </button>
                </div>
            </header>

            {/* ── Content ─────────────────────────────────────────── */}
            <main className="mx-auto max-w-xl px-4 pb-32 pt-6">
                {/* Property context */}
                <p className="text-[13px] text-neutral-400 truncate">
                    {propertyTitle}
                </p>

                <h1 className="mt-1 text-[28px] font-bold tracking-[-0.04em] text-neutral-950">
                    {hasClip ? 'Manage Clip' : 'Add a Clip'}
                </h1>
                <p className="mt-1.5 text-[15px] leading-relaxed text-neutral-500">
                    {hasClip
                        ? 'This clip appears in Discover when the listing is live. Replace or remove it below.'
                        : 'Add a short vertical video to help renters find this listing in Discover. Use H.264 MP4 or WebM for the most reliable playback.'}
                </p>

                {/* ── Video Preview / Upload ──────────────────────── */}
                <div className="mt-8">
                    <input
                        ref={inputRef}
                        type="file"
                        accept={DISCOVER_CLIP_ACCEPT}
                        onChange={handleUpload}
                        className="hidden"
                        disabled={isUploading}
                    />

                    {currentVideoUrl ? (
                        <div className="space-y-3">
                            {/* Video */}
                            <div className="overflow-hidden rounded-[20px] border border-neutral-200/80 bg-black">
                                <div className="relative aspect-[9/16] w-full sm:max-h-[480px]">
                                    <BrowserSafeVideo
                                        key={currentVideoUrl}
                                        src={currentVideoUrl}
                                        controls
                                        muted
                                        playsInline
                                        preload="metadata"
                                        warningText={DISCOVER_CLIP_PREVIEW_WARNING}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            </div>

                            {/* Actions (iOS grouped list style) */}
                            <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
                                <button
                                    type="button"
                                    onClick={() => inputRef.current?.click()}
                                    disabled={isUploading}
                                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-neutral-50"
                                >
                                    <Upload className="h-[18px] w-[18px] text-neutral-950" strokeWidth={2} />
                                    <span className="text-[15px] font-medium text-neutral-950">
                                        Replace Clip
                                    </span>
                                </button>
                                <div className="mx-4 h-px bg-neutral-100" />
                                <button
                                    type="button"
                                    onClick={handleRemove}
                                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-red-50"
                                >
                                    <Trash2 className="h-[18px] w-[18px] text-red-500" strokeWidth={2} />
                                    <span className="text-[15px] font-medium text-red-500">
                                        Remove Clip
                                    </span>
                                </button>
                            </div>
                        </div>
                    ) : isUploading ? (
                        <div className="flex flex-col items-center justify-center rounded-[20px] border border-neutral-200/80 bg-neutral-50/50 px-6 py-20">
                            <div className="relative">
                                <div className="h-14 w-14 rounded-full border-[2.5px] border-neutral-200 border-t-neutral-600 animate-spin" />
                                <Clapperboard className="absolute inset-0 m-auto h-5 w-5 text-neutral-400" strokeWidth={2} />
                            </div>
                            <p className="mt-5 text-[15px] font-semibold text-neutral-950">
                                Uploading…
                            </p>
                            <p className="mt-1 text-[13px] text-neutral-400">
                                This may take a moment
                            </p>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="group flex w-full flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-neutral-200 bg-neutral-50/50 px-6 py-20 transition-all hover:border-neutral-300 hover:bg-neutral-100/50 active:scale-[0.99]"
                        >
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white border border-neutral-200/80 shadow-sm transition-transform group-hover:scale-105">
                                <Clapperboard className="h-6 w-6 text-neutral-400" strokeWidth={1.8} />
                            </div>
                            <p className="mt-5 text-[16px] font-semibold text-neutral-950">
                                Upload a Clip
                            </p>
                            <p className="mt-1.5 max-w-[280px] text-center text-[13px] leading-relaxed text-neutral-400">
                                9:16 vertical · Under 30s · MP4 or WebM · Max 10 MB
                            </p>
                        </button>
                    )}
                </div>

                {/* ── Tip ─────────────────────────────────────────── */}
                {!hasClip && !isUploading ? (
                    <div className="mt-6 rounded-2xl bg-neutral-50 px-4 py-3.5">
                        <p className="text-[13px] leading-relaxed text-neutral-500">
                            <span className="font-semibold text-neutral-700">Tip:</span>{' '}
                            A quick walk-through with good lighting works best. The clip does not affect the listing approval status.
                        </p>
                    </div>
                ) : null}

                {hasChanges ? (
                    <p className="mt-4 text-center text-[13px] text-neutral-400">
                        You have unsaved changes
                    </p>
                ) : null}
            </main>
        </div>
    )
}
