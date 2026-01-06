import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getUserInquiries } from './actions'
import { ChatInterface } from './ChatInterface'
import { redirect } from 'next/navigation'

export default async function ChatPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/sign-in')
    }

    const inquiries = await getUserInquiries()

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col bg-white">
            <ChatInterface
                user={user}
                initialInquiries={inquiries}
            />
        </div>
    )
}
