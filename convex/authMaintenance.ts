import { internalMutation } from "./_generated/server";
import { normalizeEmail } from "./lib/normalizeEmail";

function normalizeOptionalEmail(value: string | undefined) {
    return typeof value === "string" && value.trim().length > 0
        ? normalizeEmail(value)
        : undefined;
}

export const normalizeStoredAuthEmails = internalMutation({
    args: {},
    handler: async (ctx) => {
        let normalizedUsers = 0;
        let normalizedAccounts = 0;
        let normalizedVerificationCodes = 0;

        const users = await ctx.db.query("users").collect();
        for (const user of users) {
            const nextEmail = normalizeOptionalEmail(user.email);
            if (nextEmail && user.email !== nextEmail) {
                await ctx.db.patch(user._id, { email: nextEmail });
                normalizedUsers += 1;
            }
        }

        const accounts = await ctx.db.query("authAccounts").collect();
        for (const account of accounts) {
            const providerAccountId = account.providerAccountId.includes("@")
                ? normalizeEmail(account.providerAccountId)
                : account.providerAccountId;
            const emailVerified = normalizeOptionalEmail(account.emailVerified);

            if (
                providerAccountId !== account.providerAccountId ||
                emailVerified !== account.emailVerified
            ) {
                await ctx.db.patch(account._id, {
                    providerAccountId,
                    ...(emailVerified !== undefined
                        ? { emailVerified }
                        : account.emailVerified !== undefined
                            ? { emailVerified: undefined }
                            : {}),
                });
                normalizedAccounts += 1;
            }
        }

        const verificationCodes = await ctx.db.query("authVerificationCodes").collect();
        for (const verificationCode of verificationCodes) {
            const emailVerified = normalizeOptionalEmail(verificationCode.emailVerified);
            if (emailVerified !== verificationCode.emailVerified) {
                await ctx.db.patch(verificationCode._id, {
                    ...(emailVerified !== undefined
                        ? { emailVerified }
                        : verificationCode.emailVerified !== undefined
                            ? { emailVerified: undefined }
                            : {}),
                });
                normalizedVerificationCodes += 1;
            }
        }

        return {
            normalizedUsers,
            normalizedAccounts,
            normalizedVerificationCodes,
        };
    },
});
