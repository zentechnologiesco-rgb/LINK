'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    const sendMessage = useMutation(api.messages.send)

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
            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-slate-50/50 rounded-lg mb-4 flex flex-col-reverse">
                <div className="space-y-4">
                    {messages.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No messages yet. Start the conversation!</p>
                    ) : (
                        messages.map((message) => {
                            const isCurrentUser = message.senderId === currentUserId
                            const senderName = isCurrentUser ? 'You' : otherParty?.fullName || 'User'
                            const senderAvatar = isCurrentUser ? undefined : otherParty?.avatarUrl

                            return (
                                <div
                                    key={message._id}
                                    className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={senderAvatar} />
                                        <AvatarFallback>{isCurrentUser ? 'Me' : senderName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className={`max-w-[70%] ${isCurrentUser ? 'text-right' : ''}`}>
                                        <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? 'justify-end' : ''}`}>
                                            <span className="text-xs font-medium">{senderName}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(message._creationTime), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <div
                                            className={`rounded-lg px-3 py-2 text-sm text-left ${isCurrentUser
                                                ? 'bg-black text-white'
                                                : 'bg-white border border-border'
                                                }`}
                                        >
                                            {message.content}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Message Input */}
            <form onSubmit={handleSubmit} className="flex gap-2 p-2 border-t">
                <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={isLoading}
                    className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !newMessage.trim()} size="icon">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
            </form>
        </div>
    )
}
