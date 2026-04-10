'use client'

import {
    type FormEvent,
    type KeyboardEvent,
    type PointerEvent,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    useCallback,
} from 'react'
import { format, isSameDay, isToday, isYesterday } from 'date-fns'
import { ArrowUp, Loader2 } from '@/components/ui/icons'

import { UserAvatar } from '@/components/ui/user-avatar'
import { cn } from '@/lib/utils'

/* ───────────────────────── types ───────────────────────── */

interface ChatIdentity {
    fullName?: string | null
    name?: string | null
    email?: string | null
    avatarUrl?: string | null
}

interface ChatMessage {
    _id: string
    content: string
    _creationTime: number
    senderId: string
}

interface ChatThreadProps {
    messages: ChatMessage[]
    currentUserId: string
    onSendMessage: (content: string) => Promise<void>
    isSending?: boolean
    otherParty?: ChatIdentity | null
    placeholder?: string
    emptyTitle?: string
    emptyDescription?: string
    submitLabel?: string
}

/* ───────────────────── helpers ───────────────────── */

function formatDayLabel(date: Date) {
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'EEEE, MMMM d')
}

function shouldShowDayMarker(messages: ChatMessage[], index: number) {
    if (index === 0) return true
    return !isSameDay(
        new Date(messages[index - 1]._creationTime),
        new Date(messages[index]._creationTime)
    )
}

/* ───────────────── component ───────────────── */

