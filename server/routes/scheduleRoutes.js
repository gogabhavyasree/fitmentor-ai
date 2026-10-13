const express = require('express');
const Workout = require('../models/Workout');
const WorkoutSchedule = require('../models/WorkoutSchedule');
const { isValidDate } = require('../utils/dateValidation');
const { requireAuth } = require('./authRoutes');

const router = express.Router();

const asSchedule = (schedule) => ({
  id: schedule._id.toString(),
  workoutId: schedule.workout.toString(),
  weekdays: schedule.weekdays,
  reminderTime: schedule.reminderTime,
  completedDates: schedule.completedDates,
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const schedule = await WorkoutSchedule.findOne({ user: req.session.user._id });
    const workout = schedule
      ? await Workout.findOne({ _id: schedule.workout, user: req.session.user._id })
      : null;
    res.json({ schedule: schedule ? asSchedule(schedule) : null, workout: workout ? {
      workoutId: workout._id.toString(),
      goal: workout.goal,
      level: workout.level,
      exercises: workout.exercises,
    } : null });
  } catch (error) {
    next(error);
  }
});

router.put('/', requireAuth, async (req, res, next) => {
  try {
    const { workoutId, weekdays, reminderTime } = req.body;
    if (typeof workoutId !== 'string' || !/^[a-f\d]{24}$/i.test(workoutId)
      || !Array.isArray(weekdays) || weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)
      || new Set(weekdays).size !== weekdays.length
      || typeof reminderTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(reminderTime)) {
      return res.status(400).json({ message: 'Choose a workout, valid weekdays, and a reminder time.' });
    }
    const workout = await Workout.findOne({ _id: workoutId, user: req.session.user._id });
    if (!workout) return res.status(404).json({ message: 'Workout plan was not found.' });

    const schedule = await WorkoutSchedule.findOneAndUpdate(
      { user: req.session.user._id },
      { $set: { workout: workout._id, weekdays, reminderTime }, $setOnInsert: { completedDates: [] } },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ schedule: asSchedule(schedule) });
  } catch (error) {
    next(error);
  }
});

router.post('/complete', requireAuth, async (req, res, next) => {
  try {
    const date = req.body.date;
    if (!isValidDate(date)) {
      return res.status(400).json({ message: 'Provide a valid completion date.' });
    }
    const schedule = await WorkoutSchedule.findOneAndUpdate(
      { user: req.session.user._id },
      { $addToSet: { completedDates: date } },
      { new: true }
    );
    if (!schedule) return res.status(404).json({ message: 'Create a weekly schedule first.' });
    res.json({ schedule: asSchedule(schedule) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
