import Google, { type GoogleProfile } from "@auth/core/providers/google";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { type Doc, DataModel } from "./_generated/dataModel";
import { type MutationCtx } from "./_generated/server";
import { normalizeEmail } from "./lib/normalizeEmail";
import { normalizeOptionalText } from "./lib/security";
import { getDefaultUserPreferences } from "./lib/userPreferences";

const DEFAULT_REGISTRATION_ROLE = "tenant" as const;

type AuthProfile = Record<string, unknown> & {
    email?: string;
    firstName?: string;
    surname?: string;
    fullName?: string;
    name?: string;
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

async function findPrimaryUserByEmail(ctx: MutationCtx, email: string) {
    const matchingUsers = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", email))
        .take(10);

    return matchingUsers[0] ?? null;
}

function buildExistingUserPatch(currentUser: Doc<"users">, profile: ReturnType<typeof normalizeAuthProfile>) {
    const patch: Partial<Doc<"users">> = {};

    if (currentUser.email !== profile.email) {
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
        async createOrUpdateUser(ctx, args) {
            const normalizedProfile = normalizeAuthProfile(args.profile as AuthProfile);
            const currentAuthUserId = await getAuthUserId(ctx);
            const currentAuthUser =
                currentAuthUserId !== null ? await ctx.db.get(currentAuthUserId) : null;

            if (
                currentAuthUser &&
                normalizeEmail(currentAuthUser.email) !== normalizedProfile.email
            ) {
                throw new Error("Use the same email address on every sign-in method.");
            }

            const existingLinkedUser =
                args.existingUserId !== null ? await ctx.db.get(args.existingUserId) : null;
            const sameEmailUser = await findPrimaryUserByEmail(ctx, normalizedProfile.email);
            const targetUser =
                existingLinkedUser ??
                currentAuthUser ??
                sameEmailUser;

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
