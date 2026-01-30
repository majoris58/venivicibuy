const express = require('express');
const Platform = require('../models/Platform');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const platforms = await Platform.find({ isActive: true }).sort({ name: 1 });
    res.json(platforms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const platforms = await Platform.find().sort({ name: 1 });
    res.json(platforms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const platform = new Platform(req.body);
    await platform.save();
    res.status(201).json(platform);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const platform = await Platform.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!platform) return res.status(404).json({ error: 'Platform bulunamadı' });
    res.json(platform);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await Platform.findByIdAndDelete(req.params.id);
    res.json({ message: 'Platform silindi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
