'use client'

import { Suspense, useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthActions } from '@convex-dev/auth/react'
import { toast } from 'sonner'
import { AuthBrandLink } from '@/components/auth/AuthBrandLink'
import { AlertCircle, ArrowLeft, CheckCircle, Loader2, Mail } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import {
  getFriendlyPasswordResetError,
  getPasswordResetRequestFieldErrors,
  shouldMaskPasswordResetAccountError,
  type AuthField,
  type AuthFieldErrors,
} from '@/lib/auth-feedback'

function buildResetRedirect(email: string, redirectUrl: string | null) {
  const params = new URLSearchParams({ email })

  if (redirectUrl) {
    params.set('redirect', redirectUrl)
  }

  return `/reset-password?${params.toString()}`
}

function ForgotPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useAuthActions()

  const redirectUrl = searchParams.get('redirect')
  const initialEmail = searchParams.get('email') ?? ''

  const [email, setEmail] = useState(initialEmail)
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submittedEmail, setSubmittedEmail] = useState(initialEmail)

  useEffect(() => {
    setEmail(initialEmail)
    setSubmittedEmail(initialEmail)
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

    const values = { email }
    const nextFieldErrors = getPasswordResetRequestFieldErrors(values)
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      setFormError('Enter the email address you want to reset.')
      toast.error('Check the email address and try again.')
      return
    }

    const normalizedEmail = email.trim()
    const formData = new FormData()
    formData.set('email', normalizedEmail)
    formData.set('flow', 'reset')
    formData.set('redirectTo', buildResetRedirect(normalizedEmail, redirectUrl))

    setIsLoading(true)
    setFieldErrors({})
    setFormError(null)

    try {
      await signIn('password', formData)
      setSubmittedEmail(normalizedEmail)
      setIsSent(true)
      toast.success('If that email is registered, a reset link is on its way.')
    } catch (error) {
      console.error(error)

      if (shouldMaskPasswordResetAccountError(error)) {
        setSubmittedEmail(normalizedEmail)
        setIsSent(true)
        toast.success('If that email is registered, a reset link is on its way.')
      } else {
        const feedback = getFriendlyPasswordResetError(error, 'request')
        setFieldErrors(feedback.fieldErrors ?? {})
        setFormError(feedback.formError ?? null)
        toast.error(feedback.toastMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isSent) {
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

          <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 px-6 py-7">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-white">
              <CheckCircle className="h-7 w-7" strokeWidth={2.2} />
            </div>

            <h1 className="mt-6 text-[32px] font-bold tracking-tight text-neutral-900">
              Check your email
            </h1>
            <p className="mt-3 text-[16px] leading-relaxed text-neutral-600">
              If an account exists for <span className="font-semibold text-neutral-900">{submittedEmail}</span>, we just sent a password reset link.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-neutral-500">
              Open the email on this device and use the link within 30 minutes to set a new password.
            </p>
          </div>

          <div className="mt-auto space-y-4 pt-8">
            <Link
              href={redirectUrl ? `/sign-in?redirect=${encodeURIComponent(redirectUrl)}` : '/sign-in'}
              className="flex h-14 w-full items-center justify-center rounded-[16px] bg-black text-[17px] font-bold tracking-tight text-white shadow-md transition-all hover:bg-neutral-800 focus-visible:ring-4 focus-visible:ring-black/20"
            >
              Back to sign in
            </Link>
            <button
              type="button"
              onClick={() => setIsSent(false)}
              className="flex h-14 w-full items-center justify-center rounded-[16px] bg-neutral-100 text-[16px] font-bold tracking-tight text-neutral-900 transition-colors hover:bg-neutral-200 focus-visible:ring-4 focus-visible:ring-black/10"
            >
              Send another link
            </button>
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

        <div className="mb-10">
          <h1 className="text-[34px] sm:text-[40px] font-bold text-neutral-900 tracking-tight leading-tight">
            Forgot password
          </h1>
          <p className="text-[17px] text-neutral-500 font-medium mt-1.5 tracking-tight">
            Enter your email and we&apos;ll send you a secure reset link.
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
                <Mail className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-[15px] font-semibold tracking-tight text-neutral-900">One tap from your inbox</p>
                <p className="text-[13px] leading-relaxed text-neutral-500">We&apos;ll send a reset link that opens straight into the new password form.</p>
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
                'Send reset link'
              )}
            </button>

            <div className="text-center pt-1.5 pb-2">
              <p className="text-[15px] font-medium text-neutral-500">
                Remembered it?{' '}
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

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  )
}
