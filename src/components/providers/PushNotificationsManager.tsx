'use client'

import { useEffect, useRef } from 'react'
import { useMutation, useQuery } from 'convex/react'

import { api } from '@convex/_generated/api'
import {
    getPushSupportState,
    subscribeCurrentDeviceToPush,
    unsubscribeCurrentDeviceFromPush,
} from '@/lib/push-notifications'

import { useUser } from './UserProvider'

export function PushNotificationsManager() {
    const { user } = useUser()
    const pushConfiguration = useQuery(api.pushSubscriptions.getClientConfiguration, {})
    const upsertPushSubscription = useMutation(api.pushSubscriptions.upsert)
    const removePushSubscription = useMutation(api.pushSubscriptions.remove)
    const previousUserIdRef = useRef<string | null>(null)

    useEffect(() => {
        let cancelled = false

        async function syncPushSubscription() {
            const supportState = getPushSupportState(pushConfiguration?.publicKey)
            if (!supportState.supported) {
                return
            }

            if (!user?._id) {
                if (previousUserIdRef.current) {
                    await unsubscribeCurrentDeviceFromPush().catch(() => undefined)
                }

                previousUserIdRef.current = null
                return
            }

            const pushEnabled = user.preferences?.notifications?.push === true

            if (!pushEnabled) {
                const result = await unsubscribeCurrentDeviceFromPush().catch(() => null)

                if (!cancelled && result?.endpoint) {
                    await removePushSubscription({ endpoint: result.endpoint }).catch(() => undefined)
                }

                previousUserIdRef.current = user._id
                return
            }

            if (Notification.permission !== 'granted') {
                previousUserIdRef.current = user._id
                return
            }

            const subscription = await subscribeCurrentDeviceToPush(pushConfiguration?.publicKey).catch(() => null)
            if (!subscription || cancelled) {
                previousUserIdRef.current = user._id
                return
            }

            await upsertPushSubscription({
                ...subscription,
                userAgent: navigator.userAgent,
            }).catch(() => undefined)

            previousUserIdRef.current = user._id
        }

        void syncPushSubscription()

        return () => {
            cancelled = true
        }
    }, [
        removePushSubscription,
        upsertPushSubscription,
        pushConfiguration?.publicKey,
        user?._id,
        user?.preferences?.notifications?.push,
    ])

    return null
}
