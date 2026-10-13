# FitMentor AI — Project Audit Report

**Audit date:** 2026-10-13  
**Scope:** Repository source, local development service, and read-only checks against the configured public deployment. No production account data was intentionally queried or changed; no accounts were created.

## A. Executive Summary

FitMentor AI is a functional student fitness application with session-based accounts, MongoDB-backed workout and meal records, a fixed-template workout generator, a static nutrition catalog, a weekly schedule, weight tracking, and a camera-based pose landmark feature. It is not currently a trained AI fitness coach: there is no in-repository training pipeline or task-specific exercise/food model. MediaPipe Pose Landmarker is a real, externally hosted general pose model; app-authored geometry rules use its landmarks to estimate selected joint angles and count movement cycles.

The application is more than a set of static pages, but most of its intelligence is deterministic and narrow. Form Check is the most technically distinctive feature, yet its feedback is limited: squat/lunge depth is displayed, push-up body alignment can prompt a generic correction, and deadlift feedback is primarily movement status. I could not verify live camera inference without granting camera access and performing movements. The local server and MongoDB were running, the production website and model assets responded, and the local production build had passed. Production was inspected read-only.

Three low-risk issues were confirmed and are addressed after this initial report: equipment does not influence generated exercises, the budget planner does not apply saved profile allergen exclusions, and malformed registration names can reach the generic 500 handler rather than being rejected as invalid input. Retest evidence and changes are recorded at the end.

## B. Feature Audit Table

The statuses and original test evidence below record the initial audit, before the focused fixes in the final section.

