'use client'

import { useState, Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react'
import { useAuthActions } from "@convex-dev/auth/react"
import { useUser } from '@/components/providers/UserProvider'

function SignUpContent() {
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
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

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const firstName = formData.get('firstName') as string
        const surname = formData.get('surname') as string

        if (!firstName || !surname) {
            toast.error('First name and surname are required')
            setIsLoading(false)
            return
        }

        formData.set("name", `${firstName} ${surname}`)
        formData.set("role", "tenant")
        formData.set("flow", "signUp")

        try {
            await signIn("password", formData)
            router.refresh()
            // Redirect handled by useEffect or router.push in Convex
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : 'Sign up failed')
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
                <Link href="/" className="font-[900] text-3xl tracking-tighter text-neutral-900 absolute left-1/2 -translate-x-1/2">
                    LINK
                </Link>
                <div className="w-11" />
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col justify-center px-6 pb-12 relative z-10 w-full max-w-[500px] mx-auto">
                <div className="w-full space-y-8">
                    {/* Header Text */}
                    <div className="space-y-3">
                        <h1 className="text-[36px] sm:text-[44px] font-[900] text-neutral-900 tracking-[-0.03em] leading-tight text-center">
                            Create account
                        </h1>
                        <p className="text-neutral-500 text-[17px] font-semibold text-center mt-2">
                            Join Link to find your perfect home
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white border border-neutral-200/60 rounded-[32px] p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-5">
                                {/* Name Fields */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2.5">
                                        <Label htmlFor="firstName" className="text-[14px] font-[900] text-neutral-900 tracking-tight ml-1">
                                            First name
                                        </Label>
                                        <Input
                                            id="firstName"
                                            name="firstName"
                                            type="text"
                                            placeholder="John"
                                            required
                                            disabled={isLoading}
                                            className="h-14 rounded-2xl bg-[#F8F9FA] border border-neutral-200 hover:border-neutral-300 focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all font-semibold placeholder:text-neutral-400 placeholder:font-medium px-5 text-[16px]"
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label htmlFor="surname" className="text-[14px] font-[900] text-neutral-900 tracking-tight ml-1">
                                            Surname
                                        </Label>
                                        <Input
                                            id="surname"
                                            name="surname"
                                            type="text"
                                            placeholder="Doe"
                                            required
                                            disabled={isLoading}
                                            className="h-14 rounded-2xl bg-[#F8F9FA] border border-neutral-200 hover:border-neutral-300 focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all font-semibold placeholder:text-neutral-400 placeholder:font-medium px-5 text-[16px]"
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="space-y-2.5">
                                    <Label htmlFor="email" className="text-[14px] font-[900] text-neutral-900 tracking-tight ml-1">
                                        Email Address
                                    </Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        required
                                        disabled={isLoading}
                                        className="h-14 rounded-2xl bg-[#F8F9FA] border border-neutral-200 hover:border-neutral-300 focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all font-semibold placeholder:text-neutral-400 placeholder:font-medium px-5 text-[16px]"
                                    />
                                </div>

                                {/* Password */}
                                <div className="space-y-2.5">
                                    <Label htmlFor="password" className="text-[14px] font-[900] text-neutral-900 tracking-tight ml-1">
                                        Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            minLength={6}
                                            disabled={isLoading}
                                            className="h-14 rounded-2xl bg-[#F8F9FA] border border-neutral-200 hover:border-neutral-300 focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all font-semibold placeholder:text-neutral-400 placeholder:font-medium px-5 text-[16px] pr-12"
                                            placeholder="Create a password"
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
                                    <p className="text-[13px] text-neutral-400 font-semibold ml-1">Must be at least 6 characters</p>
                                </div>
                            </div>
                            
                            {/* Terms */}
                            <p className="text-[13px] font-semibold text-neutral-500 text-center px-4 pt-2">
                                By creating an account, you agree to our{' '}
                                <Link href="/terms" className="text-neutral-900 font-bold hover:underline decoration-2 underline-offset-2 decoration-[#C4F135]">
                                    Terms
                                </Link>{' '}
                                and{' '}
                                <Link href="/privacy" className="text-neutral-900 font-bold hover:underline decoration-2 underline-offset-2 decoration-[#C4F135]">
                                    Privacy Policy
                                </Link>.
                            </p>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-14 bg-[#C4F135] hover:bg-[#b5e02a] text-black font-[900] text-[17px] rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center mt-8 border-0 shadow-none"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    'Create account'
                                )}
                            </Button>
                        </form>
                    </div>

                    {/* Sign In Link */}
                    <div className="text-center pt-2">
                        <p className="text-neutral-500 font-semibold text-[15px]">
                            Already have an account?{' '}
                            <Link
                                href={redirectUrl ? `/sign-in?redirect=${encodeURIComponent(redirectUrl)}` : '/sign-in'}
                                className="text-neutral-900 font-[900] hover:underline decoration-2 underline-offset-4 decoration-[#C4F135]"
                            >
                                Sign in instead
                            </Link>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default function SignUpPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-900" />
            </div>
        }>
            <SignUpContent />
        </Suspense>
    )
}
