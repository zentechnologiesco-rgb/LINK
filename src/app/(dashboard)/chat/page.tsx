'use client'

import { AuthedChatInterface } from './ChatInterface'
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react"
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ChatPage() {
    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col bg-white">
            <AuthLoading>
                <div className="flex h-full items-center justify-center">
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </AuthLoading>

            <Unauthenticated>
                <div className="flex h-full flex-col items-center justify-center space-y-4">
                    <p className="text-gray-500">Please sign in to view your messages</p>
                    <Link href="/sign-in">
                        <Button>Sign In</Button>
                    </Link>
                </div>
            </Unauthenticated>

            <Authenticated>
                <AuthedChatInterface />
            </Authenticated>
        </div>
    )
}
