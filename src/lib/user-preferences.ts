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

type StartPageOption = {
    value: string;
    label: string;
    description: string;
    href: string;
};

const START_PAGE_OPTIONS: Record<UserRole, StartPageOption[]> = {
    tenant: [
        {
            value: "home",
            label: "Home Feed",
            description: "Jump straight into the main property feed.",
            href: "/",
        },
        {
            value: "saved",
            label: "Saved Homes",
            description: "Open the homes you bookmarked first.",
            href: "/tenant/saved",
        },
        {
            value: "leases",
            label: "My Leases",
            description: "Land on lease actions and agreements.",
            href: "/tenant/leases",
        },
        {
            value: "payments",
            label: "Payments",
            description: "Start with rent and payment tracking.",
            href: "/tenant/payments",
        },
    ],
    landlord: [
        {
            value: "properties",
            label: "Properties",
            description: "Open your portfolio and listing health.",
            href: "/landlord/properties",
        },
        {
            value: "leases",
            label: "Leases",
            description: "Go straight to tenant agreements and actions.",
            href: "/landlord/leases",
        },
        {
            value: "payments",
            label: "Payments",
            description: "Review collections, pending rent, and overdue items.",
            href: "/landlord/payments",
        },
    ],
    admin: [
        {
            value: "overview",
            label: "Dashboard",
            description: "See platform health at a glance.",
            href: "/admin",
        },
        {
            value: "users",
            label: "Users",
            description: "Open user management first.",
            href: "/admin/users",
        },
        {
            value: "property-requests",
            label: "Property Requests",
            description: "Review listing approvals immediately.",
            href: "/admin/property-requests",
        },
        {
            value: "landlord-requests",
            label: "Landlord Requests",
            description: "Start with landlord verification queues.",
            href: "/admin/landlord-requests",
        },
    ],
};

function getDefaultUserPreferences(role: UserRole): UserPreferences {
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

    const validStartPageValues = START_PAGE_OPTIONS[role].map((option) => option.value);
    if (!validStartPageValues.includes(normalized.experience.startPage)) {
        normalized.experience.startPage = defaults.experience.startPage;
    }

    return normalized;
}
