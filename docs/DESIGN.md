# AI Guruji interface design

Redesign: 25 October 2026. User-selected direction: **athletic dark — graphite, lime, bold typography**.

## Visual system

- Dark background `#111410`, sidebar `#141713`, surfaces `#1a1e18`, borders `#2e3528`, primary text `#f0f3e9`, muted text `#9ba593`.
- Lime `#bdf366` for primary actions, active navigation, completion, and focused controls. Orange is a secondary movement accent.
- DM Sans for interface text; Barlow Condensed for large athletic display headlines. Both use Google Fonts with local sans-serif fallbacks.
- Shared semantic CSS variables and screen classes are in `client/src/index.css`. Light appearance uses the same component structure with a complete alternate palette.
- Dark is the default. Saved light preference is preserved; toggles remain available in desktop and mobile dashboards.
- Main responsive breakpoints: 1150, 900, 700, and 380 pixels. Mobile navigation accounts for the safe-area inset. Motion respects prefers-reduced-motion.

## Light-theme finish

Reworked on 25 October 2026 after the user rejected the mint/pastel version. Light mode now has a consistent warm fitness identity: sand canvas (`#e9e2d6`), linen sidebar (`#ded6c7`), warm paper cards (`#f4ede1`), charcoal-olive text (`#292c24`), and secondary text (`#58564a`). Terracotta (`#b5472b`, light action text `#fff5e9`) identifies actions; dark rust (`#903923`) identifies links/focus. Deep olive (`#485239`) anchors the checklist and coach panel. The Training session hero uses olive with cream text. The dark theme tokens are unchanged.

Overview has a larger editorial headline and an arched crop of the existing athlete image on desktop. Phones use the movement mark to keep the hero compact and its text unobstructed. Cards share consistent warm neutral surfaces, subtle shadows and borders; thin accents distinguish energy metrics, while olive completion states identify logged meals/exercises. Nutrition, Training, Progress, Profile, coach, dialogs, landing, and the public walkthrough inherit the same system. The walkthrough content/layout is retained, with fresh app screenshots.

Public landing and walkthrough have appearance controls; the saved preference still uses the shared theme provider. Light-specific layout/style rules are centralized under the sand/clay/olive comment in `index.css` and scoped to `:root:not(.dark)`. Avoid introducing unrelated pastel card fills or hardcoded white panels. Checked primary/secondary text pairs on the shared light surfaces exceed 4.5:1 contrast; the primary action pair is 5:1. Olive panels use explicit foreground colors rather than inheriting the body ink.

## Screens and ownership

| Area | Implementation |
| --- | --- |
| Landing | `LandingPage.jsx`: athletic photographic hero, real feature descriptions, three feature panels, working auth, theme toggle, and public walkthrough links |
| Authentication | `Auth.jsx`: split photographic layout on desktop, single column on mobile, Google/email sign-in and signup, show password, loading and inline errors |
| Profile editor | `ProfileForm.jsx`: three-step sidebar/progress layout, inline validation, selectable goals/diet/allergies, macros, optional body type/notes, saving/cancel states |
| Profile overview | `ProfileOverview.jsx`: identity, read-only measurements/preferences/goals, local activity summary, explicit Edit button |
| How it works | `HowItWorks.jsx`: public recruiter-friendly story, setup-to-progress journey, four actual screenshots with accessible enlargement, focused-coach example, implementation decisions and storage disclosure |
| Overview | `Dashboard.jsx`: greeting without a date badge, quick log action, energy/checklist metrics, meal/session previews, real seven-day calorie bars, coach entry |
| Nutrition | `DietCard.jsx`: photographic daily summary with macro totals, ordered meal lineup and missing-slot recovery, numbered meal cards with macro bars, completion, swaps, recipes, food journal |
| Training | `WorkoutCard.jsx`: photographic session summary and progress ring, movement icon tiles, exercise completion, expandable form cues/warmup/cooldown, extra movement log; Dashboard owns saved-data week strip |
| Coach | `ChatCoach.jsx`: conversational message layout, safe basic rich text via ChatMessage, typing state, horizontally scrolling mobile suggestions, textarea, Enter/Shift+Enter support |
| Shared controls | `ui.jsx`: brand, buttons, fields, choices, tags, headings, coach mark, links, native dialog |

