'use client'

import { useState, Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Eye, EyeOff, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'
import { useAuthActions } from "@convex-dev/auth/react"
import { useUser } from '@/components/providers/UserProvider'
import { getFriendlyAuthError, getSignInFieldErrors, type AuthField, type AuthFieldErrors } from '@/lib/auth-feedback'

function SignInContent() {
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({})
    const [formError, setFormError] = useState<string | null>(null)
    const router = useRouter()
    const searchParams = useSearchParams()
    const { signIn } = useAuthActions()
    const { isAuthenticated, isLoading: authLoading } = useUser()

    // Get the redirect URL from query params
    const redirectUrl = searchParams.get('redirect')

    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            router.push(redirectUrl ? decodeURIComponent(redirectUrl) : '/')
        }
    }, [isAuthenticated, authLoading, router, redirectUrl])

    function clearFieldError(field: AuthField) {
        setFieldErrors((current) => {
            if (!current[field]) return current
            return { ...current, [field]: undefined }
        })
        setFormError(null)
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()

        const formData = new FormData(e.currentTarget)
        const values = {
            email: String(formData.get('email') ?? ''),
            password: String(formData.get('password') ?? ''),
        }

        const nextFieldErrors = getSignInFieldErrors(values)
        if (Object.keys(nextFieldErrors).length > 0) {
            setFieldErrors(nextFieldErrors)
            setFormError('Please fix the highlighted fields and try again.')
            toast.error('Please check your email and password.')
            return
        }

        setFieldErrors({})
        setFormError(null)
        setIsLoading(true)
        formData.set("flow", "signIn")

        try {
            await signIn("password", formData)
            router.refresh()
            // Redirect handled by useEffect or router.push in Convex
        } catch (error) {
            console.error(error)
            const feedback = getFriendlyAuthError(error, 'signIn')
            setFieldErrors(feedback.fieldErrors ?? {})
            setFormError(feedback.formError ?? null)
            toast.error(feedback.toastMessage)
            setIsLoading(false)
        }
    }

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-900" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white relative overflow-hidden flex flex-col font-sans selection:bg-neutral-200">
            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10">
                <Link
                    href="/"
                    className="flex items-center justify-center w-11 h-11 border border-neutral-200 text-neutral-900 transition-all rounded-full hover:bg-neutral-50 active:scale-95"
                >
                    <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
                </Link>
                <Link href="/" className="font-semibold text-3xl tracking-tighter text-neutral-900 absolute left-1/2 -translate-x-1/2">
                    LINK
                </Link>
                <div className="w-11" />
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col justify-center px-6 pb-12 relative z-10 w-full max-w-[500px] mx-auto">
                <div className="w-full space-y-8">
                    {/* Header Text */}
                    <div className="space-y-3">
                        <h1 className="text-[36px] sm:text-[44px] font-semibold text-neutral-900 tracking-[-0.03em] leading-tight text-center">
                            Welcome back
                        </h1>
                        <p className="text-neutral-500 text-[17px] font-medium text-center mt-2">
                            Sign in to continue your journey
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white border border-neutral-200/60 rounded-[32px] p-6 sm:p-10">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {formError && (
                                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                    <p className="text-[14px] font-medium leading-5">{formError}</p>
                                </div>
                            )}
                            <div className="space-y-5">
                                {/* Email */}
                                <div className="space-y-2.5">
                                    <Label htmlFor="email" className="text-[14px] font-semibold text-neutral-900 tracking-tight ml-1">
                                        Email Address
                                    </Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        required
                                        disabled={isLoading}
                                        aria-invalid={!!fieldErrors.email}
                                        onChange={() => clearFieldError('email')}
                                        className={cn(
                                            "h-14 rounded-2xl bg-[#F8F9FA] border border-neutral-200 hover:border-neutral-300 focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all font-medium placeholder:text-neutral-400 placeholder:font-medium px-5 text-[16px]",
                                            fieldErrors.email && "border-red-300 bg-red-50/60 focus:border-red-500 focus:ring-red-500/20"
                                        )}
                                    />
                                    {fieldErrors.email && (
                                        <p className="ml-1 text-[13px] font-medium text-red-600">{fieldErrors.email}</p>
                                    )}
                                </div>

                                {/* Password */}
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between ml-1">
                                        <Label htmlFor="password" className="text-[14px] font-semibold text-neutral-900 tracking-tight">
                                            Password
                                        </Label>
                                        <Link
                                            href="/forgot-password"
                                            className="text-[13px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors underline underline-offset-2"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            disabled={isLoading}
                                            aria-invalid={!!fieldErrors.password}
                                            onChange={() => clearFieldError('password')}
                                            className={cn(
                                                "h-14 rounded-2xl bg-[#F8F9FA] border border-neutral-200 hover:border-neutral-300 focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all font-medium placeholder:text-neutral-400 placeholder:font-medium px-5 text-[16px] pr-12",
                                                fieldErrors.password && "border-red-300 bg-red-50/60 focus:border-red-500 focus:ring-red-500/20"
                                            )}
                                            placeholder="Enter your password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 transition-colors p-1"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5" strokeWidth={2.5} />
                                            ) : (
                                                <Eye className="h-5 w-5" strokeWidth={2.5} />
                                            )}
                                        </button>
                                    </div>
                                    {fieldErrors.password && (
                                        <p className="ml-1 text-[13px] font-medium text-red-600">{fieldErrors.password}</p>
                                    )}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-14 bg-[#C4F135] hover:bg-[#b5e02a] text-black font-semibold text-[17px] rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center mt-8 border-0 shadow-none"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Signing you in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>
                    </div>

                    {/* Sign Up Link */}
                    <div className="text-center pt-2">
                        <p className="text-neutral-500 font-medium text-[15px]">
                            Don't have an account?{' '}
                            <Link
                                href={redirectUrl ? `/sign-up?redirect=${encodeURIComponent(redirectUrl)}` : '/sign-up'}
                                className="text-black font-semibold hover:underline decoration-2 underline-offset-4 decoration-[#C4F135]"
                            >
                                Create one now
                            </Link>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default function SignInPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-900" />
            </div>
        }>
            <SignInContent />
        </Suspense>
    )
}
