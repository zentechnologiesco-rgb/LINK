'use client'

import { useState, Suspense, useEffect, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Eye, EyeOff, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { useAuthActions } from "@convex-dev/auth/react"
import { useUser } from '@/components/providers/UserProvider'
import { getFriendlyAuthError, getSignUpFieldErrors, type AuthField, type AuthFieldErrors } from '@/lib/auth-feedback'

function SignUpContent() {
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
            firstName: String(formData.get('firstName') ?? ''),
            surname: String(formData.get('surname') ?? ''),
            email: String(formData.get('email') ?? ''),
            password: String(formData.get('password') ?? ''),
        }

        const nextFieldErrors = getSignUpFieldErrors(values)
        if (Object.keys(nextFieldErrors).length > 0) {
            setFieldErrors(nextFieldErrors)
            setFormError('Please resolve the highlighted fields below.')
            toast.error('Review your details and try again.')
            return
        }

        setFieldErrors({})
        setFormError(null)
        setIsLoading(true)

        formData.set("name", `${values.firstName.trim()} ${values.surname.trim()}`)
        formData.set("role", "tenant")
        formData.set("flow", "signUp")

        try {
            await signIn("password", formData)
            router.refresh()
            // Redirect handled by useEffect or Convex
        } catch (error) {
            console.error(error)
            const feedback = getFriendlyAuthError(error, 'signUp')
            setFieldErrors(feedback.fieldErrors ?? {})
            setFormError(feedback.formError ?? null)
            toast.error(feedback.toastMessage)
            setIsLoading(false)
        }
    }

    if (authLoading) {
        return (
            <div className="min-h-[100dvh] flex items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
            </div>
        )
    }

    return (
        <div className="min-h-[100dvh] bg-white relative flex flex-col font-sans selection:bg-neutral-200">
            {/* iOS Top Nav Area */}
            <header className="safe-top flex items-center justify-between px-4 h-[60px] sm:h-[72px] shrink-0">
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
                
                {/* Large Native Title */}
                <div className="mt-2 mb-8">
                    <h1 className="text-[34px] sm:text-[40px] font-bold text-neutral-900 tracking-tight leading-tight">
                        Create account
                    </h1>
                    <p className="text-[17px] text-neutral-500 font-medium mt-1.5 tracking-tight">
                        Join LINK to find your perfect home.
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

                    <div className="space-y-4 pb-12">
                        {/* Name Fields Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* First Name */}
                            <div className="space-y-2">
                                <label htmlFor="firstName" className="text-[11px] font-bold text-neutral-900 tracking-wide uppercase px-1">
                                    First Name
                                </label>
                                <div className="relative">
                                    <input
                                        id="firstName"
                                        name="firstName"
                                        type="text"
                                        placeholder="John"
                                        required
                                        disabled={isLoading}
                                        aria-invalid={!!fieldErrors.firstName}
                                        onChange={() => clearFieldError('firstName')}
                                        className={cn(
                                            "w-full h-14 rounded-[16px] bg-neutral-100 border-[1.5px] border-transparent outline-none px-4 text-[16px] font-medium transition-all text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-black focus:shadow-[0_0_0_4px_rgba(0,0,0,0.05)]",
                                            fieldErrors.firstName && "border-red-400 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)] bg-red-50"
                                        )}
                                    />
                                </div>
                            </div>
                            
                            {/* Surname */}
                            <div className="space-y-2">
                                <label htmlFor="surname" className="text-[11px] font-bold text-neutral-900 tracking-wide uppercase px-1">
                                    Surname
                                </label>
                                <div className="relative">
                                    <input
                                        id="surname"
                                        name="surname"
                                        type="text"
                                        placeholder="Doe"
                                        required
                                        disabled={isLoading}
                                        aria-invalid={!!fieldErrors.surname}
                                        onChange={() => clearFieldError('surname')}
                                        className={cn(
                                            "w-full h-14 rounded-[16px] bg-neutral-100 border-[1.5px] border-transparent outline-none px-4 text-[16px] font-medium transition-all text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-black focus:shadow-[0_0_0_4px_rgba(0,0,0,0.05)]",
                                            fieldErrors.surname && "border-red-400 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)] bg-red-50"
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Name Error Block - Rendered outside the tight grid */}
                        {(fieldErrors.firstName || fieldErrors.surname) && (
                            <p className="mt-1 ml-1 text-[13px] font-semibold text-red-500 tracking-tight">
                                {fieldErrors.firstName || fieldErrors.surname}
                            </p>
                        )}


                        {/* Email Native Input */}
                        <div className="space-y-2 pt-2">
                            <label htmlFor="email" className="text-[11px] font-bold text-neutral-900 tracking-wide uppercase px-1">
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
                            </div>
                            {fieldErrors.email && (
                                <p className="mt-1 ml-1 text-[13px] font-semibold text-red-500 tracking-tight">{fieldErrors.email}</p>
                            )}
                        </div>

                        {/* Password Native Input */}
                        <div className="space-y-2 pt-2">
                            <label htmlFor="password" className="text-[11px] font-bold text-neutral-900 tracking-wide uppercase px-1">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    minLength={6}
                                    disabled={isLoading}
                                    aria-invalid={!!fieldErrors.password}
                                    onChange={() => clearFieldError('password')}
                                    placeholder="Create a password"
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
                            <p className={cn(
                                "mt-1.5 ml-1 text-[13px] tracking-tight",
                                fieldErrors.password ? "font-semibold text-red-500" : "font-medium text-neutral-400"
                            )}>
                                {fieldErrors.password || 'Must be at least 6 characters'}
                            </p>
                        </div>
                    </div>

                    {/* Bottom Sticky-like Action Area */}
                    <div className="mt-auto space-y-4">
                        {/* Terms */}
                        <p className="text-[13px] font-medium text-neutral-500 text-center px-4 -mt-2">
                            By creating an account, you agree to our{' '}
                            <Link href="/terms" className="text-black font-semibold hover:underline decoration-1 underline-offset-2">
                                Terms
                            </Link>{' '}
                            and{' '}
                            <Link href="/privacy" className="text-black font-semibold hover:underline decoration-1 underline-offset-2">
                                Privacy Policy
                            </Link>.
                        </p>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 bg-black text-white hover:bg-neutral-800 disabled:opacity-50 disabled:active:scale-100 font-bold text-[17px] tracking-tight rounded-[16px] active:scale-[0.98] transition-all flex items-center justify-center shadow-md select-none outline-none focus-visible:ring-4 focus-visible:ring-black/20"
                        >
                            {isLoading ? (
                                <Loader2 className="h-[22px] w-[22px] animate-spin" />
                            ) : (
                                'Sign Up'
                            )}
                        </button>
                        
                        <div className="text-center pt-1.5 pb-2">
                            <p className="text-[15px] font-medium text-neutral-500">
                                Already have an account?{' '}
                                <Link
                                    href={redirectUrl ? `/sign-in?redirect=${encodeURIComponent(redirectUrl)}` : '/sign-in'}
                                    className="text-black font-bold outline-none rounded-md focus-visible:ring-2 focus-visible:ring-black"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    )
}

export default function SignUpPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[100dvh] flex items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
            </div>
        }>
            <SignUpContent />
        </Suspense>
    )
}
