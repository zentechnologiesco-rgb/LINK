'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Eye, EyeOff, ArrowRight, Home, Loader2, Building2 } from 'lucide-react'
import { useAuthActions } from "@convex-dev/auth/react"
import { cn } from '@/lib/utils'

export default function SignInPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()
    const { signIn } = useAuthActions()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        formData.set("flow", "signIn")

        try {
            await signIn("password", formData)
            router.refresh()
            router.push('/')
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : 'Sign in failed')
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
                            <span className="text-[10px] font-mono uppercase tracking-widest opacity-80">Secure Login</span>
                        </div>
                    </Link>
                </div>

                {/* Main Content */}
                <div className="z-10 max-w-xl">
                    <h1 className="font-[family-name:var(--font-anton)] text-7xl leading-[0.9] mb-8 uppercase tracking-tight">
                        Welcome<br />Back<span className="text-emerald-500">.</span>
                    </h1>

                    <p className="text-lg text-neutral-400 font-light leading-relaxed max-w-sm mb-12">
                        Access your dashboard to manage properties, view inquiries, and track performance in real-time.
                    </p>

                    <div className="flex gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
                            <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </div>
                            <span className="text-xs font-mono text-neutral-300">Live System</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
                            <Building2 className="w-3 h-3 text-neutral-300" />
                            <span className="text-xs font-mono text-neutral-300">Property Manager</span>
                        </div>
                    </div>
                </div>

                {/* Abstract Visual */}
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                    <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="300" cy="300" r="200" stroke="white" strokeWidth="1" />
                        <circle cx="300" cy="300" r="150" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
                        <circle cx="300" cy="300" r="100" stroke="white" strokeWidth="1" />
                    </svg>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col items-center relative bg-white overflow-y-auto h-screen">
                {/* Mobile Header / Back Button - Relative on Mobile, Absolute on Desktop */}
                <div className="w-full px-6 py-6 sm:px-12 sm:pt-12 flex justify-between items-center lg:absolute lg:top-0 lg:right-0 lg:w-auto lg:p-12 z-20">
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

                {/* Form Container - Centered vertically via flex-1 */}
                <div className="w-full max-w-[400px] flex-1 flex flex-col justify-center px-6 py-8 lg:py-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-full space-y-8">
                        <div className="space-y-2 text-center lg:text-left">
                            <h2 className="font-[family-name:var(--font-anton)] text-2xl sm:text-3xl text-neutral-900 uppercase tracking-wide">
                                Sign In
                            </h2>
                            <p className="text-neutral-500 text-sm">
                                Enter your credentials to continue
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
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

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between ml-1">
                                        <Label htmlFor="password" className="text-[10px] uppercase tracking-widest font-mono font-bold text-neutral-500">
                                            Password
                                        </Label>
                                        <Link
                                            href="/forgot-password"
                                            className="text-[10px] uppercase tracking-widest font-mono font-bold text-neutral-900 hover:underline"
                                        >
                                            Forgot?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
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
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-bold tracking-wide shadow-lg shadow-neutral-900/10 transition-all hover:translate-y-[-1px]"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        Sign In <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="pt-6 border-t border-neutral-100 text-center">
                            <p className="text-xs text-neutral-500">
                                New to Link?{' '}
                                <Link
                                    href="/sign-up"
                                    className="text-neutral-900 font-bold hover:underline"
                                >
                                    Create an account
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
