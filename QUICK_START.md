# Quick Start

## Install

```bash
npm install
```

New dependency already added for password reset email:

```bash
npm install nodemailer @types/nodemailer --workspace @trip-planner/server
```

## Environment

Copy the example file:

```bash
cp .env.example .env
```

Important backend-only values:

```env
OPENAI_API_KEY=
GOOGLE_PLACES_API_KEY=
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
MAIL_FROM="TripPlanner AI <no-reply@example.com>"
```

Do not expose backend secrets with a `VITE_` prefix.

## Run Locally

Backend:

```bash
cd apps/server
npm run dev
```

Frontend:

```bash
cd apps/client
npm run dev
```

Verify:

- API health: `http://localhost:5000/api/v1/health`
- Client: `http://localhost:5173`

## Checks

```bash
npm run typecheck
npm run lint
npm run test --workspace @trip-planner/server
npm run build
```

## Notes

The client imports Google Fonts from `fonts.googleapis.com`. If your production CSP blocks remote fonts, allow `https://fonts.googleapis.com` and `https://fonts.gstatic.com`, or self-host the font files.
