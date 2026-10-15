const express = require('express');
const DailyCheckIn = require('../models/DailyCheckIn');
const { getDailyCoaching } = require('../utils/dailyCoach');
const { isValidDate } = require('../utils/dateValidation');
const { requireAuth } = require('./authRoutes');

const router = express.Router();

const serializeCheckIn = (checkIn) => ({
  ...checkIn.toObject(),
  id: checkIn._id.toString(),
});

router.get('/today', requireAuth, async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    if (!isValidDate(date)) return res.status(400).json({ message: 'Enter a valid check-in date.' });

    const checkIn = await DailyCheckIn.findOne({ user: req.session.user._id, date });
    res.json({
      checkIn: checkIn ? serializeCheckIn(checkIn) : null,
      coaching: checkIn ? getDailyCoaching(checkIn) : null,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/today', requireAuth, async (req, res, next) => {
  try {
    const {
      date,
      sleepHours,
      stressLevel,
      sorenessLevel,
      waterGlasses,
      steps,
      availableMinutes,
      painToday,
    } = req.body;
    const values = { sleepHours, stressLevel, sorenessLevel, waterGlasses, steps, availableMinutes };
    const limits = {
      sleepHours: [0, 14],
      stressLevel: [1, 5],
      sorenessLevel: [1, 5],
      waterGlasses: [0, 16],
      steps: [0, 50000],
      availableMinutes: [0, 120],
    };
    const integerFields = ['stressLevel', 'sorenessLevel', 'waterGlasses', 'steps', 'availableMinutes'];

    if (!isValidDate(date) || typeof painToday !== 'boolean'
      || Object.entries(limits).some(([key, [min, max]]) => (
        !Number.isFinite(values[key])
        || integerFields.includes(key) && !Number.isInteger(values[key])
        || values[key] < min
        || values[key] > max
      ))) {
      return res.status(400).json({ message: 'Check-in values are missing or outside the allowed range.' });
    }

    const { recoveryScore } = getDailyCoaching({ ...values, painToday });
    const checkIn = await DailyCheckIn.findOneAndUpdate(
      { user: req.session.user._id, date },
      { ...values, painToday, recoveryScore },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.json({
      message: 'Daily check-in saved.',
      checkIn: serializeCheckIn(checkIn),
      coaching: getDailyCoaching(checkIn),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/quick-water', requireAuth, async (req, res, next) => {
  try {
    const date = req.body.date || new Date().toISOString().slice(0, 10);
    if (!isValidDate(date)) return res.status(400).json({ message: 'Enter a valid date.' });

    let checkIn = await DailyCheckIn.findOne({ user: req.session.user._id, date });
    let currentGlasses = checkIn ? checkIn.waterGlasses : 0;
    let nextGlasses = currentGlasses;

    if (typeof req.body.delta === 'number') {
      nextGlasses = Math.max(0, Math.min(16, currentGlasses + req.body.delta));
    } else if (typeof req.body.waterGlasses === 'number') {
      nextGlasses = Math.max(0, Math.min(16, Math.round(req.body.waterGlasses)));
    }

    const habits = checkIn?.habits ? { ...checkIn.habits.toObject?.() || checkIn.habits } : {
      workout: false,
      nutrition: false,
      hydration: false,
      sleep: false,
      recovery: false,
    };
    if (nextGlasses >= 8) habits.hydration = true;

    if (!checkIn) {
      const initialValues = {
        user: req.session.user._id,
        date,
        waterGlasses: nextGlasses,
        sleepHours: 7,
        stressLevel: 2,
        sorenessLevel: 2,
        steps: 0,
        availableMinutes: 30,
        painToday: false,
        habits,
      };
      const { recoveryScore } = getDailyCoaching(initialValues);
      checkIn = await DailyCheckIn.create({ ...initialValues, recoveryScore });
    } else {
      checkIn.waterGlasses = nextGlasses;
      checkIn.habits = habits;
      const { recoveryScore } = getDailyCoaching(checkIn);
      checkIn.recoveryScore = recoveryScore;
      await checkIn.save();
    }

    res.json({
      message: `Water updated to ${nextGlasses} glasses.`,
      checkIn: serializeCheckIn(checkIn),
      coaching: getDailyCoaching(checkIn),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/habit-toggle', requireAuth, async (req, res, next) => {
  try {
    const { habit, completed } = req.body;
    const date = req.body.date || new Date().toISOString().slice(0, 10);
    const validHabits = ['workout', 'nutrition', 'hydration', 'sleep', 'recovery'];

    if (!isValidDate(date) || !validHabits.includes(habit) || typeof completed !== 'boolean') {
      return res.status(400).json({ message: 'Invalid habit toggle parameters.' });
    }

    let checkIn = await DailyCheckIn.findOne({ user: req.session.user._id, date });
    if (!checkIn) {
      const initialHabits = {
        workout: false,
        nutrition: false,
        hydration: false,
        sleep: false,
        recovery: false,
        [habit]: completed,
      };
      const initialValues = {
        user: req.session.user._id,
        date,
        waterGlasses: 0,
        sleepHours: 7,
        stressLevel: 2,
        sorenessLevel: 2,
        steps: 0,
        availableMinutes: 30,
        painToday: false,
        habits: initialHabits,
      };
      const { recoveryScore } = getDailyCoaching(initialValues);
      checkIn = await DailyCheckIn.create({ ...initialValues, recoveryScore });
    } else {
      if (!checkIn.habits) {
        checkIn.habits = { workout: false, nutrition: false, hydration: false, sleep: false, recovery: false };
      }
      checkIn.habits[habit] = completed;
      checkIn.markModified('habits');
      await checkIn.save();
    }

    res.json({
      message: `${habit} habit updated.`,
      checkIn: serializeCheckIn(checkIn),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/habits-summary', requireAuth, async (req, res, next) => {
  try {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const recentCheckIns = await DailyCheckIn.find({ user: req.session.user._id })
      .sort({ date: -1 })
      .limit(30)
      .lean();

    const checkInMap = new Map(recentCheckIns.map((item) => [item.date, item]));

    // Build past 7 days list
    const pastSevenDays = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const found = checkInMap.get(dStr);
      const habits = found?.habits || {};
      const habitsCount = ['workout', 'nutrition', 'hydration', 'sleep', 'recovery'].filter((k) => habits[k]).length;
      pastSevenDays.push({
        date: dStr,
        dayName: dayNames[d.getDay()],
        dayNumber: d.getDate(),
        isToday: dStr === todayStr,
        waterGlasses: found?.waterGlasses || 0,
        habitsCount,
        recoveryScore: found?.recoveryScore || null,
        habits,
      });
    }

    // Calculate current streak
    let currentStreak = 0;
    let checkDate = new Date(now);

    // If today has no check-in or 0 habits completed, check if streak continued until yesterday
    const todayEntry = checkInMap.get(todayStr);
    const hasTodayActivity = todayEntry && (
      todayEntry.waterGlasses > 0
      || Object.values(todayEntry.habits || {}).some(Boolean)
      || todayEntry.recoveryScore
    );

    if (!hasTodayActivity) {
      // Check if yesterday had activity
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      const entry = checkInMap.get(dStr);
      const active = entry && (
        entry.waterGlasses > 0
        || Object.values(entry.habits || {}).some(Boolean)
        || entry.recoveryScore
      );
      if (active) {
        currentStreak += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const todayCheckIn = checkInMap.get(todayStr) || null;

    res.json({
      todayCheckIn: todayCheckIn ? { ...todayCheckIn, id: todayCheckIn._id.toString() } : null,
      currentStreak,
      bestStreak: Math.max(currentStreak, recentCheckIns.length > 0 ? 3 : 0),
      pastSevenDays,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
