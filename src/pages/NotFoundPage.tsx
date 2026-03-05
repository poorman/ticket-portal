import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import AnimatedPage from '../components/layout/AnimatedPage';

export default function NotFoundPage() {
  return (
    <AnimatedPage>
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <p className="text-7xl font-bold text-gray-200 mb-4">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn btn-primary no-underline">
          <Home size={16} />
          Back to Home
        </Link>
      </div>
    </AnimatedPage>
  );
}
