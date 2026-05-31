PS C:\personal_files\codefolders\ts\qst> npm run dev

> qst@0.1.0 dev
> next dev

▲ Next.js 16.2.6 (Turbopack)
- Local:         http://localhost:3000
- Network:       http://192.168.1.69:3000
- Environments: .env.local
✓ Ready in 806ms

 GET / 307 in 1981ms (next.js: 351ms, application-code: 1630ms)
[QuestSwipe] No generated quest — calling Gemini for user: e446e9f5-7377-4a92-833f-015a5721c4a0
[QuestSwipe] Generating quest with context: { hobbyCount: 39, level: 1, historyCount: 17, rejectedCount: 17 }
[Gemini] generateQuest start {
  apiKeyConfigured: true,
  hobbiesInPrompt: [ 'Fiction', 'Film Photography', 'Filmmaking', 'Finance', 'Fishing' ],
  totalHobbies: 39,
  level: 1,
  hasLocation: true
}
[Gemini] Trying model: gemini-2.0-flash-lite
[Gemini] gemini-2.0-flash-lite rate limited (429), trying next model...
[Gemini] Trying model: gemini-1.5-flash-8b
[Gemini] gemini-1.5-flash-8b failed: 404 {
  "error": {
    "code": 404,
    "message": "models/gemini-1.5-flash-8b is not found for API version v1beta, or is not supported for generateContent. Call ModelService.ListModels to see the list of available models and their supported methods.",
    "status": "NOT_FOUND"
  }
}

[Gemini] Trying model: gemini-1.5-flash
[Gemini] gemini-1.5-flash failed: 404 {
  "error": {
    "code": 404,
    "message": "models/gemini-1.5-flash is not found for API version v1beta, or is not supported for generateContent. Call ModelService.ListModels to see the list of available models and their supported methods.",
    "status": "NOT_FOUND"
  }
}

[Gemini] Trying model: gemini-2.0-flash
[Gemini] gemini-2.0-flash rate limited (429), trying next model...
[Gemini] All models rate limited — wait or enable billing on Google AI Studio
[QuestSwipe] Gemini failed: rate_limited Gemini free-tier quota exceeded. Wait a few minutes or check https://ai.google.dev/gemini-api/docs/rate-limits
[DiscoverPage] No quest assignment: rate_limited
 GET /discover 200 in 4.0s (next.js: 86ms, application-code: 3.9s)
 GET /discover 200 in 73ms (next.js: 25ms, application-code: 48ms)
[QuestSwipe] No generated quest — calling Gemini for user: e446e9f5-7377-4a92-833f-015a5721c4a0
[QuestSwipe] Generating quest with context: { hobbyCount: 39, level: 1, historyCount: 17, rejectedCount: 17 }
[Gemini] generateQuest start {
  apiKeyConfigured: true,
  hobbiesInPrompt: [ 'Fiction', 'Film Photography', 'Filmmaking', 'Finance', 'Fishing' ],
  totalHobbies: 39,
  level: 1,
  hasLocation: true
}
[Gemini] Trying model: gemini-2.0-flash-lite
[Gemini] gemini-2.0-flash-lite rate limited (429), trying next model...
[Gemini] Trying model: gemini-1.5-flash-8b
[Gemini] gemini-1.5-flash-8b failed: 404 {
  "error": {
    "code": 404,
    "message": "models/gemini-1.5-flash-8b is not found for API version v1beta, or is not supported for generateContent. Call ModelService.ListModels to see the list of available models and their supported methods.",
    "status": "NOT_FOUND"
  }
}

[Gemini] Trying model: gemini-1.5-flash
[Gemini] gemini-1.5-flash failed: 404 {
  "error": {
    "code": 404,
    "message": "models/gemini-1.5-flash is not found for API version v1beta, or is not supported for generateContent. Call ModelService.ListModels to see the list of available models and their supported methods.",
    "status": "NOT_FOUND"
  }
}

