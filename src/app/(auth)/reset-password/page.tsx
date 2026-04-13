'use client'

import { Suspense, useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthActions } from '@convex-dev/auth/react'
import { toast } from 'sonner'
import { AuthBrandLink } from '@/components/auth/AuthBrandLink'
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, Lock } from '@/components/ui/icons'
import {
  getFriendlyPasswordResetError,
  getPasswordResetFieldErrors,
  type AuthField,
  type AuthFieldErrors,
} from '@/lib/auth-feedback'
import { cn } from '@/lib/utils'

function buildForgotPasswordHref(email: string, redirectUrl: string | null) {
  const params = new URLSearchParams()

  if (email) {
    params.set('email', email)
  }

  if (redirectUrl) {
    params.set('redirect', redirectUrl)
  }

  const query = params.toString()
  return query ? `/forgot-password?${query}` : '/forgot-password'
}

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useAuthActions()

  const code = searchParams.get('code') ?? ''
  const redirectUrl = searchParams.get('redirect')
  const nextRedirectUrl = redirectUrl ? decodeURIComponent(redirectUrl) : '/'
  const initialEmail = searchParams.get('email') ?? ''

  const [email, setEmail] = useState(initialEmail)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    setEmail(initialEmail)
  }, [initialEmail])

  function clearFieldError(field: AuthField) {
    setFieldErrors((current) => {
      if (!current[field]) return current
      return { ...current, [field]: undefined }
    })
    setFormError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const values = {
      email,
      newPassword,
      confirmPassword,
    }

    const nextFieldErrors = getPasswordResetFieldErrors(values)
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      setFormError('Please resolve the highlighted fields below.')
      toast.error('Check the form and try again.')
      return
    }

    if (!code) {
      setFormError('This reset link is incomplete. Request a fresh one and try again.')
      toast.error('Reset link is missing required details.')
      return
    }

    const formData = new FormData()
    formData.set('email', email.trim())
    formData.set('newPassword', newPassword)
    formData.set('code', code)
    formData.set('flow', 'reset-verification')

    setIsLoading(true)
    setFieldErrors({})
    setFormError(null)

    try {
      await signIn('password', formData)
      toast.success('Your password has been updated.')
      router.replace(nextRedirectUrl)
      router.refresh()
    } catch (error) {
      console.error(error)
      const feedback = getFriendlyPasswordResetError(error, 'confirm')
      setFieldErrors(feedback.fieldErrors ?? {})
      setFormError(feedback.formError ?? null)
      toast.error(feedback.toastMessage)
      setIsLoading(false)
    }
  }

  if (!code) {
    return (
      <div className="min-h-screen bg-white relative flex flex-col font-sans selection:bg-neutral-200">
        <header className="safe-top flex h-[60px] shrink-0 items-center px-4 sm:h-[72px]">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors -ml-2 text-neutral-900 outline-none"
            aria-label="Go back"
          >
            <ArrowLeft className="h-[22px] w-[22px]" strokeWidth={2.5} />
          </button>
        </header>

        <main className="flex-1 flex flex-col px-6 sm:px-12 w-full max-w-[480px] mx-auto pb-8">
          <AuthBrandLink className="mx-auto mt-2 mb-7" />

          <div className="rounded-[28px] border border-red-200 bg-red-50 px-6 py-7">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-red-600">
              <AlertCircle className="h-7 w-7" strokeWidth={2.2} />
            </div>

            <h1 className="mt-6 text-[32px] font-bold tracking-tight text-neutral-900">
              Reset link unavailable
            </h1>
            <p className="mt-3 text-[16px] leading-relaxed text-neutral-600">
              This page needs a valid password reset link from your email. Request a new link to continue.
            </p>
          </div>

          <div className="mt-auto space-y-4 pt-8">
            <Link
              href={buildForgotPasswordHref(initialEmail, redirectUrl)}
              className="flex h-14 w-full items-center justify-center rounded-[16px] bg-black text-[17px] font-bold tracking-tight text-white shadow-md transition-all hover:bg-neutral-800 focus-visible:ring-4 focus-visible:ring-black/20"
            >
              Request a new link
            </Link>
            <Link
              href={redirectUrl ? `/sign-in?redirect=${encodeURIComponent(redirectUrl)}` : '/sign-in'}
              className="flex h-14 w-full items-center justify-center rounded-[16px] bg-neutral-100 text-[16px] font-bold tracking-tight text-neutral-900 transition-colors hover:bg-neutral-200 focus-visible:ring-4 focus-visible:ring-black/10"
            >
              Back to sign in
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white relative flex flex-col font-sans selection:bg-neutral-200">
      <header className="safe-top flex h-[60px] shrink-0 items-center px-4 sm:h-[72px]">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors -ml-2 text-neutral-900 outline-none"
          aria-label="Go back"
        >
          <ArrowLeft className="h-[22px] w-[22px]" strokeWidth={2.5} />
        </button>
      </header>

      <main className="flex-1 flex flex-col px-6 sm:px-12 w-full max-w-[480px] mx-auto pb-8">
        <AuthBrandLink className="mx-auto mt-2 mb-7" />

        <div className="mb-8">
          <h1 className="text-[34px] sm:text-[40px] font-bold text-neutral-900 tracking-tight leading-tight">
            Create a new password
          </h1>
          <p className="text-[17px] text-neutral-500 font-medium mt-1.5 tracking-tight">
            Use the same email address that received this reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col" noValidate>
          {formError && (
            <div className="mb-6 flex items-start gap-3 rounded-[16px] bg-red-50 px-4 py-3 text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" strokeWidth={2.5} />
              <p className="text-[14px] font-semibold leading-relaxed tracking-tight">{formError}</p>
            </div>
          )}

          <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-900 shadow-sm">
                <Lock className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-[15px] font-semibold tracking-tight text-neutral-900">Secure reset</p>
                <p className="text-[13px] leading-relaxed text-neutral-500">Your new password replaces the old one and signs out older sessions.</p>
              </div>
            </div>
          </div>

          <div className="space-y-5 flex-1 py-8">
            <div className="space-y-2">
              <label htmlFor="email" className="text-[13px] font-bold text-neutral-900 tracking-wide uppercase px-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    clearFieldError('email')
                  }}
                  autoComplete="email"
                  placeholder="name@example.com"
                  disabled={isLoading}
                  aria-invalid={!!fieldErrors.email}
                  className={cn(
                    'w-full h-14 rounded-[16px] bg-neutral-100 border-[1.5px] border-transparent outline-none px-4 text-[16px] font-medium transition-all text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-black focus:shadow-[0_0_0_4px_rgba(0,0,0,0.05)]',
                    fieldErrors.email && 'border-red-400 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)] bg-red-50',
                  )}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-2 ml-1 text-[13px] font-semibold text-red-500 tracking-tight">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-[13px] font-bold text-neutral-900 tracking-wide uppercase px-1">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value)
                    clearFieldError('newPassword')
                  }}
                  autoComplete="new-password"
                  placeholder="Create a new password"
                  disabled={isLoading}
                  aria-invalid={!!fieldErrors.newPassword}
                  className={cn(
                    'w-full h-14 rounded-[16px] bg-neutral-100 border-[1.5px] border-transparent outline-none pl-4 pr-12 text-[16px] font-medium transition-all text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-black focus:shadow-[0_0_0_4px_rgba(0,0,0,0.05)]',
                    fieldErrors.newPassword && 'border-red-400 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)] bg-red-50',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition-colors outline-none rounded-full"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-[22px] w-[22px]" strokeWidth={2} />
                  ) : (
                    <Eye className="h-[22px] w-[22px]" strokeWidth={2} />
                  )}
                </button>
              </div>
              <p className={cn(
                'mt-1.5 ml-1 text-[13px] tracking-tight',
                fieldErrors.newPassword ? 'font-semibold text-red-500' : 'font-medium text-neutral-400',
              )}>
                {fieldErrors.newPassword || 'Must be at least 6 characters'}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-[13px] font-bold text-neutral-900 tracking-wide uppercase px-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value)
                    clearFieldError('confirmPassword')
                  }}
                  autoComplete="new-password"
                  placeholder="Enter your new password again"
                  disabled={isLoading}
                  aria-invalid={!!fieldErrors.confirmPassword}
                  className={cn(
                    'w-full h-14 rounded-[16px] bg-neutral-100 border-[1.5px] border-transparent outline-none pl-4 pr-12 text-[16px] font-medium transition-all text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-black focus:shadow-[0_0_0_4px_rgba(0,0,0,0.05)]',
                    fieldErrors.confirmPassword && 'border-red-400 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)] bg-red-50',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition-colors outline-none rounded-full"
                  aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-[22px] w-[22px]" strokeWidth={2} />
                  ) : (
                    <Eye className="h-[22px] w-[22px]" strokeWidth={2} />
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-2 ml-1 text-[13px] font-semibold text-red-500 tracking-tight">{fieldErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="mt-auto space-y-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-black text-white hover:bg-neutral-800 disabled:opacity-50 disabled:active:scale-100 font-bold text-[17px] tracking-tight rounded-[16px] active:scale-[0.98] transition-all flex items-center justify-center shadow-md select-none outline-none focus-visible:ring-4 focus-visible:ring-black/20"
            >
              {isLoading ? (
                <Loader2 className="h-[22px] w-[22px] animate-spin" />
              ) : (
                'Update password'
              )}
            </button>

            <div className="text-center pt-1.5 pb-2">
              <p className="text-[15px] font-medium text-neutral-500">
                Need a fresh link?{' '}
                <Link
                  href={buildForgotPasswordHref(email.trim(), redirectUrl)}
                  className="text-black font-bold outline-none rounded-md focus-visible:ring-2 focus-visible:ring-black"
                >
                  Request another
                </Link>
              </p>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
