const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { getTrendyolProduct, extractContentId } = require('../services/trendyol');
const Product = require('../models/Product');

const router = express.Router();

// Admin: Trendyol URL/contentId'den ürün bilgisi çek (preview)
router.post('/fetch', authMiddleware, async (req, res) => {
  try {
    const { trendyolUrl } = req.body;
    if (!trendyolUrl) {
      return res.status(400).json({ error: 'trendyolUrl gerekli' });
    }

    const data = await getTrendyolProduct(trendyolUrl);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Public: Bir ürünün Trendyol verisini getir (cache'li)
// Eğer cache 1 saatten eskiyse yeniden çeker
router.get('/product/:productId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }

    if (!product.trendyolContentId) {
      return res.status(400).json({ error: 'Bu ürün Trendyol ürünü değil' });
    }

    const ONE_HOUR = 60 * 60 * 1000;
    const isCacheStale =
      !product.trendyolData?.fetchedAt ||
      Date.now() - new Date(product.trendyolData.fetchedAt).getTime() > ONE_HOUR;

    if (isCacheStale) {
      try {
        const freshData = await getTrendyolProduct(product.trendyolContentId);
        product.trendyolData = freshData;
        // Fiyatları da senkronize et
        product.price = freshData.price.discountedPrice || freshData.price.sellingPrice;
        product.originalPrice = freshData.price.originalPrice;
        product.thumbnail = freshData.thumbnail;
        product.images = freshData.images;
        await product.save();
      } catch (fetchErr) {
        // Cache'deki veriyi kullan, hata logla
        console.error('Trendyol veri güncelleme hatası:', fetchErr.message);
      }
    }

    res.json({
      product: {
        _id: product._id,
        title: product.title,
        affiliateUrl: product.affiliateUrl,
        clickCount: product.clickCount,
      },
      trendyolData: product.trendyolData,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Trendyol verilerini manuel yenile
router.post('/refresh/:productId', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }
    if (!product.trendyolContentId) {
      return res.status(400).json({ error: 'Bu ürün Trendyol ürünü değil' });
    }

    const freshData = await getTrendyolProduct(product.trendyolContentId);
    product.trendyolData = freshData;
    product.price = freshData.price.discountedPrice || freshData.price.sellingPrice;
    product.originalPrice = freshData.price.originalPrice;
    product.thumbnail = freshData.thumbnail;
    product.images = freshData.images;
    await product.save();

    const populated = await Product.findById(product._id)
      .populate('category', 'name slug')
      .populate('platform', 'name slug logo color');

    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
