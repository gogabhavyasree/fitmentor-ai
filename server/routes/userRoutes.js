const express = require('express');
const User = require('../models/User');
const Workout = require('../models/Workout');
const Meal = require('../models/Meal');
const Progress = require('../models/Progress');
const { requireAuth } = require('./authRoutes');

const router = express.Router();

router.get('/dashboard', requireAuth, async (req, res, next) => {
  try {
    const [user, latestWorkout, workouts, meals, progress] = await Promise.all([
      User.findById(req.session.user._id).lean(),
      Workout.findOne({ user: req.session.user._id }).sort({ createdAt: -1 }).lean(),
      Workout.find({ user: req.session.user._id }).sort({ createdAt: -1 }).limit(3).lean(),
      Meal.find({ user: req.session.user._id }).sort({ createdAt: -1 }).limit(3).lean(),
      Progress.find({ user: req.session.user._id }).sort({ date: -1, createdAt: -1 }).limit(5).lean(),
    ]);

    if (!user) {
      return res.status(404).json({ message: 'User profile not found.' });
    }
    const displayWorkout = (workout) => workout ? ({
      ...workout,
      id: workout._id.toString(),
      exercises: workout.exercises || [],
    }) : null;

    res.json({
      dashboard: {
        user: {
          name: user.name,
          email: user.email,
          goal: user.goal,
          age: user.age,
          role: user.role,
        },
        welcomeMessage: `Welcome back, ${user.name}!`,
        todaysWorkout: displayWorkout(latestWorkout),
        recentWorkoutActivity: workouts.map(displayWorkout),
        dailyNutritionSummary: meals.map((meal) => ({ ...meal, id: meal._id.toString() })),
        weightSummary: progress.map((entry) => ({ ...entry, id: entry._id.toString() })),
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
