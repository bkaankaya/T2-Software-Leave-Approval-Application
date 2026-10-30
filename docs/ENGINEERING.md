# Engineering review and runbook

## Objectives and boundaries

The application's primary supported scenario is an employee and a manager testing a leave request on one development computer. **Python 3.9+, JDK 21, Maven 3.9+ and Node.js 22.12+** are explicit prerequisites. A clean clone should not require manually typing an insecure fixed JWT secret, editing a database URL, creating SQL tables or installing third-party Python packages.

Do not use this demo to store real HR data. The repo intentionally excludes deployment, HR balance accounting, email verification, password recovery and audit-log retention. Passing CI demonstrates deterministic builds and covered behavior, not production security certification.

## Architecture and trust boundaries

1. The Vite dev server (port 3000, bound to loopback) serves React and proxies **/api** to Spring Boot on port 8080.
2. **src/api.js** sends JSON using fetch, a 15-second AbortController and an optional bearer token.
3. Spring Security verifies JWT signatures, expiry and issuer; loads the user from the database on each request, validates enabled status and token version, and assigns current roles from the database.
4. **AuthController** handles registration, login, verification and password change. Public registration assigns **EMPLOYEE**, never **ADMIN**.
5. **LeaveController** authorizes personal and admin endpoints, validates leave categories/slots/dates, and uses a transaction with a conditional bulk UPDATE that prevents partial approvals when items were modified concurrently.
6. Hibernate JPA persists accounts and requests to local file-backed H2. The connection URL is configurable for other databases, but the project does not provide production migrations.

**Local storage is not an authorization source.** The UI caches username and role for presentation only; the server checks identity and role independently. A revoked/expired token clears the UI session; transient connectivity faults show a Retry screen without discarding the token. This is a usability improvement, not a replacement for production cookie-based sessions.

## Clean-clone acceptance test

~~~sh
git clone https://github.com/bkaankaya/T2-Software-Leave-Approval-Application.git
cd T2-Software-Leave-Approval-Application
python scripts/dev.py --check
python scripts/dev.py
~~~

Open http://localhost:3000 and verify:

- Register a unique employee and log in.
- Submit annual leave with start/end dates; the displayed duration should count *inclusive calendar days*.
- Submit a two-hour excuse slot; confirm only the predefined slots are offered.
- Open **İzinlerim** and observe your request.
- Set ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_EMAIL *on first initialization*, relaunch and sign in as manager; approve/reject pending requests.
- Change an employee password; the previous token should then fail on the next verified API call.
- Temporarily stop the backend while the app is verifying a session: the UI should preserve stored credentials and offer a retry (rather than silently logging out).

