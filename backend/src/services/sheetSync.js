const https = require('https');
const Product = require('../models/Product');
const Platform = require('../models/Platform');
const Category = require('../models/Category');
const { getTrendyolProduct, extractContentId } = require('./trendyol');

// Sync durumu
let syncState = {
  lastSync: null,
  status: 'idle', // idle | syncing | success | error
  message: '',
  stats: { added: 0, updated: 0, skipped: 0, errors: 0 },
};

function getSyncState() {
  return { ...syncState };
}

/**
 * Google Sheets'ten CSV olarak veri çeker.
 * Sheet "Bağlantısı olan herkes görüntüleyebilir" olarak ayarlanmalı.
 * URL formatı: https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv&sheet={SHEET_NAME}
 */
function fetchSheetCSV(sheetUrl) {
  return new Promise((resolve, reject) => {
    // Sheet URL'sinden ID çıkar
    const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return reject(new Error('Geçersiz Google Sheets URL'));

    const sheetId = match[1];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;

    const request = (url, redirectCount = 0) => {
      if (redirectCount > 5) return reject(new Error('Çok fazla yönlendirme'));

      https.get(url, { headers: { 'User-Agent': 'VeniViciBuy/1.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return request(res.headers.location, redirectCount + 1);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Sheet erişim hatası: HTTP ${res.statusCode}`));
        }

        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve(data));
        res.on('error', reject);
      }).on('error', reject);
    };

    request(csvUrl);
  });
}

/**
 * CSV string'ini parse eder.
 * İlk satır başlık satırı olarak kullanılır.
 */
function parseCSV(csv) {
  const lines = csv.split('\n').filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ? values[idx].trim() : '';
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Tek bir CSV satırını parse eder (tırnak içi virgülleri destekler).
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map((v) => v.replace(/^"|"$/g, ''));
}

/**
 * Platform adına göre Platform ID'si bulur veya oluşturur.
 */
const platformCache = {};
async function resolvePlatform(name) {
  if (!name) return null;
  const key = name.toLowerCase().trim();
  if (platformCache[key]) return platformCache[key];

  let platform = await Platform.findOne({ name: new RegExp(`^${key}$`, 'i') });
  if (!platform) {
    // Bilinen platformlar için varsayılan renk
    const colors = {
      trendyol: '#FF6000',
      hepsiburada: '#FF6600',
      n11: '#7B2D8E',
      amazon: '#FF9900',
      çiçeksepeti: '#E5007E',
    };
    platform = await Platform.create({
      name: name.trim(),
      slug: name.toLowerCase().trim().replace(/\s+/g, '-'),
      color: colors[key] || '#666666',
    });
  }
  platformCache[key] = platform._id;
  return platform._id;
}

/**
 * Kategori adına göre Category ID'si bulur veya oluşturur.
 */
const categoryCache = {};
async function resolveCategory(name) {
  if (!name) return null;
  const key = name.toLowerCase().trim();
  if (categoryCache[key]) return categoryCache[key];

  let category = await Category.findOne({ name: new RegExp(`^${key}$`, 'i') });
  if (!category) {
    category = await Category.create({ name: name.trim() });
  }
  categoryCache[key] = category._id;
  return category._id;
}

/**
 * Sheet'teki bir satırı Product verisine dönüştürür.
 *
 * Beklenen sütunlar (başlık satırı):
 * | başlık | platform | kategori | fiyat | eski_fiyat | url | affiliate_url | görsel | marka | etiketler | öne_çıkan | günün_fırsatı | trendyol_id | aktif |
 *
 * Alternatif İngilizce başlıklar da desteklenir:
 * | title | platform | category | price | original_price | url | affiliate_url | thumbnail | brand | tags | featured | deal_of_day | trendyol_id | active |
 */
async function rowToProduct(row) {
  const title = row['başlık'] || row['title'] || row['baslik'] || '';
  if (!title) return null;

  const platformName = row['platform'] || '';
  const categoryName = row['kategori'] || row['category'] || '';
  const price = parseFloat(row['fiyat'] || row['price'] || '0');
  const originalPrice = parseFloat(row['eski_fiyat'] || row['original_price'] || '0');
  const url = row['url'] || row['link'] || '';
  const affiliateUrl = row['affiliate_url'] || row['affiliate'] || row['referans'] || '';
  const thumbnail = row['görsel'] || row['gorsel'] || row['thumbnail'] || row['image'] || '';
  const brand = row['marka'] || row['brand'] || '';
  const tags = (row['etiketler'] || row['tags'] || '').split(',').map((t) => t.trim()).filter(Boolean);
  const isFeatured = ['true', 'evet', '1', 'yes'].includes((row['öne_çıkan'] || row['one_cikan'] || row['featured'] || '').toLowerCase());
  const isDealOfDay = ['true', 'evet', '1', 'yes'].includes((row['günün_fırsatı'] || row['gunun_firsati'] || row['deal_of_day'] || '').toLowerCase());
  const trendyolContentId = row['trendyol_id'] || row['trendyol'] || '';
  const isActive = !['false', 'hayır', 'hayir', '0', 'no'].includes((row['aktif'] || row['active'] || 'true').toLowerCase());

  if (!url && !trendyolContentId) return null;

  const platformId = await resolvePlatform(platformName || 'Diğer');
  const categoryId = await resolveCategory(categoryName || 'Genel');

  const data = {
    title,
    platform: platformId,
    category: categoryId,
    price: price || 0,
    url: url || '',
    isActive,
  };

  if (originalPrice) data.originalPrice = originalPrice;
  if (affiliateUrl) data.affiliateUrl = affiliateUrl;
  if (thumbnail) data.thumbnail = thumbnail;
  if (brand) data.brand = brand;
  if (tags.length) data.tags = tags;
  if (isFeatured) data.isFeatured = true;
  if (isDealOfDay) data.isDealOfDay = true;
  if (trendyolContentId) data.trendyolContentId = trendyolContentId;

  return data;
}

