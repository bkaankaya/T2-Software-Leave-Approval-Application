# T2 Software Leave Approval Application

A full-stack employee leave-management application developed from my T2 Software internship project.

© 2026 Kaan Kaya. All rights reserved. Proprietary and confidential.

## What it does

- Employee registration and login, with server-verified JWT authentication
- 8 supported leave categories, calendar dates and two-hour excuse slots
- Server-side leave-duration validation and persistent leave records
- Employees can view only their own leave requests
- Administrator can search, filter, approve and reject pending leave requests in bulk
- Account password changes require the current password and invalidate existing tokens
- React/Vite UI and Java 21 Spring Boot REST API

## Prerequisites

- Java 21 and Maven 3.9+
- Node.js 22 and npm

## Local development

1. Set a unique random JWT key (at least 32 random bytes encoded in Base64). For example, in a shell:
   `export JWT_SECRET="$(openssl rand -base64 32)"`
2. Optional, to create an initial administrator on the first run:
   `export ADMIN_USERNAME="admin"`
   `export ADMIN_PASSWORD="replace-with-a-strong-password"`
   `export ADMIN_EMAIL="admin@example.invalid"`
3. Start the backend from the `backend/` directory: `mvn spring-boot:run`
4. In another terminal start the frontend: `cd 1.giris && npm ci && npm run start`
5. Visit http://localhost:3000

The API runs on http://localhost:8080. Vite proxies `/api` to the backend. The development database is an H2 file saved under `backend/data/`, which is ignored by Git. A seeded admin must have a password of at least 12 characters. Ordinary public registration creates **employees only**.

Environment options in `backend/.env.example` describe PostgreSQL and CORS configuration. The example file is documentation, not an automatically loaded environment; configure environment variables in your shell or deployment system. Do not put actual passwords or JWT keys in Git.

## Verification

- `cd backend && mvn verify`
- `cd 1.giris && npm ci && npm run build && npm run lint`

The GitHub Actions workflow performs these checks on pull requests and pushes.

## API

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | /api/login/register | Public | Register an employee |
| POST | /api/login | Public | Obtain a short-lived bearer token |
| GET | /api/auth/verify-token | Bearer | Verify a session |
| PUT | /api/users/{username}/update-password | Same user | Update password (old password required) |
| POST | /api/admin | Bearer | Submit leave |
| GET | /api/leave/{username} | Same user | List own leave |
| GET | /api/leave/leaves | Admin | List all leave requests |
| POST | /api/admin/approve-leaves | Admin | Approve pending IDs |
| POST | /api/admin/reject-leaves | Admin | Reject pending IDs |

API errors use HTTP status codes; invalid leave types, dates and time slots are rejected on the server regardless of browser-side inputs.

## Scope

This is a functional demonstration and portfolio app, not an HR production deployment. Production requires managed PostgreSQL, schema migrations, HTTPS, secure account recovery, email verification, backups, rate limiting, monitoring and an organization-specific leave policy (business days/holidays/balances).
