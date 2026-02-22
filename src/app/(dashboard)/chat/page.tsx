'use client'

import { Suspense } from 'react'
import { AuthedChatInterface } from './ChatInterface'

function ChatLoading() {
    return (
        <div className="flex h-full items-center justify-center bg-gray-50/50">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 rounded-full border-2 border-black/10 border-t-black animate-spin" />
                <p className="text-sm font-medium text-black/60">Loading messages...</p>
            </div>
        </div>
    )
}

export default function ChatPage() {
    return (
        <div className="h-[calc(100vh-120px)] flex flex-col -mx-4 sm:-mx-6 md:-mx-12 -mt-4 -mb-24">
            <Suspense fallback={<ChatLoading />}>
                <AuthedChatInterface />
            </Suspense>
        </div>
    )
}
