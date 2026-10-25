# AI Guruji: the final product experience

Updated 25 October 2026. This separates delivered behavior from recommended follow-up work. The aim is a personal fitness companion that helps users follow a routine, see an honest record of it, and ask their trainer small questions.

## The six parts of the experience

| Area | Purpose | Current behavior |
| --- | --- | --- |
| Overview | What matters today | Today's meals, workout, energy estimates, completed activities, and an optional check-in. No past-date controls. |
| Nutrition | Follow today's food plan | Ordered meals, portions/recipes, ingredient alternatives via swaps, food logging. |
| Training | Know what to do next | Today's session and the upcoming seven-day programme. Upcoming sessions are previews; activity logging belongs to today. |
| Progress | Understand the journey | Trends over 7/14/30/90 days, optional weight journal, activity summary, and Day history with a date picker and saved-day views. |
| Ask Guruji | Ask a small follow-up | Clarify portions, substitutions, form, a missed session, or recovery using today's available plan context. Complete programmes belong to dedicated plan screens. |
| Profile | Know and manage your preferences | Read-only identity/goals/preferences and latest measured weight, with a separate editor. |

A typical return visit is: see today's routine → log food or movement → ask a small question if needed → check progress when useful. Ongoing weight check-ins are never a prerequisite for using the rest of the app. Initial onboarding still asks for a profile weight.

## Optional weight tracking

Users can choose daily, weekly, only when they choose, or paused prompts. Each dated check-in records one of three explicit choices:

- **Measured:** an actual weight, with an optional personal note.
- **Reused:** a reference to the most recent earlier actual measurement. The backend resolves the source date/value; this does not become a new measurement.
- **Not shared:** no weight value stored for that date. This choice does not break activity streaks.

Only measured entries appear on the weight chart and determine the measured change. There are no fabricated measurements for missing days, no interpolation presented as recorded data, and no body-fat-loss estimate from scale weight. Replacing a check-in replaces that date's choice; it does not create a second entry.

The profile weight remains a baseline. Future generated plans and coach answers can use the latest actual check-in weight; reused entries do not advance its date. Existing plans are not silently regenerated or edited after a weigh-in. Pausing prompts retains previous entries; it is not a delete-history action.

## What two weeks of use can show

Illustrative example, not an actual user's result: five actual weigh-ins from 78.4 to 77.0 kg, 27 meals logged, and four days with movement recorded.

The product can show the dated measurements, a recorded change of -1.4 kg, logged activity days, and the actual meals/workouts on any saved day. It must not say this proves 1.4 kg of fat loss, promise a future outcome, or treat every unlogged day as a missed workout. Someone with only weekly weigh-ins can still see a trend after two measurements. Someone sharing no weight still gets food and movement summaries.

Current storage boundary: weight check-ins/preferences are account-owned MongoDB data. Meal/workout working history and completion/manual logs remain device-local, and the UI labels that boundary. Cross-device weight data should not be confused with cross-device activity sync.

## Recommended next changes, in order

1. **Unify saved history across devices.** Persist completion, manual logs, and meal swaps; correct server workout dates; hydrate the working plans from authenticated history. Define a merge for existing browser data and keep item IDs intact. This is the largest remaining reliability improvement.
2. **Add a short weekly review of how the plan feels.** Optional hunger, energy, workout difficulty, and recovery feedback would give personalization context beyond weight. Keep these voluntary and allow users to review their own notes. Summarize existing data without requiring extra LLM calls.
3. **Offer explainable, user-approved plan adjustments.** Show what would change and why, using measured trends and routine feedback. Let the user accept or keep the existing plan. Avoid automatically cutting calories or increasing exercise from a few scale readings.
4. **Support practical scheduling.** Let users choose training days, move a missed session, and distinguish a planned recovery day from no saved data. Keep historical records intact when scheduling changes.
5. **Finish privacy and recruiter readiness.** Add clear export/delete controls, a maintained sample-data demo, a deployed walkthrough, and CI for the existing tests/build. Keep the project README aligned with real features and limitations. Finish timezone handling so a user's local day is consistent across devices and the API.

Suggested finish scope: complete reliable persistence and the demo before adding more AI features. The strongest demonstration is an account returning after two weeks with its own saved routine, optional measurements, useful history, and a short contextual chat.

## Engineering and verification

Implementation reference: [ARCHITECTURE.md](ARCHITECTURE.md). Visual direction: [DESIGN.md](DESIGN.md).

Weight API validation/ownership, explicit reuse, no-weight overwrite, preference preservation, and latest-measurement context have automated regression coverage. Client tests cover weekly/sparse measurements, omitted/reused entries, date separation, prompt frequency, activity counts, and streak behavior. Browser review uses an isolated synthetic account with an in-memory progress API; it does not write real account records or exercise deployed MongoDB persistence.
