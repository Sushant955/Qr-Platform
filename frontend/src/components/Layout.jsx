import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, User, LogOut, ScanLine } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const navItem = (to, Icon, label) => (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive ? 'bg-signal/10 text-signal' : 'text-mist hover:text-white hover:bg-panel2'
        }`
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-ink text-white flex">
      <aside className="w-64 shrink-0 border-r border-line bg-panel flex flex-col">
        <div className="px-5 py-6 flex items-center gap-2 border-b border-line">
          <div className="w-8 h-8 rounded-lg bg-signal/15 flex items-center justify-center">
            <ScanLine size={18} className="text-signal" />
          </div>
          <div>
            <div className="font-display font-semibold text-sm leading-tight">Unified QR</div>
            <div className="text-[11px] text-mist leading-tight">Platform</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItem('/', LayoutDashboard, 'Dashboard')}
          {navItem('/create', PlusCircle, 'Create QR')}
          {navItem('/profile', User, 'Profile')}
        </nav>

        <div className="px-3 py-4 border-t border-line">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-signal2/20 flex items-center justify-center text-xs font-semibold text-signal2">
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <div className="text-xs text-mist truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-2 py-2 text-sm text-mist hover:text-warn transition-colors w-full"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto scanline-bg">{children}</main>
    </div>
  );
}