All component paths above are under `client/src/components/`. Route/profile integration lives in `client/src/AppRouter.jsx`.

The redesign preserves existing route paths, Firebase login, API helpers, stored plan shapes, and all UID/date localStorage key patterns. Dashboard sections are kept in location state on `/dashboard`; `/profile` opens the profile overview and `/profile/edit` opens editing. Missing-profile onboarding stays at `/profile`. The Overview is the new initial section. The charts and totals derive from saved tracking; no demonstration values are embedded in production screens.

Profile saves now include Firebase email, use Firebase displayName as an optional initial name, disable duplicate submission while saving, and show API errors inline. The unimplemented body-photo upload is no longer presented as an available feature; existing bodyAnalysis data remains preserved. Body type can still be selected manually.

The manual-workout add flow now computes totals from the newly extended array before saving, fixing the previous immediate/weekly burn mismatch. Overview completion counts include both planned and manually logged items; workout-session progress counts only exercises in the plan.

## Accessibility and interaction

Controls have accessible names, visible focus, form labels, and disabled/loading states. Completion and preference buttons expose aria-pressed. Modal dialogs use the native dialog element for focus containment, Escape dismissal, and background inertness; focus moves to the first form field and returns to the opener. Dialogs scroll within the viewport. Chat uses a conversation log and an announced loading state. Body text preserves paragraph breaks and wraps long messages.

The dashboard uses inline error banners for generation and swap failures. Profile-save errors are also inline. Existing cached messages and plans are retained.

## Original image assets

Generated using the **built-in image_gen tool** via the imagegen skill, then copied into the project. These depict illustrative subjects, not actual application users. No remote stock-image host is needed at runtime.

### Athlete

Saved path: `client/public/images/athlete.png`.

Exact generation prompt:

> Use case: photorealistic-natural. Asset type: hero photograph for an athletic dark fitness app website. Premium monochrome sports editorial photography, a fit Indian female athlete in her late 20s with a dark ponytail, charcoal sleeveless training top and black training leggings, in a natural strong ready stance holding a kettlebell at hip level with both hands. Three-quarter body view from head to knees, face calm and focused looking slightly toward the left, authentic attainable athletic physique. Graphite studio background, dramatic directional silver rim lighting, sculptural highlights, deep shadows, subtle film grain. Strong centered-right composition with space around subject, portrait orientation. Sophisticated Nike-style performance editorial image, realistic anatomy and kettlebell grip. Strictly black-and-white grayscale photography. No logos, no typography, no text, no graphics, no watermark.

### Food

Saved path: `client/public/images/food.png`.

Exact generation prompt:

> Use case: photorealistic-natural. Asset type: premium Indian fitness and nutrition website editorial photograph. Create a beautiful, highly realistic overhead food photograph of a nourishing Indian vegetarian lunch arranged naturally on a large pale ivory ceramic plate: dal in a little ceramic bowl, fluffy rice, two folded rotis, roasted vegetables and fresh cucumber salad, with coriander and a small lime. Pale warm taupe tabletop, a softly crumpled terracotta cloth in one corner, warm directional sunlight and tactile soft shadows. Restrained beautiful food editorial styling, contemporary Indian wellness magazine feel, rich natural orange and olive green food tones, no excessive props. Square composition, food centered, enough breathing room around the plate for flexible crop. No text, no labels, no graphics, no people, no hands, no watermark. This is a photographic food asset, not a UI screenshot.

The food asset was generated while the optional direction question was pending; its natural food colors provide contrast within the selected dark interface. The final athletic direction uses the monochrome athlete as its primary image.

## Verification

