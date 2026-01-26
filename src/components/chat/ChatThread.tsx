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
            <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <p className="font-medium text-black/40">No messages yet</p>
                        <p className="text-sm text-black/20 mt-1">Start the conversation!</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {messages.map((message) => {
                            const isCurrentUser = message.senderId === currentUserId
                            const senderName = isCurrentUser ? 'You' : otherParty?.fullName || 'User'
                            const senderAvatar = isCurrentUser ? undefined : otherParty?.avatarUrl

                            return (
                                <div
                                    key={message._id}
                                    className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                                >
                                    {!isCurrentUser && (
                                        <Avatar className="h-8 w-8 shrink-0 border border-transparent ring-2 ring-gray-100">
                                            <AvatarImage src={senderAvatar} />
                                            <AvatarFallback className="bg-gray-100 text-black text-xs font-bold">
                                                {senderName.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={`max-w-[75%] ${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col`}>
                                        <div
                                            className={`rounded-2xl px-5 py-3 text-sm shadow-sm ${isCurrentUser
                                                ? 'bg-black text-white rounded-tr-sm'
                                                : 'bg-white border border-gray-100 text-black rounded-tl-sm'
                                                }`}
                                        >
                                            {message.content}
                                        </div>
                                        <span className="text-[10px] uppercase tracking-wider font-medium text-black/20 mt-1.5 px-1">
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
            <div className="p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 shrink-0">
                <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={isLoading}
                        className="flex-1 px-5 py-3 rounded-full bg-gray-50 border border-gray-100 text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-black/5 focus:bg-white focus:border-black/10 transition-all font-medium"
                    />
                    <Button
                        type="submit"
                        disabled={isLoading || !newMessage.trim()}
                        className="h-12 w-12 rounded-full bg-black hover:bg-black/90 text-white shrink-0 shadow-lg shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Send className="h-5 w-5 ml-0.5" />
                        )}
                    </Button>
                </form>
            </div>
        </div>
    )
}