export function ChatThread({
    messages,
    currentUserId,
    onSendMessage,
    isSending = false,
    otherParty,
    placeholder = 'Message…',
    emptyTitle = 'No messages yet',
    emptyDescription = 'Send a message to start the conversation.',
}: ChatThreadProps) {
    const [draft, setDraft] = useState('')
    const scrollAreaRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const prevMessageCountRef = useRef(messages.length)

    const scrollThreadToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
        scrollAreaRef.current?.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior,
        })
    }, [])

    /* ── auto-resize textarea ── */
    const resizeTextarea = useCallback(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${Math.min(el.scrollHeight, 120)}px`
    }, [])

    useLayoutEffect(() => {
        resizeTextarea()
    }, [draft, resizeTextarea])

    /* ── scroll to bottom on new messages ── */
    useEffect(() => {
        const isNewMessage = messages.length > prevMessageCountRef.current
        prevMessageCountRef.current = messages.length

        scrollThreadToBottom(isNewMessage ? 'smooth' : 'auto')
    }, [messages.length, scrollThreadToBottom])

    /* ── send ── */
    async function submitDraft() {
        const content = draft.trim()
        if (!content || isSending) return
        setDraft('')
        await onSendMessage(content)
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        void submitDraft()
    }

    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            void submitDraft()
        }
    }

    function handleComposerFocus() {
        window.setTimeout(() => {
            scrollThreadToBottom('auto')
        }, 180)
    }

    function handleComposerPointerDown(event: PointerEvent<HTMLTextAreaElement>) {
        const textarea = textareaRef.current
        if (!textarea || typeof window === 'undefined') return

        const isMobile = window.matchMedia('(max-width: 1023px)').matches
        if (!isMobile || document.activeElement === textarea) return

        event.preventDefault()
        textarea.focus({ preventScroll: true })

        const cursorPosition = textarea.value.length
        textarea.setSelectionRange(cursorPosition, cursorPosition)
    }

    /* ── empty state ── */
    if (messages.length === 0) {
        return (
            <div className="flex h-full flex-col">
                <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                    <UserAvatar className="h-16 w-16 ring-2 ring-neutral-100" user={otherParty} />
                    <p className="mt-4 text-[17px] font-semibold tracking-[-0.2px] text-neutral-900">
                        {emptyTitle}
                    </p>
                    <p className="mt-1 max-w-[280px] text-[14px] leading-[1.4] text-neutral-400">
                        {emptyDescription}
                    </p>
                </div>

                {/* input bar even on empty state */}
                <div className="border-t border-neutral-100 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-4">
                    <form
                        onSubmit={handleSubmit}
                        className="mx-auto flex w-full max-w-3xl items-end gap-2"
                    >
                        <div className="flex min-h-[44px] flex-1 items-end rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2">
                            <textarea
                                ref={textareaRef}
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onPointerDown={handleComposerPointerDown}
                                onFocus={handleComposerFocus}
                                disabled={isSending}
                                placeholder={placeholder}
                                rows={1}
                                className="max-h-[120px] w-full resize-none overflow-y-auto border-0 bg-transparent text-[16px] leading-[1.35] text-neutral-900 outline-none placeholder:text-neutral-400 sm:text-[15px]"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!draft.trim() || isSending}
                            className={cn(
                                'flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full transition-all duration-200',
                                draft.trim()
                                    ? 'bg-[#007AFF] text-white shadow-sm active:scale-90'
                                    : 'bg-neutral-200 text-neutral-400'
                            )}
                            aria-label="Send message"
                        >
                            {isSending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
                            )}
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    /* ── messages ── */
    return (
        <div className="flex h-full flex-col">
            <div ref={scrollAreaRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5">
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-[3px]">
                    {messages.map((message, index) => {
                        const isCurrentUser = message.senderId === currentUserId
                        const prevMessage = messages[index - 1]
                        const nextMessage = messages[index + 1]

                        const isSequenceStart = !prevMessage || prevMessage.senderId !== message.senderId
                        const isSequenceEnd = !nextMessage || nextMessage.senderId !== message.senderId

                        // Day marker check includes cross-day sequences
                        const showDay = shouldShowDayMarker(messages, index)

                        // Determine bubble radius (tail on last bubble of sequence)
                        const getBubbleRadius = () => {
                            if (isCurrentUser) {
                                if (isSequenceStart && isSequenceEnd) return 'rounded-[20px] rounded-br-[6px]'
                                if (isSequenceEnd) return 'rounded-[20px] rounded-br-[6px]'
                                if (isSequenceStart) return 'rounded-[20px] rounded-tr-[14px]'
                                return 'rounded-[20px] rounded-tr-[14px] rounded-br-[14px]'
                            }
                            if (isSequenceStart && isSequenceEnd) return 'rounded-[20px] rounded-bl-[6px]'
                            if (isSequenceEnd) return 'rounded-[20px] rounded-bl-[6px]'
                            if (isSequenceStart) return 'rounded-[20px] rounded-tl-[14px]'
                            return 'rounded-[20px] rounded-tl-[14px] rounded-bl-[14px]'
                        }

                        return (
                            <div key={message._id}>
                                {showDay && (
                                    <div className="flex justify-center py-3 first:pt-1">
                                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-medium text-neutral-500">
                                            {formatDayLabel(new Date(message._creationTime))}
                                        </span>
                                    </div>
                                )}

                                <div
                                    className={cn(
                                        'flex animate-in fade-in duration-200',
                                        isCurrentUser ? 'justify-end' : 'justify-start',
                                        isSequenceStart && index > 0 && !showDay && 'mt-2'
                                    )}
                                >
                                    {/* Other party avatar — only on first message of sequence */}
                                    {!isCurrentUser && isSequenceEnd ? (
                                        <UserAvatar className="mr-1.5 h-6 w-6 shrink-0 self-end" user={otherParty} />
                                    ) : !isCurrentUser ? (
                                        <div className="mr-1.5 w-6 shrink-0" />
                                    ) : null}

                                    <div className={cn('max-w-[75%] lg:max-w-[65%]')}>
                                        <div
                                            className={cn(
                                                'px-3.5 py-2 text-[15px] leading-[1.38] break-words',
                                                getBubbleRadius(),
                                                isCurrentUser
                                                    ? 'bg-[#007AFF] text-white'
                                                    : 'bg-[#E9E9EB] text-[#1C1C1E]'
                                            )}
                                        >
                                            {message.content}
                                        </div>

                                        {/* Timestamp — shown at end of each sequence */}
                                        {isSequenceEnd && (
                                            <p
                                                className={cn(
                                                    'mt-1 px-1 text-[11px] text-neutral-400',
                                                    isCurrentUser ? 'text-right' : 'text-left'
                                                )}
                                            >
                                                {format(new Date(message._creationTime), 'h:mm a')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* ── floating input bar ── */}
            <div className="border-t border-neutral-100 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-4">
                <form
                    onSubmit={handleSubmit}
                    className="mx-auto flex w-full max-w-3xl items-end gap-2"
                >
                    <div className="flex min-h-[44px] flex-1 items-end rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2">
                        <textarea
                            ref={textareaRef}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onPointerDown={handleComposerPointerDown}
                            onFocus={handleComposerFocus}
                            disabled={isSending}
                            placeholder={placeholder}
                            rows={1}
                            className="max-h-[120px] w-full resize-none overflow-y-auto border-0 bg-transparent text-[16px] leading-[1.35] text-neutral-900 outline-none placeholder:text-neutral-400 sm:text-[15px]"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!draft.trim() || isSending}
                        className={cn(
                            'flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full transition-all duration-200',
                            draft.trim()
                                ? 'bg-[#007AFF] text-white shadow-sm active:scale-90'
                                : 'bg-neutral-200 text-neutral-400'
                        )}
                        aria-label="Send message"
                    >
                        {isSending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