[Gemini] Trying model: gemini-2.0-flash
[Gemini] gemini-2.0-flash rate limited (429), trying next model...
[Gemini] All models rate limited — wait or enable billing on Google AI Studio
[QuestSwipe] Gemini failed: rate_limited Gemini free-tier quota exceeded. Wait a few minutes or check https://ai.google.dev/gemini-api/docs/rate-limits
[DiscoverPage] No quest assignment: rate_limited
 GET /discover 200 in 3.7s (next.js: 14ms, application-code: 3.7s)
 GET /discover 200 in 20ms (next.js: 6ms, application-code: 15ms)
[QuestSwipe] No generated quest — calling Gemini for user: e446e9f5-7377-4a92-833f-015a5721c4a0
[QuestSwipe] Generating quest with context: { hobbyCount: 39, level: 1, historyCount: 17, rejectedCount: 17 }
[Gemini] generateQuest start {
  apiKeyConfigured: true,
  hobbiesInPrompt: [ 'Fiction', 'Film Photography', 'Filmmaking', 'Finance', 'Fishing' ],
  totalHobbies: 39,
  level: 1,
  hasLocation: true
}
[Gemini] Trying model: gemini-2.0-flash-lite
[Gemini] gemini-2.0-flash-lite rate limited (429), trying next model...
[Gemini] Trying model: gemini-1.5-flash-8b
[Gemini] gemini-1.5-flash-8b failed: 404 {
  "error": {
    "code": 404,
    "message": "models/gemini-1.5-flash-8b is not found for API version v1beta, or is not supported for generateContent. Call ModelService.ListModels to see the list of available models and their supported methods.",
    "status": "NOT_FOUND"
  }
}

[Gemini] Trying model: gemini-1.5-flash
[Gemini] gemini-1.5-flash failed: 404 {
  "error": {
    "code": 404,
    "message": "models/gemini-1.5-flash is not found for API version v1beta, or is not supported for generateContent. Call ModelService.ListModels to see the list of available models and their supported methods.",
    "status": "NOT_FOUND"
  }
}

[Gemini] Trying model: gemini-2.0-flash
[Gemini] gemini-2.0-flash rate limited (429), trying next model...
[Gemini] All models rate limited — wait or enable billing on Google AI Studio
[QuestSwipe] Gemini failed: rate_limited Gemini free-tier quota exceeded. Wait a few minutes or check https://ai.google.dev/gemini-api/docs/rate-limits
[DiscoverPage] No quest assignment: rate_limited
 GET /discover 200 in 3.2s (next.js: 6ms, application-code: 3.2s)
[QuestSwipe] No generated quest — calling Gemini for user: e446e9f5-7377-4a92-833f-015a5721c4a0
[QuestSwipe] Generating quest with context: { hobbyCount: 39, level: 1, historyCount: 17, rejectedCount: 17 }
[Gemini] generateQuest start {
  apiKeyConfigured: true,
  hobbiesInPrompt: [ 'Fiction', 'Film Photography', 'Filmmaking', 'Finance', 'Fishing' ],
  totalHobbies: 39,
  level: 1,
  hasLocation: true
}
[Gemini] Trying model: gemini-2.0-flash-lite
[Gemini] gemini-2.0-flash-lite rate limited (429), trying next model...
[Gemini] Trying model: gemini-1.5-flash-8b
[Gemini] gemini-1.5-flash-8b failed: 404 {
  "error": {
    "code": 404,
    "message": "models/gemini-1.5-flash-8b is not found for API version v1beta, or is not supported for generateContent. Call ModelService.ListModels to see the list of available models and their supported methods.",
    "status": "NOT_FOUND"
  }
}

[Gemini] Trying model: gemini-1.5-flash
[Gemini] gemini-1.5-flash failed: 404 {
  "error": {
    "code": 404,
    "message": "models/gemini-1.5-flash is not found for API version v1beta, or is not supported for generateContent. Call ModelService.ListModels to see the list of available models and their supported methods.",
    "status": "NOT_FOUND"
  }
}

