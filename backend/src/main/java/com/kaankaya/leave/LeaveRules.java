package com.kaankaya.leave;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Set;

public final class LeaveRules {
    private LeaveRules() {}
    private static final Set<String> TYPES = Set.of("YILLIK_IZIN", "MAZARET_IZIN", "MAHSUP_IZIN",
        "UCRETSIZ_IZIN", "HASTALIK_IZNI", "DOGUM_IZNI", "OLUM_IZIN", "EVLILIK_IZNI");
    private static final Set<String> SLOTS = Set.of("08:00 - 10:00", "10:00 - 12:00",
        "12:00 - 14:00", "14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00");

    public static int calculate(String type, LocalDate submitted, LocalDate start, LocalDate end, String slot) {
        if (!TYPES.contains(type)) throw new IllegalArgumentException("Geçersiz izin türü");
        if (submitted == null) throw new IllegalArgumentException("İzin tarihi zorunludur");
        if ("MAZARET_IZIN".equals(type)) {
            if (!SLOTS.contains(slot)) throw new IllegalArgumentException("Geçerli bir saat aralığı seçin");
            return 2;
        }
        if (start == null || end == null || end.isBefore(start)) {
            throw new IllegalArgumentException("Geçerli başlangıç ve bitiş tarihleri girin");
        }
        long days = ChronoUnit.DAYS.between(start, end) + 1;
        if (days > 366) throw new IllegalArgumentException("İzin süresi 366 günü aşamaz");
        return (int) days;
    }
}