To reset *all* test data: stop the server and remove **backend/data/**. To rotate the local dev JWT signing key, stop the server and delete **backend/.env.local**; all existing tokens will be invalid. Keep this local file out of version control.

## Tests and CI

The backend uses a **real embedded HTTP server on a random port** for three Spring Boot integration tests; four more unit tests exercise LeaveRules. The frontend uses built-in Node.js **node:test** without installing an additional test runner; duration tests cover leap days, inclusive dates, invalid dates, year boundaries and whitelist-based hourly slots. GitHub Actions verifies both independently and runs npm audit against *all* frontend dependencies, not just runtime packages.

The GitHub workflow explicitly grants **contents:read** and pins standard actions to verified full Git commit SHAs. This limits token privileges and prevents mutable version tags from silently changing workflow code.

A separate **local-smoke** Actions job launches both services from a clean checkout and requests the Vite homepage and the proxied unauthenticated API (expected HTTP 200 and 401). This verifies actual startup rather than only compilation.

These automated tests do not exercise the full React DOM in a browser, parallel account registration, a real PostgreSQL instance, production HTTPS, or performance under concurrent load. Those require separate integration, browser and load test environments.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| JWT_SECRET | none | Base64-encoded >=32-byte HS256 signing key; launcher creates local-only key |
| ADMIN_USERNAME | blank | Optional one-time administrator bootstrap |
| ADMIN_PASSWORD | blank | 12+ chars when administrator bootstrap is enabled |
| ADMIN_EMAIL | admin@localhost.invalid | Administrator identity/contact |
| PORT | 8080 | Backend HTTP port (launcher expects 8080) |
| DATABASE_URL | jdbc:h2:file:./data/leaves;DB_CLOSE_ON_EXIT=FALSE | Local persistent H2 |
| DATABASE_USERNAME | sa | DB login |
| DATABASE_PASSWORD | blank | DB password |
| DDL_AUTO | update | Hibernate schema convenience **only for local development** |
| CORS_ORIGINS | http://localhost:3000,http://localhost:5173 | Browser origins |
| VITE_API_BASE_URL | /api | Frontend API prefix (defaults to Vite development proxy) |

**Env-file caveat:** Spring does not automatically source arbitrary .env files. The Python launcher explicitly reads the one local signing-key value into the backend process; custom administrator settings are passed through your shell. Unknown or production Spring profiles are rejected by the local launcher.

## Failure diagnosis

| Symptom | Likely cause | Recommended action |
| --- | --- | --- |
| Command missing or wrong version | JDK/Maven/Node/Python not installed or off PATH | Install prerequisites and reopen terminal |
| npm ci fails | Registry offline or lockfile conflict | Check registry/network; do not delete lockfile or force-install incompatible deps |
| Port 3000/8080 occupied | Other local server running | Stop the existing process or run services manually with matching proxy settings |
| JWT_SECRET invalid | Manual environment variable is blank/invalid | Generate a new 32-byte Base64 key; do not use a shared/example test key |
| 401 on protected API | Expired or revoked login | Sign in again |
| 403 on admin API | Authenticated employee, not manager | Use the optional manager bootstrap rather than altering client-side role flags |
| Login works but UI shows retry | Backend unavailable, wrong proxy or transient network fault | Check API logs, restart and retry |
| H2 database lock | Two backend processes are using the same file | Stop the duplicate process |
| Maven fails after JDK upgrade | Wrong JAVA_HOME or incompatible compiler | Confirm java -version and mvn -version |
| No admin after enabling environment | Existing database account, or admin was not seeded on first run | Verify ADMIN_* variables, username uniqueness and startup logs |

## Threat model and future work

- **Login throttling:** public registration/login APIs are not rate-limited; production needs independent per-IP and per-account throttles and edge protection.
- **Browser token storage:** bearer JWT is in localStorage, readable by JavaScript in the origin. Move to an HttpOnly/Secure/SameSite cookie/BFF flow before deployment and review CSRF controls accordingly.
- **Schema migrations:** Hibernate **ddl-auto:update** is suitable for a demonstration but unsafe for managed production lifecycle; use Flyway or Liquibase for PostgreSQL and backups.
- **Secrets and deployment:** the CI JWT key is a publicly known test fixture. Generate deployment-specific secrets and never use the fixture outside CI. Do not put ADMIN_PASSWORD in committed config.
- **Data classification:** real leave reasons can include sensitive personal information. Define retention, access logging, data minimization and role authorization before production use.
- **Leave rules:** duration counts *calendar days*, not workdays or national holidays, and does not maintain leave allowances.
- **Availability:** the local launcher checks only loopback ports. It does not provide service supervision, TLS, scalability, telemetry or monitoring.

## Official engineering references (checked 30 October 2026)

- Spring Boot externalized configuration and property precedence: https://docs.spring.io/spring-boot/reference/features/external-config.html
- Spring Boot real HTTP integration testing with RANDOM_PORT: https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html
- Spring Boot database initialization / Flyway and Liquibase: https://docs.spring.io/spring-boot/how-to/data-initialization.html
- Vite 8 / supported Node releases: https://vite.dev/guide/ and https://vite.dev/blog/announcing-vite8
- React Router createBrowserRouter and single router instance: https://api.reactrouter.com/v7/functions/react-router.createBrowserRouter.html
- GitHub Actions permissions: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- GitHub Actions SHA pinning: https://docs.github.com/en/actions/reference/security/secure-use
- OWASP authentication throttling: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP browser token storage: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
