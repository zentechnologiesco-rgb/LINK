import Google, { type GoogleProfile } from "@auth/core/providers/google";
import { convexAuth, getAuthUserId, type EmailConfig } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { type Doc, DataModel } from "./_generated/dataModel";
import { type MutationCtx } from "./_generated/server";
import { normalizeEmail } from "./lib/normalizeEmail";
import { getResendFromEmail, getResendTestingGuidance, isResendTestingDomain } from "./lib/resend";
import { normalizeOptionalText } from "./lib/security";
import { getDefaultUserPreferences } from "./lib/userPreferences";

const DEFAULT_REGISTRATION_ROLE = "tenant" as const;
const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_RESET_PROVIDER_ID = "password-reset";
const PASSWORD_RESET_MAX_AGE_SECONDS = 60 * 30;
const DEFAULT_SITE_URL = "http://localhost:3000";

type AuthProfile = Record<string, unknown> & {
    email?: string;
    firstName?: string;
    surname?: string;
    fullName?: string;
    name?: string;
};

type CreateOrUpdateUserArgs = {
    existingUserId: string | null;
    type: "oauth" | "credentials" | "email" | "phone" | "verification";
    provider: { id: string };
    profile: Record<string, unknown> & {
        email?: string;
        phone?: string;
        emailVerified?: boolean;
        phoneVerified?: boolean;
    };
    shouldLink?: boolean;
};

function getProfileString(profile: AuthProfile, keys: string[]) {
    for (const key of keys) {
        const value = profile[key];
        if (typeof value === "string") {
            return value;
        }
    }

    return undefined;
}

function normalizeAuthProfile(profile: AuthProfile) {
    const email = normalizeEmail(typeof profile.email === "string" ? profile.email : "");
    if (!email) {
        throw new Error("Missing email address");
    }

    const firstName = normalizeOptionalText(
        getProfileString(profile, ["firstName", "given_name", "givenName"]),
        { maxLength: 80 },
    );
    const surname = normalizeOptionalText(
        getProfileString(profile, ["surname", "family_name", "familyName", "lastName"]),
        { maxLength: 80 },
    );
    const fullName =
        normalizeOptionalText(
            getProfileString(profile, ["fullName", "name"]),
            { maxLength: 160 },
        ) ??
        normalizeOptionalText([firstName, surname].filter(Boolean).join(" "), {
            maxLength: 160,
        });

    return {
        email,
        firstName,
        surname,
        fullName,
    };
}

function emailsMatch(left?: string | null, right?: string | null) {
    return normalizeEmail(left ?? "") !== "" &&
        normalizeEmail(left ?? "") === normalizeEmail(right ?? "");
}

function validatePasswordRequirements(password: string) {
    if (!password || password.length < PASSWORD_MIN_LENGTH) {
        throw new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`);
    }
}

async function findPrimaryUserByEmail(ctx: MutationCtx, email: string) {
    const exactMatchUsers = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", email))
        .take(10);

    if (exactMatchUsers[0]) {
        return exactMatchUsers[0];
    }

    const allUsers = await ctx.db.query("users").collect();
    return allUsers.find((user) => emailsMatch(user.email, email)) ?? null;
}

function canUseCurrentSessionForProfile(args: CreateOrUpdateUserArgs) {
    return args.type === "oauth" || args.type === "credentials";
}

function getBaseSiteUrl() {
    return (process.env.SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_SITE_URL).replace(/\/$/, "");
}

function getSafeRedirectUrl(redirectTo: string) {
    const baseUrl = getBaseSiteUrl();

    if (redirectTo.startsWith("?") || redirectTo.startsWith("/")) {
        return `${baseUrl}${redirectTo}`;
    }

    if (redirectTo.startsWith(baseUrl)) {
        const afterBaseUrl = redirectTo[baseUrl.length];
        if (afterBaseUrl === undefined || afterBaseUrl === "?" || afterBaseUrl === "/") {
            return redirectTo;
        }
    }

    throw new Error(`Invalid \`redirectTo\` ${redirectTo} for configured site URL: ${baseUrl}`);
}

const PasswordResetProvider: EmailConfig = {
    id: PASSWORD_RESET_PROVIDER_ID,
    type: "email",
    name: "Password Reset",
    from: getResendFromEmail(),
    apiKey: process.env.RESEND_API_KEY,
    maxAge: PASSWORD_RESET_MAX_AGE_SECONDS,
    authorize: async (params, account) => {
        const email = normalizeEmail(typeof params.email === "string" ? params.email : "");
        if (!email) {
            throw new Error("Password reset verification requires an email address.");
        }

        if (account.providerAccountId !== email) {
            throw new Error("Password reset code must be used with the same email address.");
        }
    },
    async sendVerificationRequest({ identifier, url, provider }) {
        if (!provider.apiKey) {
            throw new Error("Missing RESEND_API_KEY for password reset emails.");
        }

        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${provider.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: provider.from ?? getResendFromEmail(),
                to: identifier,
                subject: "Reset your LINK password",
                html: `
                    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#171717;">
                        <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#737373;">LINK</p>
                        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#111111;">Reset your password</h1>
                        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#404040;">
                            We received a request to reset the password for your LINK account.
                        </p>
                        <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#404040;">
                            This link expires in 30 minutes. If you did not request it, you can safely ignore this email.
                        </p>
                        <a href="${url}" style="display:inline-block;padding:14px 22px;border-radius:14px;background:#111111;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;">
                            Reset password
                        </a>
                        <p style="margin:24px 0 8px;font-size:14px;line-height:1.6;color:#525252;">
                            If the button does not work, copy and paste this URL into your browser:
                        </p>
                        <p style="margin:0;font-size:14px;line-height:1.6;color:#171717;word-break:break-all;">
                            <a href="${url}" style="color:#171717;">${url}</a>
                        </p>
                    </div>
                `,
                text: `Reset your LINK password.\n\nUse this link within 30 minutes:\n${url}\n\nIf you did not request this, you can ignore this email.`,
            }),
        });

        if (!response.ok) {
            const responseText = await response.text();
            const guidance = provider.from && isResendTestingDomain(provider.from)
                ? ` ${getResendTestingGuidance()}`
                : "";
            throw new Error(`Resend error: ${responseText}${guidance}`);
        }
    },
    options: {
        id: PASSWORD_RESET_PROVIDER_ID,
        from: getResendFromEmail(),
        apiKey: process.env.RESEND_API_KEY,
        maxAge: PASSWORD_RESET_MAX_AGE_SECONDS,
    },
};

