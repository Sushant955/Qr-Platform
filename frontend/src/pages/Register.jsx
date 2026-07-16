import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ScanLine } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink text-white flex items-center justify-center px-4 scanline-bg">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg bg-signal/15 flex items-center justify-center">
            <ScanLine size={20} className="text-signal" />
          </div>
          <span className="font-display font-semibold text-lg">Unified QR</span>
        </div>

        <div className="bg-panel border border-line rounded-2xl p-7">
          <h1 className="font-display text-xl font-semibold mb-1">Create your account</h1>
          <p className="text-mist text-sm mb-6">Start generating and tracking QR codes.</p>

          {error && (
            <div className="mb-4 text-sm text-warn bg-warn/10 border border-warn/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-mist mb-1.5">Full name</label>
              <input
                required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-panel2 border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-signal transition-colors"
                placeholder="Shiva Sai"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-mist mb-1.5">Email</label>
              <input
                type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-panel2 border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-signal transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-mist mb-1.5">Password</label>
              <input
                type="password" required minLength={8} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-panel2 border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-signal transition-colors"
                placeholder="At least 8 characters"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-signal text-ink font-semibold text-sm rounded-lg py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-mist mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-signal font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
