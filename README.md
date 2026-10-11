# 💪 FitMentor AI — Your Trainer. Your Nutritionist. Your Gym Buddy.

**FitMentor AI** is a student-built full-stack fitness and nutrition web application designed to help users manage their workouts, make better food choices, and track their fitness journey in one place.

The platform combines personalized workout planning, exercise assistance, nutrition guidance, budget-friendly diet planning, and progress tracking to make fitness more accessible and convenient.

🌐 **Live Website:** [FitMentor AI](https://fitmentor-ai-xbmr.onrender.com/login)

---

## ✨ Features

### 🏋️ Workout Planner
- Generate workout plans based on user preferences and fitness goals.
- Explore structured workout routines.
- Follow a weekly workout schedule.
- Save workouts and track self-reported completion.

### 🎯 Exercise Form Check
- Uses camera-based pose tracking powered by MediaPipe Pose Landmarker.
- Estimates visible knee angles during squats.
- Counts repetitions by detecting movement from standing to a squat and back.
- Helps users observe basic movement patterns during exercise.

*Note: Form Check is a basic demonstration tool, not a complete assessment of exercise technique or a substitute for professional guidance.*

### 🥗 Food Nutrition
- Explore nutrition information for supported food items.
- View approximate calories, protein, carbohydrates, and fats.
- Make more informed food choices based on serving sizes.

### 💰 Budget Diet Planner
- Generate diet suggestions based on a user's budget and preferences.
- Support practical meal planning with affordability in mind.
- Help users explore suitable food choices for their fitness goals.

### 🍛 Mess Assistant
- Get food suggestions suited to common mess and everyday meal options.
- Explore practical alternatives using the available food catalog.
- Make meal decisions more conveniently.

### 📅 Weekly Workout Schedule
- View saved workouts in a weekly calendar.
- Schedule in-app reminders.
- Record workout check-ins and completion.

### 📈 Fitness Progress Tracking
- Save weight entries and view weight trends.
- Track completed workout targets.
- Store relevant fitness activity and preferences.
- Review progress over time.

### 👤 User Accounts
- Register and log in securely.
- Maintain individual user accounts and sessions.
- Store supported user data in MongoDB for future access.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React | Interactive user interface |
| Vite | Frontend development and build tool |
| React Router | Client-side navigation |
| Node.js | JavaScript runtime |
| Express.js | Backend server and REST APIs |
| MongoDB | Persistent data storage |
| Mongoose | MongoDB data modeling |
| EJS | Server-rendered views |
| MediaPipe Pose Landmarker | Basic camera-based pose tracking |
| Render | Application deployment |
| MongoDB Atlas | Cloud database hosting |

---

## 🏗️ Project Structure

```text
FitMentor-AI/
├── client/
│   └── src/
│       └── pages/
│           └── WeeklySchedulePage.jsx
├── server/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── views/
│   └── .env.example
├── render.yaml
├── package.json
└── README.md
```

- `client/` — React frontend and application pages.
- `server/` — Express backend, APIs, and server-rendered views.
- `server/models/` — Mongoose models for database collections.
- `server/routes/` — Authentication and application API routes.
- `server/utils/` — Workout generation logic and shared food catalog.
- `server/views/` — EJS templates.
- `render.yaml` — Render deployment configuration.

---

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

- Node.js and npm
- MongoDB locally or a MongoDB Atlas database
- Git

### 1. Clone the repository

```bash
git clone https://github.com/kalpana6497-cmd/fitmentor-ai.git
cd fitmentor-ai
```

### 2. Install dependencies

```bash
npm install
npm install --prefix server
npm install --prefix client
```

### 3. Configure environment variables

Create a `.env` file inside the `server/` directory using `server/.env.example` as a reference.

Configure the required variables, including your MongoDB connection string and a secure session secret.

Example:

```env
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_secure_random_secret
```

Use your own credentials. Never upload `.env` files, database passwords, or secret keys to GitHub.

### 4. Run the application

From the project root, run:

```bash
npm run dev
```

Open the local frontend at:

http://localhost:5173

*Make sure MongoDB is available and the required environment variables are configured before starting the application.*

---

## 🌐 Live Deployment

FitMentor AI is deployed using Render, with MongoDB Atlas intended for persistent cloud data storage.

**Access the application:** [https://fitmentor-ai-xbmr.onrender.com/login](https://fitmentor-ai-xbmr.onrender.com/login)

Users can open the deployed link without running the project on their own computers. Render's free services may take some time to respond after a period of inactivity.

---

## 🔐 Security and Privacy

- Passwords should be stored using secure password hashing.
- Authentication and authorization must be handled on the server.
- Database credentials and session secrets must remain private.
- User information should be accessed only through the application's authorized routes.

---

## 🎯 Project Objective

The objective of FitMentor AI is to bring workout planning, basic exercise assistance, nutrition guidance, affordable diet suggestions, and progress tracking together in a single web application.

The project demonstrates how frontend development, backend APIs, database management, and camera-based pose estimation can work together to create a practical fitness application.

---

## 🔮 Future Enhancements

- More exercise types and improved pose-based feedback.
- More personalized workout and nutrition recommendations.
- Expanded food recognition and nutrition data.
- Enhanced progress reports and fitness analytics.
- Improved mobile responsiveness and user experience.

---

## 👩‍💻 Developed As

A student full-stack development project focused on fitness, nutrition, and personal wellness using modern web technologies.

**FitMentor AI — Your trainer. Your nutritionist. Your gym buddy.**
