import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', brand: '', category: '', thumbnail: '',
    images: [''], tags: '', isFeatured: false, isActive: true, prices: [],
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
          category: p.category?._id || '', thumbnail: p.thumbnail || '',
          images: p.images?.length ? p.images : [''],
          tags: (p.tags || []).join(', '),
          isFeatured: p.isFeatured || false, isActive: p.isActive !== false,
          prices: (p.prices || []).map((pr) => ({
            platform: pr.platform?._id || pr.platform,
            price: pr.price, originalPrice: pr.originalPrice || '',
            url: pr.url, affiliateUrl: pr.affiliateUrl || '', inStock: pr.inStock !== false,
          })),
        });
      });
    }
  }, [id]);

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const addPrice = () => {
    setForm((prev) => ({
      ...prev,
      prices: [...prev.prices, { platform: '', price: '', originalPrice: '', url: '', affiliateUrl: '', inStock: true }],
    }));
  };

  const updatePrice = (index, field, value) => {
    setForm((prev) => {
      const prices = [...prev.prices];
      prices[index] = { ...prices[index], [field]: value };
      return { ...prev, prices };
    });
  };

  const removePrice = (index) => {
    setForm((prev) => ({ ...prev, prices: prev.prices.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        images: form.images.filter(Boolean),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        prices: form.prices.map((p) => ({
          ...p,
          price: Number(p.price),
          originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
        })),
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
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => updateField('isFeatured', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                <span className="text-sm text-gray-700">Öne Çıkan</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => updateField('isActive', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                <span className="text-sm text-gray-700">Aktif</span>
              </label>
            </div>
          </div>
        </div>

        {/* Platform Prices */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Platform Fiyatları</h2>
            <button type="button" onClick={addPrice} className="btn-primary flex items-center gap-1 text-sm py-1.5">
              <Plus className="w-4 h-4" /> Platform Ekle
            </button>
          </div>

          {form.prices.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Henüz fiyat eklenmedi. Yukarıdan platform ekleyin.</p>
          ) : (
            <div className="space-y-4">
              {form.prices.map((price, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Platform {index + 1}</span>
                    <button type="button" onClick={() => removePrice(index)} className="p-1 text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="label">Platform *</label>
                      <select value={price.platform} onChange={(e) => updatePrice(index, 'platform', e.target.value)} className="input" required>
                        <option value="">Seçin</option>
                        {platforms.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Fiyat (TL) *</label>
                      <input type="number" step="0.01" value={price.price} onChange={(e) => updatePrice(index, 'price', e.target.value)} className="input" required />
                    </div>
                    <div>
                      <label className="label">Orijinal Fiyat (TL)</label>
                      <input type="number" step="0.01" value={price.originalPrice} onChange={(e) => updatePrice(index, 'originalPrice', e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">Ürün URL *</label>
                      <input type="url" value={price.url} onChange={(e) => updatePrice(index, 'url', e.target.value)} className="input" required />
                    </div>
                    <div>
                      <label className="label">Affiliate URL</label>
                      <input type="url" value={price.affiliateUrl} onChange={(e) => updatePrice(index, 'affiliateUrl', e.target.value)} className="input" />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer pb-2">
                        <input type="checkbox" checked={price.inStock} onChange={(e) => updatePrice(index, 'inStock', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                        <span className="text-sm text-gray-700">Stokta</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
