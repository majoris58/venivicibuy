const mongoose = require('mongoose');

const clickLogSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  platform: { type: mongoose.Schema.Types.ObjectId, ref: 'Platform', required: true },
  userAgent: { type: String },
  ip: { type: String },
  referrer: { type: String },
}, { timestamps: true });

clickLogSchema.index({ createdAt: -1 });
clickLogSchema.index({ product: 1, platform: 1 });

module.exports = mongoose.model('ClickLog', clickLogSchema);
