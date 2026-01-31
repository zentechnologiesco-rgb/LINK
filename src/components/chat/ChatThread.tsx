'use client'

import { useState, useRef, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, Send, ArrowUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { cn } from '@/lib/utils'

interface Message {
    _id: Id<"messages">
    content: string
    _creationTime: number
    senderId: Id<"users">
}

interface ChatThreadProps {
    inquiryId: Id<"inquiries">
    messages: Message[]
    currentUserId: string
    otherParty?: {
        fullName?: string
        avatarUrl?: string
    } | null
}

export function ChatThread({ inquiryId, messages, currentUserId, otherParty }: ChatThreadProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [newMessage, setNewMessage] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const sendMessage = useMutation(api.messages.send)

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!newMessage.trim()) return

        setIsLoading(true)
        try {
            await sendMessage({ inquiryId, content: newMessage })
            setNewMessage('')
        } catch (error) {
            toast.error('Failed to send message')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full relative z-10 w-full max-w-5xl mx-auto">
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 scrollbar-hide">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-0 animate-in fade-in duration-1000">
                        <div className="h-16 w-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl">👋</span>
                        </div>
                        <p className="font-[family-name:var(--font-anton)] text-xl text-neutral-900 uppercase tracking-wide">Say Hello!</p>
                        <p className="text-sm font-medium text-neutral-400 mt-2 max-w-[200px]">
                            This is the start of your conversation with {otherParty?.fullName || 'the user'}.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8 flex flex-col">
                        {messages.map((message, index) => {
                            const isCurrentUser = message.senderId === currentUserId
                            const senderName = isCurrentUser ? 'You' : otherParty?.fullName || 'User'
                            const senderAvatar = isCurrentUser ? undefined : otherParty?.avatarUrl

                            // Check if previous message was from same sender to group visually
                            const isSequence = index > 0 && messages[index - 1].senderId === message.senderId

                            return (
                                <div
                                    key={message._id}
                                    className={cn(
                                        "flex gap-4 w-full max-w-3xl animate-in slide-in-from-bottom-2 duration-500",
                                        isCurrentUser ? "ml-auto flex-row-reverse" : "mr-auto"
                                    )}
                                >
                                    {!isCurrentUser && !isSequence ? (
                                        <Avatar className="h-8 w-8 shrink-0 border border-neutral-200 mt-1">
                                            <AvatarImage src={senderAvatar} />
                                            <AvatarFallback className="bg-neutral-900 text-white text-[10px] font-bold font-mono">
                                                {senderName.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                    ) : !isCurrentUser ? (
                                        <div className="w-8 shrink-0" />
                                    ) : null}

                                    <div className={cn(
                                        "flex flex-col max-w-[85%] sm:max-w-[75%]",
                                        isCurrentUser ? "items-end" : "items-start"
                                    )}>
                                        <div
                                            className={cn(
                                                "px-5 py-3.5 text-sm font-medium leading-relaxed shadow-sm transition-all hover:shadow-md",
                                                isCurrentUser
                                                    ? "bg-neutral-900 text-white rounded-2xl rounded-tr-sm"
                                                    : "bg-white border border-neutral-100 text-neutral-900 rounded-2xl rounded-tl-sm"
                                            )}
                                        >
                                            {message.content}
                                        </div>
                                        <span className={cn(
                                            "text-[9px] uppercase tracking-widest font-mono font-bold text-neutral-400 mt-1.5 px-1 opacity-0 transition-opacity group-hover:opacity-100",
                                            "opacity-60" // Always confirm visibility for now
                                        )}>
                                            {formatDistanceToNow(new Date(message._creationTime), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                )}
            </div>

            {/* Message Input */}
            <div className="p-4 md:p-6 bg-white/80 backdrop-blur-xl border-t border-neutral-100 shrink-0 sticky bottom-0 z-20">
                <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto relative">
                    <input
                        type="text"
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={isLoading}
                        className="flex-1 pl-6 pr-14 py-4 rounded-xl bg-neutral-50 border-2 border-transparent focus:bg-white focus:border-neutral-200 focus:ring-0 transition-all font-medium placeholder:text-neutral-400 shadow-inner"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Button
                            type="submit"
                            disabled={isLoading || !newMessage.trim()}
                            size="icon"
                            className={cn(
                                "h-10 w-10 rounded-lg bg-neutral-900 text-white shadow-lg shadow-neutral-900/10 transition-all hover:scale-105 active:scale-95",
                                (!newMessage.trim() || isLoading) && "opacity-50 cursor-not-allowed bg-neutral-200 text-neutral-400 shadow-none"
                            )}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <ArrowUp className="h-5 w-5 stroke-[3px]" />
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
