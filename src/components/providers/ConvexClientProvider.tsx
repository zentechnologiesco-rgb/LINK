"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ReactNode } from "react";
import { UserProvider } from "./UserProvider";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://optimistic-starling-894.convex.cloud");

export function ConvexClientProvider({ children }: { children: ReactNode }) {
    return (
        <ConvexAuthProvider client={convex}>
            <UserProvider>
                {children}
            </UserProvider>
        </ConvexAuthProvider>
    );
}
