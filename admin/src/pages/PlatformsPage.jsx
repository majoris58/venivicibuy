import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Globe, Save, X } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function PlatformsPage() {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', slug: '', website: '', logo: '', color: '#000000',
    affiliateBaseUrl: '', affiliateParam: '', affiliateId: '', isActive: true,
  });

  const fetchPlatforms = async () => {
    try {
      const res = await api.get('/platforms/admin/all');
      setPlatforms(res.data);
    } catch {
      toast.error('Platformlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlatforms(); }, []);

  const resetForm = () => {
    setForm({ name: '', slug: '', website: '', logo: '', color: '#000000', affiliateBaseUrl: '', affiliateParam: '', affiliateId: '', isActive: true });
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (p) => {
    setForm({
      name: p.name, slug: p.slug || '', website: p.website || '', logo: p.logo || '',
      color: p.color || '#000000', affiliateBaseUrl: p.affiliateBaseUrl || '',
      affiliateParam: p.affiliateParam || '', affiliateId: p.affiliateId || '', isActive: p.isActive,
    });
    setEditing(p._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/platforms/${editing}`, form);
        toast.success('Platform güncellendi');
      } else {
        await api.post('/platforms', form);
        toast.success('Platform eklendi');
      }
      resetForm();
      fetchPlatforms();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Hata oluştu');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Platformu silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/platforms/${id}`);
      toast.success('Platform silindi');
      fetchPlatforms();
    } catch {
      toast.error('Platform silinemedi');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Platformlar</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Yeni Platform
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{editing ? 'Platform Düzenle' : 'Yeni Platform'}</h2>
            <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Platform Adı *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="label">Slug</label>
              <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Website</label>
              <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Logo URL</label>
              <input type="url" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Renk</label>
              <div className="flex gap-2">
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                <input type="text" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="input flex-1" />
              </div>
            </div>
            <div>
              <label className="label">Affiliate Base URL</label>
              <input type="text" value={form.affiliateBaseUrl} onChange={(e) => setForm({ ...form, affiliateBaseUrl: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Affiliate Param</label>
              <input type="text" value={form.affiliateParam} onChange={(e) => setForm({ ...form, affiliateParam: e.target.value })} className="input" placeholder="ref, tag, utm_source..." />
            </div>
            <div>
              <label className="label">Affiliate ID</label>
              <input type="text" value={form.affiliateId} onChange={(e) => setForm({ ...form, affiliateId: e.target.value })} className="input" />
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded" />
                <span className="text-sm">Aktif</span>
              </label>
              <button type="submit" className="btn-primary flex items-center gap-1"><Save className="w-4 h-4" /> Kaydet</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
        ) : platforms.length === 0 ? (
          <div className="text-center py-10">
            <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Henüz platform eklenmemiş</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
            {platforms.map((p) => (
              <div key={p._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: p.color }}>
                    {p.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{p.name}</h3>
                    <p className="text-xs text-gray-500">{p.website}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {p.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                {p.affiliateId && <p className="text-xs text-gray-400 mb-3">Affiliate: {p.affiliateId}</p>}
                <div className="flex justify-end gap-2">
                  <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary-600"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(p._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
