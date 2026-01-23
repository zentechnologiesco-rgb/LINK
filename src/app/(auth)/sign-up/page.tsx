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

export default function SignUpPage() {
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
        const firstName = formData.get('firstName') as string
        const surname = formData.get('surname') as string

        if (!firstName || !surname) {
            toast.error('First name and surname are required')
            setIsLoading(false)
            return
        }

        try {
            await signIn("password", {
                email,
                password,
                name: `${firstName} ${surname}`,
                firstName,
                surname,
                role: "tenant",
                flow: "signUp"
            })
            router.refresh()
            router.push('/')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Sign up failed')
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-sidebar-accent relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-1/3 -left-32 w-96 h-96 bg-lime-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 -right-32 w-80 h-80 bg-lime-500/10 rounded-full blur-3xl" />

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
                                Start your journey
                                <br />
                                <span className="text-lime-500">to finding home</span>
                            </h1>
                            <p className="text-muted-foreground text-lg max-w-md">
                                Join thousands who have found their perfect rental through our trusted platform.
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-8">
                            <div>
                                <p className="text-3xl font-bold text-foreground">10K+</p>
                                <p className="text-sm text-muted-foreground">Happy renters</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-foreground">500+</p>
                                <p className="text-sm text-muted-foreground">Properties</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-foreground">100%</p>
                                <p className="text-sm text-muted-foreground">Verified</p>
                            </div>
                        </div>

                        {/* Testimonial */}
                        <div className="bg-background/50 backdrop-blur-sm rounded-xl p-5 max-w-md">
                            <p className="text-muted-foreground italic">
                                "LINK made finding my apartment so easy. The verification process gave me confidence I was dealing with real landlords."
                            </p>
                            <div className="flex items-center gap-3 mt-4">
                                <div className="w-10 h-10 rounded-full bg-lime-500 flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">JM</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">Jane M.</p>
                                    <p className="text-xs text-muted-foreground">Windhoek</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-sm text-muted-foreground">
                        © 2024 LINK. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Right Side - Sign Up Form */}
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
                        <h2 className="text-3xl font-bold text-foreground">Create an account</h2>
                        <p className="text-muted-foreground">
                            Fill in your details to get started
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-4">
                            {/* Name Fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="firstName" className="text-foreground">
                                        First name
                                    </Label>
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        type="text"
                                        placeholder="John"
                                        required
                                        disabled={isLoading}
                                        className="mt-1.5 h-12 rounded-lg bg-sidebar-accent border-0 focus-visible:ring-2 focus-visible:ring-lime-500/50"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="surname" className="text-foreground">
                                        Surname
                                    </Label>
                                    <Input
                                        id="surname"
                                        name="surname"
                                        type="text"
                                        placeholder="Doe"
                                        required
                                        disabled={isLoading}
                                        className="mt-1.5 h-12 rounded-lg bg-sidebar-accent border-0 focus-visible:ring-2 focus-visible:ring-lime-500/50"
                                    />
                                </div>
                            </div>

                            {/* Email */}
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

                            {/* Password */}
                            <div>
                                <Label htmlFor="password" className="text-foreground">
                                    Password
                                </Label>
                                <div className="relative mt-1.5">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        required
                                        disabled={isLoading}
                                        minLength={6}
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
                                <p className="text-xs text-muted-foreground mt-1.5">Must be at least 6 characters</p>
                            </div>
                        </div>

                        {/* Terms */}
                        <p className="text-xs text-muted-foreground text-center lg:text-left">
                            By creating an account, you agree to our{' '}
                            <Link href="/terms" className="text-lime-600 hover:underline">
                                Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link href="/privacy" className="text-lime-600 hover:underline">
                                Privacy Policy
                            </Link>
                        </p>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-lime-500 hover:bg-lime-600 text-white rounded-lg font-medium shadow-lg shadow-lime-500/20 transition-all"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Creating account...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Create account
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
                            <span className="px-4 bg-background text-muted-foreground">Already have an account?</span>
                        </div>
                    </div>

                    {/* Sign In Link */}
                    <div className="text-center">
                        <Link
                            href="/sign-in"
                            className="inline-flex items-center gap-2 text-foreground font-medium hover:text-lime-600 transition-colors group"
                        >
                            Sign in instead
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
