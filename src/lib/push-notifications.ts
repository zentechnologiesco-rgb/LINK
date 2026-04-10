'use client'

export type PushSubscriptionPayload = {
    endpoint: string
    expirationTime?: number
    keys: {
        p256dh: string
        auth: string
    }
}

export type PushSupportState = {
    supported: boolean
    permission: NotificationPermission | 'unsupported'
    requiresInstall: boolean
    publicKeyReady: boolean
    reason: string | null
}

const SERVICE_WORKER_PATH = '/sw.js'

function hasPushApis() {
    return typeof window !== 'undefined'
        && 'Notification' in window
        && 'serviceWorker' in navigator
        && 'PushManager' in window
}

function isIosDevice() {
    if (typeof window === 'undefined') {
        return false
    }

    const { userAgent, platform, maxTouchPoints } = window.navigator
    return /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)
}

function isStandalonePwa() {
    if (typeof window === 'undefined') {
        return false
    }

    const iosNavigator = window.navigator as Navigator & { standalone?: boolean }
    return window.matchMedia('(display-mode: standalone)').matches || iosNavigator.standalone === true
}

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let index = 0; index < rawData.length; index += 1) {
        outputArray[index] = rawData.charCodeAt(index)
    }

    return outputArray
}

export function getPushPublicKey(publicKeyOverride?: string | null) {
    return publicKeyOverride || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null
}

export function getPushSupportState(publicKeyOverride?: string | null): PushSupportState {
    if (typeof window === 'undefined') {
        return {
            supported: false,
            permission: 'unsupported',
            requiresInstall: false,
            publicKeyReady: Boolean(getPushPublicKey(publicKeyOverride)),
            reason: 'Push notifications require a browser environment.',
        }
    }

    const permission = 'Notification' in window ? Notification.permission : 'unsupported'
    const publicKey = getPushPublicKey(publicKeyOverride)

    if (!hasPushApis()) {
        return {
            supported: false,
            permission,
            requiresInstall: false,
            publicKeyReady: Boolean(publicKey),
            reason: 'This browser does not support web push notifications.',
        }
    }

    if (isIosDevice() && !isStandalonePwa()) {
        return {
            supported: false,
            permission,
            requiresInstall: true,
            publicKeyReady: Boolean(publicKey),
            reason: 'Install LINK to your home screen and open it from there to enable push notifications on iPhone or iPad.',
        }
    }

    if (!publicKey) {
        return {
            supported: false,
            permission,
            requiresInstall: false,
            publicKeyReady: false,
            reason: 'Push notifications are not configured for this deployment yet.',
        }
    }

    return {
        supported: true,
        permission,
        requiresInstall: false,
        publicKeyReady: true,
        reason: null,
    }
}

export function supportsPushNotifications(publicKeyOverride?: string | null) {
    return getPushSupportState(publicKeyOverride).supported
}

export async function ensurePushServiceWorkerRegistration() {
    if (!hasPushApis()) {
        return null
    }

    const existingRegistration = await navigator.serviceWorker.getRegistration('/')
    if (existingRegistration) {
        return existingRegistration
    }

    try {
        return await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
            scope: '/',
            updateViaCache: 'none',
        })
    } catch {
        try {
            return await navigator.serviceWorker.ready
        } catch {
            return null
        }
    }
}

export async function getExistingPushSubscription() {
    const registration = await ensurePushServiceWorkerRegistration()
    if (!registration) {
        return null
    }

    return registration.pushManager.getSubscription()
}

export function serializePushSubscription(subscription: PushSubscription): PushSubscriptionPayload {
    const json = subscription.toJSON()
    const p256dh = json.keys?.p256dh
    const auth = json.keys?.auth

    if (!p256dh || !auth) {
        throw new Error('Push subscription is missing encryption keys')
    }

    return {
        endpoint: subscription.endpoint,
        expirationTime: subscription.expirationTime ?? undefined,
        keys: {
            p256dh,
            auth,
        },
    }
}

export async function subscribeCurrentDeviceToPush(publicKeyOverride?: string | null) {
    const supportState = getPushSupportState(publicKeyOverride)
    if (!supportState.supported) {
        throw new Error(supportState.reason || 'Push notifications are not supported on this device')
    }

    const publicKey = getPushPublicKey(publicKeyOverride)
    if (!publicKey) {
        throw new Error('Push notifications are not configured yet')
    }

    const registration = await ensurePushServiceWorkerRegistration()
    if (!registration) {
        throw new Error('Service worker is not ready for push notifications')
    }

    const existingSubscription = await registration.pushManager.getSubscription()
    if (existingSubscription) {
        return serializePushSubscription(existingSubscription)
    }

    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
    })

    return serializePushSubscription(subscription)
}

export async function unsubscribeCurrentDeviceFromPush() {
    const subscription = await getExistingPushSubscription()
    if (!subscription) {
        return {
            endpoint: null,
            unsubscribed: false,
        }
    }

    const endpoint = subscription.endpoint

    try {
        const unsubscribed = await subscription.unsubscribe()
        return { endpoint, unsubscribed }
    } catch {
        return { endpoint, unsubscribed: false }
    }
}

export async function requestPushPermission(publicKeyOverride?: string | null) {
    const supportState = getPushSupportState(publicKeyOverride)

    if (!hasPushApis() || supportState.requiresInstall) {
        return 'denied' as NotificationPermission
    }

    if (Notification.permission === 'granted') {
        return 'granted' as NotificationPermission
    }

    return Notification.requestPermission()
}
