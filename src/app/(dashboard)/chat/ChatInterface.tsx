'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { Search, MoreVertical, MessageSquare } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
        }
    }, [activeId])

    const handleSelectInquiry = (id: string) => {
        setSelectedInquiryId(id)
        router.push(`/chat?id=${id}`, { scroll: false })
    }

    if (currentUser === undefined || inquiries === undefined) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar List */}
            <div className="w-80 md:w-96 border-r flex flex-col bg-slate-50/50">
                <div className="p-4 border-b space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-lg">Messages</h2>
                        <Badge variant="secondary" className="bg-white">{filteredInquiries.length}</Badge>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search conversations..."
                            className="pl-9 bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="flex flex-col gap-1 p-2">
                        {filteredInquiries.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                No conversations found.
                            </div>
                        ) : (
                            filteredInquiries.map((inquiry: any) => (
                                <button
                                    key={inquiry._id}
                                    onClick={() => handleSelectInquiry(inquiry._id)}
                                    className={cn(
                                        "flex items-start gap-3 p-3 text-left rounded-lg transition-colors",
                                        selectedInquiryId === inquiry._id
                                            ? "bg-white shadow-sm ring-1 ring-border"
                                            : "hover:bg-white/50"
                                    )}
                                >
                                    <Avatar className="h-10 w-10 border bg-white">
                                        <AvatarImage src={inquiry.otherParty?.avatarUrl} />
                                        <AvatarFallback>{getDisplayName(inquiry.otherParty).charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-sm truncate">
                                                {getDisplayName(inquiry.otherParty)}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                                                {formatDistanceToNow(new Date(inquiry.updatedAt || inquiry._creationTime), { addSuffix: false })}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground font-medium truncate mb-0.5">
                                            {inquiry.property?.title}
                                        </div>
                                        <p className="text-xs text-slate-500 truncate">
                                            {inquiry.lastMessage?.content || inquiry.message || 'No messages yet'}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Chat Thread Area */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                {selectedInquiry ? (
                    <div className="flex-1 flex flex-col h-full">
                        {/* Chat Header */}
                        <div className="flex items-center justify-between p-4 border-b shrink-0">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border">
                                    <AvatarImage src={selectedInquiry.otherParty?.avatarUrl} />
                                    <AvatarFallback>{getDisplayName(selectedInquiry.otherParty).charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold">{getDisplayName(selectedInquiry.otherParty)}</h3>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <span>{selectedInquiry.property?.title}</span>
                                    </div>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Messages Thread */}
                        <div className="flex-1 overflow-hidden p-4">
                            <ChatThread
                                inquiryId={selectedInquiry._id}
                                messages={messages || []}
                                currentUserId={currentUser?._id || ''}
                                otherParty={selectedInquiry.otherParty}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-slate-50/30">
                        <div className="p-4 rounded-full bg-slate-100 mb-4">
                            <MessageSquare className="h-8 w-8 text-slate-400" />
                        </div>
                        <p className="text-lg font-medium">Select a conversation</p>
                        <p className="text-sm">Choose a chat from the sidebar to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    )
}
