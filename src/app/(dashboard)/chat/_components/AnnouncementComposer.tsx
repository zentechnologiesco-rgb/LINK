'use client'

import type { FormEvent } from 'react'
import { Loader2, Send } from '@/components/ui/icons'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

import type {
    AnnouncementAudience,
    AnnouncementDraft,
    AnnouncementPriority,
} from '../_lib/chat-workspace-types'

export function AnnouncementComposer({
    draft,
    onChange,
    onSubmit,
    isSubmitting,
}: {
    draft: AnnouncementDraft
    onChange: (nextDraft: AnnouncementDraft) => void
    onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
    isSubmitting: boolean
}) {
    return (
        <form onSubmit={onSubmit} className="space-y-3">
            <Input
                value={draft.title}
                onChange={(event) => onChange({ ...draft, title: event.target.value })}
                placeholder="Announcement title"
                className="h-10 rounded-xl border-neutral-200 bg-neutral-50 text-[14px]"
            />
            <Textarea
                value={draft.body}
                onChange={(event) => onChange({ ...draft, body: event.target.value })}
                placeholder="Keep it clear and actionable..."
                className="min-h-24 rounded-xl border-neutral-200 bg-neutral-50 text-[14px]"
            />

            <div className="flex flex-wrap gap-1.5">
                {(['all', 'tenant', 'landlord', 'admin'] as AnnouncementAudience[]).map((audience) => (
                    <button
                        key={audience}
                        type="button"
                        onClick={() => onChange({ ...draft, audience })}
                        className={cn(
                            'rounded-full px-3 py-1 text-[12px] font-semibold capitalize transition-colors',
                            draft.audience === audience
                                ? 'bg-neutral-900 text-white'
                                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                        )}
                    >
                        {audience}
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
                {(['normal', 'important', 'critical'] as AnnouncementPriority[]).map((priority) => (
                    <button
                        key={priority}
                        type="button"
                        onClick={() => onChange({ ...draft, priority })}
                        className={cn(
                            'rounded-full px-3 py-1 text-[12px] font-semibold capitalize transition-colors',
                            draft.priority === priority
                                ? 'bg-neutral-900 text-white'
                                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                        )}
                    >
                        {priority}
                    </button>
                ))}
            </div>

            <button
                type="button"
                onClick={() => onChange({ ...draft, isPinned: !draft.isPinned })}
                className={cn(
                    'w-full rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold transition-colors',
                    draft.isPinned
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-500'
                )}
            >
                {draft.isPinned ? 'Pinned announcement' : 'Pin announcement'}
            </button>

            <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full rounded-full bg-[#007AFF] text-white transition-colors hover:bg-[#0066D6]"
            >
                {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <>
                        <Send className="mr-2 h-4 w-4" />
                        Publish
                    </>
                )}
            </Button>
        </form>
    )
}
