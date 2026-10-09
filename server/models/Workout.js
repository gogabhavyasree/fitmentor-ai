const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    goal: { type: String, required: true },
    level: { type: String, required: true },
    duration: { type: Number, required: true },
    equipment: { type: String, required: true },
    note: { type: String, required: true },
    exercises: [{
      id: String,
      name: { type: String, required: true },
      instructions: String,
      sets: Number,
      reps: mongoose.Schema.Types.Mixed,
      duration: String,
      rest: String,
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Workout || mongoose.model('Workout', workoutSchema);
