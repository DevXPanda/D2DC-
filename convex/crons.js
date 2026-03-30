import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

/**
 * Automatically synchronizes property demands daily.
 * This ensures that on the first of every month, new demands (₹100) are generated 
 * and tracked in the demands table.
 */
crons.daily(
  "synchronize-demands-daily",
  { hourUTC: 0, minuteUTC: 0 },
  api.demands.syncAllDemands,
  { token: "SYSTEM_INTERNAL" }
);

export default crons;
