# FitMentor AI

FitMentor AI is a student-built full-stack fitness and nutrition project built with React, Express, MongoDB, and EJS. It gives users a dashboard, AI-style workout generator, nutrition planner, mess assistant, progress tracking, and admin tools.

## Folder structure

- `client/` — React frontend built with Vite and React Router.
- `server/` — Express server, REST API, and EJS views.
- `server/models/` — MongoDB/Mongoose data models.
- `server/routes/` — Auth, workout, nutrition, progress, admin endpoints.
- `server/utils/` — Rule-based workout generation and the shared food catalog.
- `server/views/` — EJS pages for simple server-rendered views.
- `client/src/pages/WeeklySchedulePage.jsx` — Saved weekly plan, in-app reminder schedule, and self-reported check-ins.

## Getting started

1. Start MongoDB locally, or configure a MongoDB URI in `server/.env`.
2. Install dependencies:
   - `npm install`
   - `npm install --prefix server`
   - `npm install --prefix client`
3. Start the app:
   - `npm run dev`
4. Open the frontend in the browser at `http://localhost:5173`.

## Environment

Create a `server/.env` file using the example in `server/.env.example`.

## Deploy for a team review

The repository includes a Render Blueprint in `render.yaml`. To publish the app:

1. Push the project to a GitHub repository you control.
2. Create a MongoDB Atlas cluster and database user. In Atlas Network Access, allow connections from Render (for a student demo, Atlas may require `0.0.0.0/0`; use a strong database password and never put the URI in source code).
3. In Render, choose **New + → Blueprint**, connect the repository, and apply `render.yaml`.
4. When prompted for `MONGODB_URI`, enter the Atlas connection string, including the database name `fitmentor-ai`.
5. Wait for the Render deploy to finish, then open its `onrender.com` URL and register a user. Share that HTTPS URL with your team leader.

Render builds the React app and serves it from the Express server, so the frontend and API use the same HTTPS origin. Render generates a session secret automatically. Do not publish `server/.env`, database credentials, or the local demo admin password.

The Blueprint uses Render's free web-service plan for a no-cost demo. Free services spin down after inactivity, so the first request after a quiet period can take about a minute; their local filesystem is temporary. Keep user and session data in MongoDB Atlas, not on the Render filesystem. Render's free plan has usage limits and is intended for demos rather than production workloads.

For an admin account on the deployed app, configure both `ADMIN_EMAIL` and `ADMIN_PASSWORD` as Render environment variables before the first deploy. Use a unique strong password. Production does not create the local demo admin account by default.

The Admin link is shown only to accounts with the admin role. To initialize the first production admin, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the server environment before startup; this securely creates or grants the admin role only to that configured email. Admin APIs re-check the role in MongoDB on every request. Local development retains the demo `admin@fitmentor.ai` / `admin123` account for convenience only.

## Persistence and camera

Users, generated workouts, saved meals, weight entries, and login sessions are stored in MongoDB. If MongoDB is unavailable, local API requests return an explicit error instead of pretending that data was saved; a production deployment will not start without its configured database.

The app also includes a saved weekly workout calendar and in-app reminders (visible only while the app is open), profile-based workout/nutrition preferences, suggested workout substitutions, meal favorites, weight trend chart, completed-target history, and per-member usage counts for administrators. Allergen catalog tags are approximate item-name matches, not a guarantee about recipes or cross-contamination; users must check product labels and preparation methods.

The Form Check page uses MediaPipe Pose Landmarker to estimate a squat's visible knee angle and count a rep after a descent and return to standing. Allow camera access, use `localhost` or HTTPS, and keep the full body in frame. The pose model and WebAssembly files are downloaded from their public CDN on first use. This is a basic rep-counting aid, not a medical or full-form assessment.

Food nutrition values and meal costs are approximate per the serving size shown. They are for demonstration and general guidance, not clinical nutrition advice.

## Notes

This project intentionally keeps the implementation straightforward and beginner-friendly so it is easy to explain in class presentations and lab viva. On first start, it creates a demo admin account: `admin@fitmentor.ai` / `admin123`. Change that password before using the application beyond a local demonstration.
