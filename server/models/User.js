const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    age: { type: Number, required: true, min: 13, max: 120 },
    goal: {
      type: String,
      enum: ['Weight Loss', 'Muscle Gain', 'General Fitness'],
      default: 'General Fitness',
    },
    fitnessLevel: { type: String, enum: ['Beginner', 'Intermediate'], default: 'Beginner' },
    availableTime: { type: Number, min: 10, max: 120, default: 20 },
    equipment: { type: String, enum: ['Bodyweight', 'Dumbbells', 'Yoga mat', 'Home gym'], default: 'Bodyweight' },
    dietPreference: { type: String, enum: ['Any', 'Vegetarian', 'Non-vegetarian'], default: 'Any' },
    allergens: [{ type: String, enum: ['dairy', 'egg', 'fish', 'gluten', 'peanut', 'sesame', 'shellfish', 'soy', 'tree nuts'] }],
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
