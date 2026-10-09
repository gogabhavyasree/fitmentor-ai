const mongoose = require('mongoose');

const workoutScheduleSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    workout: { type: mongoose.Schema.Types.ObjectId, ref: 'Workout', required: true },
    weekdays: [{ type: Number, min: 0, max: 6 }],
    reminderTime: { type: String, required: true, default: '18:00' },
    completedDates: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.models.WorkoutSchedule || mongoose.model('WorkoutSchedule', workoutScheduleSchema);
