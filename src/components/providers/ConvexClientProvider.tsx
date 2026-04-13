"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ReactNode } from "react";
import { NotificationCountsProvider } from "./NotificationCountsProvider";
import { PushNotificationsManager } from "./PushNotificationsManager";
import { SavedPropertiesProvider } from "./SavedPropertiesProvider";
import { UserProvider } from "./UserProvider";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
}

const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
    const shouldHandleCode = () => {
        if (typeof window === "undefined") {
            return true;
        }

        return !window.location.pathname.startsWith("/reset-password");
    };

    return (
        <ConvexAuthProvider client={convex} shouldHandleCode={shouldHandleCode}>
            <UserProvider>
                <PushNotificationsManager />
                <NotificationCountsProvider>
                    <SavedPropertiesProvider>
                        {children}
                    </SavedPropertiesProvider>
                </NotificationCountsProvider>
            </UserProvider>
        </ConvexAuthProvider>
    );
}
