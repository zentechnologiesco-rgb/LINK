'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react'
import { useAuthActions } from "@convex-dev/auth/react"

export default function SignInPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const { signIn } = useAuthActions()

    // Get the redirect URL from query params
    const redirectUrl = searchParams.get('redirect')

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        formData.set("flow", "signIn")

        try {
            await signIn("password", formData)
            router.refresh()
            // Redirect to the original page if redirect param exists, otherwise go to home
            router.push(redirectUrl ? decodeURIComponent(redirectUrl) : '/')
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : 'Sign in failed')
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-neutral-50 relative overflow-hidden flex flex-col font-sans">
            {/* Ambient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-blue-100/50 blur-3xl opacity-50 mix-blend-multiply animate-blob" />
                <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-purple-100/50 blur-3xl opacity-50 mix-blend-multiply animate-blob animation-delay-2000" />
                <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] rounded-full bg-emerald-100/50 blur-3xl opacity-50 mix-blend-multiply animate-blob animation-delay-4000" />
            </div>

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-6 py-6 border-b border-transparent">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-all hover:-translate-x-1 p-2 -ml-2 rounded-full hover:bg-white/50"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="font-[family-name:var(--font-anton)] text-2xl tracking-wide text-neutral-900 absolute left-1/2 -translate-x-1/2">
                    LINK
                </div>
                <div className="w-9" />
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col justify-center px-6 pb-12 relative z-10">
                <div className="max-w-md mx-auto w-full space-y-8">
                    {/* Header Text */}
                    <div className="space-y-2 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">
                            Welcome back
                        </h1>
                        <p className="text-neutral-500 text-lg">
                            Sign in to continue your journey
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl shadow-neutral-900/5 rounded-3xl p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 ring-1 ring-black/5">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-5">
                                {/* Email */}
                                <div className="space-y-2 group">
                                    <Label htmlFor="email" className="text-sm font-medium text-neutral-700 ml-1 transition-colors group-focus-within:text-neutral-900">
                                        Email Address
                                    </Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        required
                                        disabled={isLoading}
                                        className="h-12 sm:h-14 rounded-2xl bg-neutral-50/50 border-transparent hover:bg-neutral-50 focus:bg-white focus:border-neutral-200 focus:ring-4 focus:ring-neutral-100 transition-all font-medium placeholder:text-neutral-400"
                                    />
                                </div>

                                {/* Password */}
                                <div className="space-y-2 group">
                                    <div className="flex items-center justify-between ml-1">
                                        <Label htmlFor="password" className="text-sm font-medium text-neutral-700 transition-colors group-focus-within:text-neutral-900">
                                            Password
                                        </Label>
                                        <Link
                                            href="/forgot-password"
                                            className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
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
                                            className="h-12 sm:h-14 rounded-2xl bg-neutral-50/50 border-transparent hover:bg-neutral-50 focus:bg-white focus:border-neutral-200 focus:ring-4 focus:ring-neutral-100 transition-all font-medium pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors p-1"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 sm:h-14 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-lg rounded-2xl shadow-lg shadow-neutral-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Checking credentials...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>

                        {/* Sign Up Link */}
                        <div className="text-center pt-6 mt-2">
                            <p className="text-neutral-500 font-medium">
                                Don't have an account?{' '}
                                <Link
                                    href={redirectUrl ? `/sign-up?redirect=${encodeURIComponent(redirectUrl)}` : '/sign-up'}
                                    className="text-neutral-900 font-bold hover:underline decoration-2 underline-offset-4"
                                >
                                    Create one now
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
