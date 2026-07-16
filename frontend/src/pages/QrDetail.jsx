import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ChevronLeft, Download, Copy, Check, Zap, Trash2, Circle } from 'lucide-react';
import Layout from '../components/Layout';
import DynamicIcon from '../components/DynamicIcon';
import client, { API_BASE_URL } from '../api/client';
import { getQrType } from '../qrTypes';

export default function QrDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [qr, setQr] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [imgUrl, setImgUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let objectUrl;
    async function load() {
      setLoading(true);
      const { data } = await client.get(`/qr/${id}`);
      setQr(data.qr);

      const imgRes = await client.get(`/qr/${id}/image?format=png`, { responseType: 'blob' });
      objectUrl = window.URL.createObjectURL(imgRes.data);
      setImgUrl(objectUrl);

      if (data.qr.mode === 'dynamic') {
        const { data: a } = await client.get(`/qr/${id}/analytics`);
        setAnalytics(a);
      }
      setLoading(false);
    }
    load();
    return () => objectUrl && window.URL.revokeObjectURL(objectUrl);
  }, [id]);

  async function handleDownload(format) {
    const res = await client.get(`/qr/${id}/image?format=${format}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url; a.download = `${qr.title}.${format}`; a.click();
    window.URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${qr.title}"? This can't be undone.`)) return;
    await client.delete(`/qr/${id}`);
    navigate('/');
  }

  async function toggleActive() {
    const { data } = await client.put(`/qr/${id}`, { is_active: !qr.is_active });
    setQr(data.qr);
  }

  function copyLink() {
    navigator.clipboard.writeText(`${API_BASE_URL}/r/${qr.short_code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (loading || !qr) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-8 py-20 text-center text-mist text-sm">Loading…</div>
      </Layout>
    );
  }

  const typeDef = getQrType(qr.type);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-8 py-8">
        <Link to="/" className="flex items-center gap-1 text-mist hover:text-white text-sm mb-6 w-fit transition-colors">
          <ChevronLeft size={16} /> Back to dashboard
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
          {/* Left: QR image + actions */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 flex items-center justify-center">
              {imgUrl && <img src={imgUrl} alt={qr.title} className="w-full max-w-[240px]" />}
            </div>

            <div className="bg-panel border border-line rounded-2xl p-4 space-y-2">
              <button onClick={() => handleDownload('png')} className="w-full flex items-center justify-center gap-2 text-sm font-medium bg-panel2 hover:bg-line rounded-lg py-2.5 transition-colors">
                <Download size={14} /> Download PNG
              </button>
              <button onClick={() => handleDownload('svg')} className="w-full flex items-center justify-center gap-2 text-sm font-medium bg-panel2 hover:bg-line rounded-lg py-2.5 transition-colors">
                <Download size={14} /> Download SVG
              </button>
            </div>

            {qr.mode === 'dynamic' && (
              <div className="bg-panel border border-line rounded-2xl p-4">
                <p className="text-xs text-mist mb-2">Dynamic redirect link</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono text-signal2 bg-panel2 rounded-lg px-3 py-2 truncate">
                    {API_BASE_URL}/r/{qr.short_code}
                  </code>
                  <button onClick={copyLink} className="text-mist hover:text-white p-2">
                    {copied ? <Check size={15} className="text-signal" /> : <Copy size={15} />}
                  </button>
                </div>
              </div>
            )}

            <div className="bg-panel border border-line rounded-2xl p-4 space-y-2">
              {qr.mode === 'dynamic' && (
                <button onClick={toggleActive} className="w-full flex items-center justify-center gap-2 text-sm font-medium bg-panel2 hover:bg-line rounded-lg py-2.5 transition-colors">
                  <Circle size={9} className={qr.is_active ? 'text-signal fill-signal' : 'text-mist fill-mist'} />
                  {qr.is_active ? 'Active — click to disable' : 'Disabled — click to enable'}
                </button>
              )}
              <button onClick={handleDelete} className="w-full flex items-center justify-center gap-2 text-sm font-medium bg-panel2 hover:bg-warn/20 hover:text-warn rounded-lg py-2.5 transition-colors">
                <Trash2 size={14} /> Delete QR code
              </button>
            </div>
          </div>

          {/* Right: details + analytics */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-lg bg-signal/15 flex items-center justify-center">
                  <DynamicIcon name={typeDef.icon} size={16} className="text-signal" />
                </div>
                <h1 className="font-display text-xl font-semibold">{qr.title}</h1>
                {qr.mode === 'dynamic' && (
                  <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full border text-signal2 border-signal2/30 bg-signal2/10">
                    <Zap size={9} /> dynamic
                  </span>
                )}
              </div>
              <p className="text-mist text-sm">{typeDef.label} · Created {new Date(qr.created_at).toLocaleDateString()}</p>
            </div>

            {qr.mode === 'dynamic' && analytics ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <Stat label="Total scans" value={analytics.totalScans} />
                  <Stat label="Devices" value={analytics.scansByDevice.length} />
                  <Stat label="Browsers" value={analytics.scansByBrowser.length} />
                </div>

                <div className="bg-panel border border-line rounded-2xl p-5">
                  <h3 className="font-display font-semibold text-sm mb-4">Scans over time</h3>
                  {analytics.scansByDay.length === 0 ? (
                    <p className="text-mist text-sm py-10 text-center">No scans yet. Share your QR code to see activity here.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={analytics.scansByDay}>
                        <defs>
                          <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00D9C0" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#00D9C0" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#242B3A" vertical={false} />
                        <XAxis dataKey="day" stroke="#8B93A7" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#8B93A7" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: '#181D29', border: '1px solid #242B3A', borderRadius: 8, fontSize: 12 }} />
                        <Area type="monotone" dataKey="count" stroke="#00D9C0" strokeWidth={2} fill="url(#scanGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {analytics.recentScans.length > 0 && (
                  <div className="bg-panel border border-line rounded-2xl p-5">
                    <h3 className="font-display font-semibold text-sm mb-4">Recent scans</h3>
                    <div className="space-y-2">
                      {analytics.recentScans.map((s, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-line last:border-0">
                          <span className="text-mist">{new Date(s.scanned_at).toLocaleString()}</span>
                          <span className="font-mono text-mist">{s.device_type} · {s.browser} · {s.os}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-panel border border-line rounded-2xl p-5">
                <p className="text-mist text-sm">
                  This is a <strong className="text-white">static</strong> QR code — content is baked directly
                  into the image, so scan analytics aren't tracked. Create a dynamic QR code if you'd like
                  scan tracking and the ability to edit the destination later.
                </p>
              </div>
            )}

            <div className="bg-panel border border-line rounded-2xl p-5">
              <h3 className="font-display font-semibold text-sm mb-3">Content</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(qr.target_data).map(([k, v]) => (
                  <div key={k} className="flex gap-3">
                    <span className="text-mist w-28 shrink-0 capitalize">{k}</span>
                    <span className="text-white break-all">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-panel border border-line rounded-2xl p-4">
      <div className="font-display text-2xl font-semibold text-signal">{value}</div>
      <div className="text-xs text-mist mt-1">{label}</div>
    </div>
  );
}
