# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

qst is an RPG-style social adventure game that turns real life into a game. Players receive AI-generated quests based on their hobbies and location, complete quests by uploading proof, and earn XP/badges when more than 50% of their friends approve the completion post.

### Implemented MVP Features
- Google OAuth sign-in (Supabase Auth)
- Onboarding with hobby selection + location permission capture
- AI quest generation (Gemini with deterministic fallback)
- Tinder-style quest acceptance/rejection
- Active quest management + completion uploads
- Social feed with friend approve/disapprove voting
- Reward pipeline (XP, level progression, badges)
- Friends search/add/remove
- Profile pages with stats, badges, completed quests, and posts
- Supabase SQL schema + seed files for all core entities

## Stack
- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (Auth, PostgreSQL, Storage)
- Gemini API (quest generation)

## Setup
1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and fill values.
3. In Supabase SQL editor:
   - run `supabase/migrations/0001_init.sql`
   - run `supabase/seed.sql`
4. In Supabase Auth settings:
   - enable Google provider
   - add callback URL: `http://localhost:3000/auth/callback` (and production equivalent)
5. Run the app:
   `npm run dev`

## Environment Variables
- `NEXT_PUBLIC_APP_URL`: app base URL
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (required for awarding XP after approvals; server-only, never expose to the client)
- `GOOGLE_GEMINI_API_KEY`: Gemini API key (optional but recommended)

If `GOOGLE_GEMINI_API_KEY` is missing, qst still works using safe fallback quest generation.

## Commonly Used Commands
- `npm run dev`: start development server
- `npm run build`: production build
- `npm run start`: start production server
- `npm run lint`: run ESLint
- `npm run typecheck`: run TypeScript typecheck

Note: There is no dedicated test script; testing is primarily done through linting and type checking.

## Code Architecture

### High-Level Structure
- `src/app`: Next.js App Router route definitions
  - `(app)`: Route group containing the main application screens (accessible after authentication)
    - `discover/`: Quest discovery page
    - `feed/`: Social feed of friends' quest completions
    - `friends/`: Friends management
    - `onboarding/`: User onboarding flow
    - `profile/`: User profile page
    - `quests/`: Active quest management
    - `streak/`: Daily streaks leaderboard
    - `daily/`: Daily quests (if applicable)
  - `auth/`: Authentication routes (callback, testing, etc.)
  - `csae-standards/`, `privacy/`: Static pages
  - `actions/`: Server actions for data mutations (used with Next.js server actions)
  - `layout.tsx`: Root layout for the `(app)` route group
  - `page.tsx`: Home page (landing page)

- `src/components`: Reusable UI components
  - UI elements like buttons, avatars, cards, modals, etc.
  - Feature-specific components (quest swipe deck, level-up overlay, etc.)
  - `ui/`: Base UI components (spinner, toast, skeleton)

- `src/lib`: Utilities and shared logic
  - `supabase/`: Supabase client initialization (browser and server)
  - `ai.ts`: Gemini API integration for quest generation
  - `data.ts`: Data fetching and mutation logic (wrappers around Supabase)
  - `constants.ts`: Application constants
  - `dates.ts`: Date utility functions
  - `env.ts`: Environment variable validation
  - `utils.ts`: Miscellaneous utility functions
  - `hobby-validation.ts`: Validation for hobby selection
  - `image-editor.ts`: Image manipulation utilities
  - `leveling.ts`/`level-up.ts`: XP and level progression logic
  - `types.ts`: Shared TypeScript types

- `src/types`: TypeScript definition files (e.g., for SVG imports)

### Key Patterns
- **Supabase Integration**: Uses `@supabase/supabase-js` for client and `@supabase/ssr` for server-side auth.
- **Server Actions**: Async functions in `src/app/actions/` handle form submissions and data mutations.
- **AI Quest Generation**: Centralized in `src/lib/ai.ts` with Gemini API and fallback.
- **Authentication**: Protected routes redirect to sign-in; Supabase handles session management.
- **Real-time Updates**: Notifications and live data likely use Supabase Realtime (implied by data.ts).
- **Styling**: Tailwind CSS with custom CSS in `globals.css` and utility classes.

## Development Notes
- Read `node_modules/next/dist/docs/` for Next.js App Router specifics due to breaking changes.
- When modifying Supabase schema, update migration files in `supabase/migrations/`.
- The `SUPABASE_SERVICE_ROLE_KEY` is required for server-side operations like awarding XP and should never be exposed to the client.
- Gemini API key is optional; the app functions with deterministic fallback quests when missing.