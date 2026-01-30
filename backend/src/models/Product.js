const mongoose = require('mongoose');
const slugify = require('slugify');

const priceEntrySchema = new mongoose.Schema({
  platform: { type: mongoose.Schema.Types.ObjectId, ref: 'Platform', required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  currency: { type: String, default: 'TRY' },
  url: { type: String, required: true },
  affiliateUrl: { type: String },
  inStock: { type: Boolean, default: true },
  lastChecked: { type: Date, default: Date.now },
});

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  description: { type: String },
  images: [{ type: String }],
  thumbnail: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand: { type: String },
  prices: [priceEntrySchema],
  bestPrice: { type: Number },
  bestPlatform: { type: mongoose.Schema.Types.ObjectId, ref: 'Platform' },
  tags: [{ type: String }],
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  viewCount: { type: Number, default: 0 },
  clickCount: { type: Number, default: 0 },
}, { timestamps: true });

productSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  // Calculate best price
  if (this.prices && this.prices.length > 0) {
    const activePrices = this.prices.filter((p) => p.inStock);
    if (activePrices.length > 0) {
      const best = activePrices.reduce((min, p) => (p.price < min.price ? p : min));
      this.bestPrice = best.price;
      this.bestPlatform = best.platform;
    }
  }
  next();
});

productSchema.index({ title: 'text', brand: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1, bestPrice: 1 });

module.exports = mongoose.model('Product', productSchema);
