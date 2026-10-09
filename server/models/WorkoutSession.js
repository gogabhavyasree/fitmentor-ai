const mongoose = require('mongoose');

const workoutSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    workout: { type: mongoose.Schema.Types.ObjectId, ref: 'Workout' },
    exerciseName: { type: String, required: true },
    completed: { type: Boolean, default: false },
    skipped: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.models.WorkoutSession || mongoose.model('WorkoutSession', workoutSessionSchema);
