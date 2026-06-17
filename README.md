# TripPlannerAI

TripPlannerAI is a production-oriented MERN and AI travel planning application. Users can upload flight tickets, train tickets, hotel bookings, PDFs, images, or travel screenshots, and the system extracts the booking details, generates a structured itinerary, stores the plan, and exposes authenticated and shareable itinerary views.

The project is organized as a TypeScript monorepo with a React client, an Express API, and a shared package for schemas, types, and API contracts.

## Features

- Upload PDF, PNG, JPG, and JPEG travel documents.
- Extract travel details with PDF parsing and OCR.
- Generate itinerary JSON with OpenAI, with a controlled local fallback for non-production development.
- Store users, sessions, uploaded files, extracted travel data, and generated itineraries in MongoDB.
- Register, login, Google OAuth login, refresh sessions, logout, and password reset.
- Browse itinerary history with search, pagination, and sorting.
- Edit generated itinerary content after creation.
- Create expiring public share links.
- Export itinerary details as a polished PDF from the client.
- Fetch optional destination recommendations through the Google Places-backed service.
- Run the stack locally with npm workspaces or Docker Compose.

## Tech Stack

| Area | Technology |
| --- | --- |
| Client | React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, React Router, Zustand |
| API | Node.js, Express, TypeScript, Mongoose, JWT, Zod |
| AI and extraction | OpenAI, Tesseract.js, pdf-parse |
| Auth | Local auth, Google OAuth, HttpOnly refresh cookie |
| Storage | Local upload storage by default, S3 adapter available |
| Shared contracts | `@trip-planner/shared` with Zod schemas and DTO types |
| Tests | Vitest, Supertest, mongodb-memory-server |
| Tooling | npm workspaces, ESLint, Prettier, Docker Compose |

## Repository Structure

```text
.
+-- apps/
|   +-- client/              # React + Vite web app
|   |   +-- src/components/  # Shared UI and layout components
|   |   +-- src/lib/         # API client and browser utilities
|   |   +-- src/pages/       # Route-level pages
|   |   +-- src/stores/      # Zustand state stores
|   |   +-- src/styles/      # Tailwind and global styles
|   +-- server/              # Express API
|       +-- src/config/      # Environment, database, Swagger config
|       +-- src/controllers/ # HTTP request handlers
|       +-- src/middleware/  # Auth, upload, error, and validation middleware
|       +-- src/models/      # Mongoose models
|       +-- src/repositories/# Database access layer
|       +-- src/routes/      # API route declarations
|       +-- src/services/    # Auth, itinerary, OCR, AI, storage, email, places services
|       +-- src/tests/       # Server tests
|       +-- src/utils/       # Mappers and response helpers
+-- packages/
|   +-- shared/              # Shared Zod schemas, constants, DTOs, and types
+-- docker-compose.yml       # Local MongoDB, API, and client stack
+-- package.json             # Root workspace scripts
+-- tsconfig.base.json       # Shared TypeScript configuration
+-- .env.example             # Required environment variable template
```

## Architecture

The backend follows a layered flow:

```text
Route -> Controller -> Service -> Repository -> Mongoose Model -> MongoDB
```

Provider boundaries are kept behind services so production infrastructure can be swapped without changing controllers:

- Storage: local filesystem by default, S3 adapter available.
- OCR and parsing: `pdf-parse` for PDFs and Tesseract for images.
- AI: OpenAI for strict travel JSON generation, with fallback behavior controlled by environment.
- Places: Google Places can enrich destination recommendations when configured.
- Email: SMTP-backed password reset and welcome emails.

The client communicates with the API through a typed Axios wrapper and shares API response types with the server through `@trip-planner/shared`.

## Prerequisites

- Node.js 20 or newer.
- npm 10 or newer.
- MongoDB connection string, or Docker for the bundled local MongoDB service.
- OpenAI API key for production-quality itinerary generation.
- Optional Google OAuth, Google Places, SMTP, and AWS S3 credentials depending on enabled features.

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Update `.env` with at least:

