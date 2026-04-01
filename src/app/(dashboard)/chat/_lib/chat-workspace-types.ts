export type ConversationKind = 'inquiry' | 'support'
export type InboxFilter = 'all' | 'inquiry' | 'support'
export type SupportPriority = 'normal' | 'high' | 'urgent'
export type SupportStatus = 'open' | 'pending' | 'resolved'
export type AnnouncementPriority = 'normal' | 'important' | 'critical'
export type AnnouncementAudience = 'all' | 'tenant' | 'landlord' | 'admin'

export interface SupportDraft {
    subject: string
    category: string
    priority: SupportPriority
    content: string
}

export interface AnnouncementDraft {
    title: string
    body: string
    audience: AnnouncementAudience
    priority: AnnouncementPriority
    isPinned: boolean
}

export interface InboxItem {
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
