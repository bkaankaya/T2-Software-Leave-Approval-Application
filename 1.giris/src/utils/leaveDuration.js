export const HOURLY_LEAVE_TYPE = "MAZARET_IZIN";

export const LEAVE_HOURLY_SLOTS = Object.freeze([
    "08:00 - 10:00",
    "10:00 - 12:00",
    "12:00 - 14:00",
    "14:00 - 16:00",
    "16:00 - 18:00",
    "18:00 - 20:00",
]);

function utcDay(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const milliseconds = Date.parse(value + "T00:00:00Z");
    if (!Number.isFinite(milliseconds)) return null;
    // Reject dates normalized by JavaScript, such as 2026-02-30.
    return new Date(milliseconds).toISOString().slice(0, 10) === value ? milliseconds : null;
}

/** A display-only estimate. The backend owns the authoritative leave duration. */
export function calculateLeaveDuration(type, start, end, slot) {
    if (!type) return "";
    if (type === HOURLY_LEAVE_TYPE) return LEAVE_HOURLY_SLOTS.includes(slot) ? "2" : "";
    const first = utcDay(start);
    const last = utcDay(end);
    if (first === null || last === null || last < first) return "";
    const days = (last - first) / 86400000 + 1;
    return days > 0 && days <= 366 ? String(days) : "";
}
