# qst
qst turns real life into an RPG-style social adventure game. Players receive AI-generated quests based on hobbies and location, complete quests with proof uploads, and earn XP/badges when more than 50% of their friends approve the completion post.

## Implemented MVP features
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

## Environment variables
- `NEXT_PUBLIC_APP_URL`: app base URL
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (required for awarding XP after approvals and deleting accounts; server-only, never expose to the client)
- `GOOGLE_GEMINI_API_KEY`: Gemini API key (optional but recommended)

If `GOOGLE_GEMINI_API_KEY` is missing, qst still works using safe fallback quest generation.

## Commands
- `npm run dev`: start dev server
- `npm run lint`: run ESLint
- `npm run typecheck`: run TypeScript typecheck
- `npm run build`: production build
