import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { DataModel } from "./_generated/dataModel";
import { getDefaultUserPreferences } from "./lib/userPreferences";

const CustomPassword = Password<DataModel>({
    profile(params) {
        return {
            email: params.email as string,
            fullName: params.name as string | undefined,
            firstName: params.firstName as string | undefined,
            surname: params.surname as string | undefined,
            role: (params.role as "tenant" | "landlord" | "admin") || "tenant",
            isVerified: false,
            preferences: getDefaultUserPreferences(
                ((params.role as "tenant" | "landlord" | "admin") || "tenant"),
            ),
        };
    },
});

export const { auth, signIn, signOut, store } = convexAuth({
    providers: [CustomPassword],
});
