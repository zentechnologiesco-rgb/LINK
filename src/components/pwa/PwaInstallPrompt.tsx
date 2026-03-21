'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Download, Share2, Smartphone } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

  return (
    <Dialog open={isOpen} onOpenChange={(nextOpen) => !nextOpen && dismissPrompt()}>
      <DialogContent
        showCloseButton={false}
        className="top-1/2 left-1/2 right-auto bottom-auto -translate-x-1/2 -translate-y-1/2 w-[calc(100%-24px)] max-w-[360px] gap-0 overflow-hidden rounded-[24px] border border-neutral-200/80 bg-white p-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)]"
      >
        {/* Compact content */}
        <div className="px-5 pt-5 pb-4">
          {/* Top row: icon + text */}
          <div className="flex items-start gap-3.5 mb-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-900">
              <Smartphone className="h-5 w-5 text-[#C4F135]" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-[17px] font-[900] leading-tight tracking-[-0.01em] text-neutral-900">
                Get the LINK app
              </DialogTitle>
              <DialogDescription className="text-[13px] font-semibold leading-snug text-neutral-400 mt-1">
                Faster browsing, one tap from home screen.
              </DialogDescription>
            </div>
          </div>

          {/* Manual install tips — only shown when needed */}
          {showManualTips && (
            <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-4 mb-4 text-left animate-in fade-in zoom-in-95 duration-200">
              {isIOS ? (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200">
                    <Share2 className="h-3.5 w-3.5 text-neutral-600" />
                  </div>
                  <p className="text-[13px] leading-relaxed text-neutral-500 font-medium">
                    Tap <span className="font-bold text-neutral-900">Share</span> then{' '}
                    <span className="font-bold text-neutral-900">Add to Home Screen</span>.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200">
                    <Smartphone className="h-3.5 w-3.5 text-neutral-600" />
                  </div>
                  <p className="text-[13px] leading-relaxed text-neutral-500 font-medium">
                    Open browser menu → <span className="font-bold text-neutral-900">Install app</span> or{' '}
                    <span className="font-bold text-neutral-900">Add to Home Screen</span>.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <button
              className="h-12 flex-1 rounded-full text-[14px] font-bold text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 transition-all active:scale-[0.97]"
              onClick={() => dismissPrompt()}
            >
              Not now
            </button>
            {!showManualTips ? (
              <Button
                className="h-12 flex-[2] rounded-full bg-neutral-900 text-[14px] font-[800] tracking-tight text-white hover:bg-neutral-800 active:scale-[0.97] transition-all"
                disabled={isInstalling}
                onClick={handleInstallClick}
              >
                <Download className="mr-1.5 h-4 w-4" />
                {isInstalling ? 'Installing...' : 'Install'}
              </Button>
            ) : (
              <Button
                className="h-12 flex-[2] rounded-full bg-neutral-900 text-[14px] font-[800] tracking-tight text-white hover:bg-neutral-800 active:scale-[0.97] transition-all"
                onClick={() => dismissPrompt()}
              >
                Got it
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
