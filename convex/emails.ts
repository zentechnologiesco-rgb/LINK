"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { Resend } from "resend";

// Send an email
export const send = action({
    args: {
        to: v.string(),
        subject: v.string(),
        html: v.string(),
    },
    handler: async (ctx, args) => {
        if (!process.env.RESEND_API_KEY) {
            console.warn("Resend API Key not found. Email not sent:", args.subject);
            return { success: false, error: "Configuration missing" };
        }

        const resend = new Resend(process.env.RESEND_API_KEY);

        try {
            const data = await resend.emails.send({
                from: "LINK Property <noreply@link-property.com>", // Update with verified domain
                to: args.to,
                subject: args.subject,
                html: args.html,
            });

            return { success: true, data };
        } catch (error) {
            console.error("Failed to send email:", error);
            // Don't throw to avoid failing the calling mutation if checking result
            return { success: false, error: error };
        }
    },
});

// Email Templates moved to emailTemplates.ts
