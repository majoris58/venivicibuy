const express = require('express');
const Product = require('../models/Product');
const ClickLog = require('../models/ClickLog');
const { authMiddleware } = require('../middleware/auth');
const { getTrendyolProduct, extractContentId } = require('../services/trendyol');

const router = express.Router();

// Public: list products with filtering
router.get('/', async (req, res) => {
  try {
    const { category, platform, search, sort, featured, dealOfDay, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (platform) filter.platform = platform;
    if (featured === 'true') filter.isFeatured = true;
    if (dealOfDay === 'true') filter.isDealOfDay = true;
    if (search) filter.$text = { $search: search };

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'popular') sortOption = { clickCount: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug icon')
        .populate('platform', 'name slug logo color')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug icon')
      .populate('platform', 'name slug logo color website');

    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }

    product.viewCount += 1;
    await product.save();

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: track click and redirect
router.post('/:id/click', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Ürün bulunamadı' });

    await ClickLog.create({
      product: product._id,
      platform: product.platform,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      referrer: req.headers.referer,
    });

    product.clickCount += 1;
    await product.save();

    const redirectUrl = product.affiliateUrl || product.url;
    res.json({ url: redirectUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: get all products
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const filter = {};
    if (search) filter.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .populate('platform', 'name slug logo color')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: create product
router.post('/', authMiddleware, async (req, res) => {
  try {
    const data = { ...req.body };

    // Trendyol URL verilmişse contentId çıkar ve verileri çek
    if (data.trendyolUrl || data.trendyolContentId) {
      const contentId = data.trendyolContentId || extractContentId(data.trendyolUrl);
      if (contentId) {
        data.trendyolContentId = contentId;
        try {
          const trendyolData = await getTrendyolProduct(contentId);
          data.trendyolData = trendyolData;
          // Trendyol'dan gelen verilerle otomatik doldur (admin override etmediyse)
          if (!data.title) data.title = trendyolData.name;
          if (!data.brand) data.brand = trendyolData.brand;
          if (!data.description) data.description = trendyolData.description;
          if (!data.thumbnail) data.thumbnail = trendyolData.thumbnail;
          if (!data.images || data.images.length === 0) data.images = trendyolData.images;
          if (!data.price) data.price = trendyolData.price.discountedPrice || trendyolData.price.sellingPrice;
          if (!data.originalPrice) data.originalPrice = trendyolData.price.originalPrice;
          if (!data.url) data.url = trendyolData.url;
        } catch (fetchErr) {
          console.error('Trendyol veri çekme hatası:', fetchErr.message);
        }
      }
      delete data.trendyolUrl;
    }

    const product = new Product(data);
    await product.save();
    const populated = await Product.findById(product._id)
      .populate('category', 'name slug')
      .populate('platform', 'name slug logo color');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: update product
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('category', 'name slug')
      .populate('platform', 'name slug logo color');
    if (!product) return res.status(404).json({ error: 'Ürün bulunamadı' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: delete product
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ürün silindi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
