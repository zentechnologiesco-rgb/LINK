'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { sendMessage } from '@/app/(dashboard)/shared/chat/actions'
import { toast } from 'sonner'
import { Loader2, Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Message {
    id: string
    content: string
    created_at: string
    sender_id: string
    sender: {
        full_name: string | null
        avatar_url: string | null
    } | null
}

interface ChatThreadProps {
    inquiryId: string
    messages: Message[]
    currentUserId: string
    onMessageSent?: () => void
}

export function ChatThread({ inquiryId, messages, currentUserId, onMessageSent }: ChatThreadProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [newMessage, setNewMessage] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!newMessage.trim()) return

        setIsLoading(true)
        const formData = new FormData()
        formData.append('inquiry_id', inquiryId)
        formData.append('content', newMessage)

        const result = await sendMessage(formData)

        if (result?.error) {
            toast.error(result.error)
        } else {
            setNewMessage('')
            // toast.success('Message sent!') // Optional, maybe too noisy for chat
            if (onMessageSent) {
                onMessageSent()
            }
        }
        setIsLoading(false)
    }

    return (
        <div className="flex flex-col h-full">
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-slate-50/50 rounded-lg mb-4">
                {messages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No messages yet. Start the conversation!</p>
                ) : (
                    messages.map((message) => {
                        // Check if the current user is the sender. 
                        // We compare sender name or if we had sender_id. 
                        // Ideally we should update the Message interface to include sender_id if not present, but for now fallback to name or assume currentUserId is reliable if passed correctly.
                        const isCurrentUser = message.sender?.full_name === currentUserId || (message as any).sender_id === currentUserId

                        return (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={message.sender?.avatar_url || undefined} />
                                    <AvatarFallback>{message.sender?.full_name?.charAt(0) || '?'}</AvatarFallback>
                                </Avatar>
                                <div className={`max-w-[70%] ${isCurrentUser ? 'text-right' : ''}`}>
                                    <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? 'justify-end' : ''}`}>
                                        <span className="text-xs font-medium">{message.sender?.full_name || 'User'}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
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
