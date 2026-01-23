'use client'

import { Suspense } from 'react'
import { AuthedChatInterface } from './ChatInterface'

function ChatLoading() {
    return (
        <div className="flex h-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 rounded-full border-2 border-lime-500/20 border-t-lime-500 animate-spin" />
                <p className="text-sm text-muted-foreground">Loading messages...</p>
            </div>
        </div>
    )
}

export default function ChatPage() {
    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            <Suspense fallback={<ChatLoading />}>
                <AuthedChatInterface />
            </Suspense>
        </div>
    )
}