function buildExistingUserPatch(currentUser: Doc<"users">, profile: ReturnType<typeof normalizeAuthProfile>) {
    const patch: Partial<Doc<"users">> = {};

    if (!emailsMatch(currentUser.email, profile.email) || currentUser.email !== profile.email) {
        patch.email = profile.email;
    }
    if (!currentUser.name && profile.fullName) {
        patch.name = profile.fullName;
    }
    if (!currentUser.fullName && profile.fullName) {
        patch.fullName = profile.fullName;
    }
    if (!currentUser.firstName && profile.firstName) {
        patch.firstName = profile.firstName;
    }
    if (!currentUser.surname && profile.surname) {
        patch.surname = profile.surname;
    }
    if (!currentUser.preferences) {
        patch.preferences = getDefaultUserPreferences(currentUser.role);
    }

    return patch;
}

const CustomPassword = Password<DataModel>({
    validatePasswordRequirements,
    reset: PasswordResetProvider,
    profile(params) {
        const registrationRole = DEFAULT_REGISTRATION_ROLE;
        const firstName = normalizeOptionalText(params.firstName as string | undefined, {
            maxLength: 80,
        });
        const surname = normalizeOptionalText(params.surname as string | undefined, {
            maxLength: 80,
        });
        const fullName = normalizeOptionalText(
            (params.name as string | undefined) ?? [firstName, surname].filter(Boolean).join(" "),
            {
                maxLength: 160,
            },
        );

        return {
            email: normalizeEmail((params.email as string) ?? ""),
            fullName,
            firstName,
            surname,
            role: registrationRole,
            isVerified: false,
            preferences: getDefaultUserPreferences(registrationRole),
        };
    },
});

const GoogleProvider = Google<GoogleProfile>({
    profile(profile) {
        const normalizedProfile = normalizeAuthProfile({
            email: profile.email,
            firstName: profile.given_name,
            surname: profile.family_name,
            fullName: profile.name,
            name: profile.name,
        });

        return {
            id: profile.sub,
            email: normalizedProfile.email,
            firstName: normalizedProfile.firstName,
            surname: normalizedProfile.surname,
            fullName: normalizedProfile.fullName,
            name: normalizedProfile.fullName,
        };
    },
});

export const { auth, signIn, signOut, store } = convexAuth({
    providers: [CustomPassword, GoogleProvider],
    callbacks: {
        async redirect({ redirectTo }) {
            return getSafeRedirectUrl(redirectTo);
        },
        async createOrUpdateUser(ctx, args) {
            const normalizedProfile = normalizeAuthProfile(args.profile as AuthProfile);
            const currentAuthUserId = await getAuthUserId(ctx);
            const currentAuthUser =
                currentAuthUserId !== null ? await ctx.db.get(currentAuthUserId) : null;
            const existingLinkedUser =
                args.existingUserId !== null ? await ctx.db.get(args.existingUserId) : null;
            const sameEmailUser = await findPrimaryUserByEmail(ctx, normalizedProfile.email);
            const currentSessionMatchesProfile = currentAuthUser !== null &&
                emailsMatch(currentAuthUser.email, normalizedProfile.email);

            if (
                currentAuthUser &&
                !currentSessionMatchesProfile &&
                canUseCurrentSessionForProfile(args)
            ) {
                throw new Error("Use the same email address on every sign-in method.");
            }

            const targetUser =
                existingLinkedUser ??
                sameEmailUser ??
                (currentSessionMatchesProfile ? currentAuthUser : null);

            if (targetUser) {
                const patch = buildExistingUserPatch(targetUser, normalizedProfile);
                if (Object.keys(patch).length > 0) {
                    await ctx.db.patch(targetUser._id, patch);
                }
                return targetUser._id;
            }

            return await ctx.db.insert("users", {
                name: normalizedProfile.fullName,
                email: normalizedProfile.email,
                fullName: normalizedProfile.fullName,
                firstName: normalizedProfile.firstName,
                surname: normalizedProfile.surname,
                role: DEFAULT_REGISTRATION_ROLE,
                isVerified: false,
                preferences: getDefaultUserPreferences(DEFAULT_REGISTRATION_ROLE),
            });
        },
    },
});
