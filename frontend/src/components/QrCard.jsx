import { Link } from 'react-router-dom';
import { BarChart3, Zap, Circle } from 'lucide-react';
import DynamicIcon from './DynamicIcon';
import { getQrType } from '../qrTypes';
import { API_BASE_URL } from '../api/client';
import client from '../api/client';

export default function QrCard({ qr, onDeleted }) {
  const typeDef = getQrType(qr.type);

  async function handleDownload(e, format) {
    e.preventDefault();
    e.stopPropagation();
    const res = await client.get(`/qr/${qr.id}/image?format=${format}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${qr.title}.${format}`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function handleDelete(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${qr.title}"? This can't be undone.`)) return;
    await client.delete(`/qr/${qr.id}`);
    onDeleted?.(qr.id);
  }

  return (
    <Link
      to={`/qr/${qr.id}`}
      className="group bg-panel border border-line rounded-2xl p-5 hover:border-signal/50 transition-colors flex flex-col"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-panel2 flex items-center justify-center">
          <DynamicIcon name={typeDef.icon} size={18} className="text-signal" />
        </div>
        <span
          className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full border ${
            qr.mode === 'dynamic'
              ? 'text-signal2 border-signal2/30 bg-signal2/10'
              : 'text-mist border-line bg-panel2'
          }`}
        >
          {qr.mode === 'dynamic' && <Zap size={9} className="inline -mt-0.5 mr-0.5" />}
          {qr.mode}
        </span>
      </div>

      <h3 className="font-display font-semibold text-sm mb-1 truncate">{qr.title}</h3>
      <p className="text-xs text-mist mb-4">{typeDef.label}</p>

      <div className="mt-auto flex items-center justify-between pt-3 border-t border-line">
        <div className="flex items-center gap-1.5 text-xs text-mist">
          <BarChart3 size={13} />
          {qr.scan_count ?? 0} scans
        </div>
        <div className="flex items-center gap-1">
          <Circle size={7} className={qr.is_active ? 'text-signal fill-signal' : 'text-mist fill-mist'} />
        </div>
      </div>

      <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => handleDownload(e, 'png')}
          className="flex-1 text-[11px] font-medium bg-panel2 hover:bg-line rounded-md py-1.5 transition-colors"
        >
          PNG
        </button>
        <button
          onClick={(e) => handleDownload(e, 'svg')}
          className="flex-1 text-[11px] font-medium bg-panel2 hover:bg-line rounded-md py-1.5 transition-colors"
        >
          SVG
        </button>
        <button
          onClick={handleDelete}
          className="flex-1 text-[11px] font-medium bg-panel2 hover:bg-warn/20 hover:text-warn rounded-md py-1.5 transition-colors"
        >
          Delete
        </button>
      </div>
    </Link>
  );
}
