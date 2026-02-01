'use client'

import { useState, useRef, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, Send } from 'lucide-react'
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
        <div className="flex flex-col h-full">
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="h-12 w-12 bg-neutral-100 rounded-full flex items-center justify-center mb-3">
                            <span className="text-xl">👋</span>
                        </div>
                        <p className="font-medium text-neutral-900 mb-1">Start the conversation</p>
                        <p className="text-sm text-neutral-500">
                            Send a message to {otherParty?.fullName || 'get started'}.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 max-w-3xl mx-auto">
                        {messages.map((message, index) => {
                            const isCurrentUser = message.senderId === currentUserId
                            const senderName = isCurrentUser ? 'You' : otherParty?.fullName || 'User'
                            const senderAvatar = isCurrentUser ? undefined : otherParty?.avatarUrl

                            // Check if previous message was from same sender
                            const isSequence = index > 0 && messages[index - 1].senderId === message.senderId

                            return (
                                <div
                                    key={message._id}
                                    className={cn(
                                        "flex gap-3",
                                        isCurrentUser ? "flex-row-reverse" : ""
                                    )}
                                >
                                    {!isCurrentUser && !isSequence ? (
                                        <Avatar className="h-8 w-8 shrink-0 mt-1">
                                            <AvatarImage src={senderAvatar} />
                                            <AvatarFallback className="bg-neutral-200 text-neutral-600 text-xs font-medium">
                                                {senderName.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                    ) : !isCurrentUser ? (
                                        <div className="w-8 shrink-0" />
                                    ) : null}

                                    <div className={cn(
                                        "flex flex-col max-w-[75%]",
                                        isCurrentUser ? "items-end" : "items-start"
                                    )}>
                                        <div
                                            className={cn(
                                                "px-4 py-2.5 text-sm leading-relaxed",
                                                isCurrentUser
                                                    ? "bg-neutral-900 text-white rounded-2xl rounded-br-md"
                                                    : "bg-white text-neutral-900 rounded-2xl rounded-bl-md border border-neutral-200"
                                            )}
                                        >
                                            {message.content}
                                        </div>
                                        <span className="text-[11px] text-neutral-400 mt-1 px-1">
                                            {formatDistanceToNow(new Date(message._creationTime), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Message Input */}
            <div className="p-4 sm:p-5 bg-white border-t border-neutral-200">
                <form onSubmit={handleSubmit} className="flex gap-3 max-w-3xl mx-auto">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 rounded-lg bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-300 focus:outline-none transition-colors text-sm"
                    />
                    <Button
                        type="submit"
                        disabled={isLoading || !newMessage.trim()}
                        className={cn(
                            "h-11 px-5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white",
                            (!newMessage.trim() || isLoading) && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <Send className="h-4 w-4 mr-2" />
                                Send
                            </>
                        )}
                    </Button>
                </form>
            </div>
        </div>
    )
}
