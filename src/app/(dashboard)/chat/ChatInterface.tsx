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
            <div className="flex h-full items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-black/10 border-t-black animate-spin" />
                    <p className="text-sm font-medium text-black/60">Loading messages...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-1 overflow-hidden bg-white">
            {/* Sidebar - Conversation List */}
            <div className={cn(
                "w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col bg-white",
                showMobileChat && "hidden md:flex"
            )}>
                {/* Header */}
                <div className="p-5 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-[family-name:var(--font-anton)] tracking-wide text-black">Messages</h1>
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-black/60">
                            {filteredInquiries.length}
                        </span>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40 group-focus-within:text-black transition-colors" />
                        <Input
                            placeholder="Search conversations..."
                            className="pl-10 bg-gray-50 border-transparent focus:bg-white focus:border-black/10 rounded-xl h-10 transition-all font-medium placeholder:text-black/40"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Conversation List */}
                <ScrollArea className="flex-1">
                    <div className="p-3">
                        {filteredInquiries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                                    <MessageSquare className="h-6 w-6 text-black/20" />
                                </div>
                                <p className="font-bold text-black mb-1">No messages yet</p>
                                <p className="text-sm text-black/40">
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
                                            "w-full flex items-start gap-3 p-3 text-left rounded-xl transition-all duration-200 group",
                                            selectedInquiryId === inquiry._id
                                                ? "bg-black text-white shadow-lg shadow-black/5"
                                                : "hover:bg-gray-50 text-black"
                                        )}
                                    >
                                        <Avatar className={cn(
                                            "h-11 w-11 border shrink-0 transition-colors",
                                            selectedInquiryId === inquiry._id ? "border-black/20" : "border-gray-100"
                                        )}>
                                            <AvatarImage src={inquiry.otherParty?.avatarUrl} />
                                            <AvatarFallback className={cn(
                                                "font-medium",
                                                selectedInquiryId === inquiry._id ? "bg-white/10 text-white" : "bg-gray-50 text-black"
                                            )}>
                                                {getDisplayName(inquiry.otherParty).charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className={cn(
                                                    "font-medium truncate",
                                                    selectedInquiryId === inquiry._id ? "text-white" : "text-black"
                                                )}>
                                                    {getDisplayName(inquiry.otherParty)}
                                                </span>
                                                <span className={cn(
                                                    "text-xs shrink-0 ml-2 font-medium",
                                                    selectedInquiryId === inquiry._id ? "text-white/60" : "text-black/40"
                                                )}>
                                                    {formatDistanceToNow(new Date(inquiry.updatedAt || inquiry._creationTime), { addSuffix: false })}
                                                </span>
                                            </div>
                                            <p className={cn(
                                                "text-sm truncate mb-1 font-medium",
                                                selectedInquiryId === inquiry._id ? "text-white/80" : "text-black/60"
                                            )}>
                                                {inquiry.property?.title}
                                            </p>
                                            <p className={cn(
                                                "text-sm truncate",
                                                selectedInquiryId === inquiry._id ? "text-white/60" : "text-black/40"
                                            )}>
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
                "flex-1 flex flex-col bg-white overflow-hidden",
                !showMobileChat && "hidden md:flex"
            )}>
                {selectedInquiry ? (
                    <>
                        {/* Chat Header */}
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                            {/* Mobile back button */}
                            <button
                                onClick={handleBackToList}
                                className="md:hidden h-9 w-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors -ml-2"
                            >
                                <ChevronLeft className="h-5 w-5 text-black" />
                            </button>

                            <Avatar className="h-10 w-10 border border-gray-100">
                                <AvatarImage src={selectedInquiry.otherParty?.avatarUrl} />
                                <AvatarFallback className="bg-gray-50 text-black font-medium">
                                    {getDisplayName(selectedInquiry.otherParty).charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <h2 className="font-bold text-black truncate text-lg leading-tight">
                                    {getDisplayName(selectedInquiry.otherParty)}
                                </h2>
                                <p className="text-xs font-medium text-black/40 truncate flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
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
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/30">
                        <div className="h-20 w-20 rounded-3xl bg-gray-100 flex items-center justify-center mb-6 shadow-sm">
                            <MessageSquare className="h-10 w-10 text-black/20" />
                        </div>
                        <h2 className="text-2xl font-[family-name:var(--font-anton)] text-black mb-2">
                            Select a conversation
                        </h2>
                        <p className="text-black/40 max-w-sm font-medium">
                            Choose a conversation from the sidebar to view messages
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
