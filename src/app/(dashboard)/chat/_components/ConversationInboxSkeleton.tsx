export function ConversationInboxSkeleton() {
    return (
        <div className="flex animate-pulse items-center gap-3 px-4 py-3">
            <div className="h-12 w-12 shrink-0 rounded-full bg-neutral-100" />
            <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-4">
                    <div className="h-3.5 w-28 rounded-full bg-neutral-100" />
                    <div className="h-3 w-8 rounded-full bg-neutral-100" />
                </div>
                <div className="h-3 w-40 rounded-full bg-neutral-50" />
            </div>
        </div>
    )
}
