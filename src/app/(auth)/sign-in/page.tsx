'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Eye, EyeOff, ArrowRight, Home, Loader2 } from 'lucide-react'
import { useAuthActions } from "@convex-dev/auth/react"

export default function SignInPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()
    const { signIn } = useAuthActions()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        try {
            await signIn("password", { email, password, flow: "signIn" })
            router.refresh()
            router.push('/')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Sign in failed')
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-sidebar-accent relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-lime-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-lime-500/10 rounded-full blur-3xl" />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-lime-500 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">L</span>
                        </div>
                        <span className="text-2xl font-bold text-foreground tracking-tight">LINK</span>
                    </Link>

                    {/* Main Content */}
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <h1 className="text-4xl font-bold text-foreground leading-tight">
                                Find your perfect
                                <br />
                                <span className="text-lime-500">place to call home</span>
                            </h1>
                            <p className="text-muted-foreground text-lg max-w-md">
                                Discover premium properties, connect with trusted landlords, and make renting effortless.
                            </p>
                        </div>

                        {/* Feature Pills */}
                        <div className="flex flex-wrap gap-2">
                            <span className="px-4 py-2 rounded-full bg-background/50 text-sm font-medium text-foreground">
                                ✓ Verified Properties
                            </span>
                            <span className="px-4 py-2 rounded-full bg-background/50 text-sm font-medium text-foreground">
                                ✓ Secure Payments
                            </span>
                            <span className="px-4 py-2 rounded-full bg-background/50 text-sm font-medium text-foreground">
                                ✓ Digital Leases
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-sm text-muted-foreground">
                        © 2024 LINK. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Right Side - Sign In Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-lime-500 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">L</span>
                            </div>
                            <span className="text-2xl font-bold text-foreground tracking-tight">LINK</span>
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="text-center lg:text-left space-y-2">
                        <h2 className="text-3xl font-bold text-foreground">Welcome back</h2>
                        <p className="text-muted-foreground">
                            Enter your credentials to access your account
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="email" className="text-foreground">
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    required
                                    disabled={isLoading}
                                    className="mt-1.5 h-12 rounded-lg bg-sidebar-accent border-0 focus-visible:ring-2 focus-visible:ring-lime-500/50"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <Label htmlFor="password" className="text-foreground">
                                        Password
                                    </Label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-sm text-lime-600 hover:text-lime-700 transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        required
                                        disabled={isLoading}
                                        className="h-12 rounded-lg bg-sidebar-accent border-0 pr-12 focus-visible:ring-2 focus-visible:ring-lime-500/50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-lime-500 hover:bg-lime-600 text-white rounded-lg font-medium shadow-lg shadow-lime-500/20 transition-all"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Signing in...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Sign in
                                    <ArrowRight className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-background text-muted-foreground">New to LINK?</span>
                        </div>
                    </div>

                    {/* Sign Up Link */}
                    <div className="text-center">
                        <Link
                            href="/sign-up"
                            className="inline-flex items-center gap-2 text-foreground font-medium hover:text-lime-600 transition-colors group"
                        >
                            Create an account
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {/* Back to Home */}
                    <div className="text-center pt-4">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Home className="h-4 w-4" />
                            Back to home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