- Production frontend bundle builds using the existing dependencies.
- Browser review at desktop 1280 px and mobile approximately 369 px: landing, login, overview, nutrition, training, coach, and profile setup.
- Isolated synthetic profile/plan data was used to review authenticated component layouts without changing a real account or invoking generation. Temporary review entry files are removed before delivery.
- Checked food logging (150 kcal increments), exercise completion, manual movement (144 kcal plus a 60 kcal exercise gives 204 kcal in daily and weekly displays), overview/checklist updates, modal opening and Escape dismissal, focus behavior, profile validation, all three profile steps and save callback, dark/light appearances, mobile navigation, and horizontal page overflow.
- New UI components were formatted with an identical-compiled-JavaScript check to preserve their behavior.
- Live Firebase sign-in, profile persistence, meal swaps/generation, and AI responses were not re-exercised during this visual redesign; those service contracts remain unchanged. Earlier service verification is recorded in ARCHITECTURE.md.

Screenshots in `docs/screenshots/` show the actual rendered redesign. Authenticated-layout screenshots use isolated synthetic data.


## Daily-plan and profile refinement

Interface body copy now uses 14–15 px with secondary labels generally 12–13 px. Dense navigation labels remain smaller on phones. Headings use full phone width; date controls wrap onto their own row. Screen changes scroll to the top. Nutrition adds a decorative generic food photo (not an exact preview of each generated recipe), macro energy bars, clear Log meal/Logged actions, and four expected meal slots. Extra legacy meals remain visible. Training movement icons identify broad categories; they are decorative and do not replace the written form guidance.

Existing profiles are read-only until Edit profile is selected. The activity panel is explicitly a snapshot from this device; it does not imply cross-device history sync. Chat safely interprets basic bold/list formatting in existing saved replies, with no raw HTML.

Refinement verification: seven Node regression tests across the two packages, production build, and isolated synthetic desktop (1280 px) / phone (369 px) review. Checked logging, recipes, missing saved dinner, exercise completion/progress, form disclosure, profile view/edit/cancel, light/dark profile, and mobile navigation/layout. Saved previews: `screenshots/profile-refined-desktop.png`, `profile-refined-light.png`, `profile-refined-mobile.png`, `training-refined-desktop.png`, `training-refined-mobile.png`, `nutrition-refined-desktop.png`, `nutrition-refined-light.png`, and `nutrition-refined-mobile.png`. Temporary fixtures are removed before delivery. No authenticated profile/database writes or live model requests were performed for this refinement.


Coach scope refinement: the chat is a trainer follow-up channel. Header, placeholder, and suggestions now invite questions about assigned meals, exercises, substitutions, warm-up, and missed sessions. Dashboard sends the selected-day plan snapshot alongside the message. Full programme generation belongs to Nutrition/Training; it is redirected from chat rather than presented as another chat feature.


## Progress and today/history separation

Overview and Nutrition use today. Overview no longer displays a date badge; Nutrition retains a static date tag. Training shows the rolling upcoming seven-day strip; future sessions are view-only. Progress is a primary navigation item and a protected `/progress` route with Trends and Day history. Trends combines actual weigh-in charts, measured change, device-local activity summaries, cadence controls, and an editable journal. History has a date input and recent-day strip, saved nutrition/training tabs, and view-only plan cards. On phones the selected date scrolls into the horizontal strip without moving the page.

Check-in dialogs offer measured, explicitly reused, and not-shared choices. Each choice may include a personal note. Saving replaces the existing dated entry. Only actual measurements affect the chart; no fat-loss claim is derived from the number. Frequency can be daily, weekly, on demand, or paused. Weight records are saved to the account; the UI explicitly distinguishes device-local activity history.

Progress UI review uses synthetic data through a temporary injected API (no production auth bypass). Saved previews: `screenshots/progress-desktop.png`, `progress-mobile.png`, `progress-light.png`, `history-desktop.png`, and `history-mobile.png`. Checked entry/update/reuse/skip, retry after a simulated failed save, cadence selection, history browsing, return to today's overview, and phone navigation/layout. Temporary review entry files/data are removed before delivery. No live authenticated MongoDB writes were tested for this feature.


## Public project walkthrough

