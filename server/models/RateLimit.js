const mongoose = require('mongoose');

const RateLimitSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true, default: 0 },
  resetTime: { type: Date, required: true },
});

// TTL index: MongoDB will automatically delete expired documents
RateLimitSchema.index({ resetTime: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RateLimit', RateLimitSchema);
