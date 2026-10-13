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
For deployment, set `SESSION_SECRET` to a securely generated random value of at least 32 characters. In development, the server generates a temporary random secret when this value is omitted; existing sessions will expire when the server restarts.

## Deploy for a team review

The repository includes a Render Blueprint in `render.yaml`. To publish the app:

1. Push the project to a GitHub repository you control.
2. Create a MongoDB Atlas cluster and database user. In Atlas Network Access, allow connections from Render (for a student demo, Atlas may require `0.0.0.0/0`; use a strong database password and never put the URI in source code).
3. In Render, choose **New + → Blueprint**, connect the repository, and apply `render.yaml`.
4. When prompted for `MONGODB_URI`, enter the Atlas connection string, including the database name `fitmentor-ai`.
5. Wait for the Render deploy to finish, then open its `onrender.com` URL and register a user. Share that HTTPS URL with your team leader.

Render builds the React app and serves it from the Express server, so the frontend and API use the same HTTPS origin. Render generates a session secret automatically. Do not publish `server/.env`, database credentials, or account passwords.

The Blueprint uses Render's free web-service plan for a no-cost demo. Free services spin down after inactivity, so the first request after a quiet period can take about a minute; their local filesystem is temporary. Keep user and session data in MongoDB Atlas, not on the Render filesystem. Render's free plan has usage limits and is intended for demos rather than production workloads.

### Create the initial admin account

Admin accounts are never created automatically, and registration always creates a regular user. With MongoDB running, create the first administrator using the interactive command:

```powershell
npm run create-admin --prefix server
```

The command prompts for a name, email, and a password (the password is hidden while typing and must be at least 12 characters). It stores only a bcrypt hash, refuses to overwrite an existing account or initialize a second time, and can be run only against a database that does not already contain an admin. Run this command from the project root. For a deployed database, configure `MONGODB_URI` in `server/.env` to point to that database and run the command from a trusted machine before making the deployment available; do not add admin credentials to source control or public environment files.

Sign in to the normal Login page with the admin email and password to open the Admin Dashboard. Admin API requests independently verify the account's current role in MongoDB. Once the initial admin exists, use **Admin → Users** to grant or remove admin roles; the last administrator cannot be demoted.

## Persistence and camera

Users, generated workouts, saved meals, weight entries, and login sessions are stored in MongoDB. If MongoDB is unavailable, local API requests return an explicit error instead of pretending that data was saved; a production deployment will not start without its configured database.

The app also includes a saved weekly workout calendar and in-app reminders (visible only while the app is open), profile-based workout/nutrition preferences, suggested workout substitutions, meal favorites, weight trend chart, completed-target history, and per-member usage counts for administrators. The Daily Life Coach saves one check-in per account per local date and uses a transparent, self-reported heuristic to suggest training or recovery; its score is not a medical assessment. Allergen catalog tags are approximate item-name matches, not a guarantee about recipes or cross-contamination; users must check product labels and preparation methods.

The Form Check page uses MediaPipe Pose Landmarker to estimate a squat's visible knee angle and count a rep after a descent and return to standing. Allow camera access, use `localhost` or HTTPS, and keep the full body in frame. The pose model and WebAssembly files are downloaded from their public CDN on first use. This is a basic rep-counting aid, not a medical or full-form assessment.

Food nutrition values and meal costs are approximate per the serving size shown. They are for demonstration and general guidance, not clinical nutrition advice.

## Notes

This project intentionally keeps the implementation straightforward and beginner-friendly so it is easy to explain in class presentations and lab viva.
