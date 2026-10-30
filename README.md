# T2 Software Leave Approval Application

A full-stack employee leave-management application developed from my T2 Software internship project.

© 2026 Bertan Kaan Kaya. All rights reserved. Portfolio demonstration.

## Features

- Employee registration/login and server-validated JWT authentication
- Eight leave types, date ranges and predefined two-hour slots
- Employees see only their own requests; manager can search, approve and reject pending requests
- Atomic bulk approval/rejection, input validation and token invalidation after password changes
- React 18, React Router 7, Vite 8 and Java 21 / Spring Boot 4

## Start from a clean clone (Windows, macOS, Linux)

Install **Python 3.9+**, **Java JDK 21+**, **Maven 3.9+**, **Node.js 22.12+** and npm. Ensure all four executables (python, java, mvn, node, npm) are on your PATH.

~~~sh
git clone https://github.com/bkaankaya/T2-Software-Leave-Approval-Application.git
cd T2-Software-Leave-Approval-Application
python scripts/dev.py
~~~

On macOS/Linux, use **python3** if **python** is not available. On Windows, use **py -3** if required.

The script checks tool versions, runs **npm ci** when dependencies are missing, generates a private local JWT signing key in ignored **backend/.env.local**, and launches both services. It does **not** run migrations against a remote database. Open **http://localhost:3000**; API runs at **http://localhost:8080**. Stop with Ctrl+C.

The first visit lets you register as an **employee**. To test the **admin** dashboard, provide these environment variables before starting for the *first time*:

- **ADMIN_USERNAME** — a unique login such as **manager**
- **ADMIN_PASSWORD** — a unique password of 12+ characters
- **ADMIN_EMAIL** — an address for the account

The application does not create a default administrator or silently reset the existing admin password on restart. Do not commit real credentials. PowerShell example:

~~~powershell
$env:ADMIN_USERNAME="manager"
$env:ADMIN_PASSWORD="your-unique-strong-local-password"
$env:ADMIN_EMAIL="manager@example.invalid"
py -3 scripts/dev.py
~~~

macOS/Linux example:

~~~sh
export ADMIN_USERNAME=manager
export ADMIN_PASSWORD='your-unique-strong-local-password'
export ADMIN_EMAIL=manager@example.invalid
python3 scripts/dev.py
~~~

Persistent local data uses an H2 database in **backend/data/**. That directory and the generated key are ignored by Git. For a clean installation, remove only **backend/data/** after stopping the application; this deletes the local accounts and requests.

## Verification

~~~sh
python scripts/dev.py --check
~~~

This runs Maven tests, Node unit tests, frontend build, ESLint and npm dependency audit. To force a new installation from the frontend lockfile, run **python scripts/dev.py --clean**.

You can also run services separately after exporting a secure **JWT_SECRET**:

~~~sh
# macOS/Linux: export JWT_SECRET="$(openssl rand -base64 32)"
cd backend && mvn spring-boot:run
# another terminal
cd 1.giris && npm ci && npm run start
~~~

The standalone backend command does *not* read the generated **.env.local** automatically; use the Python launcher for the simplest setup.

## Deployment caveat

This is an educational / portfolio project, not a production HR system. It intentionally has no default admin credentials. Before using real employee data, add managed PostgreSQL, schema migrations, HTTPS, credential recovery and email verification, centralized throttling, backups, monitoring and organization-specific holiday/leave balance rules. Authentication tokens currently reside in browser localStorage; use an HttpOnly-cookie/BFF approach for a production deployment.

See **docs/ENGINEERING.md** for architecture, API paths, testing, design decisions, failure cases and official documentation references.