/**
 * Ana sync fonksiyonu.
 * Sheet'ten verileri çeker ve veritabanıyla senkronize eder.
 */
async function syncFromSheet(sheetUrl) {
  if (syncState.status === 'syncing') {
    throw new Error('Sync zaten devam ediyor');
  }

  syncState = {
    lastSync: new Date(),
    status: 'syncing',
    message: 'Sheet verisi çekiliyor...',
    stats: { added: 0, updated: 0, skipped: 0, errors: 0 },
  };

  try {
    // 1. CSV çek ve parse et
    const csv = await fetchSheetCSV(sheetUrl);
    const rows = parseCSV(csv);

    if (rows.length === 0) {
      syncState.status = 'error';
      syncState.message = 'Sheet boş veya okunamadı';
      return syncState;
    }

    syncState.message = `${rows.length} satır bulundu, işleniyor...`;

    // Cache'leri temizle
    Object.keys(platformCache).forEach((k) => delete platformCache[k]);
    Object.keys(categoryCache).forEach((k) => delete categoryCache[k]);

    // 2. Her satırı işle
    for (let i = 0; i < rows.length; i++) {
      try {
        const productData = await rowToProduct(rows[i]);
        if (!productData) {
          syncState.stats.skipped++;
          continue;
        }

        // URL veya trendyolContentId ile mevcut ürünü bul
        let existing = null;
        if (productData.trendyolContentId) {
          existing = await Product.findOne({ trendyolContentId: productData.trendyolContentId });
        }
        if (!existing && productData.url) {
          existing = await Product.findOne({ url: productData.url });
        }

        if (existing) {
          // Güncelle (sadece sheet'te dolu olan alanları)
          const updates = {};
          if (productData.title) updates.title = productData.title;
          if (productData.price) updates.price = productData.price;
          if (productData.originalPrice) updates.originalPrice = productData.originalPrice;
          if (productData.affiliateUrl) updates.affiliateUrl = productData.affiliateUrl;
          if (productData.thumbnail) updates.thumbnail = productData.thumbnail;
          if (productData.brand) updates.brand = productData.brand;
          if (productData.tags && productData.tags.length) updates.tags = productData.tags;
          updates.isFeatured = productData.isFeatured;
          updates.isDealOfDay = productData.isDealOfDay;
          updates.isActive = productData.isActive;
          updates.platform = productData.platform;
          updates.category = productData.category;

          await Product.findByIdAndUpdate(existing._id, updates);
          syncState.stats.updated++;
        } else {
          // Yeni ürün oluştur
          // Trendyol verisi varsa çek
          if (productData.trendyolContentId) {
            try {
              const trendyolData = await getTrendyolProduct(productData.trendyolContentId);
              productData.trendyolData = trendyolData;
              if (!productData.thumbnail && trendyolData.thumbnail) productData.thumbnail = trendyolData.thumbnail;
              if ((!productData.price || productData.price === 0) && trendyolData.price) {
                productData.price = trendyolData.price.discountedPrice || trendyolData.price.sellingPrice;
              }
              if (!productData.originalPrice && trendyolData.price) {
                productData.originalPrice = trendyolData.price.originalPrice;
              }
              if (!productData.url && trendyolData.url) productData.url = trendyolData.url;
              if (!productData.brand && trendyolData.brand) productData.brand = trendyolData.brand;
            } catch (tErr) {
              console.error(`Trendyol veri çekme hatası (${productData.trendyolContentId}):`, tErr.message);
            }
          }

          // URL zorunlu, hâlâ yoksa atla
          if (!productData.url) {
            syncState.stats.skipped++;
            continue;
          }

          const product = new Product(productData);
          await product.save();
          syncState.stats.added++;
        }
      } catch (rowErr) {
        console.error(`Satır ${i + 1} hatası:`, rowErr.message);
        syncState.stats.errors++;
      }
    }

    syncState.status = 'success';
    syncState.message = `Sync tamamlandı: ${syncState.stats.added} eklendi, ${syncState.stats.updated} güncellendi, ${syncState.stats.skipped} atlandı, ${syncState.stats.errors} hata`;
    console.log('[SheetSync]', syncState.message);
    return syncState;
  } catch (err) {
    syncState.status = 'error';
    syncState.message = err.message;
    console.error('[SheetSync] Hata:', err.message);
    throw err;
  }
}

/**
 * Otomatik sync zamanlayıcısı.
 * Her intervalMs milisaniyede bir çalışır.
 */
let syncInterval = null;

function startAutoSync(sheetUrl, intervalMs = 5 * 60 * 60 * 1000) {
  if (!sheetUrl) {
    console.log('[SheetSync] GOOGLE_SHEET_URL tanımlı değil, auto-sync devre dışı');
    return;
  }

  // İlk sync hemen çalışsın
  console.log(`[SheetSync] Auto-sync başlatıldı (her ${intervalMs / 3600000} saat)`);
  syncFromSheet(sheetUrl).catch((err) => {
    console.error('[SheetSync] İlk sync hatası:', err.message);
  });

  // Periyodik sync
  syncInterval = setInterval(() => {
    syncFromSheet(sheetUrl).catch((err) => {
      console.error('[SheetSync] Periyodik sync hatası:', err.message);
    });
  }, intervalMs);
}

function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('[SheetSync] Auto-sync durduruldu');
  }
}

module.exports = {
  syncFromSheet,
  startAutoSync,
  stopAutoSync,
  getSyncState,
  fetchSheetCSV,
  parseCSV,
};
