const express = require('express');
const Category = require('../models/Category');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Public: get all active categories
router.get('/', async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.parent) filter.parent = req.query.parent;
    else if (req.query.root === 'true') filter.parent = null;

    const categories = await Category.find(filter)
      .populate('parent', 'name slug')
      .sort({ order: 1, name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: get all categories including inactive
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const categories = await Category.find()
      .populate('parent', 'name slug')
      .sort({ order: 1, name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate('parent', 'name slug');
    if (!category) return res.status(404).json({ error: 'Kategori bulunamadı' });
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ error: 'Kategori bulunamadı' });
    res.json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Kategori silindi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
