const express = require('express');
const Product = require('../models/Product');
const ClickLog = require('../models/ClickLog');
const Category = require('../models/Category');
const Platform = require('../models/Platform');
const Banner = require('../models/Banner');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

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
