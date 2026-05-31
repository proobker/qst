# qst - Real Life Adventure Game

## Vision

Turn real life into an RPG.

Users receive AI-generated side quests based on:
- Location
- Hobbies
- Interests
- Previous activity

Complete quests, upload proof, earn XP, gain badges, and level up.

Inspired by:
- Pokemon GO
- Tinder
- Facebook
- RPG Games

---

# MVP Features

## Authentication

### Google Login

- Sign in with Google
- Create account automatically
- Store profile information

Fields:

- id
- name
- email
- profile_picture
- level
- xp
- badges
- hobbies
- location_enabled

---

## Onboarding

After first login:

### Step 1

Choose hobbies

Examples:

- Programming
- Photography
- Hiking
- Fitness
- Reading
- Food
- Art
- Music
- Volunteering
- Entrepreneurship

Store selected hobbies.

### Step 2

Request location permission.

Store:

- latitude
- longitude

---

## AI Quest Generation

Generate quests using:

- User hobbies
- Current location
- User level
- Previous quests

Example:

Programming + Photography

Quest:
"Take 3 photos of technology improving daily life within 2km and explain each in one sentence."

Quest Object:

- title
- description
- difficulty
- xp_reward
- badge_reward
- estimated_time
- category

---

## Tinder Style Quest Discovery

Display one quest card at a time.

### Right Swipe

Accept quest.

### Left Swipe

Reject quest.

Rejected quests are not shown again.

Accepted quests move to active quests.

---

## Active Quest Screen

Shows:

- Title
- Description
- XP
- Difficulty
- Status

Buttons:

- Upload Completion
- Abandon Quest

---

## Quest Completion

User uploads:

- Photo
- Caption

Create post.

Status:

Pending Approval

---

## Social Feed

Facebook-style feed.

Post includes:

- User
- Quest
- Photo
- Caption
- Likes
- Approvals

Friends can:

- Like
- Approve

---

## Approval System

Quest considered verified when:

Approval Percentage >= 50%

Formula:

approved_users / total_voters * 100

When approved:

- XP awarded
- Badge awarded
- Quest marked completed

---

## Level System

Level 1 → Beginner
Level 2 → Explorer
Level 3 → Adventurer
Level 4 → Hero
Level 5 → Legend

XP required per level.

Example:

Level 1 = 0 XP
Level 2 = 100 XP
Level 3 = 300 XP
Level 4 = 700 XP
Level 5 = 1500 XP

---

## Friends System

Users can:

- Search users
- Add friends
- Remove friends
- View profile

---

## Profile Page

Displays:

- Profile Picture
- Level
- XP
- Badges
- Completed Quests
- Quest Posts

---

## Badge System

Examples:

Food Explorer
Tech Explorer
Photographer
Nature Hunter
Fitness Warrior

Badges awarded by AI and rules.

---

# AI Requirements

## AI Quest Generator

Input:

- User hobbies
- Location
- User level
- Quest history

Output:

{
 title,
 description,
 difficulty,
 xp_reward,
 badge,
 estimated_time
}

Requirements:

- Never repeat recent quests
- Scale difficulty with level
- Use nearby locations
- Be achievable in real life
- Be safe
- Avoid illegal activities
- Avoid dangerous challenges

---

## AI Moderation

Check generated quests.

Reject:

- Dangerous
- Illegal
- Offensive
- Unrealistic

---

## AI Badge Engine

Analyze completed quests.

Recommend:

- New badges
- Achievement titles
- Streak rewards

---

# Database Tables

users

- id
- email
- name
- avatar
- level
- xp
- created_at

hobbies

- id
- name

user_hobbies

- user_id
- hobby_id

quests

- id
- creator_ai
- title
- description
- xp_reward
- difficulty

user_quests

- id
- user_id
- quest_id
- status

posts

- id
- user_id
- quest_id
- image_url
- caption
- created_at

likes

- id
- post_id
- user_id

approvals

- id
- post_id
- user_id

friendships

- id
- user_1
- user_2

badges

- id
- name
- icon

user_badges

- user_id
- badge_id

---

# Tech Stack

Frontend:
- Next.js
- TypeScript
- TailwindCSS
- shadcn/ui

Backend:
- Supabase

Auth:
- Google OAuth

Storage:
- Supabase Storage

Database:
- PostgreSQL

Maps:
- openstreetmaps

AI:
- Gemini API free tier

Hosting:
- Vercel

---

# Future Features

- Guilds
- Team Quests
- Local Leaderboards
- Seasonal Events
- AI NPC Guide
- AR Challenges
- Business Sponsored Quests
- City-wide Treasure Hunts