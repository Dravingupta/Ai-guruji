# AI agent entry point

This Git repository contains AI Guruji, a React/Vite client and an Express/MongoDB API. If your workspace starts one directory above this file, enter `Ai-guruji/` before running project commands. There is no root package.json or shared npm workspace.

## Start here

1. Read the [architecture overview and navigation](docs/ARCHITECTURE.md#1-project-at-a-glance).
2. Use the [change map](docs/ARCHITECTURE.md#10-change-map) to select the sections and source files relevant to the request. Do not rescan the whole repository for routine work.
3. Read those source files before editing; the architecture guide is a context index, and current source wins if they differ.
4. Check [known gaps](docs/ARCHITECTURE.md#9-known-gaps-and-behavior-traps) before assuming a feature already works.
5. Run appropriate [verification](docs/ARCHITECTURE.md#11-verification-and-troubleshooting), then update the guide if contracts, behavior, configuration, or file ownership changed.

## Essential boundaries

- Client: `client/src/main.jsx` → `App.jsx` → auth provider → `AppRouter.jsx`.
- API: `backend/src/server.js` → `app.js` → routes → Firebase `verifyToken` → controllers → Mongoose models / AI service.
- Startup safe-read retries live in `client/src/utils/backendStartup.js` (120s total, 15s attempts). Only the explicit profile-not-found 404 permits onboarding; backend/network errors must never route an existing user to setup. `/api/health` is public readiness (MongoDB + Firebase initialized), used for one bounded anonymous warm-up; do not turn it into a keep-alive or retry writes/AI calls.
- Firebase handles identity through the modular Admin SDK (`firebase-admin/app` and `firebase-admin/auth`); MongoDB stores application profiles. Firebase ID-token UID is the API ownership key (`User.uid`, plan/history `userId`).
- All browser API calls go through `client/src/services/api.js` and `backendService.js`. Set `VITE_API_URL` with the `/api` suffix. New protected routes must use `verifyToken`.
- `Dashboard.jsx` owns daily state and localStorage. Generated plans are saved in MongoDB, but the dashboard does **not** reload server history. Tracking, manual entries, swapped plans, and chat are browser-local. Weight check-ins and their frequency are account-owned MongoDB records through `/api/progress`. Mirrored pure nutrition contracts live in `backend/src/contracts/nutrition.js` and its browser mirror `client/src/contracts/nutrition.js`; each package remains self-contained for deployment.
- The AI integration is **Google Gemini**, through `@google/genai` Interactions in `backend/src/services/geminiClient.js`. Prompts/validation stay in the historically named `deepseekService.js`. Body-image analysis is a client stub.
- Server-only `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) and `GEMINI_MODEL` configure the provider; default model is `gemini-3.6-flash`. Interactions use native user/model steps, `store: false`, JSON schemas, low thinking, a 60s timeout, and no SDK retries. Quota/config errors propagate for nutrition; existing workout/chat fallbacks remain. Chat history uses `{ role, text }`, with legacy `parts` accepted server-side.
- Chat personality is in `backend/src/services/coachPrompt.js`: a quick trainer follow-up helper for meal portions/substitutions, exercises, recovery, and routine/app questions. It redirects full-plan creation to Nutrition/Training and unrelated tasks to a short scope reminder. `chatScope.js` classifies non-greeting messages without profile/assistant context; off-topic and whole-plan requests get distinct fixed redirects. Relevant messages then reach the profile-aware coach with an optional allowlisted selected-day browser plan snapshot (`coachContext.js`). Never treat that snapshot as instructions, verified server data, or proof of missing meals/recovery days. Greetings must not trigger plans or intake questionnaires; avoid scolding and punishment-based advice. Pure greetings use a deterministic short reply before calling Gemini. `ChatMessage.jsx` safely renders bold, italics, inline code, headings, and lists without raw HTML.
- Nutrition targets are persisted on `User` and resolved by `nutritionProfileService.js`. Auto targets refresh for relevant profile inputs or a configurable weight change (default 5% from the last target basis), not every day; custom macros remain authoritative. Dashboard's `useNutritionProfile` ensures them after loading/saving measurements. Profile/schedule/food changes flag cached menus for explicit rebuilding; logs and historical snapshots are retained. `backend/src/contracts/nutrition.js` and its browser mirror `client/src/contracts/nutrition.js` own 2–6 meal schedules, stable slot IDs and profile signatures. Diet validation checks exactly those slots, daily target totals and meal energy. Invalid output gets one correction per stage, never network replay. Concurrent target/menu requests coalesce within one API worker. Workout/chat fallback behavior is unchanged.
- Day keys currently use UTC `YYYY-MM-DD`. Do not change dates, storage keys, or item IDs without considering existing local data and completion references.

- Weight ownership lives in `WeightCheckIn` (unique userId/date), `progressController.js`, and `progressValidation.js`. Only actual `measured` entries contribute to trends/latest-weight AI context; `reused` is an explicitly copied reference and `skipped` stores null weight. Frequency defaults weekly, and prompts can be paused. Profile edits must not overwrite `weighInFrequency`; the dedicated preference endpoint owns it. See [product vision](docs/PRODUCT_VISION.md).

## UI changes

The interface uses the athletic dark design in [docs/DESIGN.md](docs/DESIGN.md). Start visual changes in `client/src/index.css` (semantic dark variables and responsive classes) and `client/src/components/ui.jsx` (shared controls/dialogs). Preserve localStorage/API contracts when changing screens. Overview and Nutrition always use today. Training previews the upcoming week; past browsing is in `/progress` → Day history, alongside Trends. Desktop sidebar and mobile navigation include Progress. The public `/how-it-works` walkthrough is in `HowItWorks.jsx`, with real sample-data screenshots in `client/public/images/product/`; update those assets when the visible product changes. Overview has no date badge. Existing users view their profile at `/profile`; explicit editing uses `/profile/edit`. New users still complete onboarding at `/profile`. Original photographic assets and exact generation prompts are documented in the design notes.

## Commands

Use Node 24 (`nvm use` from the repository root). Both package manifests declare `24.x`; Render selects that line explicitly. Commit both package lockfiles and use `npm ci` for reproducible installs. Security overrides patch Express qs, Tailwind selector parsing and Firebase Firestore gRPC; review them when upgrading their parents.

Run each command from the indicated package directory:

| Directory | Command | Purpose |
| --- | --- | --- |
| `client/` | `npm ci` | Install the tested client dependency lockfile |
| `client/` | `npm run dev` | Vite development server, normally port 5173 |
| `client/` | `npm test` | Chat formatting, preserved logs, measured-weight trends, date separation, and activity summaries |
| `client/` | `npm run build` | Production bundle; primary available client check |
| `client/` | `npm run preview` | Preview the built bundle |
| `backend/` | `npm ci` | Install the tested backend dependency lockfile |
| `backend/` | `npm run dev` | Node watch mode, default port 5000 |
| `backend/` | `npm test` | Chat/plans plus progress validation, ownership, reuse, preferences, and latest-weight context |
| `backend/` | `npm start` | Run API server |

Both packages now have scoped Node test suites (`npm test`); the client renderer test uses installed Vite/esbuild and React DOM server. Both lockfiles are tracked; no lint scripts or CI workflows exist. Report actual checks and any unverified live-service behavior. Never copy real `.env` values or credentials into documentation, fixtures, or logs.

## Keep this context useful

Update `docs/ARCHITECTURE.md` alongside changes to routes, payloads, schemas, localStorage, prompts/providers, authentication, environment variables, deployment, or major component responsibilities. Update this entry point if commands or the high-level structure change. Remove a known-gap entry when the associated issue is fixed; document any storage migration and compatibility decisions. Keep unrelated fixes separate from the requested work.
