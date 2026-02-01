import { useState, useEffect } from 'react';
import { RefreshCw, FileSpreadsheet, CheckCircle, AlertCircle, Clock, Plus, ArrowUpDown, XCircle } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function SheetSyncPage() {
  const [sheetUrl, setSheetUrl] = useState('');
  const [syncStatus, setSyncStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/sheet-sync/status');
      setSyncStatus(res.data);
    } catch {
      // İlk kullanımda endpoint henüz veri döndürmeyebilir
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    if (!sheetUrl && !syncStatus?.lastSync) {
      toast.error('Google Sheet URL girin');
      return;
    }

    setSyncing(true);
    try {
      const res = await api.post('/sheet-sync/trigger', {
        sheetUrl: sheetUrl || undefined,
      });
      setSyncStatus(res.data);
      toast.success('Sync tamamlandı!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Sync hatası');
    } finally {
      setSyncing(false);
    }
  };

  const handleConfigure = async () => {
    if (!sheetUrl) {
      toast.error('Google Sheet URL girin');
      return;
    }

    setSyncing(true);
    try {
      const res = await api.post('/sheet-sync/configure', { sheetUrl });
      setSyncStatus(res.data);
      toast.success('Sheet ayarlandı ve sync başlatıldı!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Yapılandırma hatası');
    } finally {
      setSyncing(false);
    }
  };

  const statusIcon = {
    idle: <Clock className="w-5 h-5 text-gray-400" />,
    syncing: <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />,
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
  };

  const statusLabel = {
    idle: 'Bekliyor',
    syncing: 'Senkronize ediliyor...',
    success: 'Başarılı',
    error: 'Hata',
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <FileSpreadsheet className="w-8 h-8 text-green-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Google Sheet Senkronizasyonu</h1>
          <p className="text-sm text-gray-500">Ürünleri Google Sheets üzerinden yönetin</p>
        </div>
      </div>

      {/* Sheet URL Girişi */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Sheet Bağlantısı</h2>
        <p className="text-sm text-gray-500 mb-4">
          Google Sheets dosyanızın bağlantısını girin. Sheet "Bağlantısı olan herkes görüntüleyebilir" olarak ayarlanmış olmalı.
        </p>
        <div className="flex gap-3">
          <input
            type="url"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="input flex-1"
          />
          <button
            onClick={handleConfigure}
            disabled={syncing || !sheetUrl}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Ayarla ve Sync Et
          </button>
        </div>
      </div>

      {/* Sync Durumu */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Sync Durumu</h2>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Senkronize ediliyor...' : 'Manuel Sync'}
          </button>
        </div>

        {syncStatus ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {statusIcon[syncStatus.status] || statusIcon.idle}
              <div>
                <p className="font-medium text-gray-900">
                  {statusLabel[syncStatus.status] || 'Bilinmiyor'}
                </p>
                {syncStatus.message && (
                  <p className="text-sm text-gray-500">{syncStatus.message}</p>
                )}
              </div>
            </div>

            {syncStatus.lastSync && (
              <p className="text-sm text-gray-500">
                Son sync: {new Date(syncStatus.lastSync).toLocaleString('tr-TR')}
              </p>
            )}

            {syncStatus.stats && (syncStatus.stats.added > 0 || syncStatus.stats.updated > 0 || syncStatus.stats.errors > 0) && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <Plus className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-lg font-bold text-green-700">{syncStatus.stats.added}</p>
                    <p className="text-xs text-green-600">Eklenen</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <ArrowUpDown className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-lg font-bold text-blue-700">{syncStatus.stats.updated}</p>
                    <p className="text-xs text-blue-600">Güncellenen</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-lg font-bold text-gray-700">{syncStatus.stats.skipped}</p>
                    <p className="text-xs text-gray-500">Atlanan</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <div>
                    <p className="text-lg font-bold text-red-700">{syncStatus.stats.errors}</p>
                    <p className="text-xs text-red-600">Hata</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">Henüz sync yapılmadı</p>
        )}
      </div>

      {/* Sheet Formatı Rehberi */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Sheet Format Rehberi</h2>
        <p className="text-sm text-gray-500 mb-4">
          Google Sheet'inizin ilk satırı başlık satırı olmalı. Aşağıdaki sütun isimlerini kullanın:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-700">Sütun</th>
                <th className="text-left py-2 px-3 font-medium text-gray-700">Açıklama</th>
                <th className="text-left py-2 px-3 font-medium text-gray-700">Zorunlu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['başlık', 'Ürün başlığı', 'Evet'],
                ['platform', 'Platform adı (Trendyol, Hepsiburada, N11...)', 'Hayır*'],
                ['kategori', 'Kategori adı', 'Hayır*'],
                ['fiyat', 'Güncel fiyat (sayı)', 'Hayır'],
                ['eski_fiyat', 'Orijinal fiyat (indirim öncesi)', 'Hayır'],
                ['url', 'Ürün linki', 'Evet**'],
                ['affiliate_url', 'Referans/affiliate linki', 'Hayır'],
                ['görsel', 'Ürün görseli URL', 'Hayır'],
                ['marka', 'Marka adı', 'Hayır'],
                ['etiketler', 'Virgülle ayrılmış etiketler', 'Hayır'],
                ['öne_çıkan', 'Öne çıkan mı? (evet/hayır)', 'Hayır'],
                ['günün_fırsatı', 'Günün fırsatı mı? (evet/hayır)', 'Hayır'],
                ['trendyol_id', 'Trendyol contentId (otomatik veri çekmek için)', 'Hayır'],
                ['aktif', 'Aktif mi? (evet/hayır, varsayılan: evet)', 'Hayır'],
              ].map(([col, desc, required]) => (
                <tr key={col}>
                  <td className="py-2 px-3">
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">{col}</code>
                  </td>
                  <td className="py-2 px-3 text-gray-600">{desc}</td>
                  <td className="py-2 px-3 text-gray-600">{required}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 space-y-1 text-xs text-gray-400">
          <p>* Yoksa otomatik oluşturulur ("Diğer" platform, "Genel" kategori)</p>
          <p>** trendyol_id varsa URL Trendyol'dan otomatik çekilir</p>
        </div>
      </div>
    </div>
  );
}
