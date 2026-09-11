# K-12 AI Customer Journey Orchestrator — Frontend

React (Vite) + Redux Toolkit + React Router + Tailwind CSS. Talks to the backend
only through `VITE_API_BASE_URL`; no secrets ever live in this project.

## Setup

```bash
cd frontend
cp .env.example .env
# edit .env if your backend isn't on http://localhost:5000
npm install
npm run dev   # http://localhost:5173
```

Make sure the backend is running and seeded first (`npm run seed` in `backend/`).

## Default seeded logins (password for all: `Password123!`)

| Role | Email |
|---|---|
| Admin | admin@schoolgroup.test |
| Sales Manager | sales@schoolgroup.test |
| Marketing Manager | marketing@schoolgroup.test |
| Service Agent | agent@schoolgroup.test |
| Customer (parent) | parent@schoolgroup.test |

## Structure

```
src/
├── api/          Axios instance + auth interceptors (token attach, 401 refresh)
├── app/          Redux store
├── features/     Redux slices per module (auth, profiles, journey, tickets, ...)
├── pages/        One folder per page/module
├── components/   Shared UI (Navbar, Sidebar, AIOutputCard, Pagination, ...)
├── routes/       ProtectedRoute wrapper (role-aware)
└── utils/        Shared helpers (e.g. resource slice factory)
```

## Pages

Login · Dashboard · Unified Customer Profiles · Journey Timeline & Service History ·
Segments/Outreach/Next-Best-Actions · Service Tickets & Agent Assist ·
Predictions (intent/sentiment/churn/NBA) · Consent-Aware Recommendations ·
Journey Outcomes & Model Feedback · Reports & Analytics · Notifications ·
User & Role Management (admin) · Audit Logs & System Settings (admin)

Every AI output on these pages is shown with source data, a confidence score,
an explanation, a timestamp, the model/version, and (for authorised roles) an
approve / reject / override control — visually marked as "AI suggested" until
a human commits it.