| Feature | Status | Actual Implementation | Test Evidence | Missing Work | Priority |
|---|---|---|---|---|---|
| AI Form Correction | Partially working | MediaPipe Pose Landmarker runs in the browser when camera access is granted. Hand-written 2D landmark geometry estimates angles; a top/bottom/top state machine counts reps for supported movements. No exercise-form classifier or form score. Squats/lunges show a simple hip-vs-knee depth comparison; push-ups can report a generic body-alignment prompt; deadlifts expose hip angle and rep movement but no specific spine correction. | Source inspection of `FormPoseTracker.jsx` and `formTracking.js`; production CDN JavaScript and `.task` model asset each returned HTTP 200. Physical camera, permission prompt, and live inference were not exercised. | Test under real camera conditions; add validated, exercise-specific rules only where camera view supports them. Rep counting is heuristic and should be evaluated for landmark jitter. | P1 |
| Indian Food Recognition and Nutrition | Not implemented (recognition); partially working (catalog nutrition) | Users manually browse a static catalog and add foods. The catalog includes Indian items and estimated serving-level calories, protein, carbs, fat, and costs. No image input, image inference, or unknown-food prediction path exists. | Source search found no image-upload or image-classification integration; catalog and nutrition aggregation code inspected. | Add image recognition only with an approved model/data and uncertainty handling. Document nutrition data sources and serving assumptions. | P2 |
| Budget Diet Planner | Partially working | Client-side deterministic meal selection from the catalog uses budget bands, vegetarian preference, hostel/home availability, and goal-specific text. Costs/macros are summed from catalog values. The same goal-independent meal choices can be shown for different goals; there is no weekly plan, persistence, or actual AI recommendation. Before the fix, profile allergens were not considered. | Executed planner examples: vegetarian hostel sample estimated ₹123/day; a ₹50 non-vegetarian home input estimated ₹145/day and displayed the over-budget case. | Make allergy filtering effective, improve substitutions and budget fit, and document estimates. Add a persisted plan only if the UX claims it is saved. | P2 |
| AI Grocery Planner | Not implemented | No weekly grocery list or ingredient quantity aggregation found. | Repository inventory and feature search. | Define serving/quantity conversion and dated price assumptions; derive a list from a plan without claiming live prices. | P3 |
| AI Body Progress Scanner | Not implemented | Progress records store weight and date only. No image capture/upload, image storage, computer vision measurements, or photo deletion flow. | Models and routes inspected; repository search found no upload or image inference path. | Do not report body composition or dimensions without a validated method. If adding photos later, establish consent, retention, access control, and deletion first. | P3 |
| Adaptive AI Workout Generator | Partially working | A server-side fixed template varies exercises by fitness goal and level, and selects 3 or 4 exercises based on time bands. It stores generated plans in MongoDB. Equipment is saved/displayed but was not used when choosing exercises; different 30- and 60-minute inputs produced the same exercises. Sleep, recovery, pain, workout history, and preferences do not affect generation. | Executed generator comparisons: Bodyweight Muscle Gain included Goblet Squats, Bent-Over Rows, and Dumbbell Press; Bodyweight intermediate General Fitness included Kettlebell Swings. Plans at 30 and 60 minutes had the same exercises. | Use only exercises feasible with selected equipment; adapt workload rather than only displayed duration. Add progression/rest-day logic only after testing. | P1 |
| AI Voice Coach | Not implemented | No speech synthesis, audio recording, voice event, or rest timer integration found. | Repository search. | Any future text-to-speech should announce supported events and avoid claims of form evaluation the tracker does not make. | P3 |
| Injury Prevention and Exercise Substitution | Partially working | Workout page offers fixed alternative exercises and filters some alternatives by equipment. A daily check-in includes a pain yes/no input and advises avoiding painful movements, but this answer is not connected to exercise generation or substitutions. No injury diagnosis exists. | Route and page source inspected. No injury-specific substitution flow found. | Connect limitations to conservative exercise exclusions only with clear user control and safety messaging; do not claim injury prevention. | P1 |
| Gym Buddy Matching | Not implemented | No location, matching, or user-discovery feature found. | Repository inventory and feature search. | Require opt-in profile fields, privacy controls, and real matching data before implementation. | P3 |
| Recovery Score | Partially working | The current local branch has a transparent deterministic self-reported heuristic based on sleep duration, stress, soreness, water glasses, steps, and a pain override. It does not include workout intensity, and is not a validated recovery or medical measure. Daily entries are stored per user/date. | Formula inspected and exercised with ready-to-train, pain, low-sleep, and no-time inputs; local `/api/coach/today` without authentication returned 401. The production deployment inspected did not show the new Daily Coach route. | Label as an estimate, broaden only with meaningful inputs, and deploy before presenting this new feature as live. | P2 |
| Habit Score | Not implemented | Schedule check-ins and saved data exist, but no consistent habit score or persisted daily habit history across workout, sleep, water, and protein was found. | Repository search and schedule/progress source inspection. | Define auditable habits and correction/history behavior before computing a score. | P3 |
| Supplement Guide | Not implemented | No educational supplement guide found. | Repository inventory and feature search. | Provide balanced general education and limitations; avoid personalized medical prescriptions or product promotion. | P3 |
| Hostel/Mess Food Assistant | Partially working | Users manually select catalog foods; the page calculates estimated macros and suggests catalog protein additions when the meal has under 15 g protein. It is not photo recognition and does not save this selection. Suggestions use a small, fixed set and do not apply profile allergens. | Page and catalog inspected; no save request is made from the Mess Assistant. | Apply allergy exclusions, make serving assumptions prominent, and add persistence only if desired. | P2 |
| Affordable Protein Finder | Not implemented | Catalog entries include static estimated costs, but there is no cost-per-gram ranking, dated market data, local store search, or online availability. | Catalog and repository search. | Compute comparable cost per gram using consistent serving units; identify prices as estimates and avoid fabricated availability. | P3 |
| Monthly Health Report | Not implemented (monthly report); partially working (progress tracking) | Weight entries and workout session records are stored; a weight trend chart uses recent persisted entries. There is no monthly filter/report, nutrition trend synthesis, or export. | Progress page, routes, and models inspected. | Build from date-filtered persisted history and handle empty periods; do not fabricate data. | P2 |
| AI Daily Life Coach | Partially working | Current local branch adds one check-in per account/local date and returns a rule-based recovery/training recommendation, including available time and pain. Workout generation can receive the recommended duration. It does not yet adapt diet, hydration targets, or equipment from daily check-in values. | Local source/build and heuristic checks; local database health is connected. Production navigation did not include Daily Coach at audit time. | Deploy the current local change and connect only additional behaviors that can be supported and verified. | P1 |

## C. ML Reality Check

- **In-repository trained ML models:** None found. No model weights, training scripts, training datasets, model metadata, or task-specific inference code are present in the repository inventory.
- **Form Check model:** MediaPipe Tasks Vision `PoseLandmarker` is loaded from the public Google-hosted `pose_landmarker_lite` `.task` asset. This general pose-estimation model provides body landmarks; app code then computes selected 2D joint angles, a simple body alignment deviation, and heuristic repetition phases. It does not classify exercise technique or produce a trained form-quality prediction. Training provenance and the app's own model accuracy are not documented.
- **Food recognition model:** None. Nutrition values are looked up from a static catalog after the user selects foods manually.
- **Other AI/ML inference:** None identified. The workout generator, diet planner, and Daily Life Coach are rule-based.
- The public MediaPipe JavaScript and model asset returned HTTP 200. Successful live model initialization and exercise inference remain unverified because a camera session was not performed.

## D. Critical Bugs

