import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Plus, LayoutDashboard, Shield, LogOut, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  return (
    <nav className="bg-gray-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 no-underline">
            <div className="w-8 h-8 rounded-lg bg-crane flex items-center justify-center font-bold text-gray-900 text-sm">
              CN
            </div>
            <span className="font-semibold text-white text-lg hidden sm:block">
              Crane Network
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/submit"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors no-underline"
            >
              <Plus size={16} />
              New Ticket
            </Link>
            <Link
              to="/track"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors no-underline"
            >
              Track Ticket
            </Link>
            {isLoggedIn && (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors no-underline"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-crane hover:text-crane-light hover:bg-gray-800 transition-colors no-underline"
              >
                <Shield size={16} />
                Admin
              </Link>
            )}

            <div className="w-px h-6 bg-gray-700 mx-2" />

            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">{user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors no-underline"
                >
                  <LogIn size={16} />
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary btn-sm no-underline"
                >
                  <UserPlus size={14} />
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-800 px-4 py-3 space-y-1">
          <Link
            to="/submit"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 no-underline"
          >
            <Plus size={16} /> New Ticket
          </Link>
          <Link
            to="/track"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 no-underline"
          >
            Track Ticket
          </Link>
          {isLoggedIn && (
            <Link
              to="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 no-underline"
            >
              <LayoutDashboard size={16} /> Dashboard
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-crane hover:text-crane-light hover:bg-gray-800 no-underline"
            >
              <Shield size={16} /> Admin
            </Link>
          )}
          <div className="border-t border-gray-800 pt-2 mt-2">
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 w-full"
              >
                <LogOut size={16} /> Logout ({user?.name})
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 no-underline"
                >
                  <LogIn size={16} /> Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-crane hover:text-crane-light hover:bg-gray-800 no-underline"
                >
                  <UserPlus size={16} /> Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
