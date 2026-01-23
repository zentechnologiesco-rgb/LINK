'use client'

import { AuthedChatInterface } from './ChatInterface'

export default function ChatPage() {
    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            <AuthedChatInterface />
        </div>
    )
}
