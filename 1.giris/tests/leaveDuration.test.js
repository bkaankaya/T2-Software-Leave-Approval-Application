import test from "node:test";
import assert from "node:assert/strict";
import { calculateLeaveDuration, LEAVE_HOURLY_SLOTS } from "../src/utils/leaveDuration.js";

test("calculates inclusive calendar days without local timezone effects", () => {
    assert.equal(calculateLeaveDuration("YILLIK_IZIN", "2026-10-31", "2026-11-02"), "3");
    assert.equal(calculateLeaveDuration("YILLIK_IZIN", "2026-10-30", "2026-10-30"), "1");
    assert.equal(calculateLeaveDuration("YILLIK_IZIN", "2028-02-28", "2028-03-01"), "3");
});

test("rejects malformed, backwards, and excessive dates", () => {
    assert.equal(calculateLeaveDuration("YILLIK_IZIN", "2026-02-30", "2026-03-01"), "");
    assert.equal(calculateLeaveDuration("YILLIK_IZIN", "2026-11-02", "2026-11-01"), "");
    assert.equal(calculateLeaveDuration("YILLIK_IZIN", "", "2026-11-01"), "");
    assert.equal(calculateLeaveDuration("YILLIK_IZIN", "2026-01-01", "2027-12-31"), "");
});

test("two-hour exception leave requires a whitelisted time slot", () => {
    for (const slot of LEAVE_HOURLY_SLOTS) {
        assert.equal(calculateLeaveDuration("MAZARET_IZIN", "", "", slot), "2");
    }
    assert.equal(calculateLeaveDuration("MAZARET_IZIN", "", "", "00:00 - 23:59"), "");
    assert.equal(calculateLeaveDuration(undefined, "", "", ""), "");
});
