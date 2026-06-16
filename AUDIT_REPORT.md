# TripPlannerAI Code Audit

Scope: MERN monorepo at `E:\TripPlannerAI` with React/Vite client, Express/TypeScript API, MongoDB/Mongoose, JWT auth, Google OAuth, OpenAI itinerary generation, optional Google Places, optional S3, sharing, PDF export, and password reset.

## Findings

```
[SEVERITY: HIGH]
File: apps/server/src/utils/mappers.ts  Line(s): 15-29
Category: Security
Issue: Public shared itinerary responses previously reused the private DTO and exposed real userId/fileUrl values.
Impact: A public share link could leak internal owner and upload location metadata.
Fix: Added toPublicItineraryDto and changed shared itinerary service responses to blank sensitive fields.
```

```
[SEVERITY: HIGH]
File: apps/server/src/services/auth.service.ts  Line(s): 88-108
Category: Security
Issue: Refresh tokens are stateless and are not revoked after password reset.
Impact: A stolen refresh cookie can remain valid until expiry even after a successful password reset.
Fix: Add refresh-token persistence with token family/versioning, then invalidate all active refresh sessions on password reset.
```

```
[SEVERITY: MEDIUM]
File: apps/server/src/repositories/itinerary.repository.ts  Line(s): 22-24
Category: Performance
Issue: Search uses unbounded case-insensitive regex over nested fields.
Impact: Large itinerary collections can produce slow scans and high CPU use.
Fix: Add bounded query length, escape regex input, and consider Mongo text indexes for title/destination/originalFileName.
```

```
[SEVERITY: MEDIUM]
File: apps/server/src/repositories/itinerary.repository.ts  Line(s): 29
Category: Security
Issue: The sort value is accepted from query input and passed directly to Mongoose.
Impact: Unexpected sort expressions can cause inefficient queries or inconsistent behavior.
Fix: Whitelist allowed sort values such as createdAt, -createdAt, departureDate, and -departureDate.
```

```
[SEVERITY: MEDIUM]
File: apps/server/src/models/itinerary.model.ts  Line(s): 10-11
Category: Architecture
Issue: travelData and aiItinerary are stored as Schema.Types.Mixed.
Impact: MongoDB cannot enforce structure and invalid AI output can be persisted if service validation is bypassed.
Fix: Replace Mixed with explicit nested schemas or add schema-level validation before persistence.
```

```
[SEVERITY: MEDIUM]
File: apps/client/src/pages/itinerary.tsx  Line(s): 207
Category: Performance
Issue: @react-pdf/renderer is imported eagerly in the main itinerary route.
Impact: Client bundle is above 2 MB and Vite reports large chunks.
Fix: Lazy-load PDF export components or split PDF rendering into a dynamic import.
```

```
[SEVERITY: MEDIUM]
File: apps/client/src/lib/api.ts  Line(s): 16-29
Category: Logic Bug
Issue: Concurrent 401 responses can each call /auth/refresh independently.
Impact: Multiple refresh requests can race and cause noisy failures under expired access tokens.
Fix: Add a shared refresh promise queue so only one refresh request is in flight.
```

```
[SEVERITY: MEDIUM]
File: apps/server/src/services/storage.service.ts  Line(s): 25
Category: Security
Issue: S3 object keys previously included unsanitized original filenames.
Impact: Odd filenames could create confusing object keys and inconsistent URLs.
Fix: Added safeObjectName before composing S3 object keys.
```

```
[SEVERITY: LOW]
File: apps/client/src/pages/itinerary.tsx  Line(s): 450
Category: Accessibility
Issue: Recommendation images use empty alt text.
Impact: Decorative images are skipped by screen readers, which is acceptable only if all meaning is duplicated in text.
Fix: Prefer alt text like `${card.name} recommendation photo` for place photos; keep empty alt only for decorative fallbacks.
```

```
[SEVERITY: LOW]
File: apps/client/src/pages/itinerary.tsx  Line(s): 247-261
Category: Accessibility
Issue: Booking details table lacks a caption.
Impact: Screen reader users get less context when entering the table.
Fix: Add a visually hidden caption describing the extracted flight details.
```

```
[SEVERITY: LOW]
File: apps/server/src/app.ts  Line(s): 23
Category: Security
Issue: A single global rate limit is used for most API traffic.
Impact: Expensive AI/upload endpoints and auth endpoints have different abuse profiles.
Fix: Keep the global limiter and add route-specific stricter limits for upload, login, Google login, and itinerary generation.
```

```
[SEVERITY: INFO]
File: apps/client/src/styles.css  Line(s): 1-150
Category: Style
Issue: The UI had basic tokens and motion but lacked a documented design-token layer.
Impact: Visual consistency was harder to maintain as pages grew.
Fix: Added apps/client/src/styles/tokens.css and mapped global typography, motion, shadows, spacing, and z-index guidance.
```

```
[SEVERITY: INFO]
File: apps/server/package.json  Line(s): 1-55
Category: DX
Issue: npm audit reports transitive dependency vulnerabilities.
Impact: Some packages may need patch upgrades before production deployment.
Fix: Run npm audit, review breaking changes, and upgrade vulnerable packages in a controlled pass.
```

## Summary Scorecard

| Category | Count |
|---|---:|
| Critical | 0 |
| High | 2 |
| Medium | 6 |
| Low | 3 |
| Info | 2 |
| Total Issues | 13 |

Overall Code Health: B

Top 3 Risks to Fix Immediately:
1. Add refresh-token revocation/session invalidation after password reset.
2. Split the PDF exporter out of the main client bundle.
3. Whitelist itinerary list sort values and harden search query handling.
