import { mutation, action, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

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

// --- Avatar Fixing Tools ---

export const getAllUsersWithUrls = internalQuery({
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        return await Promise.all(users.map(async (u) => {
            let resolvedUrl: string | null | undefined = u.avatarUrl;
            // If it's likely a storage ID, try to resolve it
            if (u.avatarUrl && !u.avatarUrl.startsWith("http")) {
                try {
                    resolvedUrl = await ctx.storage.getUrl(u.avatarUrl);
                } catch (e) {
                    resolvedUrl = null;
                }
            }
            return {
                _id: u._id,
                originalAvatarUrl: u.avatarUrl,
                resolvedUrl
            };
        }));
    },
});

export const unsetAvatar = internalMutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.userId, { avatarUrl: undefined });
    },
});

export const fixAvatars = action({
    handler: async (ctx) => {
        console.log("Starting avatar check...");
        const users = await ctx.runQuery(internal.fix_auth.getAllUsersWithUrls);
        let fixedCount = 0;

        for (const user of users) {
            // Skip if no avatar
            if (!user.originalAvatarUrl) continue;

            let shouldDelete = false;

            // Case 1: Failed to resolve storage ID (returned null)
            if (user.originalAvatarUrl && !user.originalAvatarUrl.startsWith("http") && !user.resolvedUrl) {
                console.log(`User ${user._id}: Storage ID ${user.originalAvatarUrl} could not be resolved (file missing).`);
                shouldDelete = true;
            }
            // Case 2: Resolved URL or explicit URL needs to be checked
            else if (user.resolvedUrl) {
                try {
                    const response = await fetch(user.resolvedUrl, { method: "HEAD" });
                    if (!response.ok) {
                        console.log(`User ${user._id}: URL ${user.resolvedUrl} returned ${response.status}.`);
                        shouldDelete = true;
                    }
                } catch (e) {
                    console.log(`User ${user._id}: Failed to fetch URL ${user.resolvedUrl}. Error: ${e}`);
                    shouldDelete = true;
                }
            }

            if (shouldDelete) {
                console.log(`Unsetting avatar for user ${user._id}...`);
                await ctx.runMutation(internal.fix_auth.unsetAvatar, { userId: user._id });
                fixedCount++;
            }
        }

        return `Finished. Fixed ${fixedCount} users.`;
    }
});
