"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { useUser } from "./UserProvider";
import { useNotificationSound } from "./useNotificationSound";

interface NotificationCountsContextValue {
    unreadCount: number;
    leaseActionCount: number;
    paymentActionCount: number;
    totalNotifications: number;
    isLoading: boolean;
}

const NotificationCountsContext = createContext<NotificationCountsContextValue | undefined>(undefined);

export function NotificationCountsProvider({ children }: { children: ReactNode }) {
    const { user } = useUser();

    const unreadCountQuery = useQuery(api.messages.getUnreadCount, user ? {} : "skip");
    const leaseActionCountQuery = useQuery(api.leases.getActionRequiredCount, user ? {} : "skip");
    const paymentActionCountQuery = useQuery(api.payments.getActionRequiredCount, user ? {} : "skip");

    const unreadCount = typeof unreadCountQuery === "number" ? unreadCountQuery : 0;
    const leaseActionCount = typeof leaseActionCountQuery === "number" ? leaseActionCountQuery : 0;
    const paymentActionCount = typeof paymentActionCountQuery === "number" ? paymentActionCountQuery : 0;

    const isLoading = Boolean(user) && (
        unreadCountQuery === undefined ||
        leaseActionCountQuery === undefined ||
        paymentActionCountQuery === undefined
    );

    useNotificationSound({
        userId: user?._id ?? null,
        unreadCount,
        leaseActionCount,
        paymentActionCount,
        isLoading,
        preferences: user?.preferences?.notifications,
    });

    const value = useMemo<NotificationCountsContextValue>(
        () => ({
            unreadCount,
            leaseActionCount,
            paymentActionCount,
            totalNotifications: unreadCount + leaseActionCount + paymentActionCount,
            isLoading,
        }),
        [isLoading, leaseActionCount, paymentActionCount, unreadCount]
    );

    return (
        <NotificationCountsContext.Provider value={value}>
            {children}
        </NotificationCountsContext.Provider>
    );
}

export function useNotificationCounts() {
    const context = useContext(NotificationCountsContext);

    if (context === undefined) {
        throw new Error("useNotificationCounts must be used within a NotificationCountsProvider");
    }

    return context;
}
