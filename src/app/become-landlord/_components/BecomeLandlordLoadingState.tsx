export function BecomeLandlordLoadingState() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent" />
                <p className="text-sm font-medium text-neutral-500">Loading...</p>
            </div>
        </div>
    )
}
