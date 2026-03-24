'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Download, Share2, Smartphone, PlusSquare } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

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
        className="top-auto bottom-8 left-1/2 right-auto -translate-x-1/2 translate-y-0 w-[calc(100%-32px)] max-w-[380px] gap-0 overflow-hidden rounded-[32px] border border-neutral-200/60 bg-white/95 backdrop-blur-2xl p-0 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.2)]"
      >
        <div className="p-7">
          {/* Centered Brand Copy */}
          <div className="flex flex-col items-center text-center mb-6">
            <DialogTitle className="text-[22px] font-bold tracking-tight text-neutral-900 leading-tight">
              Install the App
            </DialogTitle>
            <DialogDescription className="text-[15px] font-medium text-neutral-500 mt-1.5 leading-snug px-2">
              Get the full native experience on your home screen for faster browsing.
            </DialogDescription>
          </div>

          {/* Manual install tips — only shown when needed formatted beautifully */}
          {showManualTips && (
            <div className="rounded-[20px] bg-neutral-100/80 border border-neutral-200/50 p-4 mb-6 text-left animate-in fade-in zoom-in-95 duration-200">
              {isIOS ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm border border-neutral-200/50">
                      <Share2 className="h-4 w-4 text-blue-500" />
                    </div>
                    <p className="text-[14px] leading-tight text-neutral-600 font-medium tracking-tight">
                      First, tap the <span className="font-bold text-neutral-900">Share</span> icon at the bottom of Safari.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm border border-neutral-200/50">
                      <PlusSquare className="h-4 w-4 text-neutral-700" />
                    </div>
                    <p className="text-[14px] leading-tight text-neutral-600 font-medium tracking-tight">
                      Then, scroll down and tap <span className="font-bold text-neutral-900">Add to Home Screen</span>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm border border-neutral-200/50">
                    <Smartphone className="h-4 w-4 text-neutral-700" />
                  </div>
                  <p className="text-[14px] leading-relaxed text-neutral-600 font-medium tracking-tight">
                    Open your browser menu and tap <span className="font-bold text-neutral-900">Install app</span> or <span className="font-bold text-neutral-900">Add to Home Screen</span>.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Thick Apple Actions Stack */}
          <div className="flex flex-col gap-3">
            {!showManualTips ? (
              <button
                className="w-full h-[52px] rounded-[16px] bg-black text-[17px] font-bold tracking-tight text-white hover:bg-neutral-800 active:scale-[0.98] transition-all flex items-center justify-center outline-none select-none shadow-sm"
                disabled={isInstalling}
                onClick={handleInstallClick}
              >
                {isInstalling ? 'Installing...' : 'Get App'}
              </button>
            ) : (
              <button
                className="w-full h-[52px] rounded-[16px] bg-black text-[17px] font-bold tracking-tight text-white hover:bg-neutral-800 active:scale-[0.98] transition-all flex items-center justify-center outline-none select-none shadow-sm"
                onClick={() => dismissPrompt()}
              >
                Got it
              </button>
            )}
            <button
              className="w-full h-[52px] rounded-[16px] bg-neutral-100 text-[17px] font-bold tracking-tight text-neutral-900 hover:bg-neutral-200 active:scale-[0.98] transition-all flex items-center justify-center outline-none select-none"
              onClick={() => dismissPrompt()}
            >
              Not now
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
