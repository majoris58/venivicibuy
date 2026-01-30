import { useState, useEffect } from 'react';
import { Package, FolderTree, Globe, MousePointerClick, TrendingUp, Eye } from 'lucide-react';
import api from '../lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats/dashboard')
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>;

  const overview = stats?.overview || {};

  const cards = [
    { label: 'Toplam Ürün', value: overview.totalProducts || 0, icon: Package, color: 'bg-blue-500' },
    { label: 'Kategoriler', value: overview.totalCategories || 0, icon: FolderTree, color: 'bg-green-500' },
    { label: 'Platformlar', value: overview.totalPlatforms || 0, icon: Globe, color: 'bg-purple-500' },
    { label: 'Toplam Tıklama', value: overview.totalClicks || 0, icon: MousePointerClick, color: 'bg-orange-500' },
    { label: 'Haftalık Tıklama', value: overview.weeklyClicks || 0, icon: TrendingUp, color: 'bg-pink-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="card flex items-center gap-4">
            <div className={`${card.color} p-3 rounded-xl`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value.toLocaleString('tr-TR')}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">En Çok Tıklanan Ürünler</h2>
          <div className="space-y-3">
            {(stats?.topProducts || []).map((product, i) => (
              <div key={product._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <span className="text-sm font-bold text-gray-400 w-6">{i + 1}</span>
                {product.thumbnail ? (
                  <img src={product.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><Package className="w-5 h-5 text-gray-400" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.title}</p>
                  <p className="text-xs text-gray-500">{product.bestPrice?.toLocaleString('tr-TR')} TL</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MousePointerClick className="w-3.5 h-3.5" />
                    {product.clickCount}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Eye className="w-3 h-3" />
                    {product.viewCount}
                  </div>
                </div>
              </div>
            ))}
            {(!stats?.topProducts || stats.topProducts.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-4">Henüz veri yok</p>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Tıklamaları</h2>
          <div className="space-y-3">
            {(stats?.clicksByPlatform || []).map((item) => (
              <div key={item._id} className="flex items-center gap-3 p-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: item.color || '#666' }}>
                  {item.name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        backgroundColor: item.color || '#3b82f6',
                        width: `${Math.min(100, (item.count / (stats.clicksByPlatform[0]?.count || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-700">{item.count}</span>
              </div>
            ))}
            {(!stats?.clicksByPlatform || stats.clicksByPlatform.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-4">Henüz veri yok</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