No production data integrity or cross-account exposure was demonstrated during the read-only audit. The following confirmed issues are prioritized for focused fixes:

1. **Equipment mismatch (P1, fixed after initial report):** `server/utils/workoutGenerator.js` ignored the equipment argument while selecting exercises. A Bodyweight plan could include exercises requiring dumbbells or kettlebells.
2. **Profile allergies ignored in budget plan (P1, fixed after initial report):** `client/src/pages/BudgetDietPage.jsx` did not receive the user profile and `client/src/data/foodData.js` did not exclude catalog entries tagged with profile allergens. The Food Nutrition page's filter did not protect this separate planner.
3. **Malformed registration name returns 500 (P2, fixed after initial report):** `server/routes/authRoutes.js` called `name?.trim()` without verifying that `name` was a string. A local request with a numeric `name` returned HTTP 500 instead of a client validation response.
4. **Budget limits do not constrain a plan (P2):** A low entered budget can still produce a more expensive plan. The UI does disclose that it is over budget, but does not automatically produce an in-budget alternative.
5. **Date validation is format-only in some routes (P2, fixed after initial report):** Progress and schedule completion endpoints checked `YYYY-MM-DD` syntax but did not verify that the date exists in the calendar. Invalid dates could be stored.
6. **Record deletion is absent:** Self-service deletion of saved meal, weight, workout, and schedule records was not found. No progress photos are collected by this implementation.

### Privacy and access observations

- Registration uses bcrypt password hashing; successful login regenerates the session. Production session cookies are configured HttpOnly, Secure, and SameSite=Lax, with Mongo-backed sessions when connected.
- User-owned workout, meal, schedule, progress, and check-in queries are scoped to the authenticated user's ID in the inspected routes. Admin routes were not audited, per scope.
- No photo upload/storage path was found. Existing account history is stored in MongoDB and has no user-facing deletion path.
- Cross-account authorization was not dynamically tested with two test accounts. No production writes or account creation were performed.

## E. Prioritized Roadmap

### P0 — Security, data integrity, and misleading results

- Keep exercise feedback limited to measurable landmark rules; do not market it as a validated form classifier or injury detector.
- Add deletion/retention controls before introducing sensitive progress photos.
- Correct malformed-input handling and reject invalid calendar dates at API boundaries.

### P1 — Core fitness features and Form Check

- Fix equipment-aware workout selection and test every selectable equipment/goal/level combination.
- Verify Form Check in real camera sessions for squat, deadlift, and push-up; evaluate rep stability and view-specific feedback.
- Connect pain limitations to conservative substitution behavior only after validating each alternative.
- Deploy and end-to-end test the Daily Life Coach currently present in the local branch.

### P2 — Nutrition, diet planning, and progress

- Apply profile allergen exclusions in every meal suggestion path; improve budget-constrained alternatives and document catalog data sources.
- Build a weekly grocery list from serving quantities and explicitly estimated local prices.
- Add a date-filtered monthly report from stored weight, workouts, and meal history.

### P3 — Future startup features

- Consider food-photo recognition, voice coaching, supplement education, opt-in gym buddy matching, and image-based progress only with suitable validation, privacy safeguards, and verified data sources.

## F. Test Results

| Test | Result | Evidence / limitation |
|---|---|---|
| Local backend startup and MongoDB connection | Passed | Existing local server reported successful MongoDB connection; `GET /api/health` returned HTTP 200 and `connectedToMongo: true`. |
| Local frontend login route | Passed | `GET http://localhost:5173/login` returned HTTP 200. |
| Unauthenticated API access | Passed | Local `GET /api/auth/me` and `GET /api/coach/today` returned HTTP 401. |
| Production website and login route | Passed | Read-only requests to the configured Render site and `/login` returned HTTP 200. The active deployment did not include the local Daily Coach navigation item at audit time. |
| Production health endpoint | Passed | `GET /api/health` returned HTTP 200. No production user data was queried through API calls and no writes were made. |
| Public pose model assets | Passed (reachability only) | MediaPipe JavaScript and model asset returned HTTP 200; this does not prove a live camera inference session. |
| Workout generator behavior | Failed expectations | Direct function checks showed equipment is ignored and 30-/60-minute plans contain the same exercise list. |
| Budget planner behavior | Partially passed / issue confirmed | Direct function checks showed the cost calculation and over-budget message; goal changed only the guidance text and the planner had no allergen input. |
| Registration invalid-name validation | Failed | Local `POST /api/auth/register` with a numeric name returned HTTP 500. The invalid request did not create an account. |
| Frontend production build | Passed | `npm run build --prefix FitMentor-AI` completed successfully during the audit. |
| Automated test suite | Not available | No test script or test files were present in the project inventory. |
| Camera permission, live pose, movement, and voice | Unable to verify / not implemented | No live camera movement test was performed; voice implementation was not found. |
| Login success, logout, restart persistence, and cross-account access | Unable to verify dynamically | No test account was created and no existing production credentials/data were used. Relevant code paths were inspected. |

