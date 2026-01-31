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
        router.push('/chat', { scroll: false })
    }

    // Loading state
    if (currentUser === undefined || inquiries === undefined) {
        return (
            <div className="flex h-full items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-neutral-900 border-t-transparent animate-spin" />
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400">Loading messages...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-1 overflow-hidden bg-white h-[calc(100vh-64px)]">
            {/* Sidebar - Conversation List */}
            <div className={cn(
                "w-full md:w-[380px] lg:w-[420px] border-r border-neutral-100 flex flex-col bg-white transition-all duration-300",
                showMobileChat && "hidden md:flex"
            )}>
                {/* Header */}
                <div className="p-6 pb-4">
                    <div className="flex items-end justify-between mb-6">
                        <h1 className="text-5xl font-[family-name:var(--font-anton)] uppercase tracking-wide text-neutral-900 leading-[0.8]">
                            Messages
                        </h1>
                        <span className="px-2.5 py-1 rounded-full bg-neutral-900 text-[10px] font-mono font-bold text-white mb-1">
                            {filteredInquiries.length}
                        </span>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" />
                        <Input
                            placeholder="Search conversations..."
                            className="pl-11 h-12 bg-neutral-50 border-transparent focus:bg-white focus:border-neutral-200 focus:ring-0 rounded-xl transition-all font-medium placeholder:text-neutral-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Conversation List */}
                <ScrollArea className="flex-1 px-3">
                    <div className="space-y-2 pb-4">
                        {filteredInquiries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                                <div className="h-20 w-20 rounded-full bg-neutral-50 flex items-center justify-center mb-6">
                                    <MessageSquare className="h-8 w-8 text-neutral-300" />
                                </div>
                                <p className="font-[family-name:var(--font-anton)] text-xl text-neutral-900 mb-2 uppercase tracking-wide">No messages</p>
                                <p className="text-sm text-neutral-400 font-medium max-w-[200px] leading-relaxed mx-auto">
                                    Start a conversation by inquiring about a property.
                                </p>
                            </div>
                        ) : (
                            filteredInquiries.map((inquiry: any) => (
                                <button
                                    key={inquiry._id}
                                    onClick={() => handleSelectInquiry(inquiry._id)}
                                    className={cn(
                                        "w-full flex items-start gap-4 p-4 text-left rounded-2xl transition-all duration-300 group relative overflow-hidden",
                                        selectedInquiryId === inquiry._id
                                            ? "bg-neutral-900 text-white shadow-xl shadow-neutral-900/10"
                                            : "hover:bg-neutral-50 text-neutral-900"
                                    )}
                                >
                                    <Avatar className={cn(
                                        "h-12 w-12 border-2 shrink-0 transition-colors bg-white",
                                        selectedInquiryId === inquiry._id ? "border-neutral-700" : "border-white shadow-sm group-hover:border-neutral-200"
                                    )}>
                                        <AvatarImage src={inquiry.otherParty?.avatarUrl} className="object-cover" />
                                        <AvatarFallback className={cn(
                                            "font-bold uppercase text-lg",
                                            selectedInquiryId === inquiry._id ? "bg-neutral-800 text-white" : "bg-neutral-100 text-neutral-900"
                                        )}>
                                            {getDisplayName(inquiry.otherParty).charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={cn(
                                                "font-bold text-base truncate",
                                                selectedInquiryId === inquiry._id ? "text-white" : "text-neutral-900"
                                            )}>
                                                {getDisplayName(inquiry.otherParty)}
                                            </span>
                                            <span className={cn(
                                                "text-[10px] uppercase tracking-wider font-mono shrink-0 ml-2 font-bold",
                                                selectedInquiryId === inquiry._id ? "text-neutral-400" : "text-neutral-400"
                                            )}>
                                                {formatDistanceToNow(new Date(inquiry.updatedAt || inquiry._creationTime), { addSuffix: false })}
                                            </span>
                                        </div>
                                        <p className={cn(
                                            "text-[10px] font-mono font-bold uppercase tracking-wider truncate mb-1.5 opacity-80",
                                            selectedInquiryId === inquiry._id ? "text-neutral-400" : "text-neutral-500"
                                        )}>
                                            {inquiry.property?.title}
                                        </p>
                                        <p className={cn(
                                            "text-sm truncate leading-relaxed font-medium",
                                            selectedInquiryId === inquiry._id ? "text-neutral-300" : "text-neutral-500"
                                        )}>
                                            {inquiry.lastMessage?.content || inquiry.message || 'No messages yet'}
                                        </p>
                                    </div>
                                    {selectedInquiryId === inquiry._id && (
                                        <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-emerald-500" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Chat Thread Area */}
            <div className={cn(
                "flex-1 flex flex-col bg-white overflow-hidden relative",
                !showMobileChat && "hidden md:flex"
            )}>
                {selectedInquiry ? (
                    <>
                        {/* Chat Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 bg-white/80 backdrop-blur-xl sticky top-0 z-20">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleBackToList}
                                    className="md:hidden h-10 w-10 rounded-full bg-neutral-50 flex items-center justify-center hover:bg-neutral-100 transition-colors -ml-2"
                                >
                                    <ChevronLeft className="h-6 w-6 text-neutral-900" />
                                </button>

                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12 border-2 border-white shadow-md ring-1 ring-neutral-100">
                                        <AvatarImage src={selectedInquiry.otherParty?.avatarUrl} className="object-cover" />
                                        <AvatarFallback className="bg-neutral-900 text-white font-[family-name:var(--font-anton)] uppercase text-lg">
                                            {getDisplayName(selectedInquiry.otherParty).charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h2 className="font-[family-name:var(--font-anton)] uppercase tracking-wide text-2xl text-neutral-900 leading-none mb-1.5">
                                            {getDisplayName(selectedInquiry.otherParty)}
                                        </h2>
                                        <div className="flex items-center gap-2 bg-neutral-50 px-2 py-0.5 rounded-md w-fit">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 truncate max-w-[200px]">
                                                {selectedInquiry.property?.title}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages Thread */}
                        <div className="flex-1 overflow-hidden bg-neutral-50/30 relative">
                            {/* Background Pattern */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                                }}
                            />

                            <ChatThread
                                inquiryId={selectedInquiry._id}
                                messages={messages || []}
                                currentUserId={currentUser?._id || ''}
                                otherParty={selectedInquiry.otherParty}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-neutral-50/30">
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-neutral-100/50 blur-3xl opacity-50" />
                            <div className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-neutral-100/50 blur-3xl opacity-50" />
                        </div>

                        <div className="relative z-10 flex flex-col items-center max-w-md mx-auto">
                            <div className="h-28 w-28 rounded-3xl bg-white border border-dashed border-neutral-200 flex items-center justify-center mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rotate-3 transition-transform hover:rotate-6 duration-700">
                                <MessageSquare className="h-12 w-12 text-neutral-300" />
                            </div>
                            <h2 className="text-5xl font-[family-name:var(--font-anton)] uppercase tracking-wide text-neutral-900 mb-6 leading-none">
                                Select<br />Conversation
                            </h2>
                            <p className="text-neutral-500 font-medium leading-relaxed bg-white/50 px-6 py-4 rounded-2xl border border-neutral-100 backdrop-blur-sm">
                                Choose a conversation from the sidebar to view message history and reply.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
