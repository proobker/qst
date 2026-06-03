<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Notes for Agents

## Product

qst is a real-life RPG-style social adventure app. Users sign in with Google, choose hobbies and location, receive AI-generated quests, upload completion proof, and earn XP/badges after friend approval.

## Stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- Supabase Auth, PostgreSQL, Row Level Security, and Storage
- Gemini via `@google/genai`, with deterministic offline quest fallback
- Framer Motion for swipe interactions, Leaflet for location, react-easy-crop/canvas for image editing

## Important Files

- `src/app/(app)/layout.tsx`: authenticated app shell, profile bootstrap, notifications, level-up provider
- `src/app/(app)/*/page.tsx`: main app routes for discover, quests, feed, friends, onboarding, and profile
- `src/app/actions/*.ts`: server actions; keep these thin and call `src/lib/data.ts`
- `src/lib/data.ts`: Supabase data access and business workflows
- `src/lib/ai.ts`: Gemini prompt, parsing, moderation, cooldown, and offline fallback
- `src/lib/constants.ts`: shared product constants and hobby/badge seeds
- `src/lib/leveling.ts`: level lookup from `assets/lvls.json`
- `src/lib/supabase/*.ts`: Supabase clients for server, browser, route handlers, and admin
- `supabase/migrations/*.sql`: schema, RLS policies, storage policies, social upgrades, media editing
- `supabase/seed.sql`: baseline hobbies and badges

## Development Rules

- Before changing Next.js APIs or route conventions, read the matching local docs in `node_modules/next/dist/docs/`.
- Prefer server components for route data loading unless the UI needs client-side interaction.
- Keep server actions focused on authentication, form parsing, data calls, and revalidation.
- Put shared business rules in `src/lib/data.ts`, `src/lib/utils.ts`, or narrowly named helpers.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` or other secrets to client components.
- Use `createSupabaseServerClient()` for user-scoped server work and `createSupabaseAdminClient()` only for trusted reward/storage operations that require elevated access.
- Preserve Supabase RLS assumptions when adding data access. If a feature needs new cross-user reads or writes, update migrations intentionally.
- Keep quest generation safe, public, legal, and completable in one session.
- After meaningful changes, run `npm run lint` and `npm run typecheck`; run `npm run build` for broad Next.js/runtime changes.

## Current Workflows

- Discovery requires completed onboarding and at least `MIN_FRIENDS_REQUIRED` friend.
- Accepted quests expire to `incomplete` after `QUEST_ACCEPT_DEADLINE_HOURS`.
- Completion posts enter `pending_approval`.
- Rewards apply when approvals are more than `APPROVAL_THRESHOLD_PERCENT` of the user's friends.
- Level-up notifications drive the celebration overlay.
- Post image edits are tracked in `post_edit_history` and can be rolled back.
