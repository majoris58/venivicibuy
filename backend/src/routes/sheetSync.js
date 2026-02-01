const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { syncFromSheet, getSyncState } = require('../services/sheetSync');

const router = express.Router();

// Admin: sync durumunu görüntüle
router.get('/status', authMiddleware, (req, res) => {
  res.json(getSyncState());
});

// Admin: manuel sync tetikle
router.post('/trigger', authMiddleware, async (req, res) => {
  try {
    const sheetUrl = req.body.sheetUrl || process.env.GOOGLE_SHEET_URL;
    if (!sheetUrl) {
      return res.status(400).json({ error: 'Google Sheet URL gerekli. .env dosyasına GOOGLE_SHEET_URL ekleyin veya body ile gönderin.' });
    }

    const result = await syncFromSheet(sheetUrl);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: sheet URL'sini güncelle ve sync başlat
router.post('/configure', authMiddleware, async (req, res) => {
  try {
    const { sheetUrl } = req.body;
    if (!sheetUrl) {
      return res.status(400).json({ error: 'sheetUrl gerekli' });
    }

    // URL'yi env'e kaydetme yeteneğimiz yok ama runtime'da kullanabiliriz
    process.env.GOOGLE_SHEET_URL = sheetUrl;

    // Hemen sync başlat
    const result = await syncFromSheet(sheetUrl);
    res.json({ message: 'Sheet URL ayarlandı ve sync başlatıldı', ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
