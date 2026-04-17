// Timezone helpers. Iraq is fixed at UTC+3 year-round (no DST), so we
// anchor all date-only strings to +03:00 instead of pulling in date-fns-tz.
//
// Why this matters: `new Date("2026-04-17")` is parsed as UTC midnight.
// When a user in Baghdad picks "2026-04-17" in a <input type="date">,
// they mean Baghdad midnight, not UTC midnight. Without this, a filter
// for "today" on a traveller's laptop in UTC drops 3 hours of activity.

const BAGHDAD_OFFSET = '+03:00';

// Parse an ISO date-only string ("yyyy-MM-dd") as Baghdad midnight.
export const parseBaghdadDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(`${dateStr}T00:00:00${BAGHDAD_OFFSET}`);
};

// Start of the given date in Baghdad time, returned as a JS Date
// (which is UTC under the hood but represents the right instant).
export const startOfBaghdadDay = (dateStr) => parseBaghdadDate(dateStr);

// End of the given date in Baghdad time.
export const endOfBaghdadDay = (dateStr) => {
  if (!dateStr) return null;
  return new Date(`${dateStr}T23:59:59.999${BAGHDAD_OFFSET}`);
};
