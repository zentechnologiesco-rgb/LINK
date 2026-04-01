'use client'

import { useState, Suspense, useEffect, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Eye, EyeOff, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { useAuthActions } from "@convex-dev/auth/react"
import { useUser } from '@/components/providers/UserProvider'
import { AuthBrandLink } from '@/components/auth/AuthBrandLink'
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

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()

        const formData = new FormData(e.currentTarget)
        const values = {
            email: String(formData.get('email') ?? ''),
            password: String(formData.get('password') ?? ''),
        }

        const nextFieldErrors = getSignInFieldErrors(values)
        if (Object.keys(nextFieldErrors).length > 0) {
            setFieldErrors(nextFieldErrors)
            setFormError('Please check the highlighted fields below.')
            toast.error('Check your email and password.')
            return
        }

        setFieldErrors({})
        setFormError(null)
        setIsLoading(true)
        formData.set("flow", "signIn")

        try {
            await signIn("password", formData)
            router.refresh()
            // Redirect handled by useEffect or Convex
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
                <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white relative flex flex-col font-sans selection:bg-neutral-200">
            {/* iOS Top Nav Area */}
            <header className="safe-top flex h-[60px] shrink-0 items-center px-4 sm:h-[72px]">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors -ml-2 text-neutral-900 outline-none"
                    aria-label="Go back"
                >
                    <ArrowLeft className="h-[22px] w-[22px]" strokeWidth={2.5} />
                </button>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col px-6 sm:px-12 w-full max-w-[480px] mx-auto pb-8">
                <AuthBrandLink className="mx-auto mt-2 mb-7" />
                
                {/* Large Native Title */}
                <div className="mb-10">
                    <h1 className="text-[34px] sm:text-[40px] font-bold text-neutral-900 tracking-tight leading-tight">
                        Sign in
                    </h1>
                    <p className="text-[17px] text-neutral-500 font-medium mt-1.5 tracking-tight">
                        Please enter your details to continue.
                    </p>
                </div>

                {/* Form Elements */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col" noValidate>
                    {formError && (
                        <div className="mb-6 flex items-start gap-3 rounded-[16px] bg-red-50 px-4 py-3 text-red-700">
                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" strokeWidth={2.5} />
                            <p className="text-[14px] font-semibold leading-relaxed tracking-tight">{formError}</p>
                        </div>
                    )}

                    <div className="space-y-5 flex-1 pb-10">
                        {/* Email Native Input */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-[13px] font-bold text-neutral-900 tracking-wide uppercase px-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    required
                                    disabled={isLoading}
                                    aria-invalid={!!fieldErrors.email}
                                    onChange={() => clearFieldError('email')}
                                    className={cn(
                                        "w-full h-14 rounded-[16px] bg-neutral-100 border-[1.5px] border-transparent outline-none px-4 text-[16px] font-medium transition-all text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-black focus:shadow-[0_0_0_4px_rgba(0,0,0,0.05)]",
                                        fieldErrors.email && "border-red-400 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)] bg-red-50"
                                    )}
                                />
                                {fieldErrors.email && (
                                    <p className="mt-2 ml-1 text-[13px] font-semibold text-red-500 tracking-tight">{fieldErrors.email}</p>
                                )}
                            </div>
                        </div>

                        {/* Password Native Input */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <label htmlFor="password" className="text-[13px] font-bold text-neutral-900 tracking-wide uppercase">
                                    Password
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-[13px] font-bold text-black hover:text-neutral-600 transition-colors"
                                    tabIndex={-1}
                                >
                                    Forgot?
                                </Link>
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    disabled={isLoading}
                                    aria-invalid={!!fieldErrors.password}
                                    onChange={() => clearFieldError('password')}
                                    placeholder="Enter your password"
                                    className={cn(
                                        "w-full h-14 rounded-[16px] bg-neutral-100 border-[1.5px] border-transparent outline-none pl-4 pr-12 text-[16px] font-medium transition-all text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-black focus:shadow-[0_0_0_4px_rgba(0,0,0,0.05)]",
                                        fieldErrors.password && "border-red-400 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)] bg-red-50"
                                    )}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition-colors outline-none rounded-full"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-[22px] w-[22px]" strokeWidth={2} />
                                    ) : (
                                        <Eye className="h-[22px] w-[22px]" strokeWidth={2} />
                                    )}
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <p className="mt-2 ml-1 text-[13px] font-semibold text-red-500 tracking-tight">{fieldErrors.password}</p>
                            )}
                        </div>
                    </div>

                    {/* Bottom Sticky-like Action Area */}
                    <div className="mt-auto space-y-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 bg-black text-white hover:bg-neutral-800 disabled:opacity-50 disabled:active:scale-100 font-bold text-[17px] tracking-tight rounded-[16px] active:scale-[0.98] transition-all flex items-center justify-center shadow-md select-none outline-none focus-visible:ring-4 focus-visible:ring-black/20"
                        >
                            {isLoading ? (
                                <Loader2 className="h-[22px] w-[22px] animate-spin" />
                            ) : (
                                'Sign In'
                            )}
                        </button>
                        
                        <div className="text-center pt-1.5 pb-2">
                            <p className="text-[15px] font-medium text-neutral-500">
                                Don&apos;t have an account?{' '}
                                <Link
                                    href={redirectUrl ? `/sign-up?redirect=${encodeURIComponent(redirectUrl)}` : '/sign-up'}
                                    className="text-black font-bold outline-none rounded-md focus-visible:ring-2 focus-visible:ring-black"
                                >
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    )
}

export default function SignInPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
            </div>
        }>
            <SignInContent />
        </Suspense>
    )
}
