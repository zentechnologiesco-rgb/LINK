import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { DataModel } from "./_generated/dataModel";
import { normalizeEmail } from "./lib/normalizeEmail";
import { normalizeOptionalText } from "./lib/security";
import { getDefaultUserPreferences } from "./lib/userPreferences";

const CustomPassword = Password<DataModel>({
    profile(params) {
        const registrationRole = "tenant";
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

export const { auth, signIn, signOut, store } = convexAuth({
    providers: [CustomPassword],
});
