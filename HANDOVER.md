# QST Handover Document

## Project Overview

QST is a life-RPG app that turns real life into an adventure. Players receive AI-generated quests based on hobbies and location, complete quests with proof uploads, and earn XP/badges when community approval reaches at least 50%.

**Tech Stack:**
- Next.js 16.2.6 (App Router) + TypeScript + Tailwind CSS
- Supabase (Auth, PostgreSQL, Storage)
- Gemini API (quest generation)
- Framer Motion (animations)
- React Hook Form (form handling)

---

## Recent Changes (May 2026)

### 1. Quest Swipe System Bug Fix ✅

**Problem:**
- First quest loaded correctly
- After swiping left or right, the next quest never appeared
- Users became stuck until they refreshed the page

**Root Cause:**
The `getDiscoveryQuest` function in `src/lib/data.ts` had a race condition where:
1. After swiping, the quest status changed from "generated" to "accepted"/"rejected"
2. On page refresh, the function looked for "generated" status quests
3. If AI generated a duplicate quest (same title), the unique constraint on `(user_id, quest_id)` in the `user_quests` table caused a silent failure
4. The function returned null, showing "No quest available yet"

**Solution Implemented:**
- Added comprehensive debug logging throughout the swipe lifecycle
- Added error handling for unique constraint violations (PostgreSQL error code 23505)
- When a unique constraint violation occurs, the system now:
  1. Deletes the duplicate quest
  2. Retries quest generation with updated history to avoid generating the same quest
- Enhanced logging to track:
  - Quest generation context (hobbies, level, location)
  - Database insert operations
  - User quest assignment creation
  - Error conditions

**Files Modified:**
- `src/lib/data.ts` - Enhanced `getDiscoveryQuest` function with error handling and logging
- `src/lib/ai.ts` - Added debug logging for quest generation

**Testing:**
- Users can now continuously swipe through quests
- Next quest automatically appears after every swipe
- Works on both mobile (touch gestures) and desktop (arrow keys)
- Loading states are preserved during quest generation

---

### 2. Enhanced Gemini API Integration ✅

**Previous Implementation:**
- Basic prompt with minimal context
- No location awareness
- Limited quest history tracking
- No difficulty scaling based on user level

**New Implementation:**
- Comprehensive prompt engineering with:
  - User context (hobbies, level, location)
  - Previous quest history (last 20 quests)
  - Completed quests (to avoid repetition)
  - Rejected quests (to avoid suggesting again)
  - Difficulty guidelines based on user level
  - Location-aware quest examples
  - Strict safety constraints

**Location-Aware Quest Generation:**
- Added `getLocationHints` function that maps hobbies to relevant location types:
  - Photography → landmarks, viewpoints, architecture, street art
  - Food → cafes, restaurants, food markets, bakeries
  - Fitness → parks, walking trails, gyms, outdoor exercise areas
  - Technology → tech stores, maker spaces, coworking spots
  - Reading → libraries, bookstores, study cafes
  - And 10+ more hobby-location mappings

**Difficulty Scaling:**
- Level 1-2: Easy quests (30-45 min, 80-100 XP)
- Level 3-4: Medium quests (45-90 min, 120-180 XP)
- Level 5+: Hard quests (90-120 min, 200-300 XP)

**Safety Enhancements:**
- Expanded forbidden words list in `moderateQuest` function
- Strict safety constraints in prompt
- Fallback to safe exploration quest if moderation fails
- Validation of all generated quest fields

**Files Modified:**
- `src/lib/ai.ts` - Complete rewrite of `generateQuest` function
- `src/lib/data.ts` - Updated `getUserQuestHistory` to return completed/rejected quests

**API Configuration:**
- Uses Gemini 2.5 Flash model
- Temperature: 0.8 (balanced creativity)
- Max output tokens: 1024
- Response MIME type: application/json

---

### 3. Expanded Hobby System ✅

**Previous System:**
- 10 default hobbies
- No categorization
- Limited user choice

**New System:**
- **240 hobbies** organized into **25 categories**
- Structured format for easy expansion
- Category-based organization for better UX
- Preserved backward compatibility with existing users

**Categories:**
1. Technology (10 hobbies)
2. Programming (10 hobbies)
3. Artificial Intelligence (10 hobbies)
4. Electronics (10 hobbies)
5. Photography (10 hobbies)
6. Videography (10 hobbies)
7. Fitness (10 hobbies)
8. Sports (10 hobbies)
9. Outdoor Activities (10 hobbies)
10. Travel (10 hobbies)
11. Food (10 hobbies)
12. Art (10 hobbies)
13. Design (10 hobbies)
14. Music (10 hobbies)
15. Reading (10 hobbies)
16. Writing (10 hobbies)
17. Science (10 hobbies)
18. Business (10 hobbies)
19. Volunteering (10 hobbies)
20. Education (10 hobbies)
21. Gaming (10 hobbies)
22. Content Creation (10 hobbies)
23. DIY & Maker Projects (10 hobbies)
24. Social Activities (10 hobbies)

**Files Modified:**
- `src/lib/constants.ts` - Added `HOBBY_CATEGORIES` object and updated `DEFAULT_HOBBIES`
- `supabase/seed.sql` - Updated to seed all 240 hobbies

**Database Migration Required:**
Run the updated seed.sql in Supabase SQL editor to populate the new hobbies:
```sql
-- Run the entire seed.sql file
-- It uses ON CONFLICT DO NOTHING, so it's safe to re-run
```

**Backward Compatibility:**
- Existing user hobby selections are preserved
- New hobbies are available for selection
- Old hobby names remain valid (no breaking changes)

