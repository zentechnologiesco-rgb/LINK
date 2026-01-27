
import { query } from "./_generated/server";

export const listAuthData = query({
    handler: async (ctx) => {
        const users = await ctx.db.query("users").take(10);
        const accounts = await ctx.db.query("authAccounts").take(10);
        return { users, accounts };
    },
});
