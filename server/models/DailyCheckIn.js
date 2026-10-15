const mongoose = require('mongoose');

const dailyCheckInSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    sleepHours: { type: Number, required: true, min: 0, max: 14, default: 7 },
    stressLevel: { type: Number, required: true, min: 1, max: 5, default: 2 },
    sorenessLevel: { type: Number, required: true, min: 1, max: 5, default: 2 },
    waterGlasses: { type: Number, required: true, min: 0, max: 16, default: 0 },
    steps: { type: Number, required: true, min: 0, max: 50000, default: 0 },
    availableMinutes: { type: Number, required: true, min: 0, max: 120, default: 30 },
    painToday: { type: Boolean, required: true, default: false },
    recoveryScore: { type: Number, required: true, min: 0, max: 100, default: 70 },
    habits: {
      workout: { type: Boolean, default: false },
      nutrition: { type: Boolean, default: false },
      hydration: { type: Boolean, default: false },
      sleep: { type: Boolean, default: false },
      recovery: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

dailyCheckInSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.models.DailyCheckIn || mongoose.model('DailyCheckIn', dailyCheckInSchema);
