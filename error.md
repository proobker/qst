# Vercel Runtime Log

## Request
ID: cjl46-1780458787751-bcda727c10c1
Time: 2026-06-03T03:53:07.751Z
GET /discover → 500
Host: qst-kappa.vercel.app
Duration: 2515ms
Cache: MISS
Region: bom1
User Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
Referer: https://qst-kappa.vercel.app/discover

## Lifecycle

### Function
Status: 500
Duration: 1674ms
Runtime: nodejs24.x
Memory: 325MB / 2048MB
Region: iad1

### Middleware
Status: 200
Route: _middleware
Duration: 726ms
Runtime: edge
Memory: 279MB / 2048MB
Region: bom1

## External APIs (11)
GET zumlzeeqjknhbvouqhse.supabase.co ×6 → 200 254-708ms
HEAD zumlzeeqjknhbvouqhse.supabase.co/rest/v1/notifications → 200 261ms
GET zumlzeeqjknhbvouqhse.supabase.co/rest/v1/notifications → 200 251ms
HEAD zumlzeeqjknhbvouqhse.supabase.co/rest/v1/friendships → 200 242ms
PATCH zumlzeeqjknhbvouqhse.supabase.co/rest/v1/user_quests → 204 247ms
GET zumlzeeqjknhbvouqhse.supabase.co/rest/v1/user_quests → 200 243ms

## Deployment
ID: dpl_ddTodhabyfJsMGKZXhAgcSv8WCKY
Environment: production
Branch: master