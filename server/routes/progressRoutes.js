const express = require('express');
const Progress = require('../models/Progress');
const { isValidDate } = require('../utils/dateValidation');
const { requireAuth } = require('./authRoutes');

const router = express.Router();

router.get('/history', requireAuth, async (req, res, next) => {
  try {
    const history = await Progress.find({ user: req.session.user._id }).sort({ date: -1, createdAt: -1 }).limit(100);
    res.json({ history: history.map((entry) => ({ ...entry.toObject(), id: entry._id.toString() })) });
  } catch (error) {
    next(error);
  }
});

router.post('/save', requireAuth, async (req, res, next) => {
  try {
    const weight = Number(req.body.weight);
    const date = req.body.date || new Date().toISOString().slice(0, 10);
    if (!Number.isFinite(weight) || weight < 1 || weight > 500 || !isValidDate(date)) {
      return res.status(400).json({ message: 'Enter a valid weight and date.' });
    }

    const entry = await Progress.create({ user: req.session.user._id, weight, date });
    res.status(201).json({ message: 'Progress saved.', entry: { ...entry.toObject(), id: entry._id.toString() } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
