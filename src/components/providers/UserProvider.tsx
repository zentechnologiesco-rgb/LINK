"use client"

import React, { createContext, useContext, ReactNode } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"

// User type from the API
type User = {
    _id: string
    email: string
    fullName?: string
    firstName?: string
    surname?: string
    phone?: string
    avatarUrl?: string
    role: "tenant" | "landlord" | "admin"
    isVerified: boolean
} | null | undefined

interface UserContextValue {
    user: User
    isLoading: boolean
    isAuthenticated: boolean
    role: "tenant" | "landlord" | "admin" | null
}

const UserContext = createContext<UserContextValue | undefined>(undefined)

/**
 * UserProvider - Centralized user data provider
 * 
 * This eliminates redundant `useQuery(api.users.currentUser)` calls across components.
 * Instead of each component fetching user data separately, they all share this single query.
 * 
 * Benefits:
 * - Single query subscription for user data
 * - Reduces network requests
 * - Consistent user state across all components
 * - Automatic re-rendering when user data changes
 */
export function UserProvider({ children }: { children: ReactNode }) {
    const user = useQuery(api.users.currentUser)

    const value: UserContextValue = {
        user,
        isLoading: user === undefined,
        isAuthenticated: user !== null && user !== undefined,
        role: user?.role ?? null,
    }

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    )
}

/**
 * useUser - Hook to access current user data
 * 
 * Usage:
 * ```tsx
 * const { user, isLoading, isAuthenticated, role } = useUser()
 * ```
 */
export function useUser(): UserContextValue {
    const context = useContext(UserContext)

    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider")
    }

    return context
}

/**
 * useRequireAuth - Hook that returns user data or null if not authenticated
 * Useful for components that need to conditionally render based on auth state
 */
export function useRequireAuth() {
    const { user, isLoading, isAuthenticated } = useUser()

    return {
        user: isAuthenticated ? user : null,
        isLoading,
        isAuthenticated,
    }
}

/**
 * useRequireRole - Hook that checks if user has a specific role
 */
export function useRequireRole(requiredRole: "tenant" | "landlord" | "admin") {
    const { user, isLoading, role } = useUser()

    return {
        user,
        isLoading,
        hasRole: role === requiredRole,
        isAdmin: role === "admin",
    }
}
