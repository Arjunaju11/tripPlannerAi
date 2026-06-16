# UI Change Log

## Screen Map

| Route | Screen | Primary Action |
|---|---|---|
| `/` | Landing | Start planning or create an account |
| `/login` | Login | Authenticate with email/password or Google |
| `/register` | Register | Create account |
| `/forgot-password` | Forgot password | Request reset link |
| `/reset-password/:token` | Reset password | Set new password |
| `/dashboard` | Dashboard/history | Review and share itineraries |
| `/upload` | Upload | Upload booking document |
| `/itinerary/:id` | Itinerary detail | Review/edit/share/export itinerary |
| `/share/:shareId` | Public itinerary | View shared itinerary |
| `/profile` | Profile | Edit display name and view stats |

## Design System

Location: `apps/client/src/styles/tokens.css`

Before: Token usage was limited to a few Tailwind HSL variables.
Issues: No documented typography, motion, shadow, spacing, or z-index token layer.
Changes:
- Added brand palette, typography, fluid type scale, spacing, radius, shadow, motion, and z-index tokens.
- Added Google font links for Space Grotesk and Plus Jakarta Sans.
- Added global grid background, smoother typography, selection styles, and reduced-motion support.
After: The app has a clearer design foundation with stronger visual identity.

## Component: Button
Location: `apps/client/src/components/ui.tsx`

Before: Simple hover translate and shadow.
Issues: CTA hover felt flat and touch height was borderline.
Changes:
- Applied minimum 44px touch height.
- Added hover scale, accent glow, active press state, and smoother transition.
After: Buttons feel more premium and tactile.

## Component: Card
Location: `apps/client/src/components/ui.tsx`

Before: Solid surface card with light shadow.
Issues: Cards lacked depth and hover affordance.
Changes:
- Added glass surface, backdrop blur, stronger hover elevation, and border brightening.
After: Cards read as polished product panels.

## Component: Skeleton
Location: `apps/client/src/components/ui.tsx`

Before: Static pulse block.
Issues: Loading state felt generic.
Changes:
- Added shimmer skeleton animation via CSS.
After: Loading states feel more modern.

## Component: Toast
Location: `apps/client/src/components/toast.tsx`

Before: Basic reveal-card toast.
Issues: No warning variant and shorter-than-required dismiss duration.
Changes:
- Added warning variant, 4s auto-dismiss, stronger glass/elevated styling, and color-coded icons.
After: Notifications are clearer and more product-grade.

## Component: Layout Navigation
Location: `apps/client/src/components/layout.tsx`

Before: Active links used static background highlight.
Issues: Highlight felt abrupt and header width was narrower than desired.
Changes:
- Added animated active underline/pill.
- Expanded app content max width to 1280px.
After: Navigation feels more intentional and current route is easier to scan.

## Component: Landing Page
Location: `apps/client/src/pages/landing.tsx`

Before: Good copy and itinerary mock card, but no real travel visual.
Issues: First impression was functional but not visually memorable.
Changes:
- Added full-height hero composition.
- Added high-quality travel image with CSS mask fade.
- Added staggered entry animation to hero content and step cards.
After: First viewport feels like a travel-tech product instead of a basic assignment page.

## Component: Dashboard/Profile Stats
Location: `apps/client/src/pages/dashboard.tsx`, `apps/client/src/pages/profile.tsx`

Before: Static stat values.
Issues: Metrics lacked polish.
Changes:
- Added IntersectionObserver-powered CountUp component for numeric stats.
After: Stats have subtle motion without adding dependencies.

## Backend Presentation Fix
Location: `apps/server/src/utils/mappers.ts`, `apps/server/src/services/itinerary.service.ts`

Before: Public share response used full private itinerary DTO.
Issues: Public API exposed real `userId` and `fileUrl`.
Changes:
- Added public DTO mapper that blanks sensitive internal fields.
After: Shared itinerary pages can render while avoiding private metadata exposure.
