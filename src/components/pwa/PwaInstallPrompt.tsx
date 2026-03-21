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
        className="top-auto right-4 bottom-4 left-4 max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-[32px] border border-white/10 bg-[#0A0A0A] p-0 shadow-[0_0_40px_rgba(0,0,0,0.5)] sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:w-full sm:max-w-[360px] sm:-translate-x-1/2 sm:-translate-y-1/2"
      >
        <div className="flex flex-col items-center p-8 pb-6 text-center relative overflow-hidden">
          {/* Background glow effects */}
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#C4F135]/20 rounded-full blur-[60px] pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#C4F135]/10 rounded-full blur-[60px] pointer-events-none" />

          {/* Minimalist App Icon */}
          <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-gradient-to-b from-neutral-800 to-neutral-900 border border-white/10 shadow-xl z-10 mb-6">
            <Smartphone className="h-8 w-8 text-[#C4F135]" />
          </div>

          <DialogTitle className="text-[26px] font-[900] leading-tight tracking-[-0.02em] text-white mb-3 z-10">
            Get the full<br />experience
          </DialogTitle>
          <DialogDescription className="text-[15px] font-medium leading-relaxed text-white/60 mb-8 z-10 px-2">
            Experience LINK at its best. Faster, smoother, and just one tap away on your home screen.
          </DialogDescription>

          {/* iOS Manual Instructions */}
          {showManualTips && (
            <div className="w-full rounded-[24px] bg-white/5 border border-white/10 p-5 mb-6 text-left z-10 animate-in fade-in zoom-in-95 duration-200">
              {isIOS ? (
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <Share2 className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-[14px] leading-relaxed text-white/80 font-medium">
                    Tap the <span className="font-bold text-white">Share</span> button below
                    then select <span className="font-bold text-white">Add to Home Screen</span>.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <Smartphone className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-[14px] leading-relaxed text-white/80 font-medium">
                    Open your browser menu and tap{' '}
                    <span className="font-bold text-white">Install app</span> or{' '}
                    <span className="font-bold text-white">Add to Home Screen</span>.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex w-full flex-col gap-3 z-10 mt-auto">
            {!showManualTips ? (
              <Button
                className="h-14 w-full rounded-[20px] bg-[#C4F135] text-[16px] font-[900] tracking-tight text-black hover:bg-[#b0d930] shadow-[0_0_20px_rgba(196,241,53,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                disabled={isInstalling}
                onClick={handleInstallClick}
              >
                <Download className="mr-2 h-[22px] w-[22px]" />
                {isInstalling ? 'Installing...' : 'Install LINK App'}
              </Button>
            ) : (
              <Button
                className="h-14 w-full rounded-[20px] bg-white text-[16px] font-[900] tracking-tight text-black hover:bg-neutral-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
                onClick={() => dismissPrompt()}
              >
                Got it
              </Button>
            )}

            {!showManualTips && (
              <button
                className="h-12 w-full rounded-full text-[15px] font-bold text-white/40 hover:text-white transition-colors"
                onClick={() => dismissPrompt()}
              >
                Keep using browser
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
