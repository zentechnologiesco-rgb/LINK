export type UserRole = "tenant" | "landlord" | "admin";

export type UserPreferences = {
    notifications: {
        email: boolean;
        push: boolean;
        messages: boolean;
        leases: boolean;
        payments: boolean;
        savedSearch: boolean;
        inquiries: boolean;
        approvals: boolean;
        reviews: boolean;
        security: boolean;
        digest: boolean;
    };
    experience: {
        compactMode: boolean;
        showQuickStats: boolean;
        startPage: string;
    };
};

const START_PAGES: Record<UserRole, string[]> = {
    tenant: ["home", "saved", "leases", "payments"],
    landlord: ["properties", "leases", "payments"],
    admin: ["overview", "users", "property-requests", "landlord-requests", "reports"],
};

export function getDefaultUserPreferences(role: UserRole): UserPreferences {
    return {
        notifications: {
            email: true,
            push: false,
            messages: true,
            leases: true,
            payments: true,
            savedSearch: role === "tenant",
            inquiries: role === "landlord",
            approvals: role === "landlord",
            reviews: role === "admin",
            security: role === "admin",
            digest: role === "admin",
        },
        experience: {
            compactMode: false,
            showQuickStats: true,
            startPage:
                role === "tenant"
                    ? "home"
                    : role === "landlord"
                        ? "properties"
                        : "overview",
        },
    };
}

export function normalizeUserPreferences(
    role: UserRole,
    preferences?: UserPreferences | null,
): UserPreferences {
    const defaults = getDefaultUserPreferences(role);

    const normalized: UserPreferences = {
        notifications: {
            ...defaults.notifications,
            ...preferences?.notifications,
        },
        experience: {
            ...defaults.experience,
            ...preferences?.experience,
        },
    };

    if (!START_PAGES[role].includes(normalized.experience.startPage)) {
        normalized.experience.startPage = defaults.experience.startPage;
    }

    return normalized;
}
