const express = require('express');
const Product = require('../models/Product');
const ClickLog = require('../models/ClickLog');
const Category = require('../models/Category');
const Platform = require('../models/Platform');
const Banner = require('../models/Banner');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Ürün bazlı tıklama istatistikleri
router.get('/product/:productId/clicks', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const { days = 30 } = req.query;

    const product = await Product.findById(productId)
      .select('title thumbnail brand clickCount viewCount trendyolContentId affiliateUrl')
      .populate('platform', 'name logo color');

    if (!product) return res.status(404).json({ error: 'Ürün bulunamadı' });

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - parseInt(days));

    // Günlük tıklama grafiği
    const dailyClicks = await ClickLog.aggregate([
      { $match: { product: product._id, createdAt: { $gte: sinceDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } },
    ]);

    // Toplam tıklama (seçilen dönemde)
    const periodClicks = await ClickLog.countDocuments({
      product: product._id,
      createdAt: { $gte: sinceDate },
    });

    // Son 24 saat
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const last24hClicks = await ClickLog.countDocuments({
      product: product._id,
      createdAt: { $gte: oneDayAgo },
    });

    // Son 7 gün
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const last7dClicks = await ClickLog.countDocuments({
      product: product._id,
      createdAt: { $gte: weekAgo },
    });

    // Unique IP sayısı (yaklaşık benzersiz kullanıcı)
    const uniqueVisitors = await ClickLog.distinct('ip', {
      product: product._id,
      createdAt: { $gte: sinceDate },
    });

    // Son tıklamalar (detaylı log)
    const recentClicks = await ClickLog.find({ product: product._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('ip userAgent referrer createdAt')
      .populate('platform', 'name color');

    // Dönüşüm oranı (tıklama / görüntülenme)
    const conversionRate = product.viewCount > 0
      ? ((product.clickCount / product.viewCount) * 100).toFixed(1)
      : 0;

    res.json({
      product: {
        _id: product._id,
        title: product.title,
        thumbnail: product.thumbnail,
        brand: product.brand,
        platform: product.platform,
        affiliateUrl: product.affiliateUrl,
        trendyolContentId: product.trendyolContentId,
      },
      stats: {
        totalClicks: product.clickCount,
        totalViews: product.viewCount,
        conversionRate: parseFloat(conversionRate),
        periodClicks,
        last24hClicks,
        last7dClicks,
        uniqueVisitors: uniqueVisitors.length,
      },
      dailyClicks,
      recentClicks,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tüm ürünlerin tıklama özeti (sıralı)
router.get('/products/clicks', authMiddleware, async (req, res) => {
  try {
    const { sort = 'clicks', limit = 50 } = req.query;

    let sortOption = { clickCount: -1 };
    if (sort === 'views') sortOption = { viewCount: -1 };
    if (sort === 'recent') sortOption = { updatedAt: -1 };

    const products = await Product.find({})
      .sort(sortOption)
      .limit(parseInt(limit))
      .select('title thumbnail brand clickCount viewCount price isActive trendyolContentId createdAt')
      .populate('platform', 'name logo color')
      .populate('category', 'name');

    // Her ürün için son 7 günlük tıklama
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyClicksAgg = await ClickLog.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      { $group: { _id: '$product', weeklyClicks: { $sum: 1 } } },
    ]);

    const weeklyMap = {};
    weeklyClicksAgg.forEach((item) => {
      weeklyMap[item._id.toString()] = item.weeklyClicks;
    });

    const result = products.map((p) => ({
      _id: p._id,
      title: p.title,
      thumbnail: p.thumbnail,
      brand: p.brand,
      platform: p.platform,
      category: p.category,
      price: p.price,
      isActive: p.isActive,
      isTrendyol: Boolean(p.trendyolContentId),
      clickCount: p.clickCount,
      viewCount: p.viewCount,
      weeklyClicks: weeklyMap[p._id.toString()] || 0,
      conversionRate: p.viewCount > 0
        ? parseFloat(((p.clickCount / p.viewCount) * 100).toFixed(1))
        : 0,
      createdAt: p.createdAt,
    }));

    res.json({ products: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const [totalProducts, totalCategories, totalPlatforms, totalClicks, totalBanners] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Category.countDocuments({ isActive: true }),
      Platform.countDocuments({ isActive: true }),
      ClickLog.countDocuments(),
      Banner.countDocuments({ isActive: true }),
    ]);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyClicks = await ClickLog.countDocuments({ createdAt: { $gte: weekAgo } });

    const dealOfDayCount = await Product.countDocuments({ isActive: true, isDealOfDay: true });

    const topProducts = await Product.find({ isActive: true })
      .sort({ clickCount: -1 })
      .limit(10)
      .select('title thumbnail clickCount viewCount price')
      .populate('platform', 'name logo color');

    const clicksByPlatform = await ClickLog.aggregate([
      { $group: { _id: '$platform', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $lookup: { from: 'platforms', localField: '_id', foreignField: '_id', as: 'platform' } },
      { $unwind: '$platform' },
      { $project: { name: '$platform.name', logo: '$platform.logo', color: '$platform.color', count: 1 } },
    ]);

    res.json({
      overview: { totalProducts, totalCategories, totalPlatforms, totalClicks, weeklyClicks, totalBanners, dealOfDayCount },
      topProducts,
      clicksByPlatform,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
