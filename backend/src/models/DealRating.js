const mongoose = require('mongoose');

const dealRatingSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  rating: { type: Number, required: true, min: 0, max: 100 },
  fingerprint: { type: String, required: true },
  ip: { type: String },
  userAgent: { type: String },
}, { timestamps: true });

// Her kullanıcı (fingerprint) bir ürüne sadece bir kez oy verebilir
dealRatingSchema.index({ product: 1, fingerprint: 1 }, { unique: true });
dealRatingSchema.index({ product: 1 });

module.exports = mongoose.model('DealRating', dealRatingSchema);