[Gemini] Trying model: gemini-2.0-flash
[Gemini] gemini-2.0-flash rate limited (429), trying next model...
[Gemini] All models rate limited — wait or enable billing on Google AI Studio
[QuestSwipe] Gemini failed: rate_limited Gemini free-tier quota exceeded. Wait a few minutes or check https://ai.google.dev/gemini-api/docs/rate-limits
[DiscoverPage] No quest assignment: rate_limited
 GET /discover 200 in 5.0s (next.js: 12ms, application-code: 5.0s)
✓ Compiled in 601ms
[QuestSwipe] No generated quest — calling Gemini for user: e446e9f5-7377-4a92-833f-015a5721c4a0
[QuestSwipe] Generating quest with context: { hobbyCount: 39, level: 1, historyCount: 17, rejectedCount: 17 }
[Gemini] generateQuest start {
  apiKeyConfigured: true,
  hobbiesInPrompt: [ 'Fiction', 'Film Photography', 'Filmmaking', 'Finance', 'Fishing' ],
  totalHobbies: 39,
  level: 1,
  hasLocation: true
}
[Gemini] Trying model: gemini-2.0-flash-lite
[Gemini] gemini-2.0-flash-lite rate limited (429), trying next model...
[Gemini] Trying model: gemini-1.5-flash-8b
[Gemini] gemini-1.5-flash-8b failed: 404 {
  "error": {
    "code": 404,
    "message": "models/gemini-1.5-flash-8b is not found for API version v1beta, or is not supported for generateContent. Call ModelService.ListModels to see the list of available models and their supported methods.",
    "status": "NOT_FOUND"
  }
}

[Gemini] Trying model: gemini-1.5-flash
 GET /discover 200 in 2.6s (next.js: 125ms, application-code: 2.5s)
[Gemini] gemini-1.5-flash failed: 404 {
  "error": {
    "code": 404,
    "message": "models/gemini-1.5-flash is not found for API version v1beta, or is not supported for generateContent. Call ModelService.ListModels to see the list of available models and their supported methods.",
    "status": "NOT_FOUND"
  }
}

[Gemini] Trying model: gemini-2.0-flash
[Gemini] gemini-2.0-flash rate limited (429), trying next model...
[Gemini] All models rate limited — wait or enable billing on Google AI Studio
[QuestSwipe] Gemini failed: rate_limited Gemini free-tier quota exceeded. Wait a few minutes or check https://ai.google.dev/gemini-api/docs/rate-limits
[DiscoverPage] No quest assignment: rate_limited
 GET /discover 200 in 1680ms (next.js: 8ms, application-code: 1672ms)
[QuestSwipe] No generated quest — calling Gemini for user: e446e9f5-7377-4a92-833f-015a5721c4a0
[QuestSwipe] Generating quest with context: { hobbyCount: 39, level: 1, historyCount: 17, rejectedCount: 17 }
[Gemini] generateQuest start {
  apiKeyConfigured: true,
  hobbiesInPrompt: [ 'Fiction', 'Film Photography', 'Filmmaking', 'Finance', 'Fishing' ],
  totalHobbies: 39,
  level: 1,
  hasLocation: true
}
[Gemini] Trying model: gemini-2.0-flash-lite
[Gemini] gemini-2.0-flash-lite rate limited (429), trying next model...
[Gemini] Trying model: gemini-1.5-flash-8b
[Gemini] gemini-1.5-flash-8b failed: 404 {
  "error": {
    "code": 404,
    "message": "models/gemini-1.5-flash-8b is not found for API version v1beta, or is not supported for generateContent. Call ModelService.ListModels to see the list of available models and their supported methods.",
    "status": "NOT_FOUND"
  }
}

[Gemini] Trying model: gemini-1.5-flash
[Gemini] gemini-1.5-flash failed: 404 {
  "error": {
    "code": 404,
    "message": "models/gemini-1.5-flash is not found for API version v1beta, or is not supported for generateContent. Call ModelService.ListModels to see the list of available models and their supported methods.",
    "status": "NOT_FOUND"
  }
}

