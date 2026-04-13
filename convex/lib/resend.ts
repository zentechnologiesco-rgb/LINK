import { normalizeEmail } from "./normalizeEmail";

const RESEND_TEST_FROM_EMAIL = "LINK <onboarding@resend.dev>";
const RESEND_PRODUCTION_FROM_EMAIL = "LINK <noreply@andreasmukombambi.site>";

export function getResendFromEmail() {
    if (process.env.RESEND_FROM_EMAIL) {
        return process.env.RESEND_FROM_EMAIL;
    }

    return process.env.NODE_ENV === "production"
        ? RESEND_PRODUCTION_FROM_EMAIL
        : RESEND_TEST_FROM_EMAIL;
}

export function isResendTestingDomain(fromEmail: string) {
    return /@resend\.dev>?$/i.test(fromEmail.trim());
}

export function getResendTestingRecipient() {
    const value = process.env.RESEND_TEST_EMAIL;
    return typeof value === "string" && value.trim().length > 0 ? normalizeEmail(value) : null;
}

export function getResendTestingGuidance() {
    const configuredRecipient = getResendTestingRecipient();

    if (configuredRecipient) {
        return `Resend test mode can only send to ${configuredRecipient}.`;
    }

    return "Resend test mode can only send to the email address of your Resend account.";
}
