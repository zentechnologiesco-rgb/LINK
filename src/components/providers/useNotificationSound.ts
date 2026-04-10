'use client'

import { useEffect, useEffectEvent, useRef } from 'react'

const SOUND_THROTTLE_MS = 1500

type NotificationSoundPreferences = {
    messages?: boolean
    leases?: boolean
    payments?: boolean
} | null | undefined

type AudioCapableWindow = Window & typeof globalThis & {
    webkitAudioContext?: typeof AudioContext
}

function shouldUseMobileNotificationSound() {
    if (typeof window === 'undefined') {
        return false
    }

    const iosNavigator = window.navigator as Navigator & { standalone?: boolean }
    const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        iosNavigator.standalone === true
    const isCompactTouchDevice =
        window.matchMedia('(pointer: coarse)').matches &&
        window.matchMedia('(max-width: 1024px)').matches

    return isStandalone || isCompactTouchDevice
}

function isDocumentVisible() {
    if (typeof document === 'undefined') {
        return false
    }

    return document.visibilityState === 'visible'
}

export function useNotificationSound({
    userId,
    unreadCount,
    leaseActionCount,
    paymentActionCount,
    isLoading,
    preferences,
}: {
    userId?: string | null
    unreadCount: number
    leaseActionCount: number
    paymentActionCount: number
    isLoading: boolean
    preferences?: NotificationSoundPreferences
}) {
    const audioContextRef = useRef<AudioContext | null>(null)
    const isAudioUnlockedRef = useRef(false)
    const lastPlayedAtRef = useRef(0)
    const previousCountsRef = useRef<{
        unreadCount: number
        leaseActionCount: number
        paymentActionCount: number
    } | null>(null)

    const getAudioContext = useEffectEvent(() => {
        if (typeof window === 'undefined') {
            return null
        }

        if (audioContextRef.current) {
            return audioContextRef.current
        }

        const AudioContextConstructor =
            window.AudioContext ||
            (window as AudioCapableWindow).webkitAudioContext

        if (!AudioContextConstructor) {
            return null
        }

        audioContextRef.current = new AudioContextConstructor()
        isAudioUnlockedRef.current = audioContextRef.current.state === 'running'

        return audioContextRef.current
    })

    const unlockAudio = useEffectEvent(() => {
        const audioContext = getAudioContext()
        if (!audioContext) {
            return
        }

        void audioContext.resume().then(() => {
            isAudioUnlockedRef.current = audioContext.state === 'running'
        }).catch(() => undefined)
    })

    const playNotificationSound = useEffectEvent(() => {
        const audioContext = getAudioContext()
        if (!audioContext || (!isAudioUnlockedRef.current && audioContext.state !== 'running')) {
            return
        }

        if (audioContext.state !== 'running') {
            return
        }

        const now = audioContext.currentTime + 0.01
        const masterGain = audioContext.createGain()
        masterGain.connect(audioContext.destination)
        masterGain.gain.setValueAtTime(0.0001, now)
        masterGain.gain.exponentialRampToValueAtTime(0.018, now + 0.02)
        masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38)

        const tones = [
            { frequency: 740, duration: 0.18, volume: 0.7, delay: 0 },
            { frequency: 988, duration: 0.24, volume: 0.45, delay: 0.045 },
        ] as const

        tones.forEach((tone) => {
            const oscillator = audioContext.createOscillator()
            const gain = audioContext.createGain()
            const toneStart = now + tone.delay

            oscillator.type = 'sine'
            oscillator.frequency.setValueAtTime(tone.frequency, toneStart)
            oscillator.frequency.exponentialRampToValueAtTime(tone.frequency * 1.015, toneStart + tone.duration)

            gain.gain.setValueAtTime(0.0001, toneStart)
            gain.gain.exponentialRampToValueAtTime(0.12 * tone.volume, toneStart + 0.02)
            gain.gain.exponentialRampToValueAtTime(0.0001, toneStart + tone.duration)

            oscillator.connect(gain)
            gain.connect(masterGain)

            oscillator.start(toneStart)
            oscillator.stop(toneStart + tone.duration)
        })

        lastPlayedAtRef.current = Date.now()
    })

    useEffect(() => {
        previousCountsRef.current = null
        lastPlayedAtRef.current = 0
    }, [userId])

    useEffect(() => {
        if (typeof window === 'undefined') {
            return
        }

        window.addEventListener('pointerdown', unlockAudio, { passive: true })
        window.addEventListener('keydown', unlockAudio)

        return () => {
            window.removeEventListener('pointerdown', unlockAudio)
            window.removeEventListener('keydown', unlockAudio)
        }
    }, [])

    useEffect(() => {
        return () => {
            const audioContext = audioContextRef.current
            audioContextRef.current = null

            if (audioContext) {
                void audioContext.close().catch(() => undefined)
            }
        }
    }, [])

    useEffect(() => {
        if (isLoading) {
            return
        }

        const nextCounts = {
            unreadCount,
            leaseActionCount,
            paymentActionCount,
        }
        const previousCounts = previousCountsRef.current

        previousCountsRef.current = nextCounts

        if (!previousCounts) {
            return
        }

        if (!shouldUseMobileNotificationSound() || !isDocumentVisible()) {
            return
        }

        const messageIncrease = unreadCount > previousCounts.unreadCount && preferences?.messages !== false
        const leaseIncrease = leaseActionCount > previousCounts.leaseActionCount && preferences?.leases !== false
        const paymentIncrease = paymentActionCount > previousCounts.paymentActionCount && preferences?.payments !== false

        if (!messageIncrease && !leaseIncrease && !paymentIncrease) {
            return
        }

        if (Date.now() - lastPlayedAtRef.current < SOUND_THROTTLE_MS) {
            return
        }

        playNotificationSound()
    }, [
        isLoading,
        leaseActionCount,
        paymentActionCount,
        preferences?.leases,
        preferences?.messages,
        preferences?.payments,
        unreadCount,
    ])
}
