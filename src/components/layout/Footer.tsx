import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Footer() {
  const { isLoggedIn } = useAuth();

  return (
    <footer className="border-t border-white/[0.06] py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} Crane Network</p>
        <div className="flex items-center gap-6 text-xs">
          <Link to="/submit" className="text-gray-500 hover:text-gray-300 transition-colors no-underline">
            Submit Ticket
          </Link>
          <Link to="/search" className="text-gray-500 hover:text-gray-300 transition-colors no-underline">
            Knowledge Base
          </Link>
          {!isLoggedIn && (
            <Link to="/register" className="text-gray-500 hover:text-crane transition-colors no-underline">
              Create Account
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
}
