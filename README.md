# TripPlannerAI

Production-oriented MERN + AI travel planner. Users upload flight tickets, hotel bookings, train tickets, or screenshots; the API extracts text with OCR, asks OpenAI for strict travel JSON, generates an itinerary, stores it in MongoDB, and exposes private and shareable views.

## Architecture

```text
apps/client   React 18 + Vite + TypeScript + Tailwind + TanStack Query
apps/server   Express + TypeScript + MongoDB + JWT + OCR/AI adapters
packages/shared  Zod schemas, shared types, constants, API contracts
```

Backend flow:

```text
Route -> Controller -> Service -> Repository -> Mongoose Model -> MongoDB
```

Provider boundaries are defined for storage, OCR, and AI. Local storage and Tesseract/pdf-parse are active by default; S3 and Textract classes are included as production upgrade paths.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The root `.env` file is the canonical environment file for both workspace apps. Restart the server and Vite client after changing it.

Run apps separately:

```bash
npm run dev --workspace @trip-planner/server
npm run dev --workspace @trip-planner/client
```

Default URLs:

- Client: `http://localhost:5173`
- API: `http://localhost:5000/api/v1`
- Health: `http://localhost:5000/api/v1/health`
- Swagger: `http://localhost:5000/api-docs`

## Environment

Server variables:

```text
PORT
MONGO_URI
JWT_SECRET
JWT_REFRESH_SECRET
OPENAI_API_KEY
ALLOW_AI_FALLBACK
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL
GOOGLE_PLACES_API_KEY
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASS
MAIL_FROM
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_BUCKET_NAME
AWS_REGION
CLIENT_URL
STORAGE_DRIVER
```

Client variables:

```text
VITE_API_URL
VITE_GOOGLE_CLIENT_ID
```

Use 32+ character JWT secrets. Configure `OPENAI_API_KEY` in production for true AI recommendations; production only uses fallback when `ALLOW_AI_FALLBACK=true`. Google OAuth uses `VITE_GOOGLE_CLIENT_ID` in the browser and verifies credentials on the API with `GOOGLE_CLIENT_ID`. `GOOGLE_PLACES_API_KEY` is optional and backend-only for real place cards; never expose it with a `VITE_` prefix. SMTP variables power forgot/reset password email. In development, if SMTP is missing, the API logs a safe reset URL to the backend terminal; in production SMTP must be configured and reset links are never printed. Do not commit `.env` files.

## Core API

All responses follow:

```json
{ "success": true, "message": "OK", "data": {} }
```

Auth:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/google`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

User:

- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`

Itinerary:

- `POST /api/v1/upload`
- `POST /api/v1/itinerary/generate`
- `GET /api/v1/itinerary?page=1&limit=10&sort=-createdAt&q=`
- `GET /api/v1/itinerary/:id`
- `DELETE /api/v1/itinerary/:id`
- `POST /api/v1/share/:id`
- `GET /api/v1/share/:shareId`

## Testing

```bash
npm test
npm run typecheck
npm run lint
```

Server tests use Vitest with mocked repository/provider boundaries. Add Supertest and `mongodb-memory-server` coverage for new API routes.

## Docker

```bash
docker compose up --build
```

For Docker, set `MONGO_URI=mongodb://mongo:27017/trip-planner-ai` in `.env`.

## Security Notes

Refresh tokens are stored in HttpOnly cookies. Access tokens are kept in memory only and refreshed from the cookie on app startup. Uploads are limited to PDF/PNG/JPG/JPEG up to 10MB. API input is validated with Zod and protected by Helmet, CORS, rate limiting, compression, XSS cleanup, and Mongo sanitization.

Password reset uses crypto-secure random tokens. Only a SHA-256 hash of the reset token is stored in MongoDB, links expire after 30 minutes, and successful resets clear the token for single-use behavior. Forgot-password responses are generic to avoid email enumeration. Current refresh tokens are stateless JWTs, so password reset does not revoke already-issued refresh cookies before they expire.
