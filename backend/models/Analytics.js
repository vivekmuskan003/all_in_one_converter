const mongoose = require('mongoose');

// Daily snapshot — one document per day per tool
const dailyStatSchema = new mongoose.Schema({
  date:  { type: String, index: true }, // 'YYYY-MM-DD'
  tool:  { type: String, index: true }, // audio|video|document|image|compression
  count: { type: Number, default: 0 },
}, { _id: false });

const analyticsSchema = new mongoose.Schema({
  totalRequests: { type: Number, default: 0 },
  toolUsage: {
    audio:       { type: Number, default: 0 },
    video:       { type: Number, default: 0 },
    document:    { type: Number, default: 0 },
    image:       { type: Number, default: 0 },
    compression: { type: Number, default: 0 },
  },
  daily: [dailyStatSchema],   // per-day breakdown
}, { timestamps: true });

module.exports = mongoose.model('Analytics', analyticsSchema);