## G. Exact Files to Change

| Confirmed issue | Smallest safe change |
|---|---|
| Equipment ignored by workout template | `server/utils/workoutGenerator.js` — choose equipment-compatible template exercises or explicit safe alternatives for the selected equipment. |
| Allergens ignored in budget plan | `client/src/pages/BudgetDietPage.jsx`, `client/src/data/foodData.js` — pass profile allergen tags into plan generation and exclude catalog items matching those tags; clearly identify any omitted meal component. |
| Numeric/non-string registration name returns 500 | `server/routes/authRoutes.js` — validate `typeof name === 'string'` before calling `.trim()`. |
| Invalid date accepted by API | `server/utils/dateValidation.js`, `server/routes/progressRoutes.js`, `server/routes/scheduleRoutes.js` — share calendar-date validation across progress, schedule, and coach APIs. |
| Budget overrun not resolved | `client/src/data/foodData.js`, `client/src/pages/BudgetDietPage.jsx` — add a constrained alternative or retain the explicit over-budget warning; this needs product behavior approval if the planner must guarantee a cap. |

## H. Final Recommendation

Keep **camera-based Form Check** as the differentiator, but call the current implementation landmark-based rep counting and limited rule feedback—not AI form correction. First test it with real users and camera angles, collect failure cases, and validate exercise-specific feedback before expanding its claims. In parallel, ensure generated exercises actually match selected equipment and all food suggestions honor profile allergy exclusions.

## Post-report fixes and retests

Four small, confirmed issues were fixed after the initial findings were recorded:

- **Equipment-aware workouts:** `server/utils/workoutGenerator.js` now substitutes listed equipment-dependent template movements when Bodyweight, Yoga mat, or Dumbbells are selected. Plans longer than 35 minutes add sets, capped at five per exercise, rather than only changing the displayed duration.
- **Profile allergen exclusions in the budget planner:** `client/src/App.jsx` passes the current user to `BudgetDietPage`; `client/src/data/foodData.js` checks each plan candidate and protein suggestion against the catalog's profile allergen tags, tries listed alternatives, and counts omitted items. `BudgetDietPage.jsx` displays when no tagged-safe candidate is available. Catalog tags remain approximate and cannot identify recipe ingredients or cross-contamination.
- **Registration validation:** `server/routes/authRoutes.js` checks the name's type before trimming. Repeating the malformed local registration request returned HTTP 400; the request did not create an account.
- **Calendar date validation:** `server/utils/dateValidation.js` now checks both date syntax and that the calendar date round-trips correctly. Progress, schedule completion, and daily coach routes use it.

Retests after these changes:

| Retest | Result | Evidence |
|---|---|---|
| Frontend production build | Passed | `npm run build --prefix FitMentor-AI` completed successfully after the changes. |
| Backend syntax checks | Passed | `node --check` completed without errors for the changed route/helper files and the daily coach/workout generator. |
| Equipment and duration behavior | Passed | Direct assertions confirmed bodyweight substitutions for muscle-gain beginner and intermediate general-fitness cases; a 60-minute plan has more total sets than a 30-minute plan. |
| Budget planner allergen behavior | Passed (catalog tags only) | A test plan excluding gluten, peanut, dairy, egg, and soy contained zero foods with those catalog tags; allergen-sensitive protein advice omitted soya chunks. |
| Diet preference and meal cost | Passed | Vegetarian selection returned only catalog vegetarian foods; non-vegetarian selection included a catalog non-vegetarian item; the displayed plan total equaled the sum of its food costs. |
| Registration invalid-name behavior | Passed | The same local malformed request now returned HTTP 400 rather than 500. |
| Calendar date helper | Passed | Valid leap day was accepted; a non-leap February 29, impossible month/day, and non-string input were rejected. |
| Form rule smoke checks | Passed (synthetic data only) | Synthetic landmarks produced an approximately 90-degree squat knee estimate; rep-state assertions counted a complete top-to-bottom-to-top cycle once and did not increase on repeated static poses. This is not a live camera test. |
| Git whitespace validation | Passed | `git diff --check` completed without errors. |

These fixes do not make the workout generator or diet planner AI-based, do not guarantee that food recipes are allergen-safe, and do not prove live camera performance.
