import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

import { GoogleIcon } from './GoogleIcon'

type GoogleAuthButtonProps = {
    label: string
    onClick: () => void
    disabled?: boolean
    loading?: boolean
    className?: string
}

export function GoogleAuthButton({
    label,
    onClick,
    disabled,
    loading,
    className,
}: GoogleAuthButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'flex h-14 w-full items-center justify-center gap-3 rounded-[16px] border border-neutral-200 bg-white px-4 text-[16px] font-semibold text-neutral-900 transition-all hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60',
                className,
            )}
        >
            {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
            ) : (
                <GoogleIcon className="h-5 w-5" />
            )}
            <span>{label}</span>
        </button>
    )
}
