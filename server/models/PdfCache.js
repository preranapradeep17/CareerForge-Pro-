const mongoose = require('mongoose');

const PdfCacheSchema = new mongoose.Schema({
  hash: { type: String, required: true, unique: true },
  pdfBuffer: { type: Buffer, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
});

// Automatically expire cache entries after 7 days (604800 seconds)
PdfCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('PdfCache', PdfCacheSchema);
