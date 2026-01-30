const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, isActive: true });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
    }
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/register', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin yetkisi gerekli' });
    }
    const { email, password, name, role } = req.body;
    const user = new User({ email, password, name, role });
    await user.save();
    res.status(201).json({ message: 'Kullanıcı oluşturuldu', user: { id: user._id, email, name, role } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
