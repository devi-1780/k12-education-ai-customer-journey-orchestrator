# K-12 AI Customer Journey Orchestrator — Backend

Express + MongoDB API powering the School Group AI Customer Journey Orchestrator.
AI (Google Gemini) is called only from this backend; the key is never exposed to the frontend.

## Setup

```bash
cd backend
cp .env.example .env
# edit .env: set MONGODB_URI, JWT secrets, and (optionally) GEMINI_API_KEY
npm install
npm run seed     # populates realistic sample data for all 5 roles
npm run dev       # starts on http://localhost:5000
```

Health check: `GET http://localhost:5000/api/health`

If `GEMINI_API_KEY` is left blank, all AI endpoints still work end-to-end and return
a clearly labeled mock response (`isMock: true`), so the app is fully demoable without
a real key.

## Default seeded logins (password for all: `Password123!`)

| Role | Email |
|---|---|
| Admin | admin@schoolgroup.test |
| Sales Manager | sales@schoolgroup.test |
| Marketing Manager | marketing@schoolgroup.test |
| Service Agent | agent@schoolgroup.test |
| Customer (parent) | parent@schoolgroup.test |

## Project layout

```
src/
├── config/       env loader (fail-fast) + db connection
├── controllers/  HTTP concerns only
├── services/     business logic: audit logging, tokens, Gemini integration
├── models/       Mongoose schemas
├── routes/       /api/v1/* route definitions
├── middleware/   auth, rbac, validation, error handler, rate limiters
├── utils/        ApiResponse, ApiError, asyncHandler, pagination
├── seed/         seed.js — sample data generator
├── app.js        Express app (no listen())
└── server.js     boots DB then HTTP server, graceful shutdown
```

See `apiList.md` for the full endpoint list.

## Engineering notes

- Every response uses one envelope: `{ success, message, data, meta? }` on success,
  `{ success: false, message, details? }` on error.
- RBAC (`admin`, `sales_manager`, `marketing_manager`, `service_agent`, `customer`) is
  enforced server-side on every protected route via `authenticate` + `authorize(...)`.
  `customer` users are additionally scoped to only their own linked profile(s) via
  `attachOwnScope`, regardless of what the frontend sends.
- All state-changing controllers call `logAudit()` — the `AuditLog` collection is
  append-only (no PATCH/DELETE route is ever registered for it).
- Soft deletes (`isDeleted`/`deletedAt`) on `User`, `Profile`, `Ticket`.
- Optimistic concurrency via a `version` field on `Ticket`, `Campaign`, `Recommendation`.
- Rate limiting is applied to `/auth/login`, `/auth/forgot-password`/`reset-password`,
  and all `/ai/*` endpoints.
