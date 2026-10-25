> This original audit predates the meal/chat fixes and Progress feature. For the current delivered experience and the revised finish order, start with [PRODUCT_VISION.md](PRODUCT_VISION.md) and [ARCHITECTURE.md](ARCHITECTURE.md). The baseline issues below are historical, not all still open.

# AI Guruji: final project polish

Review date: 25 October 2026. This is a prioritized recommendation list based on the current source and architecture guide. Items below are proposed work, except the light-theme refinement, which has been implemented. No new backend feature, deployment, or CI setup was performed as part of this review.

The strongest next step is to make the existing product dependable through a complete demonstration. A recruiter should be able to understand the problem, try the product, see consistent behavior, and inspect evidence of the engineering decisions.

## Suggested finish order

### 1. Make saved state dependable

Current behavior: MongoDB stores profiles and generated plans, while the dashboard reads its working state from localStorage. Chat, manual logs, and completion tracking have no current server write flow. ChatHistory is read but never written. Another browser does not restore the same working history.

Work: persist daily tracking, manual entries, chat messages, and plan edits; hydrate from authenticated APIs; define how old local data is merged. Cache can remain a performance layer. Use token UID for ownership and retain item IDs during reconciliation.

Acceptance: log a meal, finish an exercise, and send a chat message; sign out and log in in a second browser; the same data and totals appear. A different user cannot read it. Reloading does not create duplicate plans.

Start with: Dashboard.jsx, backendService.js, relevant models/controllers, chatController.js. Correct workout dates before exposing server history.

### 2. Make AI output trustworthy and failures visible

Current behavior: the daily diet prompt omits dietaryPreference and most saved macro/fitness details. JSON syntax is parsed without full domain validation. Provider failures return static fallback plans as HTTP success; those plans can be cached and saved like generated plans. The fallback diet declares 2100 calories while its meals sum to 1600.

Work: include relevant saved preferences, validate generated structures and numeric totals, and make allergies/diet constraints explicit. Introduce a machine-readable generation status. Show a clear retry state when generation fails and avoid presenting static examples as personalized results. Add a deliberate regenerate action with defined behavior for already logged meals/exercises.

Acceptance: test vegetarian/vegan and allergy profiles, malformed AI output, model errors, missing keys, and rate limits. A failed provider call never masquerades as a personalized success. The displayed daily total agrees with its meals. Keep nutrition estimates appropriately labeled.

Start with: deepseekService.js, diet/workout controllers and models, Dashboard.jsx. The conversational tone policy is already improved and remains in coachPrompt.js.

### 3. Finish plan editing and date correctness

Current behavior: meal swaps update only the browser cache and do not recompute daily target totals. Weekly workout documents normally share the generation-day date in MongoDB, while the browser assigns sequential dates. Profile edits leave previous cached plans in place. UTC day keys differ from the Indian calendar date early in the morning.

Work: save swaps to the owned plan, reconcile totals, store each workout's correct date, define the application's day/timezone policy, and handle profile-driven regeneration explicitly. Prevent duplicate concurrent generation. Decide how prior tracking survives a regenerated plan.

Acceptance: swap a meal and reload; the change remains and totals agree. A seven-day workout response and MongoDB records have matching dates. Changing dietary restrictions does not silently keep an incompatible old plan. Test around midnight/05:30 IST.

Start with: dietController.js, workoutController.js, Dashboard.jsx, plan schemas.

### 4. Make the project effortless to evaluate

Work: provide a stable deployment URL and an obvious, clearly labeled sample-data demo that can be explored without creating an account. Keep the demo isolated from real users and distinguish its sample plans from live AI generation. Record a short walkthrough covering onboarding, nutrition, training, tracking, and coach chat.

Acceptance: a visitor can understand the value and navigate the main experience immediately. The demo does not depend on a live model call for its initial render and cannot mutate real accounts. A documented authenticated flow remains available for an actual functional evaluation.

The temporary UI-review fixtures used during development were removed; they are not a delivered demo mode. Build a maintained, intentional demo if selecting this item.

### 5. Add visible engineering evidence

Current behavior: no committed automated test harness or CI workflow exists; package-lock.json is ignored. The README still contains placeholder clone/support values, nonexistent /current routes, an outdated client Gemini setup guide, and claims stronger than the implemented validation. It references a LICENSE file that is absent.

Work: add focused tests for UID ownership, profile validation, plan generation/error paths, swaps/totals, date assignment, and daily tracking; add one browser smoke journey; run tests and the frontend build in CI. Track dependency lockfiles and document a supported Node version. Rewrite the README as a concise project case study: problem, users, live demo, screenshots, actual features, architecture, setup, tradeoffs, limitations, and your contribution. Choose and include the intended license before advertising it.

Acceptance: a fresh checkout has a reproducible install and passing documented commands. The README describes what actually works and links to a demo and architecture. CI establishes that the main journey still works after a change.

Start with: both package.json files, .gitignore, README.md, client/README.md, then narrowly scoped test/CI configuration.

### 6. Close the final account and operational edges

Work: add password reset to the existing email sign-in flow; give actionable handling for expired sessions, offline state, backend unavailability, and AI timeouts. Validate request bodies on the server, set explicit ownership fields after untrusted generated data, protect expensive AI endpoints from abuse, and avoid logging fitness profiles/model responses unnecessarily. Wait for required startup dependencies and expose an appropriate readiness check.

Acceptance: the app fails clearly and recoverably when a dependency is unavailable. A user can recover access and retry. Invalid/unauthorized requests are rejected consistently, and logs do not expose credentials or personal fitness details.

These are finishing the current product boundaries. Scope them to the demonstration and intended deployment rather than adding unrelated new feature areas.

## What the final presentation should show

- A clear problem: helping Indian users navigate everyday food and movement choices.
- One complete journey: sign in → personalize → generate → track → ask a question → return to saved progress.
- Three or four annotated screenshots and a short product walkthrough.
- An architecture diagram and an explanation of Firebase identity, MongoDB ownership, AI provider integration, and client state.
- Evidence that you can identify and resolve failure modes, with tests and honest limitations.
- A short account of your own implementation decisions and lessons learned. Avoid invented usage, accuracy, or outcome metrics.

## Light-theme refinement completed in this pass

Replaced pure-white cards with cream, moved the canvas to warm stone, used a sage sidebar/header, and introduced a dark forest-green dashboard hero. Lime actions remain, with deeper green text and clearer layers. Dark-theme colors retain their original values.

The source is client/src/index.css. Main light text/control color pairs were measured for contrast; the five checked pairs exceed 4.5:1. This is a targeted color check, not a complete accessibility certification. Browser screenshots use synthetic review data, with no real account or API calls.
