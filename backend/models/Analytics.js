const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  totalRequests: { type: Number, default: 0 },
  toolUsage: {
    audio: { type: Number, default: 0 },
    video: { type: Number, default: 0 },
    document: { type: Number, default: 0 },
    image: { type: Number, default: 0 },
    compression: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Analytics', analyticsSchema);
