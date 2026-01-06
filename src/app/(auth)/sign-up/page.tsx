'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signup } from '../actions'
import { toast } from 'sonner'
import { Building2, Eye, EyeOff, ArrowRight, Home, Shield, Users } from 'lucide-react'

export default function SignUpPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        const result = await signup(formData)

        if (result?.error) {
            toast.error(result.error)
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding & Image */}
            <div className="hidden lg:flex lg:w-1/2 bg-gray-100 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/5 via-transparent to-gray-900/10" />
                <div className="absolute top-1/3 -left-32 w-96 h-96 bg-gray-900/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 -right-32 w-80 h-80 bg-gray-900/5 rounded-full blur-3xl" />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <span className="text-3xl font-bold text-gray-900 tracking-tight">LINK</span>
                    </Link>

                    {/* Main Content */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                                Start your journey
                                <br />
                                <span className="text-gray-600">to finding home</span>
                            </h1>
                            <p className="text-gray-500 text-lg max-w-md">
                                Join thousands who have found their perfect rental through our trusted platform.
                            </p>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-4 max-w-md">
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-200/50">
                                <Users className="h-6 w-6 text-gray-900 mb-2" />
                                <p className="text-2xl font-bold text-gray-900">10K+</p>
                                <p className="text-xs text-gray-500 mt-1">Happy renters</p>
                            </div>
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-200/50">
                                <Shield className="h-6 w-6 text-gray-900 mb-2" />
                                <p className="text-2xl font-bold text-gray-900">100%</p>
                                <p className="text-xs text-gray-500 mt-1">Verified properties</p>
                            </div>
                        </div>

                        {/* Testimonial */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 max-w-md border border-gray-200/50">
                            <p className="text-gray-600 italic">
                                &quot;LINK made finding my apartment so easy. The verification process gave me confidence I was dealing with real landlords.&quot;
                            </p>
                            <div className="flex items-center gap-3 mt-4">
                                <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">JM</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Jane M.</p>
                                    <p className="text-xs text-gray-500">Windhoek</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-sm text-gray-400">
                        © 2024 LINK. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Right Side - Sign Up Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <Link href="/" className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-gray-900 tracking-tight">LINK</span>
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="text-center lg:text-left space-y-2">
                        <h2 className="text-3xl font-bold text-gray-900">Create an account</h2>
                        <p className="text-gray-500">
                            Fill in your details to get started
                        </p>
                    </div>

                    {/* Form */}
                    <form action={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            {/* Name Fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                                        First name
                                    </Label>
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        type="text"
                                        placeholder="John"
                                        required
                                        disabled={isLoading}
                                        className="h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="surname" className="text-sm font-medium text-gray-700">
                                        Surname
                                    </Label>
                                    <Input
                                        id="surname"
                                        name="surname"
                                        type="text"
                                        placeholder="Doe"
                                        required
                                        disabled={isLoading}
                                        className="h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    required
                                    disabled={isLoading}
                                    className="h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        required
                                        disabled={isLoading}
                                        minLength={6}
                                        className="h-12 bg-gray-50 border-gray-200 rounded-xl pr-12 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400">Must be at least 6 characters</p>
                            </div>
                        </div>

                        {/* Terms */}
                        <p className="text-xs text-gray-500 text-center lg:text-left">
                            By creating an account, you agree to our{' '}
                            <Link href="/terms" className="text-gray-900 hover:underline">
                                Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link href="/privacy" className="text-gray-900 hover:underline">
                                Privacy Policy
                            </Link>
                        </p>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-all hover:shadow-lg group"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Creating account...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Create account
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500">Already have an account?</span>
                        </div>
                    </div>

                    {/* Sign In Link */}
                    <div className="text-center">
                        <Link
                            href="/sign-in"
                            className="inline-flex items-center gap-2 text-gray-900 font-medium hover:text-gray-700 transition-colors group"
                        >
                            Sign in instead
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {/* Back to Home */}
                    <div className="text-center pt-4">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
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
