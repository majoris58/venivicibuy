import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Download, RefreshCw, ExternalLink, Star } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [saving, setSaving] = useState(false);
  const [fetchingTrendyol, setFetchingTrendyol] = useState(false);
  const [trendyolUrl, setTrendyolUrl] = useState('');
  const [trendyolPreview, setTrendyolPreview] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', brand: '', category: '', platform: '',
    price: '', originalPrice: '', url: '', affiliateUrl: '',
    thumbnail: '', tags: '', trendyolContentId: '',
    isFeatured: false, isDealOfDay: false, isActive: true,
  });

  useEffect(() => {
    Promise.all([
      api.get('/categories/admin/all'),
      api.get('/platforms/admin/all'),
    ]).then(([catRes, platRes]) => {
      setCategories(catRes.data);
      setPlatforms(platRes.data);
    });

    if (isEdit) {
      api.get(`/products/${id}`).then((res) => {
        const p = res.data;
        setForm({
          title: p.title || '', description: p.description || '', brand: p.brand || '',
          category: p.category?._id || '', platform: p.platform?._id || '',
          price: p.price || '', originalPrice: p.originalPrice || '',
          url: p.url || '', affiliateUrl: p.affiliateUrl || '',
          thumbnail: p.thumbnail || '',
          tags: (p.tags || []).join(', '),
          trendyolContentId: p.trendyolContentId || '',
          isFeatured: p.isFeatured || false,
          isDealOfDay: p.isDealOfDay || false,
          isActive: p.isActive !== false,
        });
        if (p.trendyolData) setTrendyolPreview(p.trendyolData);
      });
    }
  }, [id]);

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleFetchTrendyol = async () => {
    if (!trendyolUrl.trim()) {
      toast.error('Trendyol URL veya Content ID giriniz');
      return;
    }
    setFetchingTrendyol(true);
    try {
      const res = await api.post('/trendyol/fetch', { trendyolUrl: trendyolUrl.trim() });
      const data = res.data;
      setTrendyolPreview(data);

      // Formu Trendyol verileriyle doldur
      setForm((prev) => ({
        ...prev,
        title: data.name || prev.title,
        brand: data.brand || prev.brand,
        description: data.description || prev.description,
        thumbnail: data.thumbnail || prev.thumbnail,
        price: data.price?.discountedPrice || data.price?.sellingPrice || prev.price,
        originalPrice: data.price?.originalPrice || prev.originalPrice,
        url: data.url || prev.url,
        trendyolContentId: String(data.contentId) || prev.trendyolContentId,
      }));

      toast.success('Trendyol ürün bilgileri çekildi');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Trendyol verisi çekilemedi');
    } finally {
      setFetchingTrendyol(false);
    }
  };

  const handleRefreshTrendyol = async () => {
    if (!isEdit) return;
    setFetchingTrendyol(true);
    try {
      const res = await api.post(`/trendyol/refresh/${id}`);
      const p = res.data;
      setForm((prev) => ({
        ...prev,
        price: p.price || prev.price,
        originalPrice: p.originalPrice || prev.originalPrice,
        thumbnail: p.thumbnail || prev.thumbnail,
      }));
      if (p.trendyolData) setTrendyolPreview(p.trendyolData);
      toast.success('Trendyol verileri güncellendi');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Güncelleme başarısız');
    } finally {
      setFetchingTrendyol(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        trendyolContentId: form.trendyolContentId || undefined,
      };

      if (isEdit) {
        await api.put(`/products/${id}`, data);
        toast.success('Ürün güncellendi');
      } else {
        await api.post('/products', data);
        toast.success('Ürün eklendi');
      }
      navigate('/products');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/products')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Ürün Düzenle' : 'Yeni Ürün'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Trendyol Import */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Trendyol Ürün İçe Aktarma</h2>
          <p className="text-sm text-gray-500 mb-4">Trendyol ürün linkini veya Content ID girerek ürün bilgilerini otomatik doldurun.</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={trendyolUrl}
              onChange={(e) => setTrendyolUrl(e.target.value)}
              className="input flex-1"
              placeholder="https://www.trendyol.com/marka/urun-p-123456 veya 123456"
            />
            <button
              type="button"
              onClick={handleFetchTrendyol}
              disabled={fetchingTrendyol}
              className="btn-primary flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {fetchingTrendyol ? 'Çekiliyor...' : 'Verileri Çek'}
            </button>
            {isEdit && form.trendyolContentId && (
              <button
                type="button"
                onClick={handleRefreshTrendyol}
                disabled={fetchingTrendyol}
                className="btn-secondary flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                Yenile
              </button>
            )}
          </div>
          {form.trendyolContentId && (
            <div className="mt-2 text-xs text-gray-400">Content ID: {form.trendyolContentId}</div>
          )}

          {/* Trendyol Preview */}
          {trendyolPreview && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex gap-4">
                {trendyolPreview.thumbnail && (
                  <img src={trendyolPreview.thumbnail} alt="" className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">{trendyolPreview.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{trendyolPreview.brand} • {trendyolPreview.seller}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm font-bold text-green-600">
                      {(trendyolPreview.price?.discountedPrice || trendyolPreview.price?.sellingPrice || 0).toLocaleString('tr-TR')} TL
                    </span>
                    {trendyolPreview.price?.originalPrice > (trendyolPreview.price?.discountedPrice || 0) && (
                      <span className="text-xs text-gray-400 line-through">
                        {trendyolPreview.price.originalPrice.toLocaleString('tr-TR')} TL
                      </span>
                    )}
                  </div>
                  {trendyolPreview.rating && (
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs text-gray-500">
                        {trendyolPreview.rating.averageRating?.toFixed(1)} ({trendyolPreview.rating.totalCommentCount} yorum)
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {trendyolPreview.images?.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto">
                  {trendyolPreview.images.slice(0, 6).map((img, i) => (
                    <img key={i} src={img} alt="" className="w-12 h-12 object-cover rounded flex-shrink-0" />
                  ))}
                  {trendyolPreview.images.length > 6 && (
                    <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center flex-shrink-0 text-xs text-gray-500">
                      +{trendyolPreview.images.length - 6}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Temel Bilgiler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Ürün Adı *</label>
              <input type="text" value={form.title} onChange={(e) => updateField('title', e.target.value)} className="input" required />
            </div>
            <div>
              <label className="label">Marka</label>
              <input type="text" value={form.brand} onChange={(e) => updateField('brand', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Kategori *</label>
              <select value={form.category} onChange={(e) => updateField('category', e.target.value)} className="input" required>
                <option value="">Seçin</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Açıklama</label>
              <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} className="input" rows={3} />
            </div>
            <div>
              <label className="label">Thumbnail URL</label>
              <input type="url" value={form.thumbnail} onChange={(e) => updateField('thumbnail', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Etiketler (virgülle ayırın)</label>
              <input type="text" value={form.tags} onChange={(e) => updateField('tags', e.target.value)} className="input" placeholder="indirim, çok satan, yeni" />
            </div>
          </div>
        </div>

        {/* Platform & Price */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform & Fiyat</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Platform *</label>
              <select value={form.platform} onChange={(e) => updateField('platform', e.target.value)} className="input" required>
                <option value="">Seçin</option>
                {platforms.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Fiyat (TL) *</label>
              <input type="number" step="0.01" value={form.price} onChange={(e) => updateField('price', e.target.value)} className="input" required />
            </div>
            <div>
              <label className="label">Orijinal Fiyat (TL)</label>
              <input type="number" step="0.01" value={form.originalPrice} onChange={(e) => updateField('originalPrice', e.target.value)} className="input" placeholder="İndirim öncesi fiyat" />
            </div>
            <div>
              <label className="label">Ürün URL *</label>
              <input type="url" value={form.url} onChange={(e) => updateField('url', e.target.value)} className="input" required />
            </div>
            <div>
              <label className="label">Affiliate URL</label>
              <input type="url" value={form.affiliateUrl} onChange={(e) => updateField('affiliateUrl', e.target.value)} className="input" placeholder="Referans linki" />
            </div>
          </div>
        </div>

        {/* Visibility */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Görünürlük</h2>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => updateField('isFeatured', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary-600" />
              <span className="text-sm text-gray-700">Öne Çıkan Ürün</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isDealOfDay} onChange={(e) => updateField('isDealOfDay', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-red-500" />
              <span className="text-sm text-gray-700">Günün Fırsatı</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => updateField('isActive', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary-600" />
              <span className="text-sm text-gray-700">Aktif</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/products')} className="btn-secondary">İptal</button>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
}
