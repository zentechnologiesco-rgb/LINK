"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ReactNode } from "react";
import { NotificationCountsProvider } from "./NotificationCountsProvider";
import { SavedPropertiesProvider } from "./SavedPropertiesProvider";
import { UserProvider } from "./UserProvider";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
}

const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
    return (
        <ConvexAuthProvider client={convex}>
            <UserProvider>
                <NotificationCountsProvider>
                    <SavedPropertiesProvider>
                        {children}
                    </SavedPropertiesProvider>
                </NotificationCountsProvider>
            </UserProvider>
        </ConvexAuthProvider>
    );
}
