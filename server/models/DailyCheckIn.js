const mongoose = require('mongoose');

const dailyCheckInSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    sleepHours: { type: Number, required: true, min: 0, max: 14 },
    stressLevel: { type: Number, required: true, min: 1, max: 5 },
    sorenessLevel: { type: Number, required: true, min: 1, max: 5 },
    waterGlasses: { type: Number, required: true, min: 0, max: 16 },
    steps: { type: Number, required: true, min: 0, max: 50000 },
    availableMinutes: { type: Number, required: true, min: 0, max: 120 },
    painToday: { type: Boolean, required: true },
    recoveryScore: { type: Number, required: true, min: 0, max: 100 },
  },
  { timestamps: true }
);

dailyCheckInSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.models.DailyCheckIn || mongoose.model('DailyCheckIn', dailyCheckInSchema);
