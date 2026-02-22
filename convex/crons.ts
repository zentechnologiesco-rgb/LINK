import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Run checkExpired every day at midnight
crons.daily(
    "Check for expired leases",
    { hourUTC: 0, minuteUTC: 0 },
    api.leases.checkExpired
);

export default crons;
