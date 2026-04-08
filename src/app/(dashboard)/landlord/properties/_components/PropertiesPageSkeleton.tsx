export function PropertiesPageSkeleton() {
    return (
        <div className="mx-auto min-h-screen max-w-[1240px] bg-white pb-16 font-sans">
            <div className="h-14 border-b border-neutral-100/60 bg-white" />
            <div className="px-4 pt-6 sm:px-6">
                <div className="h-10 w-48 animate-pulse rounded-[12px] bg-neutral-100" />
                <div className="mt-4 flex gap-2 overflow-hidden">
                    {[1, 2, 3, 4].map((index) => (
                        <div key={index} className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-neutral-100" />
                    ))}
                </div>
            </div>
            <div className="mt-8 space-y-8 px-4 sm:px-6">
                {[1, 2].map((index) => (
                    <div key={index} className="h-[320px] w-full animate-pulse rounded-[24px] border border-neutral-100 bg-neutral-50" />
                ))}
            </div>
        </div>
    )
}
