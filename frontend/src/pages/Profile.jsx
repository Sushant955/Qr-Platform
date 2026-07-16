import { useState } from 'react';
import { Camera, Check } from 'lucide-react';
import Layout from '../components/Layout';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', company: user?.company || '', bio: user?.bio || '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const { data } = await client.put('/profile', form);
      updateUser(data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(file) {
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await client.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ ...user, avatar_url: data.avatar_url });
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-8 py-8">
        <h1 className="font-display text-2xl font-semibold mb-1">Profile</h1>
        <p className="text-mist text-sm mb-8">Manage your account details.</p>

        <div className="bg-panel border border-line rounded-2xl p-6 mb-6 flex items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-signal2/20 flex items-center justify-center text-xl font-semibold text-signal2 overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                user?.name?.[0]?.toUpperCase()
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-signal rounded-full flex items-center justify-center cursor-pointer">
              <Camera size={12} className="text-ink" />
              <input
                type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files[0] && handleAvatarUpload(e.target.files[0])}
              />
            </label>
          </div>
          <div>
            <div className="font-medium">{user?.name}</div>
            <div className="text-sm text-mist">{user?.email}</div>
            {uploadingAvatar && <div className="text-xs text-signal mt-1">Uploading…</div>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-panel border border-line rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-mist mb-1.5">Full name</label>
            <input
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-panel2 border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-signal transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-mist mb-1.5">Company / Organization</label>
            <input
              value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="e.g. MITS, Madanapalli"
              className="w-full bg-panel2 border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-signal transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-mist mb-1.5">Bio</label>
            <textarea
              rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="w-full bg-panel2 border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-signal transition-colors resize-none"
            />
          </div>
          <button
            type="submit" disabled={saving}
            className="flex items-center gap-2 bg-signal text-ink font-semibold text-sm rounded-lg px-5 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saved ? <><Check size={15} /> Saved</> : saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
