# Repository Guidelines

## Project Structure & Module Organization

This repository is currently an empty scaffold. As the TripPlannerAI codebase is added, keep the top level focused on project metadata and place application code in clearly named directories:

- `src/` for application source code.
- `tests/` for automated tests that mirror `src/` module names.
- `assets/` or `public/` for static images, icons, seed data, and other non-code resources.
- `docs/` for architecture notes, API contracts, and contributor-facing documentation.
- `.env.example` for required configuration keys without secrets.

Avoid committing generated outputs, local environment files, dependency folders, or build artifacts.

## Build, Test, and Development Commands

No build system or package manifest is present yet. When one is introduced, document the exact commands here and keep them stable. Expected examples:

- `npm install` or equivalent: install project dependencies.
- `npm run dev`: start the local development server.
- `npm run build`: create a production build.
- `npm test`: run the automated test suite.
- `npm run lint`: run formatting and static analysis checks.

Prefer scripts defined in the project manifest over one-off commands so contributors use the same workflow locally and in CI.

## Coding Style & Naming Conventions

Use consistent, idiomatic style for the chosen stack. For JavaScript or TypeScript, prefer 2-space indentation, `camelCase` for variables and functions, `PascalCase` for components/classes, and kebab-case filenames for routes or page-level modules unless the framework requires otherwise. Keep modules small and single-purpose.

Add a formatter and linter early, such as Prettier and ESLint, and make their commands part of the documented workflow.

## Testing Guidelines

Add tests beside or parallel to the modules they cover. Use clear test names that describe behavior, for example `planner-route-generation.test.ts`. Cover core trip-planning logic, API validation, error handling, and user-facing workflows before adding broad snapshot tests. Tests should be deterministic and should not depend on live third-party services unless explicitly marked as integration tests.

## Commit & Pull Request Guidelines

There is no Git history in this workspace to infer existing conventions. Use concise, imperative commit messages, for example `Add itinerary validation` or `Fix date range handling`. Pull requests should include a short summary, test results, linked issues when applicable, and screenshots or recordings for UI changes.

## Security & Configuration Tips

Never commit API keys, tokens, or real user travel data. Store secrets in local environment files and document required keys in `.env.example`.
