import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Plus, LayoutDashboard, Shield, LogOut, LogIn, UserPlus, Search, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import NotificationPanel from '../ui/NotificationPanel';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hideNewTicket = ['/', '/dashboard', '/submit'].includes(location.pathname);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const navLink = "flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all no-underline";

  return (
    <nav className="sticky top-0 z-50 bg-[#0f0f11]/80 backdrop-blur-2xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex flex-col items-end no-underline">
            <img src="/logo.png" alt="Crane Network" className="h-7 sm:h-8" />
            <span
              className="text-[9px] font-medium tracking-[0.2em] uppercase mt-0.5"
              style={{
                background: 'radial-gradient(at 100% 100%, #fedb37 0%, #fdb931 8%, #9f7928 30%, #8a6e2f 40%, #0000 80%), radial-gradient(at 0 0, #fff 0%, #ffffac 8%, #d1b464 25%, #5d4a1f 62.5% 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              support
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {!hideNewTicket && (
              <Link to="/submit" className="btn btn-primary btn-sm no-underline">
                <Plus size={13} />
                New Ticket
              </Link>
            )}
            <Link to="/search" className={navLink}>
              <Search size={15} />
              Knowledge Base
            </Link>
            <Link to="/track" className={navLink}>
              Track
            </Link>
            {isLoggedIn && (
              <Link to="/dashboard" className={navLink}>
                <LayoutDashboard size={15} />
                Dashboard
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-crane hover:text-crane-light hover:bg-white/[0.06] transition-all no-underline"
              >
                <Shield size={15} />
                Admin
              </Link>
            )}

            <div className="w-px h-5 bg-white/[0.08] mx-2" />

            <NotificationPanel />

            {isLoggedIn ? (
              <div className="flex items-center gap-1">
                <Link to="/profile" className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors no-underline">
                  <User size={16} />
                </Link>
                <button onClick={handleLogout} className="btn-ghost p-2 rounded-lg">
                  <LogOut size={15} className="text-gray-500 hover:text-white" />
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className={navLink}>
                  <LogIn size={15} />
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm no-underline ml-1">
                  <UserPlus size={13} />
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-1">
            <NotificationPanel />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/[0.06] px-4 py-3 space-y-1 bg-[#0f0f11]/95 backdrop-blur-2xl">
          {!hideNewTicket && (
            <Link to="/submit" onClick={() => setMobileOpen(false)} className="btn btn-primary btn-sm no-underline w-full justify-center">
              <Plus size={13} /> New Ticket
            </Link>
          )}
          <Link to="/search" onClick={() => setMobileOpen(false)} className={navLink}>
            <Search size={15} /> Knowledge Base
          </Link>
          <Link to="/track" onClick={() => setMobileOpen(false)} className={navLink}>
            Track Ticket
          </Link>
          {isLoggedIn && (
            <Link to="/dashboard" onClick={() => setMobileOpen(false)} className={navLink}>
              <LayoutDashboard size={15} /> Dashboard
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-crane hover:text-crane-light hover:bg-white/[0.06] no-underline"
            >
              <Shield size={15} /> Admin
            </Link>
          )}
          <div className="border-t border-white/[0.06] pt-2 mt-2">
            {isLoggedIn ? (
              <>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className={navLink}>
                  <User size={15} /> Profile ({user?.name})
                </Link>
                <button onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/[0.06] w-full"
                >
                  <LogOut size={15} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className={navLink}>
                  <LogIn size={15} /> Login
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-crane hover:text-crane-light hover:bg-white/[0.06] no-underline"
                >
                  <UserPlus size={15} /> Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
