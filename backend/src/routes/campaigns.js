const express = require('express');
const Campaign = require('../models/Campaign');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const campaigns = await Campaign.find({
      isActive: true,
      $or: [{ endDate: { $gte: now } }, { endDate: null }],
    })
      .populate('platform', 'name slug logo color')
      .sort({ order: 1, createdAt: -1 });
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .populate('platform', 'name slug logo color')
      .sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const campaign = new Campaign(req.body);
    await campaign.save();
    const populated = await Campaign.findById(campaign._id).populate('platform', 'name slug logo color');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('platform', 'name slug logo color');
    if (!campaign) return res.status(404).json({ error: 'Kampanya bulunamadı' });
    res.json(campaign);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Campaign.findByIdAndDelete(req.params.id);
    res.json({ message: 'Kampanya silindi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
