package com.kaankaya.leave;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "spring.datasource.url=jdbc:h2:mem:integration;DB_CLOSE_DELAY=-1",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "app.jwt.secret=dGVzdC1vbmx5LWNpLWtleS1maXh0dXJlLTAxMjM0NTY3ODlhYmNkZWZnaGlqa2xtbg==",
    "app.admin.username=testadmin",
    "app.admin.password=SecureAdminPassword1234!",
    "app.admin.email=admin@test.invalid"
})
class ApiIntegrationTest {
    @LocalServerPort int port;
    private final HttpClient client = HttpClient.newHttpClient();

    private HttpResponse<String> call(String method, String path, String body, String token)
            throws IOException, InterruptedException {
        HttpRequest.Builder request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
            .header("Accept", "application/json");
        if (token != null) request.header("Authorization", "Bearer " + token);
        if (body != null) request.header("Content-Type", "application/json");
        request.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body));
        return client.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private String capture(String json, String property) {
        Matcher m = Pattern.compile("\\\"" + property + "\\\"\\s*:\\s*(?:\\\"([^\\\"]+)\\\"|(\\d+))").matcher(json);
        assertTrue(m.find(), "Missing field " + property + " in " + json);
        return m.group(1) != null ? m.group(1) : m.group(2);
    }

    @Test
    void completeEmployeeAndManagerLifecycle() throws Exception {
        String username = "user" + UUID.randomUUID().toString().substring(0, 8);
        assertEquals(401, call("GET", "/api/leave/leaves", null, null).statusCode());

        String registration = "{\"username\":\"" + username +
            "\",\"email\":\"" + username + "@test.invalid\",\"password\":\"UserPassword1234!\"}";
        assertEquals(201, call("POST", "/api/login/register", registration, null).statusCode());

        String employeeLogin = "{\"username\":\"" + username + "\",\"password\":\"UserPassword1234!\"}";
        HttpResponse<String> login = call("POST", "/api/login", employeeLogin, null);
        assertEquals(200, login.statusCode(), login.body());
        String employeeToken = capture(login.body(), "token");

        assertEquals(403, call("GET", "/api/leave/leaves", null, employeeToken).statusCode());
        assertEquals(403, call("GET", "/api/leave/testadmin", null, employeeToken).statusCode());

        String leave = "{\"tarih\":\"2026-10-30\",\"izinTuru\":\"YILLIK_IZIN\"," +
            "\"baslangicTarihi\":\"2026-11-01\",\"bitisTarihi\":\"2026-11-03\"," +
            "\"izinGerekcesi\":\"Integration test leave\"}";
        HttpResponse<String> created = call("POST", "/api/admin", leave, employeeToken);
        assertEquals(200, created.statusCode(), created.body());
        String id = capture(created.body(), "id");
        assertTrue(created.body().contains("\"izinSuresi\":\"3\""));

        HttpResponse<String> personal = call("GET", "/api/leave/" + username, null, employeeToken);
        assertEquals(200, personal.statusCode(), personal.body());
        assertTrue(personal.body().contains("Integration test leave"));

        String bad = "{\"tarih\":\"2026-10-30\",\"izinTuru\":\"YILLIK_IZIN\"," +
            "\"baslangicTarihi\":\"2026-11-03\",\"bitisTarihi\":\"2026-11-01\"," +
            "\"izinGerekcesi\":\"Invalid date range\"}";
        assertEquals(400, call("POST", "/api/admin", bad, employeeToken).statusCode());

        String adminLogin = "{\"username\":\"testadmin\",\"password\":\"SecureAdminPassword1234!\"}";
        HttpResponse<String> admin = call("POST", "/api/login", adminLogin, null);
        assertEquals(200, admin.statusCode(), admin.body());
        String adminToken = capture(admin.body(), "token");
        assertEquals(200, call("GET", "/api/leave/leaves", null, adminToken).statusCode());
        assertEquals(403, call("POST", "/api/admin/approve-leaves", "{\"leaveIds\":[" + id + "]}", employeeToken).statusCode());

        HttpResponse<String> approved = call("POST", "/api/admin/approve-leaves", "{\"leaveIds\":[" + id + "]}", adminToken);
        assertEquals(200, approved.statusCode(), approved.body());
        assertEquals(409, call("POST", "/api/admin/reject-leaves", "{\"leaveIds\":[" + id + "]}", adminToken).statusCode());
        assertTrue(call("GET", "/api/leave/" + username, null, employeeToken).body().contains("Onaylandı"));

        assertEquals(400, call("PUT", "/api/users/" + username + "/update-password",
            "{\"oldPassword\":\"wrong\",\"newPassword\":\"NewPassword1234!\"}", employeeToken).statusCode());
        assertEquals(200, call("PUT", "/api/users/" + username + "/update-password",
            "{\"oldPassword\":\"UserPassword1234!\",\"newPassword\":\"NewPassword1234!\"}", employeeToken).statusCode());
        assertEquals(401, call("GET", "/api/auth/verify-token", null, employeeToken).statusCode());
        assertEquals(200, call("POST", "/api/login",
            "{\"username\":\"" + username + "\",\"password\":\"NewPassword1234!\"}", null).statusCode());
    }
    @Test
    void registrationAndAuthenticationAreValidated() throws Exception {
        String username = "test" + UUID.randomUUID().toString().substring(0, 8);
        assertEquals(400, call("POST", "/api/login/register",
            "{\"username\":\"bad/name\",\"email\":\"bad@test.invalid\",\"password\":\"UserPassword1234!\"}", null).statusCode());
        assertEquals(400, call("POST", "/api/login/register",
            "{\"username\":\"xy\",\"email\":\"bad@test.invalid\",\"password\":\"UserPassword1234!\"}", null).statusCode());
        assertEquals(400, call("POST", "/api/login/register",
            "{\"username\":\"validname\",\"email\":\"not-an-email\",\"password\":\"UserPassword1234!\"}", null).statusCode());
        String register = "{\"username\":\"" + username + "\",\"email\":\"" + username +
            "@test.invalid\",\"password\":\"UserPassword1234!\"}";
        assertEquals(201, call("POST", "/api/login/register", register, null).statusCode());
        assertEquals(409, call("POST", "/api/login/register", register, null).statusCode());
        assertEquals(401, call("POST", "/api/login", "{\"username\":\"" + username +
            "\",\"password\":\"not-the-password\"}", null).statusCode());
        HttpResponse<String> login = call("POST", "/api/login",
            "{\"username\":\"" + username + "\",\"password\":\"UserPassword1234!\"}", null);
        String token = capture(login.body(), "token");
        HttpResponse<String> verified = call("GET", "/api/auth/verify-token", null, token);
        assertEquals(200, verified.statusCode());
        assertTrue(verified.body().contains("\"adminControl\":false"));
    }

    @Test
    void bulkActionsRejectInvalidIdsWithoutPartialUpdates() throws Exception {
        String username = "user" + UUID.randomUUID().toString().substring(0, 8);
        assertEquals(201, call("POST", "/api/login/register",
            "{\"username\":\"" + username + "\",\"email\":\"" + username +
                "@test.invalid\",\"password\":\"UserPassword1234!\"}", null).statusCode());
        String userToken = capture(call("POST", "/api/login",
            "{\"username\":\"" + username + "\",\"password\":\"UserPassword1234!\"}", null).body(), "token");
        String adminToken = capture(call("POST", "/api/login",
            "{\"username\":\"testadmin\",\"password\":\"SecureAdminPassword1234!\"}", null).body(), "token");
        String leave = "{\"tarih\":\"2026-10-30\",\"izinTuru\":\"MAZARET_IZIN\"," +
            "\"izinSaatAraligi\":\"08:00 - 10:00\",\"baslangicTarihi\":\"2026-12-01\"," +
            "\"bitisTarihi\":\"2026-12-02\",\"izinGerekcesi\":\"Hourly request\"}";
        HttpResponse<String> created = call("POST", "/api/admin", leave, userToken);
        assertEquals(200, created.statusCode(), created.body());
        String id = capture(created.body(), "id");
        assertTrue(created.body().contains("\"izinSuresi\":\"2\""));
        assertTrue(created.body().contains("\"baslangicTarihi\":null"));
        assertEquals(400, call("POST", "/api/admin/approve-leaves",
            "{\"leaveIds\":[" + id + "," + id + "]}", adminToken).statusCode());
        assertEquals(400, call("POST", "/api/admin/approve-leaves",
            "{\"leaveIds\":[-1]}", adminToken).statusCode());
        assertEquals(400, call("POST", "/api/admin/approve-leaves",
            "{\"leaveIds\":[]}", adminToken).statusCode());
        assertEquals(404, call("POST", "/api/admin/approve-leaves",
            "{\"leaveIds\":[" + id + ",999999999]}", adminToken).statusCode());
        assertTrue(call("GET", "/api/leave/" + username, null, userToken).body().contains("Beklemede"));
        assertEquals(200, call("POST", "/api/admin/reject-leaves",
            "{\"leaveIds\":[" + id + "]}", adminToken).statusCode());
        assertTrue(call("GET", "/api/leave/" + username, null, userToken).body().contains("Reddedildi"));
        assertEquals(409, call("POST", "/api/admin/approve-leaves",
            "{\"leaveIds\":[" + id + "]}", adminToken).statusCode());
        HttpResponse<String> invalidSlot = call("POST", "/api/admin",
            "{\"tarih\":\"2026-10-30\",\"izinTuru\":\"MAZARET_IZIN\"," +
            "\"izinSaatAraligi\":\"00:00 - 23:59\",\"izinGerekcesi\":\"invalid\"}", userToken);
        assertEquals(400, invalidSlot.statusCode(), invalidSlot.body());
    }

}
