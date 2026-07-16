import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Upload, Zap, ChevronLeft } from 'lucide-react';
import Layout from '../components/Layout';
import DynamicIcon from '../components/DynamicIcon';
import client from '../api/client';
import { QR_TYPES, getQrType } from '../qrTypes';

export default function CreateQr() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = pick type, 2 = configure
  const [typeKey, setTypeKey] = useState('url');
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState('static');
  const [fields, setFields] = useState({});
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [size, setSize] = useState(300);
  const [links, setLinks] = useState([{ label: '', url: '' }]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const typeDef = getQrType(typeKey);

  useEffect(() => {
    const defaults = {};
    typeDef.fields.forEach((f) => { if (f.default) defaults[f.name] = f.default; });
    setFields(defaults);
    setMode(typeDef.alwaysDynamic ? 'dynamic' : 'static');
  }, [typeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateField(name, value) {
    setFields((prev) => ({ ...prev, [name]: value }));
  }

  async function handleFileUpload(fieldName, file) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await client.post('/qr/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateField(fieldName, data.fileUrl);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function updateLink(idx, key, value) {
    setLinks((prev) => prev.map((l, i) => (i === idx ? { ...l, [key]: value } : l)));
  }
  function addLink() {
    setLinks((prev) => [...prev, { label: '', url: '' }]);
  }
  function removeLink(idx) {
    setLinks((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('Give your QR code a title.'); return; }

    setSaving(true);
    try {
      const payload = {
        title,
        type: typeKey,
        mode,
        target_data: typeKey === 'multilink' ? {} : fields,
        fg_color: fgColor,
        bg_color: bgColor,
        size,
        links: typeKey === 'multilink' ? links.filter((l) => l.label && l.url) : undefined,
      };
      const { data } = await client.post('/qr', payload);
      navigate(`/qr/${data.qr.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create QR code');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-8 py-8">
        {step === 1 ? (
          <>
            <h1 className="font-display text-2xl font-semibold mb-1">What are you creating?</h1>
            <p className="text-mist text-sm mb-8">Choose a QR code type to get started.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {QR_TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => { setTypeKey(t.key); setStep(2); }}
                  className="flex flex-col items-start gap-3 bg-panel border border-line hover:border-signal/50 rounded-2xl p-5 text-left transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-panel2 flex items-center justify-center">
                    <DynamicIcon name={t.icon} size={18} className="text-signal" />
                  </div>
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-mist hover:text-white text-sm mb-6 transition-colors"
            >
              <ChevronLeft size={16} /> Change type
            </button>

            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-signal/15 flex items-center justify-center">
                <DynamicIcon name={typeDef.icon} size={18} className="text-signal" />
              </div>
              <div>
                <h1 className="font-display text-xl font-semibold">{typeDef.label} QR Code</h1>
                <p className="text-mist text-xs">Fill in the details below</p>
              </div>
            </div>

            {error && (
              <div className="mb-5 text-sm text-warn bg-warn/10 border border-warn/30 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-panel border border-line rounded-2xl p-6 space-y-5">
                <div>
                  <label className="block text-xs font-medium text-mist mb-1.5">Title (internal label)</label>
                  <input
                    value={title} onChange={(e) => setTitle(e.target.value)} required
                    placeholder="e.g. Portfolio link, Restaurant menu…"
                    className="w-full bg-panel2 border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-signal transition-colors"
                  />
                </div>

                {typeDef.key !== 'multilink' && typeDef.fields.map((f) => (
                  <div key={f.name}>
                    <label className="block text-xs font-medium text-mist mb-1.5">
                      {f.label}{f.required && <span className="text-warn"> *</span>}
                    </label>
                    {f.type === 'textarea' ? (
                      <textarea
                        required={f.required} rows={3}
                        value={fields[f.name] || ''}
                        onChange={(e) => updateField(f.name, e.target.value)}
                        placeholder={f.placeholder}
                        className="w-full bg-panel2 border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-signal transition-colors resize-none"
                      />
                    ) : f.type === 'select' ? (
                      <select
                        value={fields[f.name] || f.default}
                        onChange={(e) => updateField(f.name, e.target.value)}
                        className="w-full bg-panel2 border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-signal"
                      >
                        {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : f.type === 'file' ? (
                      <div>
                        <label className="flex items-center gap-2 justify-center border border-dashed border-line rounded-lg px-3 py-4 text-sm text-mist cursor-pointer hover:border-signal/50 transition-colors">
                          <Upload size={15} />
                          {uploading ? 'Uploading…' : fields[f.name] ? 'Replace file' : 'Choose file'}
                          <input
                            type="file" className="hidden"
                            onChange={(e) => e.target.files[0] && handleFileUpload(f.name, e.target.files[0])}
                          />
                        </label>
                        {fields[f.name] && (
                          <p className="text-xs text-signal mt-1.5 truncate">✓ {fields[f.name]}</p>
                        )}
                      </div>
                    ) : (
                      <input
                        type={f.type || 'text'} required={f.required}
                        value={fields[f.name] || ''}
                        onChange={(e) => updateField(f.name, e.target.value)}
                        placeholder={f.placeholder}
                        className="w-full bg-panel2 border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-signal transition-colors"
                      />
                    )}
                  </div>
                ))}

                {typeDef.key === 'multilink' && (
                  <div className="space-y-3">
                    <label className="block text-xs font-medium text-mist">Links</label>
                    {links.map((l, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          value={l.label} onChange={(e) => updateLink(i, 'label', e.target.value)}
                          placeholder="Label (e.g. Instagram)"
                          className="w-1/3 bg-panel2 border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-signal"
                        />
                        <input
                          value={l.url} onChange={(e) => updateLink(i, 'url', e.target.value)}
                          placeholder="https://…"
                          className="flex-1 bg-panel2 border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-signal"
                        />
                        <button type="button" onClick={() => removeLink(i)} className="text-mist hover:text-warn px-2">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button" onClick={addLink}
                      className="flex items-center gap-1.5 text-signal text-xs font-medium"
                    >
                      <Plus size={14} /> Add another link
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-panel border border-line rounded-2xl p-6 space-y-5">
                <h3 className="font-display font-semibold text-sm">Behavior & style</h3>

                {typeDef.supportsDynamic && !typeDef.alwaysDynamic && (
                  <div>
                    <label className="block text-xs font-medium text-mist mb-2">QR mode</label>
                    <div className="flex gap-2">
                      <button
                        type="button" onClick={() => setMode('static')}
                        className={`flex-1 rounded-lg py-2.5 text-sm font-medium border transition-colors ${
                          mode === 'static' ? 'border-signal bg-signal/10 text-signal' : 'border-line text-mist'
                        }`}
                      >
                        Static
                      </button>
                      <button
                        type="button" onClick={() => setMode('dynamic')}
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium border transition-colors ${
                          mode === 'dynamic' ? 'border-signal2 bg-signal2/10 text-signal2' : 'border-line text-mist'
                        }`}
                      >
                        <Zap size={13} /> Dynamic
                      </button>
                    </div>
                    <p className="text-xs text-mist mt-2">
                      {mode === 'dynamic'
                        ? 'Editable after creation, and scans are tracked with analytics.'
                        : 'Content is baked into the QR image permanently and cannot be changed later.'}
                    </p>
                  </div>
                )}
                {typeDef.alwaysDynamic && (
                  <p className="text-xs text-mist -mt-2">
                    <Zap size={12} className="inline text-signal2 -mt-0.5 mr-1" />
                    Multi-link QR codes are always dynamic.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-mist mb-1.5">Foreground color</label>
                    <div className="flex items-center gap-2 bg-panel2 border border-line rounded-lg px-3 py-2">
                      <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="w-6 h-6 rounded" />
                      <span className="text-xs font-mono text-mist">{fgColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-mist mb-1.5">Background color</label>
                    <div className="flex items-center gap-2 bg-panel2 border border-line rounded-lg px-3 py-2">
                      <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-6 h-6 rounded" />
                      <span className="text-xs font-mono text-mist">{bgColor}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-mist mb-1.5">Size: {size}px</label>
                  <input
                    type="range" min={150} max={1000} step={50}
                    value={size} onChange={(e) => setSize(Number(e.target.value))}
                    className="w-full accent-signal"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={saving}
                className="w-full bg-signal text-ink font-semibold text-sm rounded-lg py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? 'Creating…' : 'Generate QR Code'}
              </button>
            </form>
          </>
        )}
      </div>
    </Layout>
  );
}
