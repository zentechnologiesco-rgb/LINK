"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { type Id } from "../../../convex/_generated/dataModel";
import { useUser } from "./UserProvider";

type SavedOverrides = Record<string, boolean>;

interface SavedPropertiesState {
    userId: string | null;
    overrides: SavedOverrides;
}

interface SavedPropertiesContextValue {
    savedPropertyIds: Set<string>;
    isLoading: boolean;
    setSavedState: (propertyId: string, isSaved: boolean) => void;
    clearSavedState: (propertyId: string) => void;
}

const SavedPropertiesContext = createContext<SavedPropertiesContextValue | undefined>(undefined);

export function SavedPropertiesProvider({ children }: { children: ReactNode }) {
    const { user } = useUser();
    const savedPropertyIdsQuery = useQuery(api.savedProperties.listIds, user ? {} : "skip");
    const currentUserId = user?._id ?? null;
    const [optimisticState, setOptimisticState] = useState<SavedPropertiesState>({
        userId: null,
        overrides: {},
    });

    const savedPropertyIds = useMemo(() => {
        const optimisticOverrides = optimisticState.userId === currentUserId ? optimisticState.overrides : {};
        const ids = new Set<string>((savedPropertyIdsQuery ?? []).map((propertyId) => propertyId as Id<"properties"> as string));

        for (const [propertyId, isSaved] of Object.entries(optimisticOverrides)) {
            if (isSaved) {
                ids.add(propertyId);
            } else {
                ids.delete(propertyId);
            }
        }

        return ids;
    }, [currentUserId, optimisticState.overrides, optimisticState.userId, savedPropertyIdsQuery]);

    const setSavedState = useCallback((propertyId: string, isSaved: boolean) => {
        setOptimisticState((current) => {
            const baseOverrides = current.userId === currentUserId ? current.overrides : {};

            return {
                userId: currentUserId,
                overrides: {
                    ...baseOverrides,
                    [propertyId]: isSaved,
                },
            };
        });
    }, [currentUserId]);

    const clearSavedState = useCallback((propertyId: string) => {
        setOptimisticState((current) => {
            const baseOverrides = current.userId === currentUserId ? current.overrides : {};

            if (!(propertyId in baseOverrides)) {
                return current;
            }

            const next = { ...baseOverrides };
            delete next[propertyId];
            return {
                userId: currentUserId,
                overrides: next,
            };
        });
    }, [currentUserId]);

    const value = useMemo<SavedPropertiesContextValue>(
        () => ({
            savedPropertyIds,
            isLoading: Boolean(user) && savedPropertyIdsQuery === undefined,
            setSavedState,
            clearSavedState,
        }),
        [clearSavedState, savedPropertyIds, savedPropertyIdsQuery, setSavedState, user]
    );

    return (
        <SavedPropertiesContext.Provider value={value}>
            {children}
        </SavedPropertiesContext.Provider>
    );
}

export function useSavedProperties() {
    const context = useContext(SavedPropertiesContext);

    if (context === undefined) {
        throw new Error("useSavedProperties must be used within a SavedPropertiesProvider");
    }

    return context;
}
