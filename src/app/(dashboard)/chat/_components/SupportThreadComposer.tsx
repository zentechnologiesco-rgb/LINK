'use client'

import type { FormEvent } from 'react'
import { LifeBuoy, Loader2 } from '@/components/ui/icons'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

import { supportCategories } from '../_lib/chat-workspace-helpers'
import type {
    SupportDraft,
    SupportPriority,
} from '../_lib/chat-workspace-types'

export function SupportThreadComposer({
    draft,
    onChange,
    onSubmit,
    isSubmitting,
}: {
    draft: SupportDraft
    onChange: (nextDraft: SupportDraft) => void
    onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
    isSubmitting: boolean
}) {
    return (
        <form onSubmit={onSubmit} className="space-y-3 pt-1">
            <Input
                value={draft.subject}
                onChange={(event) => onChange({ ...draft, subject: event.target.value })}
                placeholder="Subject"
                className="h-11 rounded-xl border-neutral-200 bg-neutral-50 text-[14px]"
            />

            <div className="flex flex-wrap gap-1.5">
                {supportCategories.map((category) => (
                    <button
                        key={category}
                        type="button"
                        onClick={() => onChange({ ...draft, category })}
                        className={cn(
                            'rounded-full px-3 py-1 text-[12px] font-semibold transition-colors',
                            draft.category === category
                                ? 'bg-neutral-900 text-white'
                                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                        )}
                    >
                        {category}
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
                {(['normal', 'high', 'urgent'] as SupportPriority[]).map((priority) => (
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

            <Textarea
                value={draft.content}
                onChange={(event) => onChange({ ...draft, content: event.target.value })}
                placeholder="Tell us what's blocked and what you need."
                className="min-h-28 rounded-xl border-neutral-200 bg-neutral-50 text-[14px]"
            />

            <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full rounded-full bg-[#007AFF] text-white transition-colors hover:bg-[#0066D6]"
            >
                {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <>
                        <LifeBuoy className="mr-2 h-4 w-4" />
                        Start support chat
                    </>
                )}
            </Button>
        </form>
    )
}
