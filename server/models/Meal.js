const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    foods: [{
      name: { type: String, required: true },
      category: String,
      serving: String,
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      vegetarian: Boolean,
    }],
    nutrition: {
      calories: { type: Number, required: true },
      protein: { type: Number, required: true },
      carbs: { type: Number, required: true },
      fat: { type: Number, required: true },
    },
    favorite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Meal || mongoose.model('Meal', mealSchema);
