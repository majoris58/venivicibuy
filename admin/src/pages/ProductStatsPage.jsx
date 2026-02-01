import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, MousePointerClick, Eye, TrendingUp, Users,
  Clock, ExternalLink, RefreshCw, Calendar, Gauge,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function ProductStatsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [dealRating, setDealRating] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [statsRes, ratingRes] = await Promise.all([
        api.get(`/stats/product/${id}/clicks`, { params: { days } }),
        api.get(`/products/${id}/deal-rating`).catch(() => ({ data: null })),
      ]);
      setData(statsRes.data);
      setDealRating(ratingRes.data);
    } catch {
      toast.error('İstatistikler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, [id, days]);

  const getDealRatingColor = (rating) => {
    if (rating >= 75) return '#22c55e';
    if (rating >= 50) return '#84cc16';
    if (rating >= 25) return '#f59e0b';
    return '#ef4444';
  };

  const getDealRatingLabel = (rating) => {
    if (rating >= 75) return 'Çok Avantajlı';
    if (rating >= 50) return 'Avantajlı';
    if (rating >= 25) return 'Orta';
    return 'Düşük';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Veri bulunamadı</p>
        <button onClick={() => navigate('/products')} className="btn-primary mt-4">Ürünlere Dön</button>
      </div>
    );
  }

  const { product, stats, dailyClicks, recentClicks } = data;

  // Günlük tıklama grafiği için max değer
  const maxDailyClick = Math.max(...dailyClicks.map((d) => d.count), 1);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/products')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">Ürün İstatistikleri</h1>
          <p className="text-sm text-gray-500 truncate">{product.title}</p>
        </div>
        <button onClick={fetchStats} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Yenile
        </button>
      </div>

      {/* Ürün Bilgi Kartı */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          {product.thumbnail ? (
            <img src={product.thumbnail} alt="" className="w-16 h-16 rounded-lg object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
              <MousePointerClick className="w-8 h-8 text-gray-300" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 truncate">{product.title}</h2>
            <p className="text-sm text-gray-500">{product.brand}</p>
            {product.platform && (
              <span
                className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: product.platform.color || '#999' }}
              >
                {product.platform.name}
              </span>
            )}
          </div>
          {product.affiliateUrl && (
            <a
              href={product.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <ExternalLink className="w-4 h-4" /> Affiliate Link
            </a>
          )}
        </div>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <MousePointerClick className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalClicks}</p>
              <p className="text-xs text-gray-500">Toplam Tıklama</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Eye className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalViews}</p>
              <p className="text-xs text-gray-500">Toplam Görüntülenme</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">%{stats.conversionRate}</p>
              <p className="text-xs text-gray-500">Dönüşüm Oranı</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.uniqueVisitors}</p>
              <p className="text-xs text-gray-500">Benzersiz Ziyaretçi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Deal Rating */}
      {dealRating && dealRating.totalVotes > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-gray-400" /> Fırsat Değerlendirmesi
            </h3>
            <span className="text-sm text-gray-500">{dealRating.totalVotes} oy</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div
                className="text-4xl font-black"
                style={{ color: getDealRatingColor(dealRating.averageRating) }}
              >
                {dealRating.averageRating}
              </div>
              <div
                className="text-xs font-semibold mt-1"
                style={{ color: getDealRatingColor(dealRating.averageRating) }}
              >
                {getDealRatingLabel(dealRating.averageRating)}
              </div>
            </div>
            <div className="flex-1">
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${dealRating.averageRating}%`,
                    background: `linear-gradient(90deg, #ef4444 0%, #f59e0b 33%, #84cc16 66%, #22c55e 100%)`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-400">Düşük</span>
                <span className="text-[10px] text-gray-400">Orta</span>
                <span className="text-[10px] text-gray-400">Avantajlı</span>
                <span className="text-[10px] text-gray-400">Süper</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hızlı İstatistikler */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card flex items-center gap-3">
          <Clock className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-lg font-bold text-gray-900">{stats.last24hClicks}</p>
            <p className="text-xs text-gray-500">Son 24 Saat</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-lg font-bold text-gray-900">{stats.last7dClicks}</p>
            <p className="text-xs text-gray-500">Son 7 Gün</p>
          </div>
        </div>
      </div>

      {/* Günlük Tıklama Grafiği */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Günlük Tıklamalar</h3>
          <div className="flex gap-2">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  days === d ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {d} gün
              </button>
            ))}
          </div>
        </div>
        {dailyClicks.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Bu dönemde tıklama verisi yok</p>
        ) : (
          <div className="space-y-2">
            {dailyClicks.map((day) => (
              <div key={day.date} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-20 flex-shrink-0">{day.date.slice(5)}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                    style={{ width: `${Math.max((day.count / maxDailyClick) * 100, 8)}%` }}
                  >
                    {day.count > 0 && (
                      <span className="text-[10px] font-bold text-white">{day.count}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Son Tıklamalar Tablosu */}
      <div className="card overflow-hidden">
        <h3 className="font-semibold text-gray-900 mb-4 px-4 pt-4">Son Tıklamalar</h3>
        {recentClicks.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Henüz tıklama yok</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Tarih</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">IP</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Platform</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Referrer</th>
                </tr>
              </thead>
              <tbody>
                {recentClicks.map((click) => (
                  <tr key={click._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-4 text-gray-600">
                      {new Date(click.createdAt).toLocaleString('tr-TR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2 px-4">
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{click.ip || '-'}</code>
                    </td>
                    <td className="py-2 px-4">
                      {click.platform ? (
                        <span
                          className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: click.platform.color || '#999' }}
                        >
                          {click.platform.name}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-2 px-4 text-gray-500 text-xs truncate max-w-[200px]">
                      {click.referrer || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
