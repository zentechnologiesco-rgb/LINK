'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Download, Globe, Share2, Smartphone } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const PROMPT_STORAGE_KEY = 'link:pwa-install-prompt:v1'
const DISMISS_FOR_MS = 1000 * 60 * 60 * 24 * 7
const INSTALL_RETRY_MS = 1000 * 60 * 60 * 24 * 2
const PROMPT_DELAY_MS = 1400

interface PromptPreference {
  dismissedUntil?: number
  installed?: boolean
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function readPromptPreference(): PromptPreference {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const storedValue = window.localStorage.getItem(PROMPT_STORAGE_KEY)
    return storedValue ? (JSON.parse(storedValue) as PromptPreference) : {}
  } catch {
    return {}
  }
}

function writePromptPreference(patch: PromptPreference) {
  if (typeof window === 'undefined') {
    return
  }

  const nextValue = {
    ...readPromptPreference(),
    ...patch,
  }

  try {
    window.localStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(nextValue))
  } catch {
    // Ignore storage errors and keep the prompt functional.
  }
}

function isStandaloneMode() {
  if (typeof window === 'undefined') {
    return false
  }

  const iosNavigator = window.navigator as Navigator & { standalone?: boolean }
  return window.matchMedia('(display-mode: standalone)').matches || iosNavigator.standalone === true
}

function isIOSDevice() {
  if (typeof window === 'undefined') {
    return false
  }

  const userAgent = window.navigator.userAgent
  return /iPad|iPhone|iPod/.test(userAgent) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
}

function isMobileDevice() {
  if (typeof window === 'undefined') {
    return false
  }

  const userAgent = window.navigator.userAgent
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches
  const compactViewport = window.matchMedia('(max-width: 1024px)').matches

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || (coarsePointer && compactViewport)
}

export function PwaInstallPrompt() {
  const pathname = usePathname()
  const installPromptRef = useRef<BeforeInstallPromptEvent | null>(null)

  const [isEligible, setIsEligible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstallReady, setIsInstallReady] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [showManualTips, setShowManualTips] = useState(false)

  useEffect(() => {
    if (pathname === '/offline') {
      return
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })
        .catch(() => undefined)
    }

    const mobile = isMobileDevice()
    const ios = isIOSDevice()
    const storedPreference = readPromptPreference()

    setIsEligible(mobile)
    setIsIOS(ios)

    if (!mobile || isStandaloneMode() || storedPreference.installed) {
      if (isStandaloneMode()) {
        writePromptPreference({ installed: true })
      }
      return
    }

    if ((storedPreference.dismissedUntil ?? 0) > Date.now()) {
      return
    }

    const openPrompt = () => {
      const latestPreference = readPromptPreference()

      if (isStandaloneMode() || latestPreference.installed) {
        writePromptPreference({ installed: true })
        return
      }

      if ((latestPreference.dismissedUntil ?? 0) > Date.now()) {
        return
      }

      setIsOpen(true)
    }

    const promptTimer = window.setTimeout(openPrompt, PROMPT_DELAY_MS)

    const handleBeforeInstallPrompt = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent
      installEvent.preventDefault()
      installPromptRef.current = installEvent
      setIsInstallReady(true)
      openPrompt()
    }

    const handleAppInstalled = () => {
      installPromptRef.current = null
      setIsInstallReady(false)
      writePromptPreference({ installed: true, dismissedUntil: 0 })
      setIsOpen(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.clearTimeout(promptTimer)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [pathname])

  const dismissPrompt = (duration = DISMISS_FOR_MS) => {
    writePromptPreference({ dismissedUntil: Date.now() + duration })
    setShowManualTips(false)
    setIsOpen(false)
  }

  const handleInstallClick = async () => {
    if (installPromptRef.current) {
      setIsInstalling(true)

      const promptEvent = installPromptRef.current
      installPromptRef.current = null
      setIsInstallReady(false)

      try {
        const result = await promptEvent.prompt()

        if (result.outcome === 'accepted') {
          writePromptPreference({ installed: true, dismissedUntil: 0 })
          setIsOpen(false)
          return
        }

        dismissPrompt(INSTALL_RETRY_MS)
      } finally {
        setIsInstalling(false)
      }

      return
    }

    setShowManualTips(true)
  }

  if (!isEligible || pathname === '/offline') {
    return null
  }

  const installButtonLabel = isInstallReady ? 'Install app' : isIOS ? 'Show install steps' : 'Install tips'

  return (
    <Dialog open={isOpen} onOpenChange={(nextOpen) => !nextOpen && dismissPrompt()}>
      <DialogContent
        showCloseButton={false}
        className="top-auto right-4 bottom-4 left-4 max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-[28px] border-0 p-0 shadow-[0_30px_80px_rgba(0,0,0,0.24)] sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2"
      >
        <DialogHeader className="gap-0">
          <div className="bg-neutral-950 px-6 pt-6 pb-5 text-white">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#a9ff3c] text-neutral-950">
                <Smartphone className="h-6 w-6" />
              </div>
              <div className="space-y-1 text-left">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a9ff3c]/80">
                  Mobile Mode
                </p>
                <DialogTitle className="text-xl font-black tracking-tight text-white">
                  Continue on the website or install LINK
                </DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-left text-sm leading-6 text-white/70">
              Install LINK to open it from your home screen with a cleaner app-style shell and
              faster return visits.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 bg-white px-6 py-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-black/10 bg-neutral-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/40">
                Website
              </p>
              <div className="mt-3 flex items-center gap-2 text-black">
                <Globe className="h-4 w-4" />
                <p className="text-sm font-semibold">Keep browsing in the browser.</p>
              </div>
            </div>
            <div className="rounded-3xl border border-black/10 bg-neutral-950 p-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                Installed App
              </p>
              <div className="mt-3 flex items-center gap-2 text-white">
                <Download className="h-4 w-4 text-[#a9ff3c]" />
                <p className="text-sm font-semibold">Add LINK to your home screen.</p>
              </div>
            </div>
          </div>

          {(isIOS || showManualTips || !isInstallReady) && (
            <div className="rounded-3xl border border-black/10 bg-neutral-50 p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/40">
                Install Help
              </p>
              {isIOS ? (
                <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-black/60">
                  <Share2 className="mt-1 h-4 w-4 shrink-0 text-black" />
                  On iPhone or iPad, open your browser share menu and choose{' '}
                  <span className="font-semibold text-black">Add to Home Screen</span>.
                </p>
              ) : (
                <p className="mt-2 text-sm leading-6 text-black/60">
                  Some browsers wait until the visitor has spent a little time on the site before
                  enabling install. If the install sheet is not ready yet, keep browsing for a
                  moment, then use your browser menu and choose{' '}
                  <span className="font-semibold text-black">Install app</span> or{' '}
                  <span className="font-semibold text-black">Add to Home Screen</span>.
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="h-11 flex-1 rounded-full border-neutral-200 text-sm font-semibold"
              onClick={() => dismissPrompt()}
            >
              <Globe className="h-4 w-4" />
              Continue on website
            </Button>
            <Button
              className="h-11 flex-1 rounded-full bg-neutral-950 text-sm font-semibold text-white hover:bg-neutral-800"
              disabled={isInstalling}
              onClick={handleInstallClick}
            >
              <Download className="h-4 w-4" />
              {isInstalling ? 'Opening install...' : installButtonLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
