import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, PlusCircle, QrCode as QrCodeIcon } from 'lucide-react';
import Layout from '../components/Layout';
import QrCard from '../components/QrCard';
import client from '../api/client';
import { QR_TYPES } from '../qrTypes';

export default function Dashboard() {
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [mode, setMode] = useState('');

  const fetchQrCodes = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (type) params.type = type;
    if (mode) params.mode = mode;
    const { data } = await client.get('/qr', { params });
    setQrCodes(data.qrCodes);
    setLoading(false);
  }, [search, type, mode]);

  useEffect(() => {
    const timer = setTimeout(fetchQrCodes, 250);
    return () => clearTimeout(timer);
  }, [fetchQrCodes]);

  function handleDeleted(id) {
    setQrCodes((prev) => prev.filter((q) => q.id !== id));
  }

  const totalScans = qrCodes.reduce((sum, q) => sum + (q.scan_count || 0), 0);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-semibold">Your QR Codes</h1>
            <p className="text-mist text-sm mt-1">
              {qrCodes.length} codes · {totalScans} total scans
            </p>
          </div>
          <Link
            to="/create"
            className="flex items-center gap-2 bg-signal text-ink font-semibold text-sm rounded-lg px-4 py-2.5 hover:opacity-90 transition-opacity"
          >
            <PlusCircle size={16} /> Create QR Code
          </Link>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or tag…"
              className="w-full bg-panel border border-line rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-signal transition-colors"
            />
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="bg-panel border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-signal"
          >
            <option value="">All types</option>
            {QR_TYPES.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="bg-panel border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-signal"
          >
            <option value="">Static & Dynamic</option>
            <option value="static">Static only</option>
            <option value="dynamic">Dynamic only</option>
          </select>
        </div>

        {loading ? (
          <div className="text-mist text-sm py-20 text-center">Loading…</div>
        ) : qrCodes.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-line rounded-2xl">
            <QrCodeIcon size={32} className="mx-auto text-mist mb-3" />
            <p className="text-mist text-sm mb-4">
              {search || type || mode ? 'No QR codes match your filters.' : "You haven't created any QR codes yet."}
            </p>
            <Link to="/create" className="text-signal text-sm font-medium">Create your first QR code →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {qrCodes.map((qr) => (
              <QrCard key={qr.id} qr={qr} onDeleted={handleDeleted} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