[Gemini] Trying model: gemini-2.0-flash
[QuestSwipe] Joining in-flight discovery request for user: e446e9f5-7377-4a92-833f-015a5721c4a0
[Gemini] gemini-2.0-flash rate limited (429), trying next model...
[Gemini] All models rate limited — wait or enable billing on Google AI Studio
[QuestSwipe] Gemini failed: rate_limited Gemini free-tier quota exceeded. Wait a few minutes or check https://ai.google.dev/gemini-api/docs/rate-limits
[DiscoverPage] No quest assignment: rate_limited
[DiscoverPage] No quest assignment: rate_limited
 GET /discover 200 in 1205ms (next.js: 7ms, application-code: 1198ms)
 GET /profile 200 in 2.5s (next.js: 92ms, application-code: 2.4s)
 GET / 200 in 119ms (next.js: 46ms, application-code: 73ms)
 POST /profile 303 in 4.4s (next.js: 5ms, application-code: 4.4s)
  └─ ƒ signOutAction() in 4182ms src/app/actions/auth.ts
 POST / 303 in 39ms (next.js: 5ms, application-code: 34ms)
  └─ ƒ signInWithGoogle() in 21ms src/app/actions/auth.ts
 GET /profile 200 in 13.8s (next.js: 5ms, application-code: 13.8s)
 GET /auth/callback?code=a8672319-8673-4215-9898-aa2011554bce 307 in 1568ms (next.js: 408ms, application-code: 1160ms)
[QuestSwipe] Serving existing generated quest: 80fbc65c-11b5-4940-ab7f-1b660ff5053d
 GET /discover 200 in 2.8s (next.js: 19ms, application-code: 2.8s)
[QuestSwipe] swipeLeftAction 80fbc65c-11b5-4940-ab7f-1b660ff5053d
[QuestSwipe] swipeQuest {
  userQuestId: '80fbc65c-11b5-4940-ab7f-1b660ff5053d',
  direction: 'left',
  userId: 'b7b20619-31cb-4524-9abf-e2fd563fee62'
}
[QuestSwipe] swipeQuest OK: 80fbc65c-11b5-4940-ab7f-1b660ff5053d -> rejected
[QuestSwipe] No generated quest — calling Gemini for user: b7b20619-31cb-4524-9abf-e2fd563fee62
[QuestSwipe] Generating quest with context: { hobbyCount: 6, level: 1, historyCount: 14, rejectedCount: 8 }
[Gemini] generateQuest start {
  apiKeyConfigured: true,
  hobbiesInPrompt: [ 'Fitness', 'Food', 'Hiking', 'Music', 'Art' ],
  totalHobbies: 6,
  level: 1,
  hasLocation: true
}
[Gemini] Trying model: gemini-2.0-flash-lite
[Gemini] gemini-2.0-flash-lite rate limited (429), trying next model...
[Gemini] Trying model: gemini-1.5-flash-8b
[Gemini] gemini-1.5-flash-8b failed: 404 {
  "error": {
    "code": 404,
    "message": "models/gemini-1.5-flash-8b is not found for API version v1beta, or is not supported for generateContent. Call ModelService.ListModels to see the list of available models and their supported methods.",
    "status": "NOT_FOUND"
  }
}

[Gemini] Trying model: gemini-1.5-flash
[Gemini] gemini-1.5-flash failed: 404 {
  "error": {
    "code": 404,
    "message": "models/gemini-1.5-flash is not found for API version v1beta, or is not supported for generateContent. Call ModelService.ListModels to see the list of available models and their supported methods.",
    "status": "NOT_FOUND"
  }
}

[Gemini] Trying model: gemini-2.0-flash
[Gemini] gemini-2.0-flash rate limited (429), trying next model...
[Gemini] All models rate limited — wait or enable billing on Google AI Studio
[QuestSwipe] Gemini failed: rate_limited Gemini free-tier quota exceeded. Wait a few minutes or check https://ai.google.dev/gemini-api/docs/rate-limits
[DiscoverPage] No quest assignment: rate_limited
 GET /discover 200 in 3.9s (next.js: 12ms, application-code: 3.9s)
 POST /discover 303 in 4.8s (next.js: 9ms, application-code: 4.8s)
  └─ ƒ swipeLeftAction("80fbc65c-11b5-4940-ab7f-1b660ff5053d") in 892ms src/app/actions/quests.ts
 GET /profile 200 in 1515ms (next.js: 4ms, application-code: 1511ms)
 GET /profile 200 in 8.3s (next.js: 5ms, application-code: 8.2s)
