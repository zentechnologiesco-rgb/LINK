import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run checkExpired every day at midnight
crons.daily(
    "Check for expired leases",
    { hourUTC: 0, minuteUTC: 0 },
    internal.leases.checkExpired
);

// Mark overdue payments every day at 1 AM
crons.daily(
    "Mark overdue payments",
    { hourUTC: 1, minuteUTC: 0 },
    internal.payments.markOverdue
);

crons.daily(
    "Send due soon payment reminders",
    { hourUTC: 7, minuteUTC: 0 },
    internal.pushNotifications.sendDueSoonPaymentReminders
);

export default crons;
