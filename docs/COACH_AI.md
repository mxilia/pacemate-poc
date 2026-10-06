# Coach AI Integration

The main coach chat uses Groq through the top-level `groq/` integration folder.
Onboarding, nutrition processing, plan creation, run reviews, and partner suggestions
still use `src/services/coach-ai/mock/mock-ai-service.ts`.
The UI calls `aiService` from `src/services/coach-ai/coach-service.ts`, typed by the
`AIService` interface in `src/types/coach-ai.ts`. Shared request/response validation
lives in `src/features/running-coach/schema.ts`, independent of either provider.
See `docs/DEVELOPERS.md` for file ownership.

## Chat JSON

`buildCoachContext()` builds and validates a JSON-compatible snapshot containing:

- Version, generation time, and the runner's local timezone.
- Health, goals, ability, schedule, and partner preferences.
- Running plan and completed run history.
- Today's session, next session, logged macros, and recommended daily gram/calorie targets.
- Streak, weekly runs, weekly distance, longest distance, and goal percentage.
- Daily advice.

Each chat request is `{ context, messages }`. See
`docs/pacemate-coach-context.example.json` for a valid example request.
Messages use the standard `{ role: "user" | "assistant", content: "..." }` shape. The chat sends the most
recent 40 messages. The JSON download button in the coach panel exports the
current context and conversation as `pacemate-coach-context.json`.
Dashboard fixtures live in `src/services/coach-ai/mock/dashboard-data.json`. The mock service
turns relative day/month offsets into dated runs so the sample charts stay populated.
The JSON fixtures seed new users only. `src/services/database/runner-repository.ts` validates
and saves each user's data in localStorage under a normalized-email key.
Profile, onboarding progress, plan, run history, dated food logs, nutrition targets,
and the latest 100 coach messages survive refresh and logout. Restoring a user
does not re-seed their runs. Starting onboarding again preserves activity history.
Nutrition's sample consumed amounts apply only to their seed date; dated logs
contribute only to the current day's totals.

This is browser-local demo storage, not authentication or secure account isolation.
Saved records remain on this device, but sending a coach message shares selected
health/profile fields, training statistics, and recent messages with Groq. Names,
emails, raw run histories, meal entries, and partner preferences are excluded from
the automatic context. User-written chat messages may still contain sensitive data.
Use synthetic profiles for testing; a real app needs authenticated server storage
and appropriate consent for sharing health information.

The mock and UI validate requests with `coachRequestSchema` and responses with
`coachResponseSchema`. Expected response:

```json
{
  "version": "1.0",
  "message": {
    "role": "assistant",
    "content": "You have completed 2 of your 3 planned runs this week."
  },
  "suggestedReplies": ["This week", "My goal progress", "How to fuel?"]
}
```

## Nutrition JSON

The nutrition input calls `aiService.processNutrition({ context, message })`.
`nutritionRequestSchema` and `nutritionResponseSchema` validate both boundaries.
Successful responses have `{ version: "1.0", status: "logged", message, meal }`;
`meal` contains `name`, `type`, and numeric `carbs`, `protein`, `fat` in grams.
Ambiguous entries return `status: "needs_clarification"` and `meal: null`, without
changing totals. Requests include the same live coach context as the main chat.

Mock food values live in `src/services/coach-ai/mock/nutrition-data.json`. The deterministic
demo accepts explicit quantities such as `100g rice and 2 eggs` or `250ml milk`.
It is not a real food-recognition model and does not invent values for unsupported
foods. Estimates are added to today's consumed totals; daily recommendations stay
unchanged. Logs are saved per user in localStorage and included in coach
JSON exports. Replace `processNutrition` in the service adapter with a backend
implementation to support natural-language food recognition.

## Local Mock Database

`src/services/database/runner-repository.ts` validates and persists one record per normalized
email under the legacy `runnit-user:` key. Records contain user identity, profile,
onboarding answers and progress, training plan, partner recommendations and saved
invitations, completed runs with coach reviews, an unfinished run draft, dated
meal logs, nutrition targets, nutrition conversations, and coach conversations.
Old records gain defaults for new fields without losing existing history.
Unreadable records are not overwritten with demo fixtures.

The active-session key is separate: signing out removes the login but retains
the user's database record. Run drafts are restored paused; time while the app
is closed is not added to a run. Daily totals are derived from dated food logs
plus the original dated demo baseline, so a new day does not inherit yesterday's
intake. Progress and chart values are derived, not stored separately.

Open modals, loading flags, validation errors, and unsent input remain transient
UI state. JSON fixtures only seed a new record or supply mock AI responses;
localStorage is the source of saved user data. This is browser-local mock
persistence, not authentication or a secure store for production health data.

## Groq Chat

Set `GROQ_API_KEY` in `.env` or `.env.local` and restart the development server
after changing it. The key is read only on the server, never by browser code.

`src/services/api/coach.ts` sends compact JSON to the existing `POST /api/coach` route. The route
validates HTTP input and applies usage limits; `groq/groq-service.ts` calls Groq using `openai/gpt-oss-20b`, strict
JSON output, and a 1,024 completion-token cap. Requests have a 20-second provider
timeout and a 25-second browser timeout.

`src/features/running-coach/coach-context.ts` selects health, goal, ability, availability, a compact training plan,
today's session/macros/targets, and current progress from the live context derived
from localStorage. It sends up to eight recent messages, capped at 1,000 characters
each and 4,000 characters total. The compact context is inserted before conversation
messages on every request, including the first. The endpoint is stateless, so this
also keeps later replies aware of newly logged runs and meals without a stale snapshot.
The server cannot read browser localStorage directly.

Both input and output are validated. Provider failures show a retryable error;
there is no silent mock fallback. Chat saves conversation messages in localStorage
and retries without duplicating a failed user turn.

The endpoint rejects oversized bodies and cross-origin browser requests and limits
usage to six requests per minute and 100 per UTC day per server process. These
counters reset when the process restarts and are not shared across server instances.
Mock login is not server authentication: keep this POC local/private until real
authentication and durable usage limits are added before public deployment.

Run focused checks with:

```sh
node --conditions=react-server --import tsx --test groq/groq.test.ts src/services/coach-ai/mock/mock-ai-service.test.ts src/services/database/runner-repository.test.ts
```
