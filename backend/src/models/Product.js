const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  description: { type: String },
  thumbnail: { type: String },
  images: [{ type: String }],
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand: { type: String },
  platform: { type: mongoose.Schema.Types.ObjectId, ref: 'Platform', required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  currency: { type: String, default: 'TRY' },
  url: { type: String, required: true },
  affiliateUrl: { type: String },
  tags: [{ type: String }],
  isFeatured: { type: Boolean, default: false },
  isDealOfDay: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  viewCount: { type: Number, default: 0 },
  clickCount: { type: Number, default: 0 },

  // Trendyol entegrasyonu
  trendyolContentId: { type: String, index: true },
  trendyolData: {
    name: String,
    brand: String,
    categoryName: String,
    description: String,
    images: [String],
    thumbnail: String,
    price: {
      sellingPrice: Number,
      originalPrice: Number,
      discountedPrice: Number,
    },
    rating: {
      averageRating: Number,
      totalRatingCount: Number,
      totalCommentCount: Number,
    },
    favoriteCount: Number,
    seller: String,
    url: String,
    fetchedAt: Date,
  },
}, { timestamps: true });

productSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

productSchema.index({ title: 'text', brand: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isDealOfDay: 1, isActive: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
