'use client'

import {
    startTransition,
    type FormEvent,
    useDeferredValue,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import {
    ArrowLeft,
    ChevronDown,
    LifeBuoy,
    Loader2,
    Megaphone,
    Search,
    Send,
    SquarePen,
    X,
} from 'lucide-react'

import { ChatThread } from '@/components/chat/ChatThread'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { getDisplayName } from '@/lib/user-name'
import { useUser } from '@/components/providers/UserProvider'
import { api } from '../../../../convex/_generated/api'
import { type Id } from '../../../../convex/_generated/dataModel'

/* ─────────────────── types ─────────────────── */

type ConversationKind = 'inquiry' | 'support'
type InboxFilter = 'all' | 'inquiry' | 'support'
type SupportPriority = 'normal' | 'high' | 'urgent'
type SupportStatus = 'open' | 'pending' | 'resolved'
type AnnouncementPriority = 'normal' | 'important' | 'critical'
type AnnouncementAudience = 'all' | 'tenant' | 'landlord' | 'admin'

interface SupportDraft {
    subject: string
    category: string
    priority: SupportPriority
    content: string
}

interface AnnouncementDraft {
    title: string
    body: string
    audience: AnnouncementAudience
    priority: AnnouncementPriority
    isPinned: boolean
}

interface InboxItem {
    kind: ConversationKind
    id: string
    avatar?: {
        fullName?: string | null
        email?: string | null
        avatarUrl?: string | null
    } | null
    title: string
    subtitle: string
    preview: string
    updatedAt: number
    unreadCount: number
    status: string
    statusTone: string
    searchText: string
}

/* ─────────────────── constants ─────────────────── */

const supportCategories = ['General', 'Payments', 'Verification', 'Properties', 'Urgent']

const defaultSupportDraft: SupportDraft = {
    subject: '',
    category: 'General',
    priority: 'normal',
    content: '',
}

const defaultAnnouncementDraft: AnnouncementDraft = {
    title: '',
    body: '',
    audience: 'all',
    priority: 'important',
    isPinned: true,
}

/* ─────────────────── helpers ─────────────────── */

function inquiryTone(status: string) {
    if (status === 'approved') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    if (status === 'rejected') return 'border-red-200 bg-red-50 text-red-700'
    if (status === 'completed') return 'border-neutral-200 bg-neutral-100 text-neutral-500'
    return 'border-amber-200 bg-amber-50 text-amber-700'
}

function supportStatusTone(status: SupportStatus) {
    if (status === 'resolved') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    if (status === 'pending') return 'border-sky-200 bg-sky-50 text-sky-700'
    return 'border-amber-200 bg-amber-50 text-amber-700'
}

function supportStatusLabel(status: SupportStatus) {
    if (status === 'resolved') return 'Resolved'
    if (status === 'pending') return 'Awaiting user'
    return 'Needs admin'
}

function relativeTime(ts: number) {
    const d = formatDistanceToNow(new Date(ts), { addSuffix: false })
    return d
        .replace(' minutes', 'm')
        .replace(' minute', 'm')
        .replace(' hours', 'h')
        .replace(' hour', 'h')
        .replace(' days', 'd')
        .replace(' day', 'd')
        .replace('less than a', '<1')
        .replace('about ', '')
}

/* ─────────── skeleton loader ─────────── */

function ConversationSkeleton() {
    return (
        <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
            <div className="h-12 w-12 shrink-0 rounded-full bg-neutral-100" />
            <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-4">
                    <div className="h-3.5 w-28 rounded-full bg-neutral-100" />
                    <div className="h-3 w-8 rounded-full bg-neutral-100" />
                </div>
                <div className="h-3 w-40 rounded-full bg-neutral-50" />
            </div>
        </div>
    )
}

/* ━━━━━━━━━━━━━━━━ ANNOUNCEMENT COMPOSER ━━━━━━━━━━━━━━━━ */

function AnnouncementComposer({
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
                placeholder="Keep it clear and actionable…"
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
                {draft.isPinned ? '📌 Pinned announcement' : 'Pin announcement'}
            </button>

            <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full rounded-full bg-[#007AFF] text-white hover:bg-[#0066D6] transition-colors"
            >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" />Publish</>}
            </Button>
        </form>
    )
}

/* ━━━━━━━━━━━━━━━━ MAIN COMPONENT ━━━━━━━━━━━━━━━━ */

export function AuthedChatInterface() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const requestedId = searchParams.get('id')
    const requestedKind = searchParams.get('kind')
    const requestedPropertyId = searchParams.get('propertyId')
    const requestedUnitId = searchParams.get('unitId')

    const [searchQuery, setSearchQuery] = useState('')
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [viewFilter, setViewFilter] = useState<InboxFilter>('all')
    const [supportDialogOpen, setSupportDialogOpen] = useState(false)
    const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false)
    const [supportDraft, setSupportDraft] = useState<SupportDraft>(defaultSupportDraft)
    const [announcementDraft, setAnnouncementDraft] = useState<AnnouncementDraft>(defaultAnnouncementDraft)
    const [isSendingMessage, setIsSendingMessage] = useState(false)
    const [isCreatingSupportThread, setIsCreatingSupportThread] = useState(false)
    const [isPublishingAnnouncement, setIsPublishingAnnouncement] = useState(false)
    const [isUpdatingSupportStatus, setIsUpdatingSupportStatus] = useState<SupportStatus | null>(null)
    const [mobileThreadViewportHeight, setMobileThreadViewportHeight] = useState<number | null>(null)

    const deferredSearchQuery = useDeferredValue(searchQuery)

    /* ── queries ── */
    const { user: currentUser } = useUser()
    const inquiries = useQuery(api.inquiries.getUserInquiries)
    const draftInquiryContext = useQuery(
        api.inquiries.getDraftContext,
        !requestedId && requestedPropertyId
            ? {
                propertyId: requestedPropertyId as Id<'properties'>,
                unitId: requestedUnitId ? requestedUnitId as Id<'propertyUnits'> : undefined,
            }
            : 'skip'
    )
    const supportThreads = useQuery(api.support.getThreads)
    const announcements = useQuery(
        api.announcements.getFeed,
        currentUser ? { limit: currentUser.role === 'admin' ? 8 : 5 } : 'skip'
    )

    /* ── mutations ── */
    const createInquiry = useMutation(api.inquiries.create)
    const sendInquiryMessage = useMutation(api.messages.send)
    const markInquiryAsRead = useMutation(api.messages.markAsRead)
    const sendSupportMessage = useMutation(api.support.sendMessage)
    const createSupportThread = useMutation(api.support.createThread)
    const markSupportMessagesAsRead = useMutation(api.support.markMessagesAsRead)
    const updateSupportStatus = useMutation(api.support.updateThreadStatus)
    const publishAnnouncement = useMutation(api.announcements.create)

    useEffect(() => {
        if (currentUser?.role === 'admin') {
            setViewFilter('support')
        }
    }, [currentUser?.role])

    const inquiryList = useMemo(() => inquiries ?? [], [inquiries])
    const supportList = useMemo(() => supportThreads ?? [], [supportThreads])
    const announcementFeed = useMemo(() => announcements ?? [], [announcements])

    const currentUserId = currentUser?._id ?? ''
    const isAdmin = currentUser?.role === 'admin'

    /* ── selection ── */
    const selectedInquiry = requestedId
        ? inquiryList.find((inquiry) => inquiry._id === requestedId) ?? null
        : null
    const selectedSupportThread = requestedId
        ? supportList.find((thread) => thread._id === requestedId) ?? null
        : null

    const selectedKind: ConversationKind | null = requestedKind === 'support'
        ? (selectedSupportThread ? 'support' : null)
        : requestedKind === 'inquiry'
            ? (selectedInquiry ? 'inquiry' : selectedSupportThread ? 'support' : null)
            : selectedInquiry
                ? 'inquiry'
                : selectedSupportThread
                    ? 'support'
                    : null
    const isDraftInquiry = !requestedId && requestedPropertyId !== null && draftInquiryContext != null
    const hasSelection = Boolean(selectedKind || isDraftInquiry)

    const inquiryMessages = useQuery(
        api.messages.getByInquiry,
        selectedKind === 'inquiry' && selectedInquiry
            ? { inquiryId: selectedInquiry._id as Id<'inquiries'> }
            : 'skip'
    )
    const supportMessages = useQuery(
        api.support.getMessages,
        selectedKind === 'support' && selectedSupportThread
            ? { threadId: selectedSupportThread._id as Id<'supportThreads'> }
            : 'skip'
    )

    /* ── mark as read ── */
    useEffect(() => {
        if (selectedKind === 'inquiry' && selectedInquiry) {
            void markInquiryAsRead({ inquiryId: selectedInquiry._id as Id<'inquiries'> })
        }
        if (selectedKind === 'support' && selectedSupportThread) {
            void markSupportMessagesAsRead({ threadId: selectedSupportThread._id as Id<'supportThreads'> })
        }
    }, [
        markInquiryAsRead,
        markSupportMessagesAsRead,
        selectedInquiry,
        selectedKind,
        selectedSupportThread,
    ])

    useEffect(() => {
        if (typeof window === 'undefined') return

        const mediaQuery = window.matchMedia('(max-width: 1023px)')

        const syncMobileChatClass = () => {
            const shouldLockPage = hasSelection && mediaQuery.matches
            document.documentElement.classList.toggle('chat-mobile-open', shouldLockPage)
            document.body.classList.toggle('chat-mobile-open', shouldLockPage)
        }

        syncMobileChatClass()
        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', syncMobileChatClass)
        } else {
            mediaQuery.addListener(syncMobileChatClass)
        }

        return () => {
            if (typeof mediaQuery.removeEventListener === 'function') {
                mediaQuery.removeEventListener('change', syncMobileChatClass)
            } else {
                mediaQuery.removeListener(syncMobileChatClass)
            }
            document.documentElement.classList.remove('chat-mobile-open')
            document.body.classList.remove('chat-mobile-open')
        }
    }, [hasSelection])

    useEffect(() => {
        if (typeof window === 'undefined') return

        const mediaQuery = window.matchMedia('(max-width: 1023px)')
        const headerHeight = 64

        const syncViewportHeight = () => {
            if (!hasSelection || !mediaQuery.matches) {
                setMobileThreadViewportHeight(null)
                return
            }

            const viewportHeight = window.visualViewport?.height ?? window.innerHeight
            setMobileThreadViewportHeight(Math.max(0, Math.round(viewportHeight - headerHeight)))
        }

        syncViewportHeight()

        const visualViewport = window.visualViewport
        window.addEventListener('resize', syncViewportHeight)

        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', syncViewportHeight)
        } else {
            mediaQuery.addListener(syncViewportHeight)
        }

        if (visualViewport) {
            visualViewport.addEventListener('resize', syncViewportHeight)
            visualViewport.addEventListener('scroll', syncViewportHeight)
        }

        return () => {
            window.removeEventListener('resize', syncViewportHeight)

            if (typeof mediaQuery.removeEventListener === 'function') {
                mediaQuery.removeEventListener('change', syncViewportHeight)
            } else {
                mediaQuery.removeListener(syncViewportHeight)
            }

            if (visualViewport) {
                visualViewport.removeEventListener('resize', syncViewportHeight)
                visualViewport.removeEventListener('scroll', syncViewportHeight)
            }
        }
    }, [hasSelection])

    /* ── inbox items ── */
    const inboxItems = useMemo<InboxItem[]>(() => {
        const inquiryItems: InboxItem[] = inquiryList.map((inquiry) => {
            const youPrefix = inquiry.lastMessage?.senderId === currentUserId ? 'You: ' : ''
            const preview = inquiry.lastMessage?.content
                ? `${youPrefix}${inquiry.lastMessage.content}`
                : inquiry.message || 'No messages yet'

            return {
                kind: 'inquiry',
                id: inquiry._id,
                avatar: inquiry.otherParty,
                title: getDisplayName(inquiry.otherParty, 'Property chat'),
                subtitle: inquiry.property?.title || 'Property inquiry',
                preview,
                updatedAt: inquiry.updatedAt ?? inquiry._creationTime,
                unreadCount: inquiry.unreadCount ?? 0,
                status: inquiry.status,
                statusTone: inquiryTone(inquiry.status),
                searchText: `${preview} ${inquiry.property?.title ?? ''} ${getDisplayName(inquiry.otherParty, '')}`.toLowerCase(),
            }
        })

        const supportItems: InboxItem[] = supportList.map((thread) => ({
            kind: 'support',
            id: thread._id,
            avatar: isAdmin ? thread.requester : thread.assignedAdmin,
            title: isAdmin ? getDisplayName(thread.requester, 'Support request') : 'LINK Support',
            subtitle: isAdmin
                ? thread.subject
                : thread.assignedAdmin
                    ? `Handled by ${getDisplayName(thread.assignedAdmin, 'Support')}`
                    : 'Talk to the admin team',
            preview: thread.lastMessagePreview || thread.subject,
            updatedAt: thread.updatedAt ?? thread._creationTime,
            unreadCount: thread.unreadCount ?? 0,
            status: supportStatusLabel(thread.status),
            statusTone: supportStatusTone(thread.status),
            searchText: `${thread.subject} ${thread.category ?? ''} ${thread.lastMessagePreview ?? ''} ${getDisplayName(thread.requester, '')}`.toLowerCase(),
        }))

        return (isAdmin ? supportItems : [...inquiryItems, ...supportItems])
            .filter((item) => (viewFilter === 'all' ? true : item.kind === viewFilter))
            .filter((item) => {
                const normalizedSearch = deferredSearchQuery.trim().toLowerCase()
                if (!normalizedSearch) return true
                return item.searchText.includes(normalizedSearch)
            })
            .sort((a, b) => b.updatedAt - a.updatedAt)
    }, [
        currentUserId,
        deferredSearchQuery,
        inquiryList,
        isAdmin,
        supportList,
        viewFilter,
    ]) 

    /* ── derived active state ── */
    const activeMessages = selectedKind === 'support'
        ? (supportMessages ?? [])
        : selectedKind === 'inquiry'
            ? (inquiryMessages ?? [])
            : []
    const activeOtherParty = selectedKind === 'support'
        ? (isAdmin ? selectedSupportThread?.requester : selectedSupportThread?.assignedAdmin)
        : isDraftInquiry
            ? draftInquiryContext?.otherParty
            : selectedInquiry?.otherParty

    const activeTitle = selectedKind === 'support'
        ? (isAdmin ? getDisplayName(selectedSupportThread?.requester, 'Support request') : 'LINK Support')
        : isDraftInquiry
            ? getDisplayName(draftInquiryContext?.otherParty, 'Property chat')
            : getDisplayName(selectedInquiry?.otherParty, 'Property chat')

    const activeSubtitle = selectedKind === 'support'
        ? (isAdmin
            ? selectedSupportThread?.subject || 'Support thread'
            : selectedSupportThread?.assignedAdmin
                ? `Handled by ${getDisplayName(selectedSupportThread.assignedAdmin, 'Support')}`
                : 'Admin support thread')
        : isDraftInquiry
            ? draftInquiryContext?.unit?.title || draftInquiryContext?.unit?.unitCode || draftInquiryContext?.property.title || 'Property inquiry'
            : selectedInquiry?.property?.title || 'Property inquiry'

    /* ── handlers ── */

    function openConversation(kind: ConversationKind, id: string) {
        const params = new URLSearchParams({ kind, id })
        startTransition(() => router.push(`/chat?${params.toString()}`, { scroll: false }))
    }

    async function handleRefresh() {
        startTransition(() => router.refresh())
        await new Promise((resolve) => setTimeout(resolve, 300))
    }

    async function handleSendMessage(content: string) {
        setIsSendingMessage(true)
        try {
            if (selectedKind === 'support' && selectedSupportThread) {
                await sendSupportMessage({
                    threadId: selectedSupportThread._id as Id<'supportThreads'>,
                    content,
                })
                return
            }

            if (selectedKind === 'inquiry' && selectedInquiry) {
                await sendInquiryMessage({
                    inquiryId: selectedInquiry._id as Id<'inquiries'>,
                    content,
                })
                return
            }

            if (isDraftInquiry && requestedPropertyId) {
                const inquiryId = await createInquiry({
                    propertyId: requestedPropertyId as Id<'properties'>,
                    unitId: requestedUnitId ? requestedUnitId as Id<'propertyUnits'> : undefined,
                    message: content,
                })

                const params = new URLSearchParams({
                    kind: 'inquiry',
                    id: inquiryId,
                })

                startTransition(() => router.replace(`/chat?${params.toString()}`, { scroll: false }))
            }
        } catch (error) {
            toast.error('Could not send message right now.')
            console.error(error)
            throw error
        } finally {
            setIsSendingMessage(false)
        }
    }

    async function handleCreateSupport(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsCreatingSupportThread(true)
        try {
            const threadId = await createSupportThread(supportDraft)
            setSupportDialogOpen(false)
            setSupportDraft(defaultSupportDraft)
            openConversation('support', threadId)
            toast.success('Support thread opened.')
        } catch (error) {
            toast.error('Could not start support thread.')
            console.error(error)
        } finally {
            setIsCreatingSupportThread(false)
        }
    }

    async function handlePublishAnnouncement(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsPublishingAnnouncement(true)
        try {
            await publishAnnouncement({
                title: announcementDraft.title,
                body: announcementDraft.body,
                audience: announcementDraft.audience,
                priority: announcementDraft.priority,
                isPinned: announcementDraft.isPinned,
            })
            setAnnouncementDraft(defaultAnnouncementDraft)
            setAnnouncementDialogOpen(false)
            toast.success('Announcement published.')
        } catch (error) {
            toast.error('Could not publish announcement.')
            console.error(error)
        } finally {
            setIsPublishingAnnouncement(false)
        }
    }

    async function handleSupportStatusChange(status: SupportStatus) {
        if (!selectedSupportThread) return

        setIsUpdatingSupportStatus(status)
        try {
            await updateSupportStatus({
                threadId: selectedSupportThread._id as Id<'supportThreads'>,
                status,
            })
        } catch (error) {
            toast.error('Could not update support status.')
            console.error(error)
        } finally {
            setIsUpdatingSupportStatus(null)
        }
    }

    /* ── early returns ── */

    if (currentUser === null) {
        return (
            <div className="flex h-[calc(100dvh-4rem)] items-center justify-center md:h-[calc(100dvh-5rem)]">
                <div className="max-w-xs px-6 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                        <Send className="h-7 w-7 text-neutral-400" />
                    </div>
                    <p className="mt-5 text-[17px] font-semibold tracking-[-0.2px] text-neutral-900">Sign in to chat</p>
                    <p className="mt-1.5 text-[14px] text-neutral-400">Your conversations and support threads live here.</p>
                </div>
            </div>
        )
    }

    if (
        currentUser === undefined ||
        inquiries === undefined ||
        supportThreads === undefined ||
        announcements === undefined ||
        (!requestedId && requestedPropertyId !== null && draftInquiryContext === undefined)
    ) {
        return (
            <div className="flex h-[calc(100dvh-4rem)] flex-col md:h-[calc(100dvh-5rem)]">
                {/* skeleton header */}
                <div className="border-b border-neutral-100 px-4 py-4">
                    <div className="h-5 w-32 rounded-full bg-neutral-100 animate-pulse" />
                    <div className="mt-3 h-10 w-full rounded-full bg-neutral-50 animate-pulse" />
                </div>
                {/* skeleton rows */}
                <div className="flex-1 overflow-hidden">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <ConversationSkeleton key={i} />
                    ))}
                </div>
            </div>
        )
    }

    const mobileThreadShellStyle = hasSelection
        ? { height: mobileThreadViewportHeight !== null ? `${mobileThreadViewportHeight}px` : 'calc(100dvh - 4rem)' }
        : undefined

    return (
        <>
            <div
                className={cn(
                    'flex flex-col overflow-hidden bg-white lg:flex-row',
                    hasSelection
                        ? 'fixed inset-x-0 top-16 z-40 lg:static lg:h-[calc(100dvh-5rem)]'
                        : 'h-[calc(100dvh-4rem)] md:h-[calc(100dvh-5rem)]'
                )}
                style={mobileThreadShellStyle}
            >

                {/* ━━━━━━━━━━━━━━━━ CONVERSATION LIST ━━━━━━━━━━━━━━━━ */}
                <section
                    className={cn(
                        'flex min-h-0 w-full flex-col border-neutral-100 lg:w-[380px] lg:shrink-0 lg:border-r',
                        hasSelection ? 'hidden lg:flex' : 'flex'
                    )}
                >
                    {/* ── header ── */}
                    <div className="px-4 pb-2 pt-3">
                        <div className="flex items-center justify-between">
                            <h1 className="text-[28px] font-bold tracking-[-0.5px] text-neutral-900">
                                {isAdmin ? 'Inbox' : 'Messages'}
                            </h1>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                                    className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 active:scale-95"
                                    aria-label="Search"
                                >
                                    {isSearchOpen ? <X className="h-4.5 w-4.5" /> : <Search className="h-4.5 w-4.5" />}
                                </button>

                                {!isAdmin && (
                                    <button
                                        type="button"
                                        onClick={() => setSupportDialogOpen(true)}
                                        className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 active:scale-95"
                                        aria-label="New support thread"
                                    >
                                        <SquarePen className="h-4.5 w-4.5" />
                                    </button>
                                )}

                                {isAdmin && (
                                    <button
                                        type="button"
                                        onClick={() => setAnnouncementDialogOpen(true)}
                                        className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 active:scale-95"
                                        aria-label="New announcement"
                                    >
                                        <SquarePen className="h-4.5 w-4.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* ── search bar (collapsible) ── */}
                        <div
                            className={cn(
                                'overflow-hidden transition-all duration-250 ease-out',
                                isSearchOpen ? 'mt-2 max-h-12 opacity-100' : 'max-h-0 opacity-0'
                            )}
                        >
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search conversations"
                                    className="h-10 w-full rounded-xl bg-neutral-100 pl-9 pr-3 text-[14px] text-neutral-900 outline-none placeholder:text-neutral-400 transition-colors focus:bg-neutral-50 focus:ring-1 focus:ring-neutral-200"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* ── filter pills ── */}
                        <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                            {!isAdmin && (
                                <button
                                    type="button"
                                    onClick={() => setViewFilter('all')}
                                    className={cn(
                                        'shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-200 active:scale-95',
                                        viewFilter === 'all'
                                            ? 'bg-neutral-900 text-white'
                                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                    )}
                                >
                                    All
                                </button>
                            )}
                            {!isAdmin && (
                                <button
                                    type="button"
                                    onClick={() => setViewFilter('inquiry')}
                                    className={cn(
                                        'shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-200 active:scale-95',
                                        viewFilter === 'inquiry'
                                            ? 'bg-neutral-900 text-white'
                                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                    )}
                                >
                                    Chats
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setViewFilter('support')}
                                className={cn(
                                    'shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-200 active:scale-95',
                                    viewFilter === 'support'
                                        ? 'bg-neutral-900 text-white'
                                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                )}
                            >
                                Support
                            </button>
                        </div>
                    </div>

                    {/* ── list ── */}
                    <PullToRefresh onRefresh={handleRefresh} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                        {inboxItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                                    <Send className="h-7 w-7 text-neutral-300" />
                                </div>
                                <p className="mt-4 text-[15px] font-semibold text-neutral-900">No conversations</p>
                                <p className="mt-1 text-[13px] text-neutral-400">
                                    {deferredSearchQuery
                                        ? 'No results for this search.'
                                        : 'Start a property chat or open support.'}
                                </p>
                                {!isAdmin && !deferredSearchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSupportDialogOpen(true)}
                                        className="mt-4 rounded-full bg-[#007AFF] px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#0066D6] active:scale-95"
                                    >
                                        Contact support
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div>
                                {/* announcements banner for non-admin */}
                                {!isAdmin && announcementFeed.length > 0 && (
                                    <div className="border-b border-neutral-100 px-4 py-3">
                                        <div className="flex items-center gap-2 text-[12px] font-semibold text-neutral-500 uppercase tracking-wide">
                                            <Megaphone className="h-3.5 w-3.5" />
                                            Latest announcement
                                        </div>
                                        <p className="mt-1 text-[13px] font-medium text-neutral-900 line-clamp-1">
                                            {announcementFeed[0].title}
                                        </p>
                                        <p className="mt-0.5 text-[12px] text-neutral-400 line-clamp-1">
                                            {announcementFeed[0].body}
                                        </p>
                                    </div>
                                )}

                                {inboxItems.map((item) => {
                                    const selected = selectedKind === item.kind && requestedId === item.id
                                    const isUnread = item.unreadCount > 0

                                    return (
                                        <button
                                            key={`${item.kind}-${item.id}`}
                                            type="button"
                                            onClick={() => openConversation(item.kind, item.id)}
                                            className={cn(
                                                'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-neutral-100',
                                                selected
                                                    ? 'bg-neutral-50'
                                                    : 'hover:bg-neutral-50/60'
                                            )}
                                        >
                                            {/* avatar + unread dot */}
                                            <div className="relative shrink-0">
                                                <UserAvatar
                                                    className="h-12 w-12"
                                                    user={item.avatar}
                                                />
                                                {isUnread && (
                                                    <span className="absolute -right-0.5 top-0 h-3 w-3 rounded-full border-2 border-white bg-[#007AFF]" />
                                                )}
                                            </div>

                                            {/* text content */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-baseline justify-between gap-2">
                                                    <p className={cn(
                                                        'truncate text-[15px] tracking-[-0.1px]',
                                                        isUnread
                                                            ? 'font-semibold text-neutral-900'
                                                            : 'font-medium text-neutral-900'
                                                    )}>
                                                        {item.title}
                                                    </p>
                                                    <span className="shrink-0 text-[12px] text-neutral-400">
                                                        {relativeTime(item.updatedAt)}
                                                    </span>
                                                </div>
                                                <p className="truncate text-[13px] text-neutral-500">
                                                    {item.subtitle}
                                                </p>
                                                <p className={cn(
                                                    'mt-0.5 truncate text-[13px]',
                                                    isUnread
                                                        ? 'font-medium text-neutral-700'
                                                        : 'text-neutral-400'
                                                )}>
                                                    {item.preview}
                                                </p>
                                            </div>

                                            {/* status badge (only show on support items or non-default statuses) */}
                                            {item.kind === 'support' && (
                                                <Badge className={cn(
                                                    'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                                                    item.statusTone
                                                )}>
                                                    {item.status}
                                                </Badge>
                                            )}

                                            {/* chevron */}
                                            <ChevronDown className="h-4 w-4 -rotate-90 shrink-0 text-neutral-300 lg:hidden" />
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </PullToRefresh>
                </section>


                {/* ━━━━━━━━━━━━━━━━ THREAD VIEW ━━━━━━━━━━━━━━━━ */}
                <section
                    className={cn(
                        'flex min-h-0 flex-1 flex-col',
                        hasSelection ? 'flex' : 'hidden lg:flex'
                    )}
                >
                    {selectedKind || isDraftInquiry ? (
                        <>
                            {/* ── thread header ── */}
                            <div className="flex items-center gap-3 border-b border-neutral-100 px-3 py-2.5 sm:px-4">
                                {/* back button — mobile only */}
                                <button
                                    type="button"
                                    onClick={() => startTransition(() => router.push('/chat', { scroll: false }))}
                                    className="flex h-9 w-9 items-center justify-center rounded-full text-[#007AFF] transition-colors hover:bg-neutral-50 active:scale-95 lg:hidden"
                                    aria-label="Back to conversations"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </button>

                                <UserAvatar className="h-9 w-9" user={activeOtherParty} />

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[15px] font-semibold tracking-[-0.1px] text-neutral-900">
                                        {activeTitle}
                                    </p>
                                    <p className="truncate text-[12px] text-neutral-400">
                                        {activeSubtitle}
                                    </p>
                                </div>

                                {selectedKind === 'support' && (
                                    <Badge className={cn(
                                        'shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
                                        supportStatusTone(selectedSupportThread?.status ?? 'open')
                                    )}>
                                        {supportStatusLabel(selectedSupportThread?.status ?? 'open')}
                                    </Badge>
                                )}
                            </div>

                            {/* ── admin status controls ── */}
                            {isAdmin && selectedKind === 'support' && selectedSupportThread && (
                                <div className="flex items-center gap-1.5 border-b border-neutral-50 px-4 py-2">
                                    <span className="mr-1 text-[11px] font-medium text-neutral-400 uppercase tracking-wide">Status</span>
                                    {(['open', 'pending', 'resolved'] as SupportStatus[]).map((status) => (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => void handleSupportStatusChange(status)}
                                            disabled={Boolean(isUpdatingSupportStatus)}
                                            className={cn(
                                                'rounded-full px-3 py-1 text-[11px] font-semibold transition-all duration-200 active:scale-95',
                                                selectedSupportThread.status === status
                                                    ? 'bg-neutral-900 text-white'
                                                    : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                                            )}
                                        >
                                            {isUpdatingSupportStatus === status ? '…' : supportStatusLabel(status)}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* ── messages ── */}
                            <div className="min-h-0 flex-1">
                                {(selectedKind === 'inquiry' && inquiryMessages === undefined) ||
                                    (selectedKind === 'support' && supportMessages === undefined) ? (
                                    <div className="flex h-full items-center justify-center">
                                        <Loader2 className="h-5 w-5 animate-spin text-neutral-300" />
                                    </div>
                                ) : (
                                    <ChatThread
                                        messages={activeMessages}
                                        currentUserId={currentUserId}
                                        otherParty={activeOtherParty}
                                        onSendMessage={handleSendMessage}
                                        isSending={isSendingMessage}
                                        placeholder={selectedKind === 'support' ? 'Message support…' : 'Message…'}
                                        emptyTitle={selectedKind === 'support' ? 'Support thread opened' : 'Conversation started'}
                                        emptyDescription={selectedKind === 'support'
                                            ? 'Share the issue and an admin will reply here.'
                                            : 'Send a message to keep this conversation moving.'}
                                    />
                                )}
                            </div>
                        </>
                    ) : (
                        /* ── no selection (desktop) ── */
                        <div className="flex h-full flex-1 flex-col items-center justify-center text-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
                                <Send className="h-9 w-9 text-neutral-300" />
                            </div>
                            <p className="mt-5 text-[22px] font-semibold tracking-[-0.3px] text-neutral-900">
                                Your Messages
                            </p>
                            <p className="mt-1.5 max-w-[260px] text-[14px] leading-[1.4] text-neutral-400">
                                Select a conversation or start a new one.
                            </p>
                            {!isAdmin && (
                                <button
                                    type="button"
                                    onClick={() => setSupportDialogOpen(true)}
                                    className="mt-5 rounded-full bg-[#007AFF] px-6 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#0066D6] active:scale-95"
                                >
                                    Message support
                                </button>
                            )}
                        </div>
                    )}
                </section>
            </div>


            {/* ━━━━━━━━━━━━━━━━ SUPPORT DIALOG ━━━━━━━━━━━━━━━━ */}
            <Dialog open={supportDialogOpen} onOpenChange={setSupportDialogOpen}>
                <DialogContent className="max-w-lg rounded-2xl border-neutral-100 p-5 sm:p-6">
                    <DialogHeader>
                        <DialogTitle className="text-[17px] font-semibold tracking-[-0.2px]">
                            Message LINK Support
                        </DialogTitle>
                        <DialogDescription className="text-[13px] text-neutral-400">
                            Start a dedicated support conversation.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateSupport} className="space-y-3 pt-1">
                        <Input
                            value={supportDraft.subject}
                            onChange={(e) => setSupportDraft((d) => ({ ...d, subject: e.target.value }))}
                            placeholder="Subject"
                            className="h-11 rounded-xl border-neutral-200 bg-neutral-50 text-[14px]"
                        />

                        <div className="flex flex-wrap gap-1.5">
                            {supportCategories.map((category) => (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => setSupportDraft((d) => ({ ...d, category }))}
                                    className={cn(
                                        'rounded-full px-3 py-1 text-[12px] font-semibold transition-colors',
                                        supportDraft.category === category
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
                                    onClick={() => setSupportDraft((d) => ({ ...d, priority }))}
                                    className={cn(
                                        'rounded-full px-3 py-1 text-[12px] font-semibold capitalize transition-colors',
                                        supportDraft.priority === priority
                                            ? 'bg-neutral-900 text-white'
                                            : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                                    )}
                                >
                                    {priority}
                                </button>
                            ))}
                        </div>

                        <Textarea
                            value={supportDraft.content}
                            onChange={(e) => setSupportDraft((d) => ({ ...d, content: e.target.value }))}
                            placeholder="Tell us what's blocked and what you need."
                            className="min-h-28 rounded-xl border-neutral-200 bg-neutral-50 text-[14px]"
                        />

                        <Button
                            type="submit"
                            disabled={isCreatingSupportThread}
                            className="h-11 w-full rounded-full bg-[#007AFF] text-white hover:bg-[#0066D6] transition-colors"
                        >
                            {isCreatingSupportThread ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <LifeBuoy className="h-4 w-4 mr-2" />
                                    Start support chat
                                </>
                            )}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>


            {/* ━━━━━━━━━━━━━━━━ ANNOUNCEMENT DIALOG ━━━━━━━━━━━━━━━━ */}
            <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
                <DialogContent className="max-w-lg rounded-2xl border-neutral-100 p-5 sm:p-6">
                    <DialogHeader>
                        <DialogTitle className="text-[17px] font-semibold tracking-[-0.2px]">
                            New announcement
                        </DialogTitle>
                        <DialogDescription className="text-[13px] text-neutral-400">
                            Publish an inbox announcement for users.
                        </DialogDescription>
                    </DialogHeader>

                    <AnnouncementComposer
                        draft={announcementDraft}
                        onChange={setAnnouncementDraft}
                        onSubmit={handlePublishAnnouncement}
                        isSubmitting={isPublishingAnnouncement}
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}