```text
MONGO_URI=<your MongoDB connection string>
JWT_SECRET=<at-least-32-character-secret>
JWT_REFRESH_SECRET=<at-least-32-character-refresh-secret>
OPENAI_API_KEY=<your OpenAI API key>
VITE_API_URL=http://localhost:5000/api/v1
```

Start both apps:

```bash
npm run dev
```

Default local URLs:

| Service | URL |
| --- | --- |
| Client | `http://localhost:5173` |
| API base | `http://localhost:5000/api/v1` |
| API health | `http://localhost:5000/api/v1/health` |
| Swagger UI | `http://localhost:5000/api-docs` |

## Workspace Scripts

Run these from the repository root:

```bash
npm run dev
npm run build
npm test
npm run lint
npm run typecheck
npm run format
```

Run one workspace directly:

```bash
npm run dev --workspace @trip-planner/client
npm run dev --workspace @trip-planner/server
npm run build --workspace @trip-planner/shared
```

## Environment Variables

The root `.env` file is the canonical configuration file for both workspace apps. Restart the API and Vite dev server after changing it.

### Server

| Variable | Purpose |
| --- | --- |
| `PORT` | API port. Defaults to `5000`. |
| `NODE_ENV` | Runtime environment. Use `production` in deployed environments. |
| `MONGO_URI` | MongoDB connection string. |
| `USE_MEMORY_MONGO` | Enables memory MongoDB for local/test workflows when supported. |
| `JWT_SECRET` | Access token signing secret. Use 32+ characters. |
| `JWT_REFRESH_SECRET` | Refresh token signing secret. Use 32+ characters. |
| `OPENAI_API_KEY` | OpenAI API key for extraction and itinerary generation. |
| `ALLOW_AI_FALLBACK` | Allows deterministic local fallback when AI generation fails or no key exists. Keep false in production unless explicitly accepted. |
| `GOOGLE_CLIENT_ID` | Server-side Google OAuth client ID validation. |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret. |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback URL. |
| `GOOGLE_PLACES_API_KEY` | Server-only Google Places API key for destination recommendations. |
| `SMTP_HOST` | SMTP host for transactional email. |
| `SMTP_PORT` | SMTP port. |
| `SMTP_SECURE` | Whether SMTP uses TLS immediately. |
| `SMTP_USER` | SMTP username. |
| `SMTP_PASS` | SMTP password. |
| `MAIL_FROM` | Sender address for app emails. |
| `AWS_ACCESS_KEY_ID` | AWS access key for S3 storage. |
| `AWS_SECRET_ACCESS_KEY` | AWS secret for S3 storage. |
| `AWS_BUCKET_NAME` | S3 bucket name. |
| `AWS_REGION` | AWS region. |
| `CLIENT_URL` | Allowed client origins for CORS and generated links. Comma-separated values are supported. |
| `STORAGE_DRIVER` | Upload storage driver. Use `local` unless S3 is configured. |

### Client

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Browser-facing API base URL. |
| `VITE_GOOGLE_CLIENT_ID` | Browser-facing Google OAuth client ID. |

Never commit `.env` or any file containing real API keys, tokens, SMTP passwords, or user travel data.

## API Overview

All API responses follow the shared response envelope:

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

### Auth

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Create a local user account. |
| `POST` | `/api/v1/auth/login` | Login with email and password. |
| `POST` | `/api/v1/auth/google` | Login or register with Google credential payload. |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset email. |
| `POST` | `/api/v1/auth/reset-password` | Reset password with token. |
| `POST` | `/api/v1/auth/refresh` | Refresh access session from HttpOnly cookie. |
| `POST` | `/api/v1/auth/logout` | Clear refresh cookie. |
| `GET` | `/api/v1/auth/me` | Return the current authenticated user. |