`/how-it-works` is public for all visitors and lazy-loaded from `AppRouter.jsx`. Landing links to it in navigation, hero, and footer; dashboard links appear in its sidebar and footer. App CTAs respect authentication. The walkthrough explains the actual product purpose, profile → plans → logging/follow-up → progress journey, implementation choices, and current persistence limits. It makes no fabricated user/outcome claims. Its coach conversation is explicitly illustrative.

Product assets are optimized WebP files in `client/public/images/product/`: `overview.webp`, `nutrition.webp`, `training.webp`, and `progress.webp` (about 205 KB combined). They are actual 1280×720 browser captures of the app, using fictional Aarav Sharma and isolated sample plans/measurements. Training demonstrates the existing dark theme; the other three demonstrate the new light palette. Full PNG source captures are `docs/screenshots/fitness-light-overview.png`, `fitness-light-nutrition.png`, `tour-training.png`, and `fitness-light-progress.png`. These static assets must be refreshed when corresponding screens materially change. They are never injected into production user data.

The gallery uses the shared native dialog, labelled images, Escape dismissal, focus return, and a keyboard-focusable horizontal image viewport on phones. Screenshots below the hero load lazily. Public content includes a skip link, semantic headings and navigation, and reduced-motion support. The Overview date badge is removed only from Overview; Training, Nutrition, and history date controls retain their context.

Verification for this finish: production build and existing client test suite; desktop 1280×720 and phone 369×633 browser review in both appearances, tour anchors, screenshot enlargement/dismissal, storage disclosure, landing navigation, and auth CTA destination. Overview/date removal and authenticated layouts used isolated synthetic data; temporary entry files and sample localStorage keys were removed. No live AI calls or authenticated database writes were needed. New preview captures: `how-it-works-light-desktop.png`, `how-it-works-dark-desktop.png`, `how-it-works-mobile.png`, and `colorful-overview-mobile.png`. Older light screenshots in this folder document previous iterations and are superseded by the fitness-light captures.


## Warm light-theme verification

Browser review at 1280×720 and 369×633 used isolated synthetic data. Checked Overview, nutrition cards, training/session completion, progress/chart/preferences, profile, coach formatting, mobile navigation, the food logging dialog and Escape dismissal, plus preserved dark appearance. The temporary review entry and its UID-specific localStorage keys were removed. No live model requests, real-account changes, or database writes were involved. Existing client tests and production build pass.

Current previews: `screenshots/fitness-light-overview.png`, `fitness-light-nutrition.png`, `fitness-light-training.png`, `fitness-light-progress.png`, `fitness-light-profile.png`, and `fitness-light-mobile.png`. Public walkthrough source captures remain real app screens with synthetic data; the three light WebP assets were refreshed. The older `colorful-*` captures are historical, not the current palette.


## Backend wake-up and session loading

`StartupScreen.jsx` replaces the hidden auth-provider wait. It uses the existing theme, brand mark, display typography, indeterminate motion, real elapsed time, and progressive connection copy. A roughly one-minute wait is an estimate, not a promise/countdown. Desktop shows sign-in → connection → opening stages; phones omit the redundant stage list so the main message, elapsed time, and public-tour link fit. Error mode exposes Try again and (when signed in) Sign out. Status/error announcements, keyboard controls, and reduced motion are supported. `index.html` also has a small inline-styled fallback before the React bundle runs.

Public signed-out pages stay usable while an anonymous readiness request wakes the backend. Signed-in visitors see the loader while their real profile is read, then continue automatically; infrastructure errors cannot trigger onboarding. The total read retry window is two minutes, after which an error state requires an explicit retry. No paid model request or data mutation is retried. See ARCHITECTURE.md for cancellation and endpoint contracts.

Verification: 14 client tests, 20 backend tests, and client production build; simulated loading/failure/retry, theme and phone layout checks with the production presentation component. The local backend was not listening, so no live authenticated cold-start or Render deployment was tested. Temporary visual entry files were removed. Previews: `screenshots/startup-desktop.png`, `startup-error-desktop.png`, `startup-mobile.png`, and `startup-error-mobile-light.png`.
