
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const removeOrphanedAccounts = mutation({
    handler: async (ctx) => {
        const accounts = await ctx.db.query("authAccounts").collect();
        let deletedCount = 0;

        for (const account of accounts) {
            const user = await ctx.db.get(account.userId);
            if (!user) {
                console.log(`Deleting orphaned account ${account._id} pointing to missing user ${account.userId}`);
                await ctx.db.delete(account._id);
                deletedCount++;
            }
        }

        return `Deleted ${deletedCount} orphaned accounts.`;
    },
});

export const removeDuplicateUsers = mutation({
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        const emails = new Set();
        let deletedCount = 0;

        for (const user of users) {
            if (user.email) {
                if (emails.has(user.email)) {
                    console.log(`Deleting duplicate user ${user._id} with email ${user.email}`);
                    await ctx.db.delete(user._id);
                    deletedCount++;
                } else {
                    emails.add(user.email);
                }
            }
        }
        return `Deleted ${deletedCount} duplicate users.`;
    }
});

export const wipeAuth = mutation({
    handler: async (ctx) => {
        const accounts = await ctx.db.query("authAccounts").collect();
        for (const acc of accounts) await ctx.db.delete(acc._id);

        const sessions = await ctx.db.query("authSessions").collect();
        for (const s of sessions) await ctx.db.delete(s._id);

        const users = await ctx.db.query("users").collect();
        for (const u of users) await ctx.db.delete(u._id);

        return "Wiped authAccounts, authSessions, and users.";
    }
});
