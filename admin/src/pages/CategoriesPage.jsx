import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FolderTree, Save, X } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', icon: 'tag', description: '', order: 0, isActive: true, parent: '' });

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories/admin/all');
      setCategories(res.data);
    } catch {
      toast.error('Kategoriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const resetForm = () => {
    setForm({ name: '', icon: 'tag', description: '', order: 0, isActive: true, parent: '' });
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (cat) => {
    setForm({
      name: cat.name, icon: cat.icon || 'tag', description: cat.description || '',
      order: cat.order || 0, isActive: cat.isActive, parent: cat.parent?._id || '',
    });
    setEditing(cat._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form, parent: form.parent || null };
      if (editing) {
        await api.put(`/categories/${editing}`, data);
        toast.success('Kategori güncellendi');
      } else {
        await api.post('/categories', data);
        toast.success('Kategori eklendi');
      }
      resetForm();
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Hata oluştu');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Kategoriyi silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Kategori silindi');
      fetchCategories();
    } catch {
      toast.error('Kategori silinemedi');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kategoriler</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Yeni Kategori
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{editing ? 'Kategori Düzenle' : 'Yeni Kategori'}</h2>
            <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Kategori Adı *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="label">İkon</label>
              <input type="text" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="input" placeholder="lucide icon adı" />
            </div>
            <div>
              <label className="label">Sıra</label>
              <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} className="input" />
            </div>
            <div>
              <label className="label">Üst Kategori</label>
              <select value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })} className="input">
                <option value="">Ana Kategori</option>
                {categories.filter((c) => c._id !== editing).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Açıklama</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" />
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
        ) : categories.length === 0 ? (
          <div className="text-center py-10">
            <FolderTree className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Henüz kategori eklenmemiş</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Sıra</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Ad</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Üst Kategori</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Durum</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-500">{cat.order}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{cat.name}</td>
                  <td className="py-3 px-4 text-gray-600">{cat.parent?.name || '—'}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {cat.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => startEdit(cat)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary-600"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(cat._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
