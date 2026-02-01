const https = require('https');

const TRENDYOL_API_BASE =
  'https://public.trendyol.com/discovery-web-productgw-service/api/productDetail';

/**
 * Trendyol URL'den contentId çıkarır.
 * Desteklenen formatlar:
 *   - https://www.trendyol.com/marka/urun-p-123456
 *   - https://www.trendyol.com/marka/urun-p-123456?boutiqueId=...
 *   - Sadece sayısal contentId: "123456"
 */
function extractContentId(input) {
  if (!input) return null;
  const trimmed = input.trim();

  // Sadece sayıysa direkt döndür
  if (/^\d+$/.test(trimmed)) return trimmed;

  // URL'den -p-{contentId} pattern'ini çıkar
  const match = trimmed.match(/-p-(\d+)/);
  return match ? match[1] : null;
}

/**
 * Trendyol public API'den ürün detaylarını çeker.
 */
function fetchProductDetail(contentId) {
  const url = `${TRENDYOL_API_BASE}/${contentId}?storefrontId=1&culture=tr-TR&linearVariants=true&channelId=1`;

  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            reject(new Error('Trendyol API yanıtı parse edilemedi'));
          }
        });
      })
      .on('error', (err) => reject(err));
  });
}

/**
 * Raw Trendyol API yanıtını normalize eder.
 * Sadece ihtiyacımız olan verileri döndürür.
 */
function normalizeProductData(raw) {
  const result = raw?.result;
  if (!result) return null;

  const images = (result.images || []).map(
    (img) => `https://cdn.dsmcdn.com${img}`
  );

  const ratingScore = result.ratingScore || {};

  // Fiyat bilgisi
  const price = result.price || {};

  // Favori sayısı
  const favoriteCount = result.favoriteCount || 0;

  // Renk/varyant bilgisi
  const variants = (result.variants || []).map((v) => ({
    attributeName: v.attributeName,
    attributeValue: v.attributeValue,
    price: v.price,
    listPrice: v.listPrice,
    inStock: v.inStock,
  }));

  return {
    contentId: result.id || result.contentId,
    name: result.name,
    brand: result.brand?.name || '',
    categoryName: result.categoryName || result.category?.name || '',
    categoryHierarchy: result.categoryHierarchy || '',
    description: result.description || result.contentDescriptions?.[0]?.description || '',
    images,
    thumbnail: images[0] || '',
    price: {
      sellingPrice: price.sellingPrice || price.discountedPrice || 0,
      originalPrice: price.originalPrice || price.listPrice || 0,
      discountedPrice: price.discountedPrice || price.sellingPrice || 0,
      currency: 'TRY',
    },
    rating: {
      averageRating: ratingScore.averageRating || 0,
      totalRatingCount: ratingScore.totalRatingCount || 0,
      totalCommentCount: ratingScore.totalCommentCount || 0,
    },
    favoriteCount,
    variants,
    seller: result.merchant?.name || result.seller?.name || '',
    url: result.url
      ? `https://www.trendyol.com${result.url}`
      : '',
    fetchedAt: new Date(),
  };
}

/**
 * Ana fonksiyon: contentId veya URL alır, ürün bilgilerini döndürür.
 */
async function getTrendyolProduct(contentIdOrUrl) {
  const contentId = extractContentId(contentIdOrUrl);
  if (!contentId) {
    throw new Error('Geçerli bir Trendyol ürün URL veya contentId giriniz');
  }

  const raw = await fetchProductDetail(contentId);
  const normalized = normalizeProductData(raw);

  if (!normalized) {
    throw new Error('Ürün bilgileri alınamadı. ContentId geçersiz olabilir.');
  }

  return normalized;
}

module.exports = {
  extractContentId,
  fetchProductDetail,
  normalizeProductData,
  getTrendyolProduct,
};
