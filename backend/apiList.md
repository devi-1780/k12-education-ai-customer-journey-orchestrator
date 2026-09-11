# API Reference — `/api/v1`

All responses use the envelope `{ success, message, data, meta? }` (success) or
`{ success: false, message, details? }` (error). Protected routes require
`Authorization: Bearer <accessToken>`.

## Health
- `GET /api/health` — uptime + DB status (no auth)

## Auth
- `POST /auth/register`
- `POST /auth/login` (rate-limited)
- `POST /auth/refresh`
- `POST /auth/logout` (auth)
- `GET /auth/me` (auth)
- `POST /auth/forgot-password` (rate-limited)
- `POST /auth/reset-password` (rate-limited)

## Profiles (Unified Profile & Journey)
- `GET /profiles` — list, paginated, filter by entityType/riskLevel/search
- `GET /profiles/:id`
- `POST /profiles` (admin/sales/marketing/agent)
- `PATCH /profiles/:id` (admin/sales/marketing/agent)
- `GET /profiles/:id/consents`
- `PUT /profiles/:id/consents` (admin/marketing/agent/customer-self)

## Journey Timeline
- `GET /journey/stages`
- `GET /journey` — paginated interactions, filter by profileId/stage/status/date range
- `POST /journey` (admin/sales/marketing/agent)

## Tickets (Service & Support)
- `GET /tickets`
- `GET /tickets/:id`
- `POST /tickets`
- `POST /tickets/:id/messages`
- `PATCH /tickets/:id` (staff)
- `POST /tickets/:id/assign|approve|reject|defer|override|escalate|close` (staff; reject/defer/override require `reason`)

## Engagement & Outreach
- `GET /engagement/segments`
- `POST /engagement/segments` (marketing/sales/admin)
- `GET /engagement/campaigns`
- `POST /engagement/campaigns` (marketing/sales/admin)
- `POST /engagement/campaigns/:id/approve|reject` (marketing/admin)
- `POST /engagement/campaigns/:id/launch` (marketing/sales/admin)
- `GET /engagement/nba-queue`

## AI Layer
- `GET /ai/recommendations` — filter by kind/reviewState/profileId
- `POST /ai/intent-sentiment`
- `POST /ai/churn-propensity`
- `POST /ai/next-best-action`
- `POST /ai/draft-response` (admin/agent)
- `POST /ai/summarize` (admin/agent)
- `POST /ai/recommendations/:id/review` — approve/reject/overridden (reject/overridden require `reason`)

## Notifications
- `GET /notifications`
- `POST /notifications/:id/read`
- `POST /notifications/read-all`
- `POST /notifications/clear`

## Reports
- `GET /reports` (staff)
- `POST /reports` (staff) — generates a report record (journey/campaign/service/conversion/retention)
- `GET /reports/:id/download` (staff) — CSV or PDF

## Users (Admin only)
- `GET /users`
- `POST /users`
- `PATCH /users/:id`
- `POST /users/:id/deactivate`
- `POST /users/:id/activate`

## Audit Logs (Admin only, read-only)
- `GET /audit-logs` — filter by actorId/action/entityType/outcome/date range

## Configuration (Admin only)
- `GET /config`
- `PUT /config`

## Dashboard
- `GET /dashboard/outcomes-summary`
