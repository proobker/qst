# qst UI Improvement Plan

Goal: elevate the qst UI on both mobile and laptop with a bolder, gamified identity while keeping it light-mode-ready. Dark-only today; semantic tokens are structured so a light theme can be added later without a refactor.

## Design direction

- **Animated gradient CTAs** (violet -> fuchsia -> amber) with a soft outer glow on hover.
- **Depth**: radial violet glows behind the top of each screen, layered card shadows, hover lift on interactive cards.
- **Oversized display type** on page headers and quest titles.
- **Progress feel**: XP arc/ring ambitions on the profile header, glowing level/title, confident stat cards.
- **Light-mode readiness**: all visuals mapped to semantic CSS variables; no raw hex in components.

## Phase 0 — Visual polish & token foundation (DONE)

- [x] Extend tokens in `src/app/globals.css`: `danger`, `danger-hover`, `ring`, `shadow-card`, `shadow-card-hover`, `shadow-glow`; comment marks the light-theme override point.
- [x] Background depth: violet radial glows + subtle dot grid on `body`; opaque `bg-background` removed from `<body>` and `(app)` wrapper so it shows through.
- [x] Replace ad-hoc `red-400/500` with `danger` tokens across toast, delete, swipe overlays, votes, friend/abandon buttons.
- [x] Global `focus-visible` ring (primary) on links/buttons, focus border+ring on inputs.
- [x] `bg-gradient-primary` CTA class (animated shimmer + hover glow) applied to all primary buttons.
- [x] `npm run typecheck` + `npm run lint` pass.

## Phase 1 — Design system extraction

- Build hand-rolled primitives in `src/components/ui/` using installed `class-variance-authority`:
  - `button.tsx` — `Button` variants: `primary` (gradient+glow), `secondary` (outline), `secondaryDanger`, `accent`, `success`, `danger`, `ghost`; sizes `sm/md/lg/icon`; exports `buttonVariants` for link-styled-as-button.
  - `card.tsx` — `Card` (variants `default`/`accent`/`danger`, `interactive` hover lift), base `shadow-card`.
  - `input.tsx` — `Input`, `Textarea`, `Field` (label + hint/error).
  - `pill.tsx` — `Pill` variants `neutral`/`primary`/`accent`/`success`.
  - `page-header.tsx` — hero header (title, subtitle, optional action/children).
  - `empty-state.tsx` — icon + title + description + action.
- Retrofit: discover, quests, feed, friends (header/search), profile (own + public), onboarding, swipe deck, post-card, friend-button, quest-upload-form, delete-account-section.
- [x] `npm run typecheck` + `npm run lint` pass.

## Phase 2 — Desktop layout pass (`lg+`)

- [x] **Nav**: single-row desktop bar (logo left, centered nav links, actions right) at `lg+`; keeps the wrapped pill nav for tablets (`sm`–`lg`) and the bottom tab bar on phones.
- [x] **Discover**: `lg:grid-cols-[1fr_20rem]` — deck column + right rail (profile card with XP bar, CTA, top-quester leaderboard) via new `src/components/app-rail.tsx`.
- [x] **Feed**: `lg:grid-cols-[40rem_18rem]` centered — posts column + same right rail (profile, XP, leaderboard, "Discover a quest" CTA).
- [x] **Profile** (own + public): stat grid kept; XP Progress + Badges side-by-side (`md:grid-cols-2`); Completed Quests | Quest Posts side-by-side (`lg:grid-cols-2`, `lg:items-start`).
- [x] **Quests**: card grid `md:grid-cols-2`; accepted-quest form layout stacks within its card.
- [x] `npm run typecheck` + `npm run lint` pass.

## Phase 3 — Mobile polish

- [x] Touch targets >= 44px: bottom tab bar links `min-h-11`; notification bell + mobile sign-out `size-11`; friend buttons `min-h-11` (deck CTA buttons already `lg`).
- [x] Bottom tab bar: neutral rounded active pill (`bg-primary/10`), stretch layout so all 6 items stay tappable.
- [x] Discover deck responsive spacing preserved (`max-w-md` centered, slim on mobile).
- [~] Streak: detail panel already stacks below the calendar on mobile (kept as-is; no bottom sheet — mobile tap flows verified by layout).
- [x] Respect existing `env(safe-area-inset-*)` and `userScalable:false` conventions.
- [x] `npm run typecheck` + `npm run lint` pass.

## Out of scope

- Light mode itself (tokens are structured to allow it later).
- New pages/features; no gameplay logic changes.

## Verification

- `npm run lint` and `npm run typecheck` after each phase.
- Manual pass at 360px (mobile) and 1280px+ (laptop), plus PWA/Capacitor flows (notifications, image editor sheet, level-up overlay).