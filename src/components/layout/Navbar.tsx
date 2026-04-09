import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Plus, LayoutDashboard, Shield, LogOut, LogIn, UserPlus, Search, User, ChevronDown, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import { usePortalStore, PORTALS, type PortalId } from '../../store/portalStore';
import NotificationPanel from '../ui/NotificationPanel';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const currentUser = useAuthStore((s) => s.currentUser);
  const { activePortal, setPortal } = usePortalStore();
  const portal = PORTALS[activePortal];
  const navigate = useNavigate();
  const location = useLocation();
  const isTicketPage = location.pathname.startsWith('/tickets/') || location.pathname.startsWith('/admin/tickets/');
  const profileRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (portalRef.current && !portalRef.current.contains(e.target as Node)) setPortalOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close dropdown on route change
  useEffect(() => { setProfileOpen(false); setMobileOpen(false); setPortalOpen(false); }, [location.pathname]);

  const switchPortal = (id: PortalId) => {
    setPortal(id);
    setPortalOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileOpen(false);
    setMobileOpen(false);
  };

  const navLink = "flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all no-underline";

  return (
    <nav className="sticky top-0 z-50 bg-[#121014]/90 backdrop-blur-2xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-1.5" ref={portalRef}>
            <Link to="/" className="flex flex-col items-end no-underline">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activePortal}
                  src={portal.logo}
                  alt={portal.name}
                  className="h-7 sm:h-8"
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 4 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                />
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.span
                  key={activePortal + '-support'}
                  className="text-[9px] font-medium tracking-[0.2em] uppercase mt-0.5"
                  style={{
                    background: 'radial-gradient(at 100% 100%, #fedb37 0%, #fdb931 8%, #9f7928 30%, #8a6e2f 40%, #0000 80%), radial-gradient(at 0 0, #fff 0%, #ffffac 8%, #d1b464 25%, #5d4a1f 62.5% 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {portal.supportText}
                </motion.span>
              </AnimatePresence>
            </Link>

            {/* Portal switcher dropdown */}
            <div className="relative">
              <button
                onClick={() => setPortalOpen(!portalOpen)}
                className="p-1 rounded hover:bg-white/[0.06] transition-colors cursor-pointer"
                aria-label="Switch portal"
              >
                <ChevronDown size={14} className={`text-gray-500 transition-transform ${portalOpen ? 'rotate-180' : ''}`} />
              </button>

              {portalOpen && (
                <div className="absolute left-0 top-full mt-2 w-52 rounded-lg border border-white/[0.08] bg-[#1a1a1f]/95 backdrop-blur-xl shadow-2xl py-1 z-50">
                  {(Object.keys(PORTALS) as PortalId[]).map((id) => (
                    <button
                      key={id}
                      onClick={() => switchPortal(id)}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                        activePortal === id
                          ? 'text-white bg-white/[0.06]'
                          : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <img src={PORTALS[id].logo} alt={PORTALS[id].name} className="h-5" />
                      {activePortal === id && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-crane" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {isTicketPage && (
              <Link to="/submit" className="btn btn-primary btn-sm no-underline mr-2">
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
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/[0.12] flex items-center justify-center overflow-hidden shrink-0">
                    {currentUser?.avatar ? (
                      <img src={currentUser.avatar} alt={user?.name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={15} className="text-gray-400" />
                    )}
                  </div>
                  <span className="text-sm text-gray-300 max-w-[100px] truncate hidden lg:block">{user?.name?.split(' ')[0] || user?.username}</span>
                  <ChevronDown size={13} className={`text-gray-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-white/[0.08] bg-[#1a1a1f]/95 backdrop-blur-xl shadow-2xl py-1 z-50">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-white/[0.06]">
                      <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      {user?.username && <p className="text-xs text-crane/70 mt-0.5">@{user.username}</p>}
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06] no-underline transition-colors"
                      >
                        <User size={14} className="text-gray-500" />
                        Profile
                      </Link>
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06] no-underline transition-colors"
                      >
                        <LayoutDashboard size={14} className="text-gray-500" />
                        My Tickets
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin/users"
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06] no-underline transition-colors"
                        >
                          <Settings size={14} className="text-gray-500" />
                          Manage Users
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-white/[0.06] py-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-white/[0.06] w-full transition-colors cursor-pointer"
                      >
                        <LogOut size={14} />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
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
            {isLoggedIn && (
              <div className="w-7 h-7 rounded-full bg-white/[0.08] border border-white/[0.12] flex items-center justify-center overflow-hidden">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={13} className="text-gray-400" />
                )}
              </div>
            )}
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
        <div className="md:hidden border-t border-white/[0.06] px-4 py-3 space-y-1 bg-[#121014]/95 backdrop-blur-2xl">
          {isTicketPage && (
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