### User

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/v1/users/me` | Return current user profile. |
| `PATCH` | `/api/v1/users/me` | Update current user profile. |

### Itinerary

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/v1/upload` | Upload a travel document and generate an itinerary. |
| `POST` | `/api/v1/itinerary/generate` | Alternate upload-and-generate endpoint. |
| `GET` | `/api/v1/itinerary` | List authenticated user's itineraries with pagination, search, and sorting. |
| `GET` | `/api/v1/itinerary/:id` | Get one itinerary owned by the authenticated user. |
| `PATCH` | `/api/v1/itinerary/:id` | Update editable itinerary content. |
| `DELETE` | `/api/v1/itinerary/:id` | Delete one itinerary owned by the authenticated user. |
| `POST` | `/api/v1/share/:id` | Create an expiring public share link. |
| `GET` | `/api/v1/share/:shareId` | Read a public shared itinerary. |

### Places and Docs

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/v1/health` | Health check that remains available even when database-backed routes are unavailable. |
| `GET` | `/api-docs` | Swagger UI for documented API routes. |

## Client Routes

| Route | Access | Description |
| --- | --- | --- |
| `/` | Public | Landing page. |
| `/login` | Public | Login form. |
| `/register` | Public | Registration form. |
| `/forgot-password` | Public | Password reset request form. |
| `/reset-password/:token` | Public | Password reset completion form. |
| `/share/:shareId` | Public | Public shared itinerary view. |
| `/dashboard` | Authenticated | Itinerary dashboard and history. |
| `/upload` | Authenticated | Upload booking documents. |
| `/itinerary/:id` | Authenticated | Full itinerary view, editing, sharing, and PDF export. |
| `/profile` | Authenticated | User profile page. |

## Testing and Quality

Run all workspace tests:

```bash
npm test
```

Run static checks:

```bash
npm run typecheck
npm run lint
```

The server test suite uses Vitest and covers key service and database availability behavior. When adding new API routes, prefer tests at the service boundary and API integration tests with Supertest and `mongodb-memory-server`.

## Docker

Start the full local stack:

```bash
docker compose up --build
```

For Docker, set:

```text
MONGO_URI=mongodb://mongo:27017/trip-planner-ai
CLIENT_URL=http://localhost:5173
VITE_API_URL=http://localhost:5000/api/v1
```

The Compose file starts:

- MongoDB on `27017`.
- Express API on `5000`.
- Built client served on `5173`.
- Persistent MongoDB and upload volumes.

## Security Notes

- Refresh tokens are stored in HttpOnly cookies.
- Access tokens are kept in memory on the client and refreshed from the cookie on app startup.
- Password reset tokens are generated with cryptographic randomness.
- Only a SHA-256 hash of a reset token is stored in MongoDB.
- Reset links expire after 30 minutes and are cleared after a successful reset.
- Forgot-password responses are generic to avoid email enumeration.
- Uploads are restricted to PDF/PNG/JPG/JPEG and limited to 10 MB.
- API input is validated with Zod.
- Express is protected with Helmet, CORS, rate limiting, compression, XSS cleanup, and Mongo sanitization.
- Current refresh tokens are stateless JWTs, so password reset does not revoke already-issued refresh cookies before they expire.

## Development Guidelines

- Keep shared DTOs, enums, and validation schemas in `packages/shared`.
- Keep server business logic inside services and persistence logic inside repositories.
- Do not access Mongoose models directly from controllers.
- Keep frontend route pages focused on page composition and move reusable UI into `src/components`.
- Add tests for trip-planning logic, auth flows, upload validation, share links, and user-facing workflows.
- Prefer workspace scripts over one-off commands so local and CI workflows stay aligned.
- Do not commit generated folders such as `node_modules`, `dist`, `coverage`, upload artifacts, logs, or local environment files.

## Deployment Notes

Before deploying:

1. Set `NODE_ENV=production`.
2. Configure strong JWT secrets.
3. Configure `OPENAI_API_KEY`.
4. Configure production `MONGO_URI`.
5. Configure `CLIENT_URL` with the deployed frontend origin.
6. Configure SMTP so password reset links are emailed instead of logged.
7. Decide whether uploads should remain local or move to S3.
8. Keep `ALLOW_AI_FALLBACK=false` unless fallback itineraries are acceptable in production.
9. Confirm `VITE_API_URL` points to the deployed API base URL.

## License

No license file is currently included. Add a license before distributing or accepting external contributions.
