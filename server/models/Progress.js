const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    weight: { type: Number, required: true, min: 1, max: 500 },
    date: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Progress || mongoose.model('Progress', progressSchema);
