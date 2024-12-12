const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 },
  lovePoints: { type: Number, default: 0 },
  marriedTo: { type: String, default: null },
  replies: { type: [String], default: [] },
  lastLove: { type: Date, default: null },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
