'use client'

import { Suspense } from 'react'
import { ChatWorkspace } from './_components/ChatWorkspace'

function ChatLoading() {
    return (
        <div className="flex h-[calc(100dvh-4rem)] items-center justify-center bg-white md:h-[calc(100dvh-5rem)]">
            <div className="flex flex-col items-center gap-3">
                <div className="h-5 w-5 rounded-full border-2 border-neutral-200 border-t-neutral-600 animate-spin" />
                <p className="text-[13px] font-medium text-neutral-400">Loading messages…</p>
            </div>
        </div>
    )
}

export default function ChatPage() {
    return (
        <div className="-mx-4 -mt-4 sm:-mx-6 md:mx-0">
            <Suspense fallback={<ChatLoading />}>
                <ChatWorkspace />
            </Suspense>
        </div>
    )
}
