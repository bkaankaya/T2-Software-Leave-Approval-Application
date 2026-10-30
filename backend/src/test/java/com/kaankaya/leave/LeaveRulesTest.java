package com.kaankaya.leave;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class LeaveRulesTest {
    @Test void dateRangeInclusive() {
        assertEquals(3, LeaveRules.calculate("YILLIK_IZIN", LocalDate.now(),
            LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 3), null));
    }
    @Test void hourlyExcuseIsTwoHours() {
        assertEquals(2, LeaveRules.calculate("MAZARET_IZIN", LocalDate.now(), null, null, "08:00 - 10:00"));
    }
    @Test void invalidDatesAreRejected() {
        assertThrows(IllegalArgumentException.class, () -> LeaveRules.calculate("YILLIK_IZIN",
            LocalDate.now(), LocalDate.of(2026, 11, 2), LocalDate.of(2026, 11, 1), null));
    }
    @Test void invalidTypeIsRejected() {
        assertThrows(IllegalArgumentException.class, () -> LeaveRules.calculate("UNKNOWN",
            LocalDate.now(), null, null, null));
    }
}
