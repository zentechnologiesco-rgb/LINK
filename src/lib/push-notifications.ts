'use client'

export type PushSubscriptionPayload = {
    endpoint: string
    expirationTime?: number
    keys: {
        p256dh: string
        auth: string
    }
}

const SERVICE_WORKER_PATH = '/sw.js'

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

export function supportsPushNotifications() {
    return typeof window !== 'undefined'
        && 'Notification' in window
        && 'serviceWorker' in navigator
        && 'PushManager' in window
}

export function getPushPublicKey() {
    return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null
}

export async function ensurePushServiceWorkerRegistration() {
    if (!supportsPushNotifications()) {
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

export async function subscribeCurrentDeviceToPush() {
    const publicKey = getPushPublicKey()
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

export async function requestPushPermission() {
    if (!supportsPushNotifications()) {
        return 'denied' as NotificationPermission
    }

    if (Notification.permission === 'granted') {
        return 'granted' as NotificationPermission
    }

    return Notification.requestPermission()
}
