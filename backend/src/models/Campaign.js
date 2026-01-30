const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  platform: { type: mongoose.Schema.Types.ObjectId, ref: 'Platform' },
  url: { type: String },
  affiliateUrl: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  discountPercentage: { type: Number },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);