---

## Database Schema

### Key Tables

**users**
- User profiles with XP, level, location data
- RLS enabled for row-level security

**hobbies**
- 240 hobbies with unique names
- Can be extended without schema changes

**user_hobbies**
- Many-to-many relationship between users and hobbies
- Composite primary key (user_id, hobby_id)

**quests**
- AI-generated quest definitions
- Unique constraint on title to prevent duplicates
- Fields: title, description, difficulty, xp_reward, badge_reward, estimated_time, category

**user_quests**
- Tracks quest assignments and status
- Unique constraint on (user_id, quest_id) - **critical for swipe bug fix**
- Statuses: generated, accepted, rejected, pending_approval, completed, abandoned

**posts**
- User quest completion posts with images
- Linked to quests and users

**approvals**
- Community voting on quest completions
- 50% approval threshold triggers reward distribution

### Important Constraints

- `user_quests(user_id, quest_id)` unique constraint prevents duplicate quest assignments
- This constraint was the root cause of the swipe bug
- Now handled gracefully with retry logic

---

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
GOOGLE_GEMINI_API_KEY=your-gemini-api-key
```

**Note:** If `GOOGLE_GEMINI_API_KEY` is missing, the app uses a safe fallback quest generation system.

---

## Key Functions

### Quest Generation Flow

1. **getDiscoveryQuest(userId)** - `src/lib/data.ts`
   - Checks for existing "generated" status quest
   - If none, generates new quest using AI
   - Handles unique constraint violations with retry logic
   - Returns quest assignment for display

2. **generateQuest(context)** - `src/lib/ai.ts`
   - Uses Gemini API for personalized quest generation
   - Takes context: hobbies, location, level, quest history
   - Returns sanitized quest with proper validation
   - Falls back to safe quest if API fails

3. **swipeQuest(userId, userQuestId, direction)** - `src/lib/data.ts`
   - Updates quest status to "accepted" or "rejected"
   - Triggers page refresh via server actions
   - Called from swipe actions in `src/app/actions/quests.ts`

### Swipe Lifecycle

1. User loads discover page
2. `getDiscoveryQuest` fetches or generates quest
3. `QuestSwipeDeck` component displays quest
4. User swipes left/right or uses arrow keys
5. Server action updates quest status
6. `router.refresh()` triggers page re-render
7. `getDiscoveryQuest` generates next quest
8. New quest appears automatically

---

## Debug Logging

Added comprehensive logging throughout the quest system:

**[QuestSwipe] tags:**
- Quest discovery and generation
- Database operations
- Error conditions
- Retry logic

**[Gemini] tags:**
- API requests
- Generation context
- Response parsing
- Error handling

View logs in browser console during development to trace quest generation flow.

---

## Testing Checklist

### Quest Swipe System
- [x] First quest loads correctly
- [x] Swipe right accepts quest
- [x] Swipe left rejects quest
- [x] Next quest appears automatically after swipe
- [x] Arrow keys work on desktop
- [x] Touch gestures work on mobile
- [x] Loading states display during generation
- [x] Error handling works when API fails

### Gemini Integration
- [x] Quests generate with proper context
- [x] Location-aware hints included in prompts
- [x] Difficulty scales with user level
- [x] Completed/rejected quests avoided
- [x] Safety moderation works
- [x] Fallback system works when API key missing

### Hobby System
- [x] All 240 hobbies seeded in database
- [x] Categories organized correctly
- [x] Onboarding displays hobbies properly
- [x] User can select multiple hobbies
- [x] Existing users' selections preserved

---

## Remaining Issues

### Minor
- None identified

### Future Enhancements
- Add hobby category filtering in onboarding
- Implement hobby recommendations based on user behavior
- Add quest difficulty preview in swipe deck
- Implement quest queue (pre-generate multiple quests)
- Add quest retry option for rejected quests
- Implement location-based quest suggestions using geocoding API

---

## Deployment Notes

### Database Migration
1. Run updated seed.sql in Supabase SQL editor
2. Verify hobbies table has 240 rows
3. Check existing user_hobbies still valid

### Environment Setup
1. Ensure `GOOGLE_GEMINI_API_KEY` is set in production
2. Verify Supabase RLS policies are correct
3. Test quest generation in production environment

### Monitoring
- Monitor console logs for [QuestSwipe] and [Gemini] tags
- Track quest generation success rate
- Monitor unique constraint violation frequency
- Track API usage and costs

---

## Contact & Support

For questions about:
- **Quest swipe bug:** Check debug logs in browser console
- **Gemini integration:** Verify API key and quota limits
- **Hobby system:** Run seed.sql migration if issues
- **Database:** Check Supabase logs and RLS policies

---

## File Structure

```
src/
├── app/
│   ├── (app)/
│   │   ├── discover/page.tsx          # Quest swipe interface
│   │   ├── quests/                     # Active quest management
│   │   └── onboarding/                 # Hobby/location setup
│   └── actions/
│       ├── quests.ts                   # Swipe server actions
│       └── ...
├── components/
│   ├── quest-swipe-deck.tsx           # Swipe card component
│   └── ...
└── lib/
    ├── ai.ts                          # Gemini quest generation
    ├── data.ts                        # Database operations
    ├── constants.ts                   # Hobby categories
    └── types.ts                       # TypeScript types

supabase/
├── migrations/
│   └── 0001_init.sql                  # Database schema
└── seed.sql                          # Hobby/badge seeding
```

---

**Last Updated:** May 31, 2026
**Version:** 0.2.0
**Status:** Production Ready ✅
