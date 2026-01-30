import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Package, Star, Flame } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      const res = await api.get('/products/admin/all', { params });
      setProducts(res.data.products);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Ürünler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Ürün silindi');
      fetchProducts();
    } catch {
      toast.error('Ürün silinemedi');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ürünler</h1>
        <Link to="/products/new" className="btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-4 h-4" /> Yeni Ürün
        </Link>
      </div>

      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ürün ara..." className="input pl-10" />
          </div>
          <button type="submit" className="btn-primary">Ara</button>
        </form>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-10">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Henüz ürün eklenmemiş</p>
            <Link to="/products/new" className="btn-primary inline-flex items-center gap-2 mt-4"><Plus className="w-4 h-4" /> İlk Ürünü Ekle</Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Ürün</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Kategori</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Fiyat</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Platform</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">Etiketler</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">Durum</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {product.thumbnail ? (
                            <img src={product.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><Package className="w-5 h-5 text-gray-400" /></div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{product.title}</p>
                            <p className="text-xs text-gray-400">{product.brand}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{product.category?.name || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900">{product.price?.toLocaleString('tr-TR')} TL</span>
                        {product.originalPrice && (
                          <span className="block text-xs text-gray-400 line-through">{product.originalPrice.toLocaleString('tr-TR')} TL</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {product.platform && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: product.platform.color || '#999' }}>
                            {product.platform.name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {product.isFeatured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" title="Öne Çıkan" />}
                          {product.isDealOfDay && <Flame className="w-4 h-4 text-red-500" title="Günün Fırsatı" />}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {product.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/products/${product._id}/edit`} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary-600">
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button onClick={() => handleDelete(product._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">Toplam {pagination.total} ürün</p>
                <div className="flex gap-1">
                  {Array.from({ length: pagination.pages }, (_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-1 rounded-lg text-sm ${page === i + 1 ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
