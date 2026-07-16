import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ScanLine } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
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
          <h1 className="font-display text-xl font-semibold mb-1">Welcome back</h1>
          <p className="text-mist text-sm mb-6">Sign in to manage your QR codes.</p>

          {error && (
            <div className="mb-4 text-sm text-warn bg-warn/10 border border-warn/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                type="password" required value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-panel2 border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-signal transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-signal text-ink font-semibold text-sm rounded-lg py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-mist mt-5">
          Don't have an account?{' '}
          <Link to="/register" className="text-signal font-medium">Create one</Link>
        </p>
      </div>
    </div>
  );
}
