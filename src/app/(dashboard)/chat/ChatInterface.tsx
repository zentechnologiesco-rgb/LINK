'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { Search, MessageSquare, ArrowLeft } from 'lucide-react'
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
        router.push('/chat', { scroll: false })
    }

    // Loading state
    if (currentUser === undefined || inquiries === undefined) {
        return (
            <div className="flex h-full items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 rounded-full border-2 border-neutral-900 border-t-transparent animate-spin" />
                    <p className="text-sm text-neutral-500">Loading messages...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-1 overflow-hidden bg-white h-full">
            {/* Sidebar - Conversation List */}
            <div className={cn(
                "w-full md:w-[340px] lg:w-[380px] border-r border-neutral-200 flex flex-col bg-white",
                showMobileChat && "hidden md:flex"
            )}>
                {/* Header */}
                <div className="p-5 border-b border-neutral-200">
                    <h1 className="text-2xl font-semibold text-neutral-900 mb-4">
                        Messages
                    </h1>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder="Search conversations..."
                            className="pl-10 h-10 bg-neutral-50 border-neutral-200 focus:bg-white focus:border-neutral-300 rounded-lg"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredInquiries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                            <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                                <MessageSquare className="h-7 w-7 text-neutral-400" />
                            </div>
                            <p className="font-semibold text-neutral-900 mb-1">No messages</p>
                            <p className="text-sm text-neutral-500">
                                Start a conversation by inquiring about a property.
                            </p>
                        </div>
                    ) : (
                        <div className="py-2">
                            {filteredInquiries.map((inquiry: any) => (
                                <button
                                    key={inquiry._id}
                                    onClick={() => handleSelectInquiry(inquiry._id)}
                                    className={cn(
                                        "w-full flex items-start gap-3 px-5 py-4 text-left transition-colors border-b border-neutral-100 last:border-b-0",
                                        selectedInquiryId === inquiry._id
                                            ? "bg-neutral-50"
                                            : "hover:bg-neutral-50"
                                    )}
                                >
                                    <Avatar className="h-12 w-12 shrink-0">
                                        <AvatarImage src={inquiry.otherParty?.avatarUrl} className="object-cover" />
                                        <AvatarFallback className="bg-neutral-200 text-neutral-600 font-medium">
                                            {getDisplayName(inquiry.otherParty).charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                            <span className="font-medium text-neutral-900 truncate">
                                                {getDisplayName(inquiry.otherParty)}
                                            </span>
                                            <span className="text-xs text-neutral-400 shrink-0">
                                                {formatDistanceToNow(new Date(inquiry.updatedAt || inquiry._creationTime), { addSuffix: false })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-neutral-500 truncate mb-1">
                                            {inquiry.property?.title}
                                        </p>
                                        <p className="text-sm text-neutral-600 truncate">
                                            {inquiry.lastMessage?.content || inquiry.message || 'No messages yet'}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Thread Area */}
            <div className={cn(
                "flex-1 flex flex-col bg-white overflow-hidden",
                !showMobileChat && "hidden md:flex"
            )}>
                {selectedInquiry ? (
                    <>
                        {/* Chat Header */}
                        <div className="flex items-center gap-4 px-5 py-4 border-b border-neutral-200 bg-white">
                            <button
                                onClick={handleBackToList}
                                className="md:hidden h-9 w-9 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5 text-neutral-600" />
                            </button>

                            <Avatar className="h-10 w-10">
                                <AvatarImage src={selectedInquiry.otherParty?.avatarUrl} className="object-cover" />
                                <AvatarFallback className="bg-neutral-200 text-neutral-600 font-medium">
                                    {getDisplayName(selectedInquiry.otherParty).charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <h2 className="font-medium text-neutral-900 truncate">
                                    {getDisplayName(selectedInquiry.otherParty)}
                                </h2>
                                <p className="text-sm text-neutral-500 truncate">
                                    {selectedInquiry.property?.title}
                                </p>
                            </div>
                        </div>

                        {/* Messages Thread */}
                        <div className="flex-1 overflow-hidden bg-neutral-50">
                            <ChatThread
                                inquiryId={selectedInquiry._id}
                                messages={messages || []}
                                currentUserId={currentUser?._id || ''}
                                otherParty={selectedInquiry.otherParty}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-neutral-50">
                        <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                            <MessageSquare className="h-7 w-7 text-neutral-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                            Select a conversation
                        </h2>
                        <p className="text-neutral-500 max-w-sm">
                            Choose a conversation from the sidebar to view messages and reply.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
