import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Footer() {
  const { isLoggedIn } = useAuth();

  return (
    <footer className="bg-gray-900 text-gray-400 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm">&copy; {new Date().getFullYear()} Crane Network. All rights reserved.</p>
        <div className="flex items-center gap-6 text-sm">
          <Link to="/submit" className="hover:text-white transition-colors no-underline text-gray-400">
            Submit Ticket
          </Link>
          <Link to="/track" className="hover:text-white transition-colors no-underline text-gray-400">
            Track Ticket
          </Link>
          {!isLoggedIn && (
            <Link to="/register" className="hover:text-crane transition-colors no-underline text-gray-400">
              Create Account
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
}
