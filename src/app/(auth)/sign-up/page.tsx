'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Eye, EyeOff, ArrowRight, Home, Loader2, Star, CheckCircle } from 'lucide-react'
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
        const firstName = formData.get('firstName') as string
        const surname = formData.get('surname') as string

        if (!firstName || !surname) {
            toast.error('First name and surname are required')
            setIsLoading(false)
            return
        }

        // Add additional fields expected by the profile function
        formData.set("name", `${firstName} ${surname}`)
        formData.set("role", "tenant")
        formData.set("flow", "signUp")

        try {
            await signIn("password", formData)
            router.refresh()
            router.push('/')
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : 'Sign up failed')
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex bg-white font-sans">
            {/* Left Side - High Contrast Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-neutral-900 relative overflow-hidden flex-col justify-between p-12 text-white">

                {/* Brand Header */}
                <div className="z-10">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <span className="font-[family-name:var(--font-anton)] text-3xl tracking-wide">
                            LINK
                        </span>
                        <div className="px-2 py-0.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-md">
                            <span className="text-[10px] font-mono uppercase tracking-widest opacity-80">Join Now</span>
                        </div>
                    </Link>
                </div>

                {/* Main Content */}
                <div className="z-10 max-w-xl">
                    <h1 className="font-[family-name:var(--font-anton)] text-7xl leading-[0.9] mb-8 uppercase tracking-tight">
                        Start Your<br />Journey<span className="text-emerald-500">.</span>
                    </h1>

                    <p className="text-lg text-neutral-400 font-light leading-relaxed max-w-sm mb-12">
                        Join thousands of verified renters and landlords on the most trusted property platform in Namibia.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                                <CheckCircle className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="font-bold text-white text-sm">Verified Listings</p>
                                <p className="text-xs text-neutral-500 font-mono mt-0.5">Every property checked for authenticity</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                                <Star className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="font-bold text-white text-sm">Premium Experience</p>
                                <p className="text-xs text-neutral-500 font-mono mt-0.5">Seamless searching, viewing, and signing</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Abstract Visual */}
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                    <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="200" y="0" width="1" height="400" fill="white" />
                        <rect x="0" y="200" width="400" height="1" fill="white" />
                        <rect x="100" y="100" width="200" height="200" stroke="white" strokeWidth="1" />
                    </svg>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 relative bg-white">
                {/* Mobile Header / Back Button */}
                <div className="w-full max-w-md absolute top-6 sm:top-8 left-6 sm:left-12 right-6 sm:right-12 flex justify-between items-center lg:justify-end">
                    <Link href="/" className="lg:hidden font-[family-name:var(--font-anton)] text-2xl tracking-wide">
                        LINK
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500 hover:text-neutral-900 transition-colors"
                    >
                        <Home className="h-3 w-3" />
                        Back to Home
                    </Link>
                </div>

                <div className="w-full max-w-sm space-y-8 mt-12 lg:mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-2">
                        <h2 className="font-[family-name:var(--font-anton)] text-2xl text-neutral-900 uppercase tracking-wide">
                            Create Account
                        </h2>
                        <p className="text-neutral-500 text-sm">
                            Enter your details to get started
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            {/* Name Fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="firstName" className="text-[10px] uppercase tracking-widest font-mono font-bold text-neutral-500 ml-1">
                                        First Name
                                    </Label>
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        type="text"
                                        placeholder="John"
                                        required
                                        disabled={isLoading}
                                        className="h-11 rounded-lg bg-neutral-50 border-neutral-200 focus:border-neutral-900 focus:ring-0 transition-all font-medium text-sm placeholder:text-neutral-400"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="surname" className="text-[10px] uppercase tracking-widest font-mono font-bold text-neutral-500 ml-1">
                                        Surname
                                    </Label>
                                    <Input
                                        id="surname"
                                        name="surname"
                                        type="text"
                                        placeholder="Doe"
                                        required
                                        disabled={isLoading}
                                        className="h-11 rounded-lg bg-neutral-50 border-neutral-200 focus:border-neutral-900 focus:ring-0 transition-all font-medium text-sm placeholder:text-neutral-400"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-[10px] uppercase tracking-widest font-mono font-bold text-neutral-500 ml-1">
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    required
                                    disabled={isLoading}
                                    className="h-11 rounded-lg bg-neutral-50 border-neutral-200 focus:border-neutral-900 focus:ring-0 transition-all font-medium text-sm placeholder:text-neutral-400"
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-[10px] uppercase tracking-widest font-mono font-bold text-neutral-500 ml-1">
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
                                        className="h-11 rounded-lg bg-neutral-50 border-neutral-200 pr-10 focus:border-neutral-900 focus:ring-0 transition-all font-medium text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                <p className="text-[10px] text-neutral-400 font-mono mt-1">Must be at least 6 characters</p>
                            </div>
                        </div>

                        {/* Terms */}
                        <p className="text-xs text-neutral-500 leading-relaxed">
                            By creating an account, you agree to our{' '}
                            <Link href="/terms" className="text-neutral-900 font-bold hover:underline">
                                Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link href="/privacy" className="text-neutral-900 font-bold hover:underline">
                                Privacy Policy
                            </Link>.
                        </p>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-bold tracking-wide shadow-lg shadow-neutral-900/10 transition-all hover:translate-y-[-1px]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    Create Account <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="pt-6 border-t border-neutral-100 text-center">
                        <p className="text-xs text-neutral-500">
                            Already have an account?{' '}
                            <Link
                                href="/sign-in"
                                className="text-neutral-900 font-bold hover:underline"
                            >
                                Sign In Instead
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
