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
            <div className="flex-1 overflow-y-auto px-5 py-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <p className="text-muted-foreground">No messages yet</p>
                        <p className="text-sm text-muted-foreground/70">Start the conversation!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
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
                                        <Avatar className="h-8 w-8 shrink-0 border border-border">
                                            <AvatarImage src={senderAvatar} />
                                            <AvatarFallback className="bg-sidebar-accent text-foreground text-xs">
                                                {senderName.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={`max-w-[75%] ${isCurrentUser ? 'text-right' : ''}`}>
                                        <div
                                            className={`rounded-2xl px-4 py-2.5 text-sm ${isCurrentUser
                                                    ? 'bg-lime-500 text-white rounded-br-md'
                                                    : 'bg-sidebar-accent text-foreground rounded-bl-md'
                                                }`}
                                        >
                                            {message.content}
                                        </div>
                                        <span className="text-xs text-muted-foreground mt-1 block px-1">
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
            <div className="p-4 border-t border-border shrink-0">
                <form onSubmit={handleSubmit} className="flex gap-3">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 rounded-xl bg-sidebar-accent border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-lime-500/50 transition-all"
                    />
                    <Button
                        type="submit"
                        disabled={isLoading || !newMessage.trim()}
                        className="h-12 w-12 rounded-xl bg-lime-500 hover:bg-lime-600 text-white shrink-0"
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Send className="h-5 w-5" />
                        )}
                    </Button>
                </form>
            </div>
        </div>
    )
}
