'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { Search, MessageSquare, ChevronLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ChatThread } from '@/components/chat/ChatThread'
import { getDisplayName } from '@/lib/user-name'
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"

export function AuthedChatInterface() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const activeId = searchParams.get('id')

    const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(activeId)
    const [searchQuery, setSearchQuery] = useState('')
    const [showMobileChat, setShowMobileChat] = useState(false)

    const currentUser = useQuery(api.users.currentUser)
    const inquiries = useQuery(api.inquiries.getUserInquiries)
    const messages = useQuery(
        api.messages.getByInquiry,
        selectedInquiryId ? { inquiryId: selectedInquiryId as Id<"inquiries"> } : "skip"
    )

    // Filter inquiries
    const filteredInquiries = (inquiries || []).filter((inquiry: any) =>
        inquiry.property?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getDisplayName(inquiry.otherParty).toLowerCase().includes(searchQuery.toLowerCase())
    )

    const selectedInquiry = (inquiries || []).find((i: any) => i._id === selectedInquiryId)

    useEffect(() => {
        if (activeId) {
            setSelectedInquiryId(activeId)
            setShowMobileChat(true)
        }
    }, [activeId])

    const handleSelectInquiry = (id: string) => {
        setSelectedInquiryId(id)
        setShowMobileChat(true)
        router.push(`/chat?id=${id}`, { scroll: false })
    }

    const handleBackToList = () => {
        setShowMobileChat(false)
    }

    // Loading state
    if (currentUser === undefined || inquiries === undefined) {
        return (
            <div className="flex h-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-lime-500/20 border-t-lime-500 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading messages...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-1 overflow-hidden bg-background">
            {/* Sidebar - Conversation List */}
            <div className={cn(
                "w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-background",
                showMobileChat && "hidden md:flex"
            )}>
                {/* Header */}
                <div className="p-5 border-b border-border">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-semibold text-foreground">Messages</h1>
                        <span className="text-sm text-muted-foreground">
                            {filteredInquiries.length} conversation{filteredInquiries.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search conversations..."
                            className="pl-10 bg-sidebar-accent border-0 rounded-lg h-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Conversation List */}
                <ScrollArea className="flex-1">
                    <div className="p-2">
                        {filteredInquiries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <div className="h-12 w-12 rounded-full bg-sidebar-accent flex items-center justify-center mb-4">
                                    <MessageSquare className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <p className="font-medium text-foreground mb-1">No messages yet</p>
                                <p className="text-sm text-muted-foreground">
                                    Start a conversation by inquiring about a property
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredInquiries.map((inquiry: any) => (
                                    <button
                                        key={inquiry._id}
                                        onClick={() => handleSelectInquiry(inquiry._id)}
                                        className={cn(
                                            "w-full flex items-start gap-3 p-3 text-left rounded-xl transition-all duration-200",
                                            selectedInquiryId === inquiry._id
                                                ? "bg-sidebar-accent"
                                                : "hover:bg-sidebar-accent/50"
                                        )}
                                    >
                                        <Avatar className="h-11 w-11 border border-border shrink-0">
                                            <AvatarImage src={inquiry.otherParty?.avatarUrl} />
                                            <AvatarFallback className="bg-sidebar-accent text-foreground font-medium">
                                                {getDisplayName(inquiry.otherParty).charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="font-medium text-foreground truncate">
                                                    {getDisplayName(inquiry.otherParty)}
                                                </span>
                                                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                                                    {formatDistanceToNow(new Date(inquiry.updatedAt || inquiry._creationTime), { addSuffix: false })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate mb-1">
                                                {inquiry.property?.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground/70 truncate">
                                                {inquiry.lastMessage?.content || inquiry.message || 'No messages yet'}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Chat Thread Area */}
            <div className={cn(
                "flex-1 flex flex-col bg-background overflow-hidden",
                !showMobileChat && "hidden md:flex"
            )}>
                {selectedInquiry ? (
                    <>
                        {/* Chat Header */}
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
                            {/* Mobile back button */}
                            <button
                                onClick={handleBackToList}
                                className="md:hidden h-9 w-9 rounded-lg flex items-center justify-center hover:bg-sidebar-accent transition-colors"
                            >
                                <ChevronLeft className="h-5 w-5 text-foreground" />
                            </button>

                            <Avatar className="h-10 w-10 border border-border">
                                <AvatarImage src={selectedInquiry.otherParty?.avatarUrl} />
                                <AvatarFallback className="bg-sidebar-accent text-foreground font-medium">
                                    {getDisplayName(selectedInquiry.otherParty).charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <h2 className="font-medium text-foreground truncate">
                                    {getDisplayName(selectedInquiry.otherParty)}
                                </h2>
                                <p className="text-sm text-muted-foreground truncate">
                                    {selectedInquiry.property?.title}
                                </p>
                            </div>
                        </div>

                        {/* Messages Thread */}
                        <div className="flex-1 overflow-hidden">
                            <ChatThread
                                inquiryId={selectedInquiry._id}
                                messages={messages || []}
                                currentUserId={currentUser?._id || ''}
                                otherParty={selectedInquiry.otherParty}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="h-16 w-16 rounded-2xl bg-sidebar-accent flex items-center justify-center mb-4">
                            <MessageSquare className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h2 className="text-lg font-medium text-foreground mb-2">
                            Select a conversation
                        </h2>
                        <p className="text-muted-foreground max-w-sm">
                            Choose a conversation from the sidebar to view messages
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
