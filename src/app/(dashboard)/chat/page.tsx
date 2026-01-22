'use client'

import { AuthedChatInterface } from './ChatInterface'
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react"
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ChatPage() {
    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col bg-white">
            <AuthedChatInterface />
        </div>
    )
}
