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

module.exports = router;
