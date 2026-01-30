import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
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
    title: '', description: '', brand: '', category: '', platform: '',
    price: '', originalPrice: '', url: '', affiliateUrl: '',
    thumbnail: '', tags: '',
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
          isFeatured: p.isFeatured || false,
          isDealOfDay: p.isDealOfDay || false,
          isActive: p.isActive !== false,
        });
      });
    }
  }, [id]);

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
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
