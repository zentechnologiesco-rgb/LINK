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
        <div className="min-h-screen flex bg-white">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gray-50 relative overflow-hidden items-center justify-center p-12">

                {/* Abstract Design Elements matching sidebar 'premium' feel */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}
                />

                <div className="relative z-10 w-full max-w-lg">
                    <div className="mb-12">
                        <Link href="/" className="inline-block">
                            <span className="font-[family-name:var(--font-anton)] text-5xl tracking-wide text-black">
                                LINK
                            </span>
                        </Link>
                    </div>

                    <h1 className="font-[family-name:var(--font-anton)] text-6xl leading-[1.1] mb-6 text-black uppercase">
                        Start Your<br />Journey
                    </h1>

                    <p className="text-xl text-black/60 font-medium leading-relaxed max-w-md mb-8">
                        Join thousands of verified renters and landlords on the most trusted property platform.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-black/5 shadow-sm">
                            <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center shrink-0">
                                <CheckCircle className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-black">Verified Listings</p>
                                <p className="text-sm text-black/60">Every property is checked for authenticity</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-black/5 shadow-sm">
                            <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center shrink-0">
                                <Star className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-black">Premium Experience</p>
                                <p className="text-sm text-black/60">Seamless searching, viewing, and signing</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Sign Up Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-white">
                {/* Back Button */}
                <Link
                    href="/"
                    className="absolute top-4 right-4 sm:top-8 sm:right-8 p-3 rounded-full bg-gray-50 hover:bg-gray-100 text-black/60 hover:text-black transition-colors z-20"
                >
                    <Home className="h-5 w-5" />
                </Link>

                <div className="w-full max-w-md space-y-8 sm:space-y-10">
                    {/* Mobile Logo using Anton font */}
                    <div className="lg:hidden flex justify-center mb-4">
                        <Link href="/" className="inline-block relative group">
                            <span className="font-[family-name:var(--font-anton)] text-5xl tracking-wide text-black relative z-10">
                                LINK
                            </span>
                            <div className="absolute -bottom-1 left-0 w-full h-3 bg-black/5 -z-0 group-hover:h-full transition-all duration-300 ease-out -skew-x-12" />
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="text-center lg:text-left space-y-2">
                        <h2 className="font-[family-name:var(--font-anton)] text-3xl sm:text-4xl text-black uppercase tracking-wide">
                            Create Account
                        </h2>
                        <p className="text-black/60 font-medium">
                            Enter your details to get started
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-5">
                            {/* Name Fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-sm font-bold text-black/80 ml-1">
                                        First Name
                                    </Label>
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        type="text"
                                        placeholder="John"
                                        required
                                        disabled={isLoading}
                                        className="h-12 rounded-xl bg-gray-50 border-transparent focus:border-black/20 focus:bg-white focus:ring-0 transition-all font-medium placeholder:text-black/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="surname" className="text-sm font-bold text-black/80 ml-1">
                                        Surname
                                    </Label>
                                    <Input
                                        id="surname"
                                        name="surname"
                                        type="text"
                                        placeholder="Doe"
                                        required
                                        disabled={isLoading}
                                        className="h-12 rounded-xl bg-gray-50 border-transparent focus:border-black/20 focus:bg-white focus:ring-0 transition-all font-medium placeholder:text-black/20"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-bold text-black/80 ml-1">
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    required
                                    disabled={isLoading}
                                    className="h-12 rounded-xl bg-gray-50 border-transparent focus:border-black/20 focus:bg-white focus:ring-0 transition-all font-medium placeholder:text-black/20"
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-bold text-black/80 ml-1">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                        disabled={isLoading}
                                        className="h-12 rounded-xl bg-gray-50 border-transparent pr-12 focus:border-black/20 focus:bg-white focus:ring-0 transition-all font-medium placeholder:text-black/20"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                <p className="text-[11px] font-bold text-black/40 ml-1 uppercase tracking-wide">Must be at least 6 characters</p>
                            </div>
                        </div>

                        {/* Terms */}
                        <p className="text-xs text-black/50 text-center lg:text-left font-medium leading-relaxed">
                            By creating an account, you agree to our{' '}
                            <Link href="/terms" className="text-black font-bold hover:underline">
                                Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link href="/privacy" className="text-black font-bold hover:underline">
                                Privacy Policy
                            </Link>
                        </p>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-black hover:bg-gray-900 text-white rounded-xl font-bold tracking-wide shadow-xl shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    CREATING ACCOUNT...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    CREATE ACCOUNT
                                    <ArrowRight className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </form>

                    {/* Footer */}
                    <div className="space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-100" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase tracking-widest">
                                <span className="px-4 bg-white text-black/40 font-bold">Or</span>
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="text-black/60 font-medium text-sm">
                                Already have an account?{' '}
                                <Link
                                    href="/sign-in"
                                    className="text-black font-bold hover:underline transition-all"
                                >
                                    Sign In Instead
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
