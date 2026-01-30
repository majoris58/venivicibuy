const mongoose = require('mongoose');

const platformSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, unique: true },
  logo: { type: String },
  website: { type: String },
  affiliateBaseUrl: { type: String },
  affiliateParam: { type: String },
  affiliateId: { type: String },
  color: { type: String, default: '#000000' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Platform', platformSchema);
