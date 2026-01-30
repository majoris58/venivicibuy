import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Image, Save, X, GripVertical } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function BannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: '', subtitle: '', image: '', url: '', affiliateUrl: '', order: 0, isActive: true,
  });

  const fetchBanners = async () => {
    try {
      const res = await api.get('/banners/admin/all');
      setBanners(res.data);
    } catch {
      toast.error('Bannerlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  const resetForm = () => {
    setForm({ title: '', subtitle: '', image: '', url: '', affiliateUrl: '', order: 0, isActive: true });
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (b) => {
    setForm({
      title: b.title, subtitle: b.subtitle || '', image: b.image,
      url: b.url || '', affiliateUrl: b.affiliateUrl || '',
      order: b.order || 0, isActive: b.isActive,
    });
    setEditing(b._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/banners/${editing}`, form);
        toast.success('Banner güncellendi');
      } else {
        await api.post('/banners', form);
        toast.success('Banner eklendi');
      }
      resetForm();
      fetchBanners();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Hata oluştu');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Banner silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/banners/${id}`);
      toast.success('Banner silindi');
      fetchBanners();
    } catch {
      toast.error('Banner silinemedi');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banner Yönetimi</h1>
          <p className="text-sm text-gray-500 mt-1">Ana sayfa üst slider alanındaki görselleri yönetin</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Yeni Banner
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{editing ? 'Banner Düzenle' : 'Yeni Banner'}</h2>
            <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Başlık *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="label">Alt Başlık</label>
                <input type="text" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="input" />
              </div>
              <div className="md:col-span-2">
                <label className="label">Görsel URL *</label>
                <input type="url" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="input" required placeholder="Banner görseli (önerilen: 1200x400)" />
              </div>
              <div>
                <label className="label">Yönlendirme URL</label>
                <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Affiliate URL</label>
                <input type="url" value={form.affiliateUrl} onChange={(e) => setForm({ ...form, affiliateUrl: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Sıra</label>
                <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} className="input" />
              </div>
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded" />
                  <span className="text-sm">Aktif</span>
                </label>
              </div>
            </div>
            {form.image && (
              <div className="mt-2">
                <p className="label">Önizleme</p>
                <img src={form.image} alt="Preview" className="w-full max-w-lg h-40 object-cover rounded-lg border border-gray-200" />
              </div>
            )}
            <div className="flex justify-end">
              <button type="submit" className="btn-primary flex items-center gap-1"><Save className="w-4 h-4" /> Kaydet</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
        ) : banners.length === 0 ? (
          <div className="text-center py-10">
            <Image className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Henüz banner eklenmemiş</p>
          </div>
        ) : (
          <div className="space-y-3">
            {banners.map((b) => (
              <div key={b._id} className="flex items-center gap-4 p-3 border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
                <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <img src={b.image} alt="" className="w-32 h-20 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{b.title}</h3>
                  {b.subtitle && <p className="text-sm text-gray-500">{b.subtitle}</p>}
                  <p className="text-xs text-gray-400 mt-1">Sıra: {b.order}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {b.isActive ? 'Aktif' : 'Pasif'}
                </span>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => startEdit(b)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary-600"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(b._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
