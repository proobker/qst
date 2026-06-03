# qst

qst turns real life into an RPG-style social adventure game. Players receive AI-generated quests based on hobbies and location, complete quests with proof uploads, and earn XP, levels, and badges when more than 50% of their friends approve the completion post.

## What is implemented

- Google OAuth sign-in through Supabase Auth
- Onboarding with hobby selection and location capture
- AI quest generation with Gemini plus deterministic offline fallback
- Tinder-style quest swipe deck with keyboard support
- Accepted quest management and 24-hour incomplete expiration
- Completion uploads with built-in crop, rotate, filter, and adjustment tools
- Social feed with friend approve/disapprove voting
- Reward pipeline for XP, level progression, badges, and level-up notifications
- Friend requests, friend search by full email, accept/reject/cancel/remove flows
- Profile pages with stats, XP progress, bio, badges, completed quests, and posts
- Post image edit history and rollback
- Supabase SQL migrations and seed data for the core schema

## Stack

- Next.js 16.2.6 App Router, React 19, TypeScript
- Tailwind CSS 4
- Supabase Auth, PostgreSQL, Row Level Security, and Storage
- Gemini API through `@google/genai`
- Framer Motion, lucide-react, Leaflet, react-easy-crop

## Project structure

```text
src/app
  page.tsx                 Public landing route
  (app)/layout.tsx         Authenticated app shell
  (app)/discover           Quest discovery and swipe stack
  (app)/quests             Active/completed quest list and proof upload
  (app)/feed               Completion posts and approval voting
  (app)/friends            Friends, requests, and user search
  (app)/onboarding         Hobbies and location setup
  (app)/profile            Own and public profile pages
  actions                  Server actions for forms and client workflows

src/components             Reusable app UI and client interactions
src/lib                    Supabase clients, data workflows, AI, leveling, constants
supabase/migrations        Database schema, RLS, storage, and feature migrations
supabase/seed.sql          Default hobbies and badges
assets/lvls.json           999 level definitions
public                     Static images and logo assets
```

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` with the required values below.

3. In the Supabase SQL editor, run migrations in order:

   ```text
   supabase/migrations/0001_init.sql
   supabase/migrations/0002_social_upgrade.sql
   supabase/migrations/0003_media_editing.sql
   supabase/migrations/0004_public_profile_reads.sql
   supabase/migrations/0005_quest_incomplete_status.sql
   supabase/seed.sql
   ```

4. In Supabase Auth settings:

   - Enable the Google provider.
   - Add `http://localhost:3000/auth/callback` as a callback URL.
   - Add the production callback URL when deploying.

5. Start the dev server:

   ```bash
   npm run dev
   ```

## Environment variables

- `NEXT_PUBLIC_APP_URL`: app base URL, defaults to `http://localhost:3000` when omitted
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: server-only service role key, required for reward and admin storage workflows
- `GOOGLE_GEMINI_API_KEY`: Gemini API key, optional but recommended
- `GEMINI_API_KEY`: alternate Gemini key name supported by the app
- `GEMINI_MODEL`: optional Gemini model override

If no Gemini key is configured, qst still works using safe offline quest generation.

## Commands

```bash
npm run dev        # start local Next.js dev server
npm run lint       # run ESLint
npm run typecheck  # run TypeScript without emitting
npm run build      # create production build
npm run start      # start production server after build
```

## Core workflows

- A signed-in user is bootstrapped in `src/app/(app)/layout.tsx` through `ensureUserProfile`.
- Onboarding stores selected hobbies and optional latitude/longitude.
- Discovery calls `getDiscoveryQuest`, which reuses generated quest assignments, generates more when the stack is low, and falls back locally when Gemini is unavailable.
- Swiping right marks a quest `accepted`; swiping left marks it `rejected`.
- Accepted quests can be submitted with a caption and image, creating a post and moving the quest to `pending_approval`.
- Friends vote on posts in the feed. More than 50% approval awards XP and badges, marks the quest `completed`, and creates notifications.
- The profile pages aggregate user stats, completed quests, badges, friend count, and posts.

## Database overview

The Supabase schema includes:

- `users`, `hobbies`, `user_hobbies`
- `quests`, `user_quests`
- `posts`, `post_edit_history`
- `approvals`, `likes`
- `friendships`, `friend_requests`
- `notifications`
- `badges`, `user_badges`
- `quest-completions` storage bucket

Row Level Security is enabled across application tables. Keep RLS policies in sync with any new cross-user reads or writes.

## Contributor notes

- This project uses Next.js 16. Before changing Next.js APIs, routing, caching, middleware, or metadata behavior, read the relevant guide in `node_modules/next/dist/docs/`.
- Keep `src/app/actions/*.ts` thin; put durable behavior in `src/lib/data.ts` or focused helpers.
- Use `createSupabaseServerClient()` for user-scoped work and reserve `createSupabaseAdminClient()` for trusted server-only operations.
- Do not commit secrets. `.env*`, `*.pem`, and the local Google client secret JSON are ignored.
