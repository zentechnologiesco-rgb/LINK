import { Loader2 } from 'lucide-react'

export function PropertyEditorLoadingState() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-white">
            <Loader2 className="h-7 w-7 animate-spin text-neutral-400" />
        </div>
    )
}