[QuestSwipe] No generated quest — calling Gemini for user: b7b20619-31cb-4524-9abf-e2fd563fee62
[QuestSwipe] Generating quest with context: { hobbyCount: 6, level: 1, historyCount: 14, rejectedCount: 8 }
[Gemini] generateQuest start {
  apiKeyConfigured: true,
  hobbiesInPrompt: [ 'Fitness', 'Food', 'Hiking', 'Music', 'Art' ],
  totalHobbies: 6,
  level: 1,
  hasLocation: true
}
[Gemini] Trying model: gemini-2.0-flash-lite
[Gemini] gemini-2.0-flash-lite rate limited (429), trying next model...
[Gemini] Trying model: gemini-1.5-flash-8b
[Gemini] gemini-1.5-flash-8b failed: 404 {
  "error": {
    "code": 404,
    "message": "models/gemini-1.5-flash-8b is not found for API version v1beta, or is not supported for generateContent. Call ModelService.ListModels to see the list of available models and their supported methods.",
    "status": "NOT_FOUND"
  }
}

[Gemini] Trying model: gemini-1.5-flash
[Gemini] gemini-1.5-flash failed: 404 {
  "error": {
    "code": 404,
    "message": "models/gemini-1.5-flash is not found for API version v1beta, or is not supported for generateContent. Call ModelService.ListModels to see the list of available models and their supported methods.",
    "status": "NOT_FOUND"
  }
}

[Gemini] Trying model: gemini-2.0-flash
[Gemini] gemini-2.0-flash rate limited (429), trying next model...
[Gemini] All models rate limited — wait or enable billing on Google AI Studio
[QuestSwipe] Gemini failed: rate_limited Gemini free-tier quota exceeded. Wait a few minutes or check https://ai.google.dev/gemini-api/docs/rate-limits
[DiscoverPage] No quest assignment: rate_limited
 GET /discover 200 in 5.1s (next.js: 5ms, application-code: 5.1s)
[QuestSwipe] No generated quest — calling Gemini for user: b7b20619-31cb-4524-9abf-e2fd563fee62
[QuestSwipe] Generating quest with context: { hobbyCount: 6, level: 1, historyCount: 14, rejectedCount: 8 }
[Gemini] generateQuest start {
  apiKeyConfigured: true,
  hobbiesInPrompt: [ 'Fitness', 'Food', 'Hiking', 'Music', 'Art' ],
  totalHobbies: 6,
  level: 1,
  hasLocation: true
}
[Gemini] Trying model: gemini-2.0-flash-lite
[Gemini] gemini-2.0-flash-lite rate limited (429), trying next model...
[Gemini] Trying model: gemini-1.5-flash-8b
[Gemini] gemini-1.5-flash-8b failed: 404 {
  "error": {
    "code": 404,
    "message": "models/gemini-1.5-flash-8b is not found for API version v1beta, or is not supported for generateContent. Call ModelService.ListModels to see the list of available models and their supported methods.",
    "status": "NOT_FOUND"
  }
}

[Gemini] Trying model: gemini-1.5-flash
[Gemini] gemini-1.5-flash failed: 404 {
  "error": {
    "code": 404,
    "message": "models/gemini-1.5-flash is not found for API version v1beta, or is not supported for generateContent. Call ModelService.ListModels to see the list of available models and their supported methods.",
    "status": "NOT_FOUND"
  }
}

[Gemini] Trying model: gemini-2.0-flash
[Gemini] gemini-2.0-flash rate limited (429), trying next model...
[Gemini] All models rate limited — wait or enable billing on Google AI Studio
[QuestSwipe] Gemini failed: rate_limited Gemini free-tier quota exceeded. Wait a few minutes or check https://ai.google.dev/gemini-api/docs/rate-limits
[DiscoverPage] No quest assignment: rate_limited
 GET /discover 200 in 3.3s (next.js: 4ms, application-code: 3.3s)
