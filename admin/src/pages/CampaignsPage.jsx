import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Megaphone, Save, X } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', image: '', platform: '', url: '',
    affiliateUrl: '', startDate: '', endDate: '', discountPercentage: '',
    isActive: true, order: 0,
  });

  const fetchData = async () => {
    try {
      const [campRes, platRes] = await Promise.all([
        api.get('/campaigns/admin/all'),
        api.get('/platforms/admin/all'),
      ]);
      setCampaigns(campRes.data);
      setPlatforms(platRes.data);
    } catch {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({ title: '', description: '', image: '', platform: '', url: '', affiliateUrl: '', startDate: '', endDate: '', discountPercentage: '', isActive: true, order: 0 });
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (c) => {
    setForm({
      title: c.title, description: c.description || '', image: c.image || '',
      platform: c.platform?._id || '', url: c.url || '', affiliateUrl: c.affiliateUrl || '',
      startDate: c.startDate ? c.startDate.slice(0, 10) : '',
      endDate: c.endDate ? c.endDate.slice(0, 10) : '',
      discountPercentage: c.discountPercentage || '', isActive: c.isActive, order: c.order || 0,
    });
    setEditing(c._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...form,
        platform: form.platform || undefined,
        discountPercentage: form.discountPercentage ? Number(form.discountPercentage) : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      };
      if (editing) {
        await api.put(`/campaigns/${editing}`, data);
        toast.success('Kampanya güncellendi');
      } else {
        await api.post('/campaigns', data);
        toast.success('Kampanya eklendi');
      }
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Hata oluştu');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Kampanyayı silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/campaigns/${id}`);
      toast.success('Kampanya silindi');
      fetchData();
    } catch {
      toast.error('Kampanya silinemedi');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kampanyalar</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Yeni Kampanya
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{editing ? 'Kampanya Düzenle' : 'Yeni Kampanya'}</h2>
            <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="md:col-span-2 lg:col-span-3">
              <label className="label">Kampanya Başlığı *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" required />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="label">Açıklama</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" rows={2} />
            </div>
            <div>
              <label className="label">Platform</label>
              <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className="input">
                <option value="">Genel</option>
                {platforms.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">İndirim %</label>
              <input type="number" value={form.discountPercentage} onChange={(e) => setForm({ ...form, discountPercentage: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Görsel URL</label>
              <input type="url" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Kampanya URL</label>
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
            <div>
              <label className="label">Başlangıç</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Bitiş</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input" />
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

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-10">
            <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Henüz kampanya eklenmemiş</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c) => (
              <div key={c._id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
                {c.image ? (
                  <img src={c.image} alt="" className="w-20 h-14 rounded-lg object-cover" />
                ) : (
                  <div className="w-20 h-14 rounded-lg bg-gray-100 flex items-center justify-center"><Megaphone className="w-6 h-6 text-gray-400" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{c.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    {c.platform && (
                      <span className="px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: c.platform.color }}>{c.platform.name}</span>
                    )}
                    {c.discountPercentage && <span className="text-red-500 font-semibold">%{c.discountPercentage} indirim</span>}
                    {c.endDate && <span>Bitiş: {new Date(c.endDate).toLocaleDateString('tr-TR')}</span>}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {c.isActive ? 'Aktif' : 'Pasif'}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary-600"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(c._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
